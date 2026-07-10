#!/usr/bin/env bash
# Generate trusted local HTTPS certificates with mkcert.
# Install mkcert first: https://github.com/FiloSottile/mkcert#installation

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTS="$ROOT/certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. See https://github.com/FiloSottile/mkcert#installation" >&2
  exit 1
fi

mkcert -install
hosts=(localhost 127.0.0.1 ::1 bookking.local)
lan=""
if command -v ip >/dev/null 2>&1; then
  lan="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' || true)"
fi
if [ -n "$lan" ]; then
  echo "Including LAN address: $lan"
  hosts+=("$lan")
fi

mkdir -p "$CERTS"
mkcert -cert-file "$CERTS/cert.pem" -key-file "$CERTS/key.pem" "${hosts[@]}"

ca_root="$(mkcert -CAROOT)"
echo ""
echo "Certificates written to certs/"
echo "Valid for ~825 days. Re-run this script before they expire."
echo ""
echo "To avoid browser warnings on your phone, install the mkcert root CA once:"
echo "  $ca_root/rootCA.pem"
echo "See README 'Access from your phone' for iOS/Android steps."
