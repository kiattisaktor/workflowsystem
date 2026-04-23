import { supabase } from './supabase';

export interface User {
  name: string;
  id: string;
  nickName?: string;
  role?: string;
  canCreateTask?: boolean;
  isAdmin?: boolean;
  sortOrder?: number;
}

export interface Task {
  id: string;
  sheet: string;
  work: string;
  meetingNo: string;
  remarkDate?: string;
  subject_id?: string;
  meeting_id?: string;
  subject: string;
  ecm?: string;
  note?: string;
  urgent: boolean;
  dueDate?: string;
  responsible: string;
  currentHolder: string;
  status: string;
  assignedTo?: string;
  remark?: string;
  order: number;
  timestamp?: string;
}

// --- Helper: Map Supabase row → Task interface ---
function mapTask(row: Record<string, unknown>): Task {
  return {
    id: (row.id as string) || '',
    sheet: row.sheet as string,
    work: row.work as string,
    meetingNo: (row.meeting_no as string) || '',
    remarkDate: (row.remark_date as string) || '',
    subject_id: row.subject_id as string,
    meeting_id: row.meeting_id as string,
    subject: (row.subject as string) || '',
    ecm: (row.ecm as string) || '',
    note: (row.note as string) || '',
    urgent: (row.urgent as boolean) || false,
    dueDate: (row.due_date as string) || '',
    responsible: (row.responsible as string) || '',
    currentHolder: (row.current_holder as string) || '',
    status: (row.status as string) || '',
    assignedTo: (row.assigned_to as string) || '',
    remark: (row.remark as string) || '',
    order: (row.order as number) || 0,
    timestamp: row.task_timestamp ? String(row.task_timestamp) : '',
  };
}

// --- Helper: Map Supabase row → User interface ---
function mapUser(row: Record<string, unknown>): User {
  return {
    id: (row.line_user_id as string) || (row.id as string),
    name: (row.display_name as string) || '',
    nickName: (row.nick_name as string) || '',
    role: (row.role as string) || 'No Role',
    canCreateTask: (row.can_create_task as boolean) || false,
    isAdmin: (row.is_admin as boolean) || false,
    sortOrder: (row.sort_order as number) || 0,
  };
}

// ========================
// GET USERS
// ========================
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, line_user_id, display_name, nick_name, role, can_create_task, is_admin, user_manager, created_at, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data || []).map(mapUser);
}

// ========================
// GET TASKS
// ========================
export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks_view')
    .select('*');

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  const tasks = (data || []).map(mapTask);
  
  // Natural Sort: 5.1, 5.2, ..., 5.10, 5.11
  return tasks.sort((a, b) => 
    (a.subject || "").localeCompare(b.subject || "", undefined, { numeric: true, sensitivity: 'base' })
  );
}

// ========================
// CREATE TASK
// ========================
export async function createTask(taskData: {
  sheet: string;
  work: string;
  meetingNo: string;
  remarkDate: string;
  subject: string;
  ecm: string;
  note: string;
  urgent: boolean;
  dueDate: string;
  responsible: string;
  currentHolder: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // 1. Find or create meeting
    let meetingId: string;
    const { data: existingMeetings, error: mErr } = await supabase
      .from('meetings')
      .select('id')
      .eq('sheet', taskData.sheet)
      .eq('work', taskData.work)
      .eq('meeting_no', taskData.meetingNo)
      .eq('remark_date', taskData.remarkDate);
      
    if (existingMeetings && existingMeetings.length > 0) {
      meetingId = existingMeetings[0].id;
    } else {
      const { data: newMeeting, error: addMErr } = await supabase
        .from('meetings')
        .insert({
          sheet: taskData.sheet,
          work: taskData.work,
          meeting_no: taskData.meetingNo,
          remark_date: taskData.remarkDate,
        }).select('id').single();
      if (addMErr) throw addMErr;
      meetingId = newMeeting.id;
    }

    // 2. Create subject
    const { data: newSubject, error: addSubErr } = await supabase
      .from('subjects')
      .insert({
        meeting_id: meetingId,
        subject_name: taskData.subject,
        ecm: taskData.ecm,
        note: taskData.note,
        urgent: taskData.urgent,
        due_date: taskData.dueDate,
        responsible: taskData.responsible,
      }).select('id').single();
    if (addSubErr) throw addSubErr;

    // 3. Create routing row
    const { data: newRouting, error: addRErr } = await supabase
      .from('task_routing')
      .insert({
        subject_id: newSubject.id,
        current_holder: taskData.currentHolder,
        status: '',
        assigned_to: '',
        remark: '',
        order: 0,
      }).select('id').single();
    if (addRErr) throw addRErr;

    return { success: true, id: newRouting.id };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: String(error) };
  }
}

