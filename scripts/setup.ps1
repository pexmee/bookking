#Requires -Version 5.1
# First-time BookKing setup on Windows.
# Requires Docker: https://docs.docker.com/get-docker/

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker is required. See https://docs.docker.com/get-docker/"
}

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker Compose is required (docker compose plugin)."
}

$envFile = Join-Path $Root ".env"
$envExample = Join-Path $Root ".env.example"
if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envFile
  Write-Host "Created .env from .env.example (edit as needed)."
}

docker compose pull
docker compose up -d

Write-Host ""
Write-Host "BookKing is starting."
Write-Host "Open https://localhost when the stack is up (HTTPS only)."
Write-Host ""
Write-Host "Your browser may warn about the auto-generated certificate — that is expected."
Write-Host "For a trusted local certificate (no warning on this computer), run:"
Write-Host "  .\scripts\setup-certs.ps1"
Write-Host "  docker compose restart caddy"
Write-Host ""
Write-Host "See README for phone/LAN access and login setup."
