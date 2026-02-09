-- ============================
-- MIGRATION: Add phone column to Clients table
-- ============================
-- Run this command in your PostgreSQL database to add the phone field
-- This will NOT drop or modify existing data

ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);

-- Verify the column was added:
-- \d "Clients"

-- Alternative: If using Sequelize migrations, the sync() will auto-add the column on next server restart

-- ============================
-- MIGRATION: Add status column to Clients table
-- ============================
-- Run this command in your PostgreSQL database to add the status field
-- This will NOT drop or modify existing data

ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) DEFAULT 'pending';

-- Update existing records to have 'pending' status if NULL
UPDATE "Clients" SET "status" = 'pending' WHERE "status" IS NULL;

-- Verify the column was added:
-- \d "Clients"
