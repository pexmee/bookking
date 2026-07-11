#Requires -Version 5.1
# Optional: generate browser-trusted local HTTPS certificates with mkcert.
# BookKing auto-generates TLS on first start without this step.
# Install mkcert first: https://github.com/FiloSottile/mkcert#installation
#   winget install FiloSottile.mkcert
#   — or — choco install mkcert

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Certs = Join-Path $Root "certs"

function Resolve-MkcertPath {
  $cmd = Get-Command mkcert -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
  $cmd = Get-Command mkcert -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $wingetRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
  if (Test-Path $wingetRoot) {
    $match = Get-ChildItem -Path $wingetRoot -Filter mkcert.exe -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($match) { return $match.FullName }
  }

  $chocoPath = Join-Path $env:ProgramData "chocolatey\bin\mkcert.exe"
  if (Test-Path $chocoPath) { return $chocoPath }

  return $null
}

$Mkcert = Resolve-MkcertPath
if (-not $Mkcert) {
  Write-Error "mkcert is not installed. Run: winget install FiloSottile.mkcert`nThen open a new terminal, or re-run this script."
}

& $Mkcert -install

$hosts = @("localhost", "127.0.0.1", "::1", "bookking.local")
$lanCandidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)' -and
    $_.PrefixOrigin -ne 'WellKnown' -and
    $_.InterfaceAlias -notmatch 'WSL|Hyper-V|VirtualBox|VMware|Loopback'
  } |
  Sort-Object @{ Expression = { if ($_.PrefixOrigin -eq 'Dhcp') { 0 } else { 1 } } }, IPAddress
foreach ($addr in $lanCandidates.IPAddress) {
  if ($hosts -notcontains $addr) {
    Write-Host "Including LAN address: $addr"
    $hosts += $addr
  }
}

New-Item -ItemType Directory -Force -Path $Certs | Out-Null
$certFile = Join-Path $Certs "cert.pem"
$keyFile = Join-Path $Certs "key.pem"

& $Mkcert -cert-file $certFile -key-file $keyFile @hosts

$caRoot = & $Mkcert -CAROOT
Write-Host ""
Write-Host "Certificates written to certs/"
Write-Host "Valid for ~825 days. Re-run this script before they expire."
Write-Host ""
Write-Host "Restart Caddy to use the new certificates:"
Write-Host "  docker compose restart caddy"
Write-Host ""
Write-Host "To avoid browser warnings on your phone, install the mkcert root CA once:"
Write-Host "  $caRoot\rootCA.pem"
Write-Host "See README 'Access from your phone' for iOS/Android steps."
