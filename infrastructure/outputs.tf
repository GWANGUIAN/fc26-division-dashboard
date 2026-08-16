output "ecr_repository_url" { value = aws_ecr_repository.app.repository_url }
output "reader_function_url" { value = aws_lambda_function_url.reader.function_url }
output "config_sync_function_name" { value = aws_lambda_function.config.function_name }
output "budget_guard_name" { value = try(aws_budgets_budget.account_guard[0].name, null) }
output "github_roster_sync_role_arn" { value = try(aws_iam_role.github_roster_sync[0].arn, null) }