// ========================
// CREATE MEETING
// ========================
export async function createMeeting(data: {
  sheet: string;
  work: string;
  meetingNo: string;
  remarkDate: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: newMeeting, error } = await supabase
      .from('meetings')
      .insert({
        sheet: data.sheet,
        work: data.work,
        meeting_no: data.meetingNo,
        remark_date: data.remarkDate || null,
      }).select('id').single();
      
    if (error) throw error;
    return { success: true, id: newMeeting.id };
  } catch (error: any) {
    console.error('Error creating meeting:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

// 2. CREATE MEETING FROM TEMPLATE (Resume -> Draft)
export async function createMeetingFromTemplate(data: {
  sheet: string;
  work: string;
  meetingNo: string;
  remarkDate: string;
  templateMeetingId: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // A. Create the new meeting
    const { data: newMeeting, error: meetErr } = await supabase
      .from('meetings')
      .insert({
        sheet: data.sheet,
        work: data.work,
        meeting_no: data.meetingNo,
        remark_date: data.remarkDate || null,
      }).select('id').single();
    
    if (meetErr) throw meetErr;

    // B. Get subjects from template meeting
    const { data: templateSubjects, error: subErr } = await supabase
      .from('subjects')
      .select('subject_name')
      .eq('meeting_id', data.templateMeetingId);
    
    if (subErr) throw subErr;

    // C. Copy subjects to new meeting
    if (templateSubjects && templateSubjects.length > 0) {
      for (const tSub of templateSubjects) {
        // 1. Create new subject
        const { data: newSub, error: insSubErr } = await supabase
          .from('subjects')
          .insert({
            meeting_id: newMeeting.id,
            subject_name: tSub.subject_name,
            ecm: "",
            note: "",
            urgent: false,
            due_date: "",
            responsible: ""
          }).select('id').single();
        
        if (insSubErr) {
            console.error('Error copying subject:', insSubErr);
            throw insSubErr;
        }

        // 2. Create initial routing (Order 0) for this subject WITHOUT sort_order
        const { error: routErr } = await supabase
          .from('task_routing')
          .insert({
            subject_id: newSub.id,
            status: '', // Initial
            current_holder: '', // Unassigned initially
            assigned_to: '',
            remark: '',
            order: 0
            // sort_order is EXCLUDED to prevent error
          });
        
        if (routErr) {
            console.error('Error creating initial routing:', routErr);
            throw routErr;
        }
      }
    }

    return { success: true, id: newMeeting.id };
  } catch (error: any) {
    const errorMsg = error?.message || error?.details || String(error);
    console.error('Error creating meeting from template (Detailed):', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
    });
    return { success: false, error: errorMsg };
  }
}

// ========================
// CREATE SUBJECT (Add Task)
// ========================
export async function createSubject(data: {
  meetingId: string;
  subject: string;
  ecm: string;
  note: string;
  urgent: boolean;
  dueDate: string;
  responsible: string;
  currentHolder: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // 1. Create subject
    const { data: newSubject, error: addSubErr } = await supabase
      .from('subjects')
      .insert({
        meeting_id: data.meetingId,
        subject_name: data.subject,
        ecm: data.ecm,
        note: data.note,
        urgent: data.urgent,
        due_date: data.dueDate,
        responsible: data.responsible,
      }).select('id').single();
    if (addSubErr) throw addSubErr;

    // 2. Create routing row (Order 0)
    const { data: newRouting, error: addRErr } = await supabase
      .from('task_routing')
      .insert({
        subject_id: newSubject.id,
        current_holder: data.currentHolder || '',
        status: '',
        assigned_to: '',
        remark: '',
        order: 0,
      }).select('id').single();
    if (addRErr) throw addRErr;

    // NOTE: No LINE notification here as per latest requirement
    return { success: true, id: newRouting.id };
  } catch (error) {
    console.error('Error creating subject:', error);
    return { success: false, error: String(error) };
  }
}

// ========================
// FORWARD TASK
// ========================
export async function forwardTask(
  task: Task,
  remark: string,
  nextUserName: string,
  currentUserName: string,
  actionType: "SUBMIT" | "RETURN" | "CLOSE",
  suppressNotify?: boolean,
  overridingCurrentHolder?: string
): Promise<{ success: boolean; newId?: string; error?: string }> {

  try {
    // 1. Determine status
    let oldRowStatus = "ส่งตรวจ";
    let nextUser = nextUserName;

    if (actionType === "RETURN") {
      oldRowStatus = "ตรวจแล้ว";
    } else if (actionType === "CLOSE") {
      oldRowStatus = "ปิดงาน";
      nextUser = "";
    }

    // 1.5 Concurrency Check: Ensure the task status is still empty
    const { data: checkData, error: checkError } = await supabase
      .from('task_routing')
      .select('status')
      .eq('id', task.id)
      .single();

    if (checkError) {
      console.error('Error checking task status:', checkError);
      return { success: false, error: "ไม่สามารถตรวจสอบสถานะงานได้ กรุณาลองใหม่อีกครั้ง" };
    }

    if (checkData && checkData.status !== '') {
      return { success: false, error: "งานนี้มีการอัปเดตไปแล้วโดยบุคคลอื่น กรุณา Refresh หน้าจอเพื่อดูข้อมูลล่าสุด" };
    }

    // 2. Update the existing task routing
    const updatePayload: any = {
      status: oldRowStatus,
      assigned_to: nextUser || '-',
      remark: remark,
      task_timestamp: new Date().toISOString(),
    };

    if (overridingCurrentHolder) {
      updatePayload.current_holder = overridingCurrentHolder;
    }

    const { error: updateError } = await supabase
      .from('task_routing')
      .update(updatePayload)
      .eq('id', task.id);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return { success: false, error: updateError.message };
    }

    // 3. Create new routing row (if not CLOSE)
    let newId: string | undefined;
    if (actionType !== "CLOSE") {
      const { data: newRow, error: insertError } = await supabase
        .from('task_routing')
        .insert({
          subject_id: task.subject_id,
          current_holder: nextUser,
          status: '',
          assigned_to: '',
          remark: '',
          order: task.order + 1,
          task_timestamp: null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new task:', insertError);
        return { success: false, error: insertError.message };
      }
      newId = newRow?.id;
    }

    // 4. Send Line Notification (via API route)
    if (!suppressNotify) {
      let targetNickName = '';
      let message = '';

      if (actionType === "SUBMIT") {
        targetNickName = nextUserName;
        message = `ส่งตรวจ - ${task.work} ${task.sheet} ${task.meetingNo} ${task.subject} - ${task.responsible}`;
        if (remark) message += `\nNote : ${remark}`;
      } else if (actionType === "RETURN") {
        targetNickName = task.responsible;
        message = `${currentUserName} ตรวจแล้ว - ${task.work} ${task.sheet} ${task.meetingNo} ${task.subject}`;
        if (remark) message += `\nNote : ${remark}`;
      }

      if (targetNickName && message) {
        const workStr = task.work.toLowerCase();
        const botType = (workStr.includes('ร่างรายงาน') || workStr.includes('conduct')) ? 'REPORT' : 'RESUME';

        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetNickName, message, botType }),
          });
        } catch (e) {
          console.error('Error sending notification:', e);
        }
      }
    }

    return { success: true, newId };
  } catch (error) {
    console.error("Error forwarding task:", error);
    return { success: false, error: String(error) };
  }
}

