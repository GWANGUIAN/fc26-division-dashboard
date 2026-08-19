locals {
  tags           = { Project = var.project_name, ManagedBy = "terraform" }
  schedule_group = "${var.project_name}-schedules"
}

# This token is persisted only in Terraform state and is injected into the
# Reader Lambda. Its matching value is uploaded to Cloudflare as a Worker
# secret after each Terraform apply; it is never committed to Git.
resource "random_password" "reader_origin_token" {
  length  = 64
  special = false
}

resource "aws_ecr_repository" "app" {
  name                 = var.project_name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = false
  image_scanning_configuration { scan_on_push = true }
  tags = local.tags
}

resource "aws_dynamodb_table" "dashboard" {
  name         = var.project_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
  tags = local.tags
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project_name}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-runtime"
  role = aws_iam_role.lambda.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Scan"], Resource = aws_dynamodb_table.dashboard.arn },
    { Effect = "Allow", Action = ["scheduler:GetSchedule", "scheduler:UpdateSchedule"], Resource = "*" },
    { Effect = "Allow", Action = ["iam:PassRole"], Resource = aws_iam_role.scheduler.arn },
    { Effect = "Allow", Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"], Resource = "*" },
  ] })
}

resource "aws_cloudwatch_log_group" "scraper" {
  name              = "/aws/lambda/${var.project_name}-scraper"
  retention_in_days = 14
  tags              = local.tags
}
resource "aws_cloudwatch_log_group" "reader" {
  name              = "/aws/lambda/${var.project_name}-reader"
  retention_in_days = 14
  tags              = local.tags
}
resource "aws_cloudwatch_log_group" "config" {
  name              = "/aws/lambda/${var.project_name}-config"
  retention_in_days = 14
  tags              = local.tags
}
resource "aws_cloudwatch_log_group" "budget_guard" {
  count             = var.enable_account_budget_guard ? 1 : 0
  name              = "/aws/lambda/${var.project_name}-budget-guard"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_lambda_function" "scraper" {
  function_name = "${var.project_name}-scraper"
  package_type  = "Image"
  image_uri     = var.image_uri
  image_config { command = ["scraper.handler"] }
  role                           = aws_iam_role.lambda.arn
  timeout                        = 900
  memory_size                    = 2048
  reserved_concurrent_executions = 1
  environment { variables = {
    TABLE_NAME         = aws_dynamodb_table.dashboard.name
    MAX_PAGES_PER_RUN  = "20"
    DEPLOYMENT_VERSION = var.image_uri
    GEMINI_API_KEY     = var.gemini_api_key
  } }
  depends_on = [aws_cloudwatch_log_group.scraper]
  tags       = local.tags
  # CI updates the running image directly via lambda:UpdateFunctionCode; do not
  # let the next `terraform apply` revert it back to var.image_uri.
  lifecycle { ignore_changes = [image_uri] }
}
resource "aws_lambda_function" "reader" {
  function_name = "${var.project_name}-reader"
  package_type  = "Image"
  image_uri     = var.image_uri
  image_config { command = ["reader.handler"] }
  role                           = aws_iam_role.lambda.arn
  timeout                        = 15
  memory_size                    = 512
  reserved_concurrent_executions = 5
  environment { variables = {
    TABLE_NAME        = aws_dynamodb_table.dashboard.name
    ALLOWED_ORIGIN    = join(",", var.allowed_origins)
    ORIGIN_AUTH_TOKEN = random_password.reader_origin_token.result
  } }
  depends_on = [aws_cloudwatch_log_group.reader]
  tags       = local.tags
  lifecycle { ignore_changes = [image_uri] }
}
resource "aws_lambda_function" "config" {
  function_name = "${var.project_name}-config-sync"
  package_type  = "Image"
  image_uri     = var.image_uri
  image_config { command = ["config-sync.handler"] }
  role        = aws_iam_role.lambda.arn
  timeout     = 30
  memory_size = 512
  environment { variables = { TABLE_NAME = aws_dynamodb_table.dashboard.name } }
  depends_on = [aws_cloudwatch_log_group.config]
  tags       = local.tags
  lifecycle { ignore_changes = [image_uri] }
}
resource "aws_lambda_function" "budget_guard" {
  count         = var.enable_account_budget_guard ? 1 : 0
  function_name = "${var.project_name}-budget-guard"
  package_type  = "Image"
  image_uri     = var.image_uri
  image_config { command = ["budget-guard.handler"] }
  role        = aws_iam_role.lambda.arn
  timeout     = 30
  memory_size = 256
  environment { variables = { SCHEDULE_GROUP = aws_scheduler_schedule_group.main.name, SCHEDULE_NAMES = "${aws_scheduler_schedule.incremental.name},${aws_scheduler_schedule.reconcile.name}" } }
  depends_on = [aws_cloudwatch_log_group.budget_guard]
  tags       = local.tags
  lifecycle { ignore_changes = [image_uri] }
}

locals {
  github_owner     = try(split("/", var.github_repository)[0], "")
  github_repo_name = try(split("/", var.github_repository)[1], "")
}

