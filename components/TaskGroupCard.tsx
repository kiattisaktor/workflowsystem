import { useState } from "react";
import { Task, User } from "../lib/api";
import { formatName } from "../lib/format";
import TaskRow from "./TaskRow";
import TaskDetailInline from "./TaskDetailInline";
import ReportModal from "./ReportModal";

interface TaskGroupCardProps {
    title: string;
    subtitle?: string;
    tasks: Task[];
    expandedTaskId: string | null;
    historyMap: Record<string, Task[]>;
    onTaskClick: (task: Task) => void;
    onForwardClick: (task: Task, actionType: "SUBMIT" | "RETURN" | "CLOSE") => void;
    inspectors?: User[];
    showReportButton?: boolean;
}

export default function TaskGroupCard({
    title,
    subtitle,
    tasks,
    expandedTaskId,
    historyMap,
    onTaskClick,
    onForwardClick,
    inspectors = [],
    showReportButton = false
}: TaskGroupCardProps) {
    const [isReportOpen, setIsReportOpen] = useState(false);

    // Calculate specific stats for this group if needed
    const total = tasks.length;
    // "Closed" means status is "ปิดงาน" (CLOSE action)
    const closedCount = tasks.filter(t => t.status === "ปิดงาน").length;

    // Holder Summary Logic (Inspectors only)
    // We want to list ALL inspectors provided in props, and count their tasks.
    // Task.currentHolder usually contains the 'name' (e.g. "ToR (ต่อ)").
    // Inspector User object has name="ToR (ต่อ)", nickName="ต่อ".

    // 1. Create a map of inspector counts
    const inspectorCounts = inspectors.map(inspector => {
        // Count tasks where currentHolder matches inspector.name OR inspector.nickName
        const count = tasks.filter(t => {
            const holder = t.currentHolder;
            return holder === inspector.name ||
                holder === inspector.nickName ||
                holder.includes(inspector.nickName || "___"); // Fallback partial match?
            // Better: strict match on formatted?
            // If holder is "ToR (ต่อ)", formatted is "ต่อ".
            // If inspector.nickName is "ต่อ". Matches.
        }).length;

        // Let's refine the filter:
        const refinedCount = tasks.filter(t => {
            if (!t.currentHolder) return false;
            if (t.currentHolder === inspector.name) return true;
            if (inspector.nickName && t.currentHolder === inspector.nickName) return true;
            // Handle "Name (Nick)" in DB vs "Nick" in inspector object
            if (t.currentHolder.includes(inspector.name)) return true; // DB longer
            return false;
        }).length;

        return {
            nickName: inspector.nickName || inspector.name, // Fallback to name if no nickname
            count: refinedCount
        };
    });

    // 2. Format string: Nick Count, Nick Count
    const holderSummaryString = inspectorCounts
        .map(i => `${i.nickName} ${i.count}`)
        .join(", ");

    return (
        <>
            <div className="bg-white rounded-[2rem] p-2 sm:p-5 shadow-sm border border-slate-100 mb-6 h-fit relative overflow-hidden">
                {/* Decorative Top Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-200 to-amber-200 opacity-50"></div>

                <div className="flex justify-between items-start mb-3 pt-2 px-2 sm:px-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            ปิดงาน {closedCount}/{total}
                        </span>
                        {showReportButton && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsReportOpen(true);
                                }}
                                className="bg-[#F8F9FF] text-indigo-600 hover:bg-indigo-50 border border-indigo-100 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <span>สรุปสถานะ</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-5 px-2 sm:px-0">
                    {subtitle && (
                        <p className="text-sm text-red-600 font-bold mb-3">{subtitle}</p>
                    )}

                    {/* Holder Summary - Remove Box/Border */}
                    <div className="text-xs text-blue-600 leading-relaxed">
                        <span className="font-bold mr-1 inline">เอกสารรอตรวจอยู่ที่ :</span>
                        <span className="opacity-90">{holderSummaryString || "-"}</span>
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                    {/* Header - Show on All Screens */}
                    <div className="grid grid-cols-12 gap-2 px-2 sm:px-4 mb-2 text-[10px] md:text-xs text-black font-semibold uppercase tracking-wider">
                        <div className="col-span-3 text-left">วาระ/เรื่อง</div>
                        <div className="col-span-2 text-left">ผู้รับผิดชอบ</div>
                        <div className="col-span-5 flex justify-center items-center">สถานะ</div>
                        <div className="col-span-2 flex justify-center items-center">ด่วน</div>
                    </div>

                    {tasks.map(task => {
                        const isExpanded = expandedTaskId === task.id;
                        const history = historyMap[`${task.sheet}|${task.work}|${task.meetingNo}|${task.subject}`] || [];

                        // Logic for Status Badge
                        let statusText = "";
                        let statusClass = "";

                        if (task.status === "ปิดงาน") {
                            statusText = "ปิดงาน";
                            statusClass = "bg-slate-100 text-slate-400";
                        } else if (task.status && task.status !== "Pending") {
                            // Explicit status (e.g. from manual edits), excluding "Pending"
                            statusText = task.status;
                            statusClass = "bg-emerald-100 text-emerald-600";
                        } else {
                            // Empty status (or Pending)

                            // Normalize names for comparison
                            const holderName = formatName(task.currentHolder || task.responsible);
                            const responsibleName = formatName(task.responsible);

                            // Check if held by someone else (Inspector)
                            // Only if currentHolder is explicitly set and different
                            if (task.currentHolder && holderName !== responsibleName) {
                                // Waiting for Inspector
                                statusText = `ส่ง ${holderName}`;
                                statusClass = "bg-[#FFF0F0] text-[#C00000]"; // Specific Red
                            } else {
                                // With Responsible
                                // Check last history for "Reviews"
                                // History is sorted Descending (Newest first)
                                const sortedHistory = [...history].sort((a, b) => b.order - a.order);

                                let foundReview = false;
                                // Iterate from NEWEST (index 0) downwards
                                for (let i = 0; i < sortedHistory.length; i++) {
                                    const h = sortedHistory[i];
                                    if (h.id === task.id) continue;

                                    if (h.status === "ตรวจแล้ว") {
                                        statusText = `${formatName(h.currentHolder)} แล้ว`;
                                        statusClass = "bg-[#EBF9ED] text-[#036338]"; // Specific Green
                                        foundReview = true;
                                        break;
                                    }
                                }
                            }
                        }

                        return (
                            <div key={task.id}>
                                <TaskRow
                                    task={task}
                                    onClick={onTaskClick}
                                    statusText={statusText}
                                    statusClass={statusClass}
                                />
                                {isExpanded && (
                                    <TaskDetailInline
                                        currentTask={task}
                                        history={history}
                                        onForward={onForwardClick}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                title={title}
                tasks={tasks}
            />
        </>
    );
}
