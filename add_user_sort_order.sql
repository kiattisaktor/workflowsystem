-- 1. Add sort_order column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Update existing users sort_order to a default sequence if needed
-- This maintains consistency during the update.
-- You can manually change these in the UI after this script.
UPDATE users SET sort_order = 99 WHERE sort_order IS NULL;
