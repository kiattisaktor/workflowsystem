-- =============================================
-- Migration Script: Flat Table (tasks) -> Relational (meetings, subjects, task_routing)
-- =============================================

-- 1. Create the new tables
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet TEXT,
    work TEXT,
    meeting_no TEXT,
    remark_date TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    subject_name TEXT,
    ecm TEXT,
    note TEXT,
    urgent BOOLEAN DEFAULT false,
    due_date TEXT,
    responsible TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    current_holder TEXT,
    status TEXT,
    assigned_to TEXT,
    remark TEXT,
    "order" INTEGER DEFAULT 0,
    task_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clean migration of distinct meetings
INSERT INTO meetings (sheet, work, meeting_no, remark_date)
SELECT DISTINCT sheet, work, meeting_no, remark_date
FROM tasks
WHERE sheet IS NOT NULL; 

-- 3. Clean migration of subjects (tasks table matched with newly created meetings)
-- Grouping to ensure we don't create duplicate subjects if they have multiple routing rows
INSERT INTO subjects (meeting_id, subject_name, ecm, note, urgent, due_date, responsible)
SELECT 
    m.id AS meeting_id, 
    t.subject AS subject_name, 
    MAX(t.ecm), 
    MAX(t.note), 
    bool_or(t.urgent), 
    MAX(t.due_date), 
    MAX(t.responsible)
FROM tasks t
JOIN meetings m ON t.sheet = m.sheet 
    AND t.work = m.work 
    AND t.meeting_no = m.meeting_no 
    AND COALESCE(t.remark_date, '') = COALESCE(m.remark_date, '')
GROUP BY m.id, t.subject;

-- 4. Clean migration of routing (tasks to task_routing)
INSERT INTO task_routing (id, subject_id, current_holder, status, assigned_to, remark, "order", task_timestamp, created_at)
SELECT 
    t.id AS id, -- Keep the original UUID for routing history so UI doesn't break
    s.id AS subject_id,
    t.current_holder,
    t.status,
    t.assigned_to,
    t.remark,
    t."order",
    t.task_timestamp,
    t.created_at
FROM tasks t
JOIN meetings m ON t.sheet = m.sheet 
    AND t.work = m.work 
    AND t.meeting_no = m.meeting_no 
    AND COALESCE(t.remark_date, '') = COALESCE(m.remark_date, '')
JOIN subjects s ON s.meeting_id = m.id AND s.subject_name = t.subject;

-- 5. Rename old table to backup 
-- (You don't lose data, but it prevents the app from writing to the wrong place)
ALTER TABLE tasks RENAME TO tasks_backup;

-- 6. Create the VIEW to replace "tasks" for backward compatibility
-- This allows the front-end Dashboard to work EXACTLY as it did before!
CREATE VIEW tasks_view AS
SELECT 
    tr.id,
    m.sheet,
    m.work,
    m.meeting_no,
    m.remark_date,
    s.id as subject_id,
    s.subject_name as subject,
    s.ecm,
    s.note,
    s.urgent,
    s.due_date,
    s.responsible,
    tr.current_holder,
    tr.status,
    tr.assigned_to,
    tr.remark,
    tr."order",
    tr.task_timestamp,
    tr.created_at,
    m.id as meeting_id
FROM task_routing tr
JOIN subjects s ON tr.subject_id = s.id
JOIN meetings m ON s.meeting_id = m.id;
