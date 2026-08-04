-- ============================================================
-- MIGRATION: Backfill product_variants.version column
-- ============================================================
-- Context:
--   ProductVariant.java has @Version on a "version" BIGINT column
--   for Hibernate optimistic locking (prevents race conditions on stock).
--
--   Hibernate's ddl-auto=update adds the column to the table, but:
--   - Existing rows are inserted with version = NULL (no DEFAULT at column level)
--   - Hibernate does: UPDATE product_variants SET ... WHERE id = ? AND version = ?
--   - If version IS NULL, the WHERE clause matches 0 rows
--   - Hibernate throws StaleStateException / OptimisticLockingFailureException
--   - GlobalExceptionHandler catches it as HTTP 409, but any unhandled path
--     may fall through to HTTP 500.
--
-- This migration is IDEMPOTENT — safe to run multiple times.
-- ============================================================

-- Step 1: Add column with a DEFAULT if it doesn't exist yet
--         (No-op if already present — IF NOT EXISTS prevents error)
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Step 2: Backfill any rows that have version = NULL
--         (Happens on rows inserted BEFORE the column existed)
UPDATE product_variants
SET version = 0
WHERE version IS NULL;

-- Step 3: Lock in NOT NULL + DEFAULT so future inserts are always valid
ALTER TABLE product_variants
    ALTER COLUMN version SET NOT NULL,
    ALTER COLUMN version SET DEFAULT 0;

-- ============================================================
-- Verification
-- ============================================================
-- Run this after the migration to confirm zero NULL rows remain:
--   SELECT COUNT(*) FROM product_variants WHERE version IS NULL;
-- Expected result: 0
-- ============================================================
