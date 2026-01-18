// Helper to call GAS backend
// NOTE: This URL should be the Web App URL from your Google Apps Script deployment.
// You might want to put this in .env.local
const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL || '';

export interface User {
  name: string;
  id: string;
  nickName?: string;
  role?: string;
}

export interface Task {
  id: string;
  sheet: string;
  rowIndex: number;
  work: string;
  meetingNo: string;
  remarkDate?: string;
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

export async function getUsers(): Promise<User[]> {
  // Mock data for development if no URL is set
  if (!GAS_API_URL) {
    return [
      { name: "User A", id: "user_a", nickName: "A", role: "Owner" },
      { name: "User B", id: "user_b", nickName: "B", role: "Inspector" },
      { name: "User C", id: "user_c", nickName: "C", role: "Owner" },
      { name: "Manager", id: "manager", nickName: "Boss", role: "Owner" },
      { name: "New User", id: "new_user", nickName: "New", role: "No Role" }
    ];
  }

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getUsers" }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getTasks(): Promise<Task[]> {
  if (!GAS_API_URL) {
    console.log("No GAS URL provided, returning empty list.");
    return [];
  }

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getTasks" }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function forwardTask(
  task: Task,
  remark: string,
  nextUserName: string,
  currentUserName: string,
  actionType: "SUBMIT" | "RETURN" | "CLOSE"
): Promise<{ success: boolean; newId?: string; error?: string }> {

  if (!GAS_API_URL) {
    console.log("Mocking forwardTask call:", { task, remark, nextUserName, currentUserName, actionType });
    return { success: true, newId: "mock-new-id-" + Date.now() };
  }

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "forwardTask",
        sheetName: task.sheet,
        rowIndex: task.rowIndex,
        remark,
        nextUserName,
        currentUserName,
        actionType,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error forwarding task:", error);
    return { success: false, error: String(error) };
  }
}
