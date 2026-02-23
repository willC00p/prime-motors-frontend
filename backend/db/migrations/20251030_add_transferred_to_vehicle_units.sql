-- Migration: add transferred boolean to vehicle_units
-- Run this migration to add the transferred flag to vehicle units.

ALTER TABLE vehicle_units
ADD COLUMN IF NOT EXISTS transferred boolean NOT NULL DEFAULT false;
