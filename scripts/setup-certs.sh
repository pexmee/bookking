#!/usr/bin/env bash
# Optional: generate browser-trusted local HTTPS certificates with mkcert.
# BookKing auto-generates TLS on first start without this step.
# Install mkcert first: https://github.com/FiloSottile/mkcert#installation
#   Debian/Ubuntu: sudo apt install mkcert   (or download from GitHub releases)
#   Fedora: sudo dnf install mkcert
#   macOS: brew install mkcert

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTS="$ROOT/certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. See https://github.com/FiloSottile/mkcert#installation" >&2
  exit 1
fi

mkcert -install
hosts=(localhost 127.0.0.1 ::1 bookking.local)

host_known() {
  local candidate="$1"
  local h
  for h in "${hosts[@]}"; do
    if [ "$h" = "$candidate" ]; then
      return 0
    fi
  done
  return 1
}

add_host() {
  local candidate="$1"
  [ -z "$candidate" ] && return
  if host_known "$candidate"; then
    return
  fi
  echo "Including LAN address: $candidate"
  hosts+=("$candidate")
}

if command -v ip >/dev/null 2>&1; then
  while IFS= read -r lan; do
    add_host "$lan"
  done < <(
    ip -4 -o addr show scope global 2>/dev/null | awk '
      $2 !~ /^(docker|br-|veth|virbr|tun|wg|zt|tailscale|lo)/ {
        split($4, parts, "/")
        ip = parts[1]
        if (ip ~ /^192\.168\./ || ip ~ /^10\./ || ip ~ /^172\.(1[6-9]|2[0-9]|3[01])\./)
          print ip
      }'
  )
elif command -v ifconfig >/dev/null 2>&1; then
  lan="$(route -n get 1.1.1.1 2>/dev/null | awk '/interface:/{iface=$2} /source/{print $2}' || true)"
  add_host "$lan"
fi

mkdir -p "$CERTS"
mkcert -cert-file "$CERTS/cert.pem" -key-file "$CERTS/key.pem" "${hosts[@]}"

ca_root="$(mkcert -CAROOT)"
echo ""
echo "Certificates written to certs/"
echo "Valid for ~825 days. Re-run this script before they expire."
echo ""
echo "Restart Caddy to use the new certificates:"
echo "  docker compose restart caddy"
echo ""
echo "To avoid browser warnings on your phone, install the mkcert root CA once:"
echo "  $ca_root/rootCA.pem"
echo "See README 'Access from your phone' for iOS/Android steps."
