import { Task, User } from "../lib/api";
import { formatName } from "../lib/format";
import TaskRow from "./TaskRow";
import TaskDetailInline from "./TaskDetailInline";

interface TaskGroupCardProps {
    title: string;
    subtitle?: string;
    tasks: Task[];
    expandedTaskId: string | null;
    historyMap: Record<string, Task[]>;
    onTaskClick: (task: Task) => void;
    onForwardClick: (task: Task, actionType: "SUBMIT" | "RETURN" | "CLOSE") => void;
    inspectors?: User[];
}

export default function TaskGroupCard({
    title,
    subtitle,
    tasks,
    expandedTaskId,
    historyMap,
    onTaskClick,
    onForwardClick,
    inspectors = []
}: TaskGroupCardProps) {
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
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6 h-fit">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-blue-700">{title}</h3>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-blue-700">
                        สถานะปิดงาน {closedCount}/{total}
                    </span>
                </div>
            </div>

            <div className="mb-4">
                {subtitle && (
                    <p className="text-sm text-blue-700 font-bold mb-2">{subtitle}</p>
                )}

                {/* Holder Summary */}
                <div className="text-xs text-blue-600 font-medium">
                    <span className="mr-1">เอกสารรอตรวจอยู่ที่ :</span>
                    {holderSummaryString}
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 px-4 mb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <div className="col-span-4 pl-2">วาระ/เรื่อง</div>
                    <div className="col-span-4 text-left pl-1">ผู้รับผิดชอบ</div>
                    <div className="col-span-3 text-center">สถานะ</div>
                    <div className="col-span-1 text-center">ด่วน</div>
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
                            statusText = `ส่งตรวจ ${holderName}`;
                            statusClass = "bg-blue-100 text-blue-600"; // Blue for Sending
                        } else {
                            // With Responsible
                            // Check last history for "Reviews"
                            const sortedHistory = [...history].sort((a, b) => b.order - a.order);

                            let foundReview = false;
                            for (let i = sortedHistory.length - 1; i >= 0; i--) {
                                const h = sortedHistory[i];
                                if (h.id === task.id) continue;

                                if (h.status === "ตรวจแล้ว") {
                                    statusText = `${formatName(h.currentHolder)} ตรวจแล้ว`;
                                    statusClass = "bg-green-100 text-green-700"; // Green for Reviewed
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
    );
}
