-- =============================================
-- Supabase Setup Script for Board Workflow System
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Create USERS table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE,
  display_name TEXT NOT NULL,
  nick_name TEXT DEFAULT '',
  role TEXT DEFAULT 'No Role',
  user_manager TEXT DEFAULT '',
  password_hash TEXT DEFAULT '',
  can_create_task BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create TASKS table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet TEXT NOT NULL,           -- 'Board' or 'Excom'
  work TEXT NOT NULL,            -- 'Resume', 'ร่างรายงาน', 'Conduct'
  meeting_no TEXT DEFAULT '',    -- ครั้งที่
  remark_date TEXT DEFAULT '',   -- วันที่หมายเหตุ
  subject TEXT NOT NULL,         -- หัวข้อ/วาระ
  ecm TEXT DEFAULT '',           -- ECM
  note TEXT DEFAULT '',          -- หมายเหตุ
  urgent BOOLEAN DEFAULT false,  -- ด่วน
  due_date TEXT DEFAULT '',      -- วันครบกำหนด (stored as text for flexibility)
  responsible TEXT DEFAULT '',   -- ผู้รับผิดชอบ
  current_holder TEXT DEFAULT '',-- งานอยู่ที่
  status TEXT DEFAULT '',        -- สถานะ (ส่งตรวจ, ตรวจแล้ว, ปิดงาน)
  assigned_to TEXT DEFAULT '',   -- ส่งให้
  remark TEXT DEFAULT '',        -- หมายเหตุการส่ง
  "order" INTEGER DEFAULT 0,    -- ลำดับ (quoted because ORDER is reserved)
  task_timestamp TIMESTAMPTZ,   -- เวลาที่อัพเดท
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_sheet ON tasks(sheet);
CREATE INDEX IF NOT EXISTS idx_tasks_work ON tasks(work);
CREATE INDEX IF NOT EXISTS idx_tasks_meeting ON tasks(meeting_no);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject);
CREATE INDEX IF NOT EXISTS idx_users_line_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_users_nick_name ON users(nick_name);

-- =============================================
-- MIGRATION: Run this AFTER importing existing data
-- to set Admin for user_manager '592260'
-- =============================================
-- UPDATE users SET role = 'Admin', can_create_task = true WHERE user_manager = '592260';
