variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}
variable "project_name" {
  type    = string
  default = "jandy-fc26-dashboard"
}
variable "image_uri" {
  type        = string
  description = "ECR image URI including immutable tag; build and push before the full apply."
}
variable "allowed_origin" {
  type        = string
  default     = "*"
  description = "Cloudflare Worker production origin after first deployment."
}
variable "github_repository" {
  type        = string
  default     = ""
  description = "owner/repository; leave empty to omit the GitHub OIDC role."
}
variable "github_oidc_provider_arn" {
  type        = string
  default     = ""
  description = "Existing token.actions.githubusercontent.com OIDC provider ARN."
}
variable "enable_account_budget_guard" {
  type    = bool
  default = true
}
variable "account_budget_limit_usd" {
  type    = number
  default = 20
}