// --------------------------------------------------------------------------------
// CHAIN FORWARD TASK (For Inspectors to Send Directly to Next Inspector)
// --------------------------------------------------------------------------------
// This performs two steps:
// 1. RETURN (ตรวจแล้ว) -> Silent (No notification to Owner)
// 2. SUBMIT (ส่งตรวจ) -> Notify Next Inspector (From Responsible's perspective)
export async function chainForwardTask(
  task: Task,
  remark: string,
  nextInspectorName: string,
  currentUserName: string
): Promise<{ success: boolean; newId?: string; error?: string }> {
  try {
    // Step 1: Mark as "ตรวจแล้ว" (RETURN to Owner) - SUPPRESS Notification
    const res1 = await forwardTask(task, "", task.responsible, currentUserName, "RETURN", true);
    if (!res1.success) return res1;

    // Step 2: Auto-Submit from Owner to Next Inspector - NOTIFY NEXT INSPECTOR
    // We create a temporary task object representing the new state after Step 1
    const taskAfterReturn: Task = {
      ...task,
      id: res1.newId!,
      currentHolder: task.responsible,
      order: task.order + 1,
      status: ""
    };

    return await forwardTask(taskAfterReturn, remark, nextInspectorName, task.responsible, "SUBMIT", false);
  } catch (error) {
    console.error("Error in chainForwardTask:", error);
    return { success: false, error: String(error) };
  }
}

