-- =============================================
-- Migration: Add is_admin to USERS table
-- and separate admin privileges from functional roles.
-- =============================================

-- 1. Add column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Migrate existing "Admin" role users to is_admin=true and role=Owner
-- (Admin becomes a privilege, Owner becomes their working role)
UPDATE users SET is_admin = true, can_create_task = true, role = 'Owner' WHERE role = 'Admin';
UPDATE users SET is_admin = true, can_create_task = true WHERE user_manager = '592260';

-- 3. Ensure 'No Role' users are not admins (safety)
-- No changes needed as DEFAULT is false.
