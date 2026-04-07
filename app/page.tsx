"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import TaskGroupCard from "../components/TaskGroupCard";
import TaskRow from "../components/TaskRow";
import TaskDetailInline from "../components/TaskDetailInline";
import ForwardTaskModal from "../components/ForwardTaskModal";
import { Task, User, forwardTask, getTasks, getUsers } from "../lib/api";
import { formatName } from "../lib/format";


import { useAuth } from "../components/AuthProvider";
import { registerUser } from "../lib/register";
import { useRouter } from "next/navigation";
import SetPasswordModal from "../components/SetPasswordModal";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Expanded state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { user, isLoading: authLoading, isAuthenticated, authMethod, logout } = useAuth();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<"Board" | "Excom">("Board");

  // State for Work Filter
  const [activeWork, setActiveWork] = useState<string>("Resume");

  // Fetch tasks & users
  useEffect(() => {
    Promise.all([getTasks(), getUsers()]).then(([fetchedTasks, fetchedUsers]) => {
      setTasks(fetchedTasks);
      setAllUsers(fetchedUsers);
    }).finally(() => {
      setIsFetching(false);
    });
  }, []);

  // Auth Check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Register user (Only for Line users who might not be in sheet yet)
  useEffect(() => {
    if (authMethod === "LINE" && user && !user.role) {
      // Ideally AuthProvider handles fetching, but if we need to Register:
      // Actually AuthProvider tries to match. If no match, it sets a temporary user object.
      // We should check if we need to register.
      // However, the original logic registered if isLoggedIn. 
      // With AuthProvider we might need to rely on the fact that if user is in Sheet, they have a role.
      // If user.role is "No Role" (which we default to in AuthProvider if new), we might default to that?
      // Let's keep original register logic but adapted.
      // Actually, AuthProvider already calls getUsers(). If user is new, it sets role to "No Role".
      // We only need to call registerUser if they are NOT in the sheet at all.
      // But wait, AuthProvider mocks the user if not found.
      // Let's register if we are in LINE mode and we suspect they are new.
      // Safe bet: Just call registerUser. It checks duplicates on backend.
      setIsRegistering(true);
      registerUser(user.id, user.name)
        .then(() => {
          // Reload logic if needed, but AuthProvider already loaded. 
          // Maybe we don't need to do anything as backend handles it.
        })
        .finally(() => setIsRegistering(false));
    }
  }, [authMethod, user]);

  const currentUserName = user?.nickName || user?.name || "Guest";

  // --- Filtering & Helper ---

  // 1. Filter by Tab (Board/Excom)
  const tabTasks = tasks.filter(t => t.sheet === activeTab);

  // 2. Get available Works for determining buttons (optional, or hardcoded)
  // Let's hardcode for now based on image, but maybe dynamic is better?
  // Image: Resume, ร่างรายงาน, Conduct
  const workOptions = ["Resume", "ร่างรายงาน", "Conduct"]; // Could be dynamic: Array.from(new Set(tabTasks.map(t => t.work))).filter(Boolean)

  // 3. Filter by Active Work
  const workFilteredTasks = activeWork
    ? tabTasks.filter(t => t.work === activeWork)
    : tabTasks; // Should not happen if we force selection

  // 4. Group by MeetingNo
  // Record<MeetingNo, Task[]>
  const tasksByMeeting = workFilteredTasks.reduce((acc, task) => {
    const key = task.meetingNo || "No Meeting";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // 5. Process tasks within Meeting (deduplicate subjects)
  const processGroupTasks = (meetingTasks: Task[]) => {
    // Filter out rows where subject_id is null (meeting without subjects)
    // Those rows should not be rendered as individual TaskRows
    const validTasks = meetingTasks.filter(t => !!t.subject_id);
    if (validTasks.length === 0) return [];

    const subGroups = validTasks.reduce((acc, t) => {
      const key = t.subject;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {} as Record<string, Task[]>);

    return Object.values(subGroups).map(subList => {
      // Sort by order descending
      const sorted = subList.sort((a, b) => b.order - a.order);
      return sorted[0];
    }).sort((a, b) =>
      (a.subject || "").localeCompare(b.subject || "", undefined, { numeric: true, sensitivity: 'base' })
    );
  };

  /* History Map Logic */
  const historyMap = tasks.reduce((acc, t) => {
    // Key: Sheet + Work + Meeting + Subject
    const key = `${t.sheet}|${t.work}|${t.meetingNo}|${t.subject}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Task[]>);

  // Ensure history is sorted by order
  Object.keys(historyMap).forEach(k => {
    historyMap[k].sort((a, b) => a.order - b.order);
  });

  // --- Calculate Notification Counts for All Users ---
  const allWaitingTasks = Object.values(historyMap).map(history => {
    return history[history.length - 1]; // Latest row
  }).filter(latest => {
    if (latest.status === "ปิดงาน") return false;
    if (!latest.currentHolder || !user) return false;
    
    // Robust Matching: Compare NickName or Name (formatted)
    const myName = (user.nickName || user.name).toLowerCase().trim();
    const holderName = formatName(latest.currentHolder).toLowerCase().trim();

    return holderName === myName;
  });

  const tabCounts: Record<string, number> = {
    Board: allWaitingTasks.filter(t => t.sheet === "Board").length,
    Excom: allWaitingTasks.filter(t => t.sheet === "Excom").length,
  };

  // 📈 Work Counts should be Context-Aware based on activeTab
  const currentTabWaiting = allWaitingTasks.filter(t => t.sheet === activeTab);
  const workCounts: Record<string, number> = {};
  workOptions.forEach(option => {
    workCounts[option] = currentTabWaiting.filter(t => t.work === option).length;
  });



  // Modal State
  const [modalMode, setModalMode] = useState<"SUBMIT" | "RETURN" | "CLOSE">("SUBMIT");

  const handleTaskClick = (task: Task) => {
    // Toggle expansion
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(task.id);
    }
  };

  const handleForwardClick = (task: Task, actionType: "SUBMIT" | "RETURN" | "CLOSE") => {
    setSelectedTask(task);
    setModalMode(actionType);
    setIsModalOpen(true);
  };

  const handleConfirmForward = async (nextUserName: string, remark: string) => {
    if (!selectedTask) return;

    setLoading(true);
    
    let result;
    // Chain Submit Logic: 
    // If mode is SUBMIT but the person clicking is NOT the responsible person, 
    // it means an Inspector is forwarding to another Inspector.
    const isChainSubmit = modalMode === "SUBMIT" && selectedTask.responsible !== currentUserName;

    if (isChainSubmit) {
      const { chainForwardTask } = await import("../lib/api");
      result = await chainForwardTask(selectedTask, remark, nextUserName, currentUserName);
    } else {
      result = await forwardTask(selectedTask, remark, nextUserName, currentUserName, modalMode);
    }
    
    setLoading(false);

    if (result.success) {
      // Re-fetch or Optimistic Update?
      // Optimistic is cleaner but complex with new ID logic.
      // Let's re-fetch for safety with new backend logic.
      setIsFetching(true);
      getTasks().then((fetched) => setTasks(fetched)).finally(() => setIsFetching(false));
      setIsModalOpen(false);
      setSelectedTask(null);
      setExpandedTaskId(null);
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleRefresh = async () => {
    setIsFetching(true);
    const fetchedTasks = await getTasks();
    setTasks(fetchedTasks);
    setIsFetching(false);
  };

  // Calculate stats for HEADER (Global for the tab)
  const totalTasks = tabTasks.length;
  const completedTasks = tabTasks.filter(t => !!t.status).length;

  // 6. Check for No Role
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!isAuthenticated) return null; // Will redirect

  if (user && user.role === "No Role") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">รอการอนุมัติสิทธิ์</h2>
          <p className="text-slate-600 mb-6">
            คุณยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
          </p>
          {user?.name}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-50 to-transparent -z-10"></div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-4">
          {/* Placeholder for left side if needed */}
          <div className="flex-1"></div>
          {authMethod === "LINE" && user && (
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
            >
              Set Password
            </button>
          )}
        </div>

        <DashboardHeader
          profile={user ? { userId: user.id, displayName: user.name, pictureUrl: "" } : null}
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeWork={activeWork}
          onWorkChange={setActiveWork}
          workOptions={workOptions}
          onLogout={authMethod === "WEB" ? logout : undefined}
          canCreateTask={user?.canCreateTask || false}
          isAdmin={user?.isAdmin || false}
          tabCounts={tabCounts}
          workCounts={workCounts}
        />

        {/* Removed Cloud-like Tabs (moved to header) */}

        {isFetching ? (
          <div className="text-center text-slate-400 py-10">Loading tasks...</div>
        ) : (
          // Iterate over MEETINGS now
          // Sort meetings?
          Object.keys(tasksByMeeting).sort().map((meetingNo) => {
            // Process tasks
            const meetingTasks = tasksByMeeting[meetingNo];
            const latestTasks = processGroupTasks(meetingTasks);

            // Filter Inspectors
            const inspectors = allUsers.filter(u => u.role === "Inspector");

            // Get some meta from the first task properly
            const firstTask = meetingTasks[0];
            const cleanMeetingNo = meetingNo.replace("การประชุม", "").trim();
            const title = `ครั้งที่ ${cleanMeetingNo}`; // e.g. "ครั้งที่ 1-1/69"
            return (
              <TaskGroupCard
                key={meetingNo}
                title={`ครั้งที่ ${meetingNo}`}
                subtitle={meetingTasks[0]?.remarkDate}
                tasks={latestTasks}
                expandedTaskId={expandedTaskId}
                historyMap={historyMap}
                onTaskClick={handleTaskClick}
                onForwardClick={handleForwardClick}
                allUsers={allUsers}
                isAdmin={!!user?.isAdmin}
                currentUserName={user?.nickName || user?.name}
                userRole={user?.role}
                onRefresh={handleRefresh}
                meetingId={meetingTasks[0]?.meeting_id}
              />
            );
          })
        )}

        <ForwardTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmForward}
          loading={loading}
          mode={modalMode}
          responsibleName={selectedTask?.responsible}
        />

        {user && (
          <SetPasswordModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            lineUserId={user.id}
          />
        )}
      </div>
    </div>
  );
}
