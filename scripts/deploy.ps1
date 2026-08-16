param(
  [Parameter(Mandatory = $true)] [string]$ImageTag,
  [string]$Region = "ap-northeast-2",
  [string]$ProjectName = "jandy-fc26-dashboard"
)

$ErrorActionPreference = "Stop"
$AccountId = aws sts get-caller-identity --query Account --output text
$RepositoryUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ProjectName"

aws ecr get-login-password --region $Region |
  docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"

docker build --tag "$RepositoryUri`:$ImageTag" .
docker push "$RepositoryUri`:$ImageTag"

Write-Host "Image published: $RepositoryUri`:$ImageTag"
Write-Host "Run Terraform with -var=`"image_uri=$RepositoryUri`:$ImageTag`" to deploy the Lambdas."
