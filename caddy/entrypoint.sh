#!/bin/sh
set -e

if [ -n "$BOOKKING_DOMAIN" ]; then
  cat >/etc/caddy/Caddyfile <<EOF
{
  admin off
  http_port -1
  email ${ACME_EMAIL:-}
}

${BOOKKING_DOMAIN} {
  reverse_proxy app:3000
}
EOF
elif [ -f /etc/certs/cert.pem ] && [ -f /etc/certs/key.pem ]; then
  cat >/etc/caddy/Caddyfile <<EOF
{
  admin off
  http_port -1
}

:443 {
  tls /etc/certs/cert.pem /etc/certs/key.pem
  reverse_proxy app:3000
}
EOF
else
  echo "BookKing requires TLS. Run scripts/setup-certs (mkcert) or set BOOKKING_DOMAIN for Let's Encrypt." >&2
  exit 1
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
