-- Purge data only (do NOT drop tables or columns).
-- This script truncates data from all tables in the public schema except `users` and `branches` (and
-- other essential migration tables). It will not DROP any tables or alter columns.

-- Safety: this file requires a psql client-side confirmation variable `confirm=yes` to run.
-- Example (PowerShell):
--   $env:DATABASE_URL = "postgresql://user:pass@host:port/dbname"
--   psql -v confirm=yes -d $env:DATABASE_URL -f .\backend\db\purge_except_users.sql

-- If you want an automatic backup prior to running, run:
--   pg_dump -F c -b -v -f backup_before_purge.dump $DATABASE_NAME

\if :{?confirm} != 'yes'
\echo 'ABORT: This script is destructive. Run with: psql -v confirm=yes -d <db> -f purge_except_users.sql'
\exit
\endif

BEGIN;

-- Optional: drop materialized views that will be invalidated by truncation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'monthly_sales_summary') THEN
        RAISE NOTICE 'Dropping materialized view monthly_sales_summary';
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS monthly_sales_summary';
    END IF;
END$$;

-- Build a list of tables to TRUNCATE in public schema while excluding users/branches and migration tables
DO $$
DECLARE
    r RECORD;
    tbls TEXT := '';
    exclude_names TEXT[] := ARRAY['users','branches','_prisma_migrations','prisma_migrations'];
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> ALL (exclude_names)
    LOOP
        tbls := tbls || quote_ident(r.tablename) || ', ';
    END LOOP;

    IF tbls = '' THEN
        RAISE NOTICE 'No tables found to truncate (after exclusions).';
        RETURN;
    END IF;

    tbls := left(tbls, length(tbls)-2);
    RAISE NOTICE 'Truncating data from tables: %', tbls;

    -- Perform the truncation: restart identity to reset sequences and cascade to remove FK rows
    EXECUTE 'TRUNCATE TABLE ' || tbls || ' RESTART IDENTITY CASCADE';
END$$;

COMMIT;

-- Final notes:
-- - This version never drops tables or columns. It truncates data only.
-- - If you need to preserve additional tables, add their names to the exclude_names array near the top.
-- - Always take a backup before running.
-- Verification queries:
--   SELECT count(*) FROM users;
--   SELECT count(*) FROM branches;
--   SELECT tablename, (xpath('/row/count/text()', query_to_xml(format('SELECT count(*) AS count FROM %I', tablename), true, false, ''))[1])
--     FROM pg_tables WHERE schemaname='public';