data "aws_iam_policy_document" "github_actions_assume" {
  count = var.github_repository != "" && var.github_oidc_provider_arn != "" ? 1 : 0
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # StringLike (not StringEquals) with the trailing "@*" variant is required
    # to also match GitHub's fork-PR-style OIDC subject format; keep both
    # patterns so this stays compatible with the currently deployed roles.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repository}:ref:refs/heads/main",
        "repo:${local.github_owner}@*/${local.github_repo_name}@*:ref:refs/heads/main",
      ]
    }
  }
}
resource "aws_iam_role" "github_roster_sync" {
  count              = var.github_repository != "" && var.github_oidc_provider_arn != "" ? 1 : 0
  name               = "${var.project_name}-github-roster-sync"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume[0].json
  tags               = local.tags
}
resource "aws_iam_role_policy" "github_roster_sync" {
  count  = var.github_repository != "" && var.github_oidc_provider_arn != "" ? 1 : 0
  name   = "invoke-config-sync"
  role   = aws_iam_role.github_roster_sync[0].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = "lambda:InvokeFunction", Resource = aws_lambda_function.config.arn }] })
}

resource "aws_iam_role" "github_backend_deploy" {
  count              = var.github_repository != "" && var.github_oidc_provider_arn != "" ? 1 : 0
  name               = "${var.project_name}-github-backend-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume[0].json
  tags               = local.tags
}
resource "aws_iam_role_policy" "github_backend_deploy" {
  count = var.github_repository != "" && var.github_oidc_provider_arn != "" ? 1 : 0
  name  = "build-and-deploy-lambda-image"
  role  = aws_iam_role.github_backend_deploy[0].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    {
      Effect = "Allow",
      Action = [
        "ecr:BatchCheckLayerAvailability", "ecr:PutImage",
        "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload",
        "ecr:BatchGetImage",
      ],
      Resource = aws_ecr_repository.app.arn,
    },
    {
      Effect = "Allow",
      Action = ["lambda:UpdateFunctionCode", "lambda:GetFunction", "lambda:GetFunctionConfiguration"],
      Resource = compact([
        aws_lambda_function.scraper.arn,
        aws_lambda_function.reader.arn,
        aws_lambda_function.config.arn,
        try(aws_lambda_function.budget_guard[0].arn, ""),
      ]),
    },
  ] })
}

resource "aws_lambda_function_url" "reader" {
  function_name      = aws_lambda_function.reader.function_name
  authorization_type = "NONE"
  cors {
    allow_origins = var.allowed_origins
    allow_methods = ["GET"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
}
resource "aws_lambda_permission" "function_url" {
  statement_id           = "AllowPublicReader"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.reader.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_scheduler_schedule_group" "main" {
  name = local.schedule_group
  tags = local.tags
}
data "aws_iam_policy_document" "scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "scheduler" {
  name               = "${var.project_name}-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume.json
  tags               = local.tags
}
resource "aws_iam_role_policy" "scheduler" {
  name   = "invoke-scraper"
  role   = aws_iam_role.scheduler.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = "lambda:InvokeFunction", Resource = aws_lambda_function.scraper.arn }] })
}
resource "aws_scheduler_schedule" "incremental" {
  name                = "${var.project_name}-three-minute"
  group_name          = aws_scheduler_schedule_group.main.name
  schedule_expression = "rate(3 minutes)"
  flexible_time_window { mode = "OFF" }
  target {
    arn      = aws_lambda_function.scraper.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ mode = "incremental" })
  }
}
resource "aws_scheduler_schedule" "reconcile" {
  name                         = "${var.project_name}-nightly-reconcile"
  group_name                   = aws_scheduler_schedule_group.main.name
  schedule_expression          = "cron(0 18 * * ? *)"
  schedule_expression_timezone = "UTC"
  flexible_time_window { mode = "OFF" }
  target {
    arn      = aws_lambda_function.scraper.arn
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ mode = "reconcile" })
  }
}

resource "aws_cloudwatch_metric_alarm" "scraper_errors" {
  alarm_name          = "${var.project_name}-scraper-errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  dimensions          = { FunctionName = aws_lambda_function.scraper.function_name }
  treat_missing_data  = "notBreaching"
  tags                = local.tags
}

resource "aws_sns_topic" "budget_guard" {
  count = var.enable_account_budget_guard ? 1 : 0
  name  = "${var.project_name}-account-budget-guard"
  tags  = local.tags
}
resource "aws_lambda_permission" "budget_guard_sns" {
  count         = var.enable_account_budget_guard ? 1 : 0
  statement_id  = "AllowBudgetSns"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.budget_guard[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.budget_guard[0].arn
}
resource "aws_sns_topic_subscription" "budget_guard" {
  count      = var.enable_account_budget_guard ? 1 : 0
  topic_arn  = aws_sns_topic.budget_guard[0].arn
  protocol   = "lambda"
  endpoint   = aws_lambda_function.budget_guard[0].arn
  depends_on = [aws_lambda_permission.budget_guard_sns]
}
resource "aws_budgets_budget" "account_guard" {
  count        = var.enable_account_budget_guard ? 1 : 0
  name         = "${var.project_name}-account-total-cost-guard"
  budget_type  = "COST"
  limit_amount = tostring(var.account_budget_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_guard[0].arn]
  }
}