// ========================
// ADD REMARK TO LAST ACTION
// ========================
export async function addRemarkToLastAction(
  lastAction: Task,
  pendingRowId: string,
  pendingRowOrder: number,
  newRemark: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Shift pending row order (+1)
    const { error: updateErr } = await supabase
      .from('task_routing')
      .update({ order: pendingRowOrder + 1 })
      .eq('id', pendingRowId);
    if (updateErr) throw updateErr;

    // 2. Insert new action row containing remark
    const { error: insertErr } = await supabase
      .from('task_routing')
      .insert({
        subject_id: lastAction.subject_id,
        current_holder: lastAction.currentHolder,
        status: lastAction.status,
        assigned_to: lastAction.assignedTo || '-',
        remark: newRemark,
        order: pendingRowOrder,
        task_timestamp: new Date().toISOString()
      });
    if (insertErr) throw insertErr;

    // 3. Send Line Notification
    const targetNickName = lastAction.assignedTo;
    if (targetNickName && targetNickName !== '-') {
      const workStr = lastAction.work.toLowerCase();
      const botType = (workStr.includes('ร่างรายงาน') || workStr.includes('conduct')) ? 'REPORT' : 'RESUME';
      const message = `${lastAction.currentHolder} เพิ่มหมายเหตุ - ${lastAction.work} ${lastAction.sheet} ${lastAction.meetingNo} ${lastAction.subject}\nNote : ${newRemark}`;
      
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetNickName, message, botType }),
        });
      } catch (e) {
        console.error('Error sending notification:', e);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding remark:', error);
    return { success: false, error: String(error) };
  }
}

