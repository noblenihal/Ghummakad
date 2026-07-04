#!/bin/sh
# Runs once on first boot of the Postgres container (empty data volume).
# Creates the roles and auth schema that GoTrue and PostgREST expect.
# GoTrue's own migrations then create the auth tables; after that,
# post-auth.sql must be applied (see scripts/setup-droplet.sh).
set -e

psql -v ON_ERROR_STOP=1 --username postgres --dbname postgres <<SQL
-- API roles
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;

-- PostgREST connects as authenticator, then switches to the JWT role
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD '$POSTGRES_PASSWORD';
GRANT anon, authenticated, service_role TO authenticator;

-- GoTrue owns the auth schema and runs its migrations there
CREATE ROLE supabase_auth_admin LOGIN CREATEROLE PASSWORD '$POSTGRES_PASSWORD';
ALTER ROLE supabase_auth_admin SET search_path = auth;
CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- API access to the public schema (row access still governed by RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
SQL
