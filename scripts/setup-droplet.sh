#!/bin/bash
# One-time (and repeatable) droplet provisioning for Ghummakad.
# Run as root on the droplet after rsyncing the project to /opt/ghummakad and
# placing a filled-in .env.local there.
set -euo pipefail

APP_DIR="/opt/ghummakad"
cd "$APP_DIR"

if [ ! -f .env.local ]; then
  echo "ERROR: $APP_DIR/.env.local missing — create it first (see .env.example)." >&2
  exit 1
fi

docker compose --env-file .env.local up -d --build

# Wait for GoTrue to finish its auth-schema migrations (creates auth.users)
echo "Waiting for auth.users to exist..."
for i in $(seq 1 60); do
  if docker compose --env-file .env.local exec -T db psql -U postgres -d postgres -tAc \
    "select 1 from information_schema.tables where table_schema='auth' and table_name='users'" | grep -q 1; then
    break
  fi
  sleep 2
done

# Fix auth helper functions for PostgREST v12+, then apply the app schema
docker compose --env-file .env.local exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /supabase/self-host/post-auth.sql
docker compose --env-file .env.local exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /supabase/schema.sql

# PostgREST caches the schema; reload it
docker compose --env-file .env.local restart rest

echo "Done. Stack status:"
docker compose --env-file .env.local ps
