-- 1. Add is_deleted column to meetings and subjects
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Update tasks_view to exclude deleted items by default
-- This ensures the main dashboard only shows "published" and "active" items.
-- Using LEFT JOIN to allow "Empty Meetings" (no subjects yet) to show up on dashboard.
CREATE OR REPLACE VIEW tasks_view AS
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
FROM meetings m
LEFT JOIN subjects s ON m.id = s.meeting_id AND s.is_deleted = false
LEFT JOIN task_routing tr ON s.id = tr.subject_id
WHERE m.is_deleted = false;