// ========================
// UPDATE USER (Admin)
// ========================
export async function updateUser(uuid: string, updates: { 
  nick_name?: string; 
  user_manager?: string;
  role?: string; 
  can_create_task?: boolean; 
  is_admin?: boolean;
  sort_order?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // userId here is the `id` (UUID) from the users table
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', uuid);

    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========================
// DELETE USER (Admin)
// ========================
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========================
// GET ALL USERS (Admin - includes UUID id for management)
// ========================
export async function getAllUsersAdmin(): Promise<Array<{
  uuid: string;
  lineUserId: string;
  displayName: string;
  nickName: string;
  role: string;
  userManager: string;
  canCreateTask: boolean;
  isAdmin: boolean;
  createdAt: string;
  sortOrder: number;
}>> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return (data || []).map(row => ({
    uuid: row.id as string,
    lineUserId: row.line_user_id as string,
    displayName: row.display_name as string,
    nickName: (row.nick_name as string) || '',
    role: (row.role as string) || 'No Role',
    userManager: (row.user_manager as string) || '',
    canCreateTask: (row.can_create_task as boolean) || false,
    isAdmin: (row.is_admin as boolean) || false,
    createdAt: row.created_at as string,
    sortOrder: (row.sort_order as number) || 0,
  }));
}

// ========================
// GET MEETINGS
// ========================
export async function getMeetings(sheet: string, work: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('sheet', sheet)
      .eq('work', work)
      .eq('is_deleted', false)
      .order('meeting_no', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }
}

// ========================
// UPDATE MEETING (Admin)
// ========================
export async function updateMeeting(
  meetingId: string, 
  updates: { meeting_no?: string; remark_date?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', meetingId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========================
// UPDATE SUBJECT (Admin)
// ========================
export async function updateSubject(
  subjectId: string,
  updates: { 
    subject_name?: string; 
    ecm?: string; 
    note?: string; 
    urgent?: boolean; 
    due_date?: string; 
    responsible?: string;
    meeting_id?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    let oldResponsible = "";
    let latestHistory: any = null;

    // A. Pre-fetch data if responsible is changing to apply sync rules
    if (updates.responsible) {
      const { data: sub } = await supabase
        .from("subjects")
        .select("responsible")
        .eq("id", subjectId)
        .single();
      oldResponsible = sub?.responsible || "";

      const { data: hist } = await supabase
        .from("task_routing")
        .select("*")
        .eq("subject_id", subjectId)
        .order("order", { ascending: false })
        .limit(1);
      
      if (hist && hist.length > 0) {
        latestHistory = hist[0];
      }
    }

    // B. Perform the update on the subjects table
    const { error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', subjectId);

    if (error) throw error;

    // C. Sync current_holder based on user-defined rules
    if (updates.responsible && updates.responsible !== oldResponsible) {
      // 1. If only initial order (Order 0, Status '') exists (covered by rule 2)
      // 2. If the LATEST holder is the old responsible, update them to the new one
      if (latestHistory && latestHistory.current_holder === oldResponsible) {
        await supabase
          .from("task_routing")
          .update({ current_holder: updates.responsible })
          .eq("id", latestHistory.id);
      }
      
      // Also always update Order 0 if it was held by the old responsible to keep root record clean
      await supabase
        .from("task_routing")
        .update({ current_holder: updates.responsible })
        .eq("subject_id", subjectId)
        .eq("order", 0)
        .eq("status", "")
        .eq("current_holder", oldResponsible);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========================
// SOFT DELETE / RESTORE
// ========================
export async function toggleMeetingDelete(id: string, deleted: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('meetings')
      .update({ is_deleted: deleted })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error toggling meeting delete:', error);
    return { success: false, error: String(error) };
  }
}

export async function toggleSubjectDelete(id: string, deleted: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subjects')
      .update({ is_deleted: deleted })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error toggling subject delete:', error);
    return { success: false, error: String(error) };
  }
}

// ========================
// FETCH DELETED ITEMS (Admin Only)
// ========================
export async function getDeletedItems(): Promise<{ meetings: any[]; subjects: any[] }> {
  try {
    const { data: meetings, error: mErr } = await supabase
      .from('meetings')
      .select('*')
      .eq('is_deleted', true)
      .order('created_at', { ascending: false });
    if (mErr) throw mErr;

    // For subjects, we want to know which meeting they belonged to
    const { data: subjects, error: sErr } = await supabase
      .from('subjects')
      .select(`
        *,
        meetings (
          sheet,
          work,
          meeting_no,
          remark_date
        )
      `)
      .eq('is_deleted', true)
      .order('created_at', { ascending: false });
    if (sErr) throw sErr;

    return { meetings: meetings || [], subjects: subjects || [] };
  } catch (error) {
    console.error('Error fetching deleted items:', error);
    return { meetings: [], subjects: [] };
  }
}

// ========================
// PERMANENT DELETE (Admin Only)
// ========================
export async function permanentDeleteMeeting(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Subjects and Routing will be deleted due to ON DELETE CASCADE
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error permanently deleting meeting:', error);
    return { success: false, error: String(error) };
  }
}

export async function permanentDeleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error permanently deleting subject:', error);
    return { success: false, error: String(error) };
  }
}

// ========================
// LOGIN USER (via API route for security)
// ========================
export async function loginUser(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========================
// BATCH UPDATE USER SORT ORDER
// ========================
export async function updateUserSortOrderBatch(updates: { id: string; sort_order: number }[]): Promise<{ success: boolean; error?: string }> {
  try {
    const promises = updates.map(u => 
      supabase
        .from('users')
        .update({ sort_order: u.sort_order })
        .eq('id', u.id)
    );
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error).map(r => r.error?.message);
    
    if (errors.length > 0) {
      return { success: false, error: errors.join(', ') };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========================
// SET PASSWORD (via API route for security)
// ========================
export async function setPassword(lineUserId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineUserId, newPassword }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


// ========================
// RE-OPEN TASK
// ========================
export async function reopenTask(rowId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('task_routing')
      .update({ 
        status: null,
        assigned_to: null 
      })
      .eq('id', rowId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error re-opening task:", error);
    return { success: false, error: String(error) };
  }
}

// GET MEETINGS BY WORK TYPE (For Templates)
export async function getResumeMeetings(sheet: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('sheet', sheet)
      .eq('work', 'Resume')
      .order('meeting_no', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching resume meetings:', error);
    return [];
  }
}
