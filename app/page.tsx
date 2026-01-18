"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import TaskGroupCard from "../components/TaskGroupCard";
import TaskRow from "../components/TaskRow";
import TaskDetailInline from "../components/TaskDetailInline";
import ForwardTaskModal from "../components/ForwardTaskModal";
import { Task, User, forwardTask, getTasks, getUsers } from "../lib/api";
import { useLiff } from "../components/LiffProvider";
import { registerUser } from "../lib/register";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Expanded state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { isLoggedIn, profile, error: liffError } = useLiff();
  const [isRegistering, setIsRegistering] = useState(false);

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

  // Register user
  useEffect(() => {
    if (isLoggedIn && profile) {
      setIsRegistering(true);
      registerUser(profile.userId, profile.displayName)
        .then((res) => {
          // Refresh users to get the new role immediately
          getUsers().then(setAllUsers);
        })
        .finally(() => setIsRegistering(false));
    }
  }, [isLoggedIn, profile]);

  // Resolve Nickname for "Check" action
  // If we have profile and allUsers loaded, find the matching user
  const currentUserInSheet = (profile && allUsers.length > 0)
    ? allUsers.find(u => u.id === profile.userId)
    : null;

  const currentUserName = currentUserInSheet
    ? (currentUserInSheet.nickName || currentUserInSheet.name)
    : (profile ? profile.displayName : "User A (Guest)");

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
    const subGroups = meetingTasks.reduce((acc, t) => {
      const key = t.subject;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {} as Record<string, Task[]>);

    return Object.values(subGroups).map(subList => {
      // Sort by order descending
      const sorted = subList.sort((a, b) => b.order - a.order);
      return sorted[0];
    });
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
    // Pass modalMode as actionType
    const result = await forwardTask(selectedTask, remark, nextUserName, currentUserName, modalMode);
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

  // Calculate stats for HEADER (Global for the tab)
  const totalTasks = tabTasks.length;
  const completedTasks = tabTasks.filter(t => !!t.status).length;

  // 6. Check for No Role
  if (isLoggedIn && currentUserInSheet && currentUserInSheet.role === "No Role") {
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
          <div className="text-xl text-slate-600 font-semibold">
            {profile?.displayName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-50 to-transparent -z-10"></div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <DashboardHeader
          profile={profile ? profile : null}
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeWork={activeWork}
          onWorkChange={setActiveWork}
          workOptions={workOptions}
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
            const subtitle = firstTask.remarkDate || ""; // e.g. "ส่งออกจาก ลออ..."

            return (
              <TaskGroupCard
                key={meetingNo}
                title={title}
                subtitle={subtitle}
                tasks={latestTasks}
                expandedTaskId={expandedTaskId}
                historyMap={historyMap}
                onTaskClick={handleTaskClick}
                onForwardClick={handleForwardClick}
                inspectors={inspectors}
                showReportButton={activeWork === "Resume"}
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
      </div>
    </div>
  );
}
