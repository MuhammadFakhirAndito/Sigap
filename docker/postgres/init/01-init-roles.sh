#!/bin/sh
set -eu

if [ -z "${POSTGRES_APP_PASSWORD:-}" ]; then
  echo "ERROR: POSTGRES_APP_PASSWORD wajib diatur untuk membuat peran aplikasi 'sigap'." >&2
  exit 1
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" \
  -v app_pw="$POSTGRES_APP_PASSWORD" <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sigap') THEN
    CREATE ROLE sigap WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE sigap WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;
ALTER ROLE sigap WITH PASSWORD :'app_pw';
EOSQL

DB_EXISTS="$(psql -tAc "SELECT 1 FROM pg_database WHERE datname='sigap'" --username "$POSTGRES_USER" --dbname "postgres")"
if [ "$DB_EXISTS" != "1" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" -c "CREATE DATABASE sigap OWNER sigap ENCODING 'UTF8';"
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "sigap" <<'EOSQL'
ALTER SCHEMA public OWNER TO sigap;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO sigap;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

if [ -n "${POSTGRES_DEV_PASSWORD:-}" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" \
    -v dev_pw="$POSTGRES_DEV_PASSWORD" <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sigap_dev') THEN
    CREATE ROLE sigap_dev WITH LOGIN NOSUPERUSER CREATEDB NOCREATEROLE;
  ELSE
    ALTER ROLE sigap_dev WITH LOGIN NOSUPERUSER CREATEDB NOCREATEROLE;
  END IF;
END
$$;
ALTER ROLE sigap_dev WITH PASSWORD :'dev_pw';
GRANT sigap TO sigap_dev;
EOSQL
fi
