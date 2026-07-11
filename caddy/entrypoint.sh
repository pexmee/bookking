#!/bin/sh
set -e

generate_self_signed_certs() {
  cert_dir="$1"
  mkdir -p "$cert_dir"

  san="DNS:localhost,DNS:bookking.local,IP:127.0.0.1"
  if [ -n "$BOOKKING_TLS_SANS" ]; then
    for item in $(echo "$BOOKKING_TLS_SANS" | tr ',' ' '); do
      item=$(echo "$item" | tr -d ' ')
      [ -z "$item" ] && continue
      case "$item" in
        *:*)
          case "$item" in
            *.*.*.*) san="$san,IP:$item" ;;
            *) san="$san,IP:$item" ;;
          esac
          ;;
        *.*.*.*) san="$san,IP:$item" ;;
        *) san="$san,DNS:$item" ;;
      esac
    done
  fi

  cat >"$cert_dir/openssl.cnf" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = BookKing

[v3_req]
subjectAltName = $san
EOF

  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$cert_dir/key.pem" \
    -out "$cert_dir/cert.pem" \
    -days 825 \
    -config "$cert_dir/openssl.cnf"
  rm -f "$cert_dir/openssl.cnf"
}

resolve_tls_files() {
  if [ -f /etc/certs/cert.pem ] && [ -f /etc/certs/key.pem ]; then
    TLS_CERT=/etc/certs/cert.pem
    TLS_KEY=/etc/certs/key.pem
    return
  fi

  if [ ! -f /data/certs/cert.pem ] || [ ! -f /data/certs/key.pem ]; then
    echo "BookKing: generating self-signed TLS certificate (first start)..." >&2
    generate_self_signed_certs /data/certs
    printf '%s' "$BOOKKING_TLS_SANS" > /data/certs/sans
    echo "BookKing: HTTPS is ready. Browsers will show a one-time security warning for self-signed certs." >&2
    echo "BookKing: optional — run scripts/setup-certs for locally trusted certs, or set BOOKKING_TLS_SANS to your LAN IP in .env." >&2
  elif [ "$(cat /data/certs/sans 2>/dev/null || true)" != "$BOOKKING_TLS_SANS" ]; then
    echo "BookKing: BOOKKING_TLS_SANS changed — regenerating TLS certificate..." >&2
    generate_self_signed_certs /data/certs
    printf '%s' "$BOOKKING_TLS_SANS" > /data/certs/sans
  fi

  TLS_CERT=/data/certs/cert.pem
  TLS_KEY=/data/certs/key.pem
}

if [ -n "$BOOKKING_DOMAIN" ]; then
  cat >/etc/caddy/Caddyfile <<EOF
{
  admin off
  auto_https disable_redirects
  email ${ACME_EMAIL:-}
}

${BOOKKING_DOMAIN} {
  reverse_proxy app:3000
}
EOF
else
  resolve_tls_files
  cat >/etc/caddy/Caddyfile <<EOF
{
  admin off
  auto_https disable_redirects
}

:443 {
  tls ${TLS_CERT} ${TLS_KEY}
  reverse_proxy app:3000
}
EOF
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
