#!/bin/sh
set -e

# Optional file: one username:password per line (# comments and blank lines ignored).
if [ -n "$BOOKKING_AUTH_USERS_FILE" ] && [ -f "$BOOKKING_AUTH_USERS_FILE" ]; then
  merged=""
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      \#* | "") continue ;;
    esac
    if [ -n "$merged" ]; then
      merged="$merged,$line"
    else
      merged="$line"
    fi
  done < "$BOOKKING_AUTH_USERS_FILE"
  if [ -n "$merged" ]; then
    if [ -n "$BOOKKING_AUTH_USERS" ]; then
      export BOOKKING_AUTH_USERS="$BOOKKING_AUTH_USERS,$merged"
    else
      export BOOKKING_AUTH_USERS="$merged"
    fi
  fi
fi

exec node server.js
