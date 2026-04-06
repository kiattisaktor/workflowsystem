import { useState } from "react";
import * as XLSX from "xlsx";
import { Task, User, toggleMeetingDelete } from "../lib/api";
import { formatName } from "../lib/format";
import TaskRow from "./TaskRow";
import TaskDetailInline from "./TaskDetailInline";
import ReportModal from "./ReportModal";
import EditMeetingModal from "./EditMeetingModal";
import CreateSubjectModal from "./CreateSubjectModal";

interface TaskGroupCardProps {
    title: string;
    subtitle?: string;
    tasks: Task[];
    expandedTaskId: string | null;
    historyMap: Record<string, Task[]>;
    onTaskClick: (task: Task) => void;
    onForwardClick: (task: Task, actionType: "SUBMIT" | "RETURN" | "CLOSE") => void;
    allUsers?: User[];
    isAdmin?: boolean;
    onRefresh?: () => void;
    meetingId?: string;
}

export default function TaskGroupCard({
    title,
    subtitle,
    tasks,
    expandedTaskId,
    historyMap,
    onTaskClick,
    onForwardClick,
    allUsers = [],
    isAdmin = false,
    onRefresh,
    meetingId,
}: TaskGroupCardProps) {
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isEditMeetingOpen, setIsEditMeetingOpen] = useState(false);
    const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

    // Identify Work Type
    const workType = tasks[0]?.work || "";
    const isResume = workType === "Resume";
    const isDraft = workType === "ร่างรายงาน";

    // Stats
    const total = tasks.length;
    const closedCount = tasks.filter(t => t.status === "ปิดงาน").length;
    const inspectors = allUsers.filter(u => u.role === "Inspector");

    const inspectorCounts = inspectors.map(inspector => {
        const refinedCount = tasks.filter(t => {
            if (t.status === "ปิดงาน") return false;
            if (!t.currentHolder) return false;
            if (t.currentHolder === inspector.name) return true;
            if (inspector.nickName && t.currentHolder === inspector.nickName) return true;
            if (t.currentHolder.includes(inspector.name)) return true;
            return false;
        }).length;
        return {
            nickName: inspector.nickName || inspector.name,
            count: refinedCount
        };
    });

    const holderSummaryString = inspectorCounts
        .map(i => `${i.nickName} ${i.count}`)
        .join(", ");

    // Excel Export Logic for Draft (พี่จา)
    const handleDirectExcelExport = () => {
        const titleRow = [[`สรุปการส่งงานร่างรายงาน: ${title}`], []]; // Title followed by empty row

        const excelData = tasks.map((task, index) => {
            const history = historyMap[`${task.sheet}|${task.work}|${task.meetingNo}|${task.subject}`] || [];

            // Logic as specified by the user:
            // status.includes("ส่งตรวจ")
            // assigned_to.includes("จา")
            // current_holder == responsible
            const phiJaStep = [...history].reverse().find(h => {
                const s = h.status || "";
                const a = h.assignedTo || "";
                return s.includes("ส่งตรวจ") && a.includes("จา") && h.currentHolder === h.responsible;
            });

            let dateToJa = "";
            if (phiJaStep && phiJaStep.timestamp) {
                dateToJa = new Date(phiJaStep.timestamp).toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }

            return {
                "วาระ/เรื่อง": task.subject,
                "คนรับผิดชอบ": formatName(task.responsible),
                "วันที่ส่งตรวจให้พี่จา": dateToJa || ""
            };
        });

        // Create Worksheet starting with title
        const worksheet = XLSX.utils.aoa_to_sheet(titleRow);

        // Add JSON data starting from row 3 (A3)
        XLSX.utils.sheet_add_json(worksheet, excelData, { origin: "A3" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DraftSummary");

        // Set column widths (Shifted after removing Sequence column)
        worksheet["!cols"] = [
            { wch: 50 }, // วาระ/เรื่อง
            { wch: 20 }, // คนรับผิดชอบ
            { wch: 25 }  // วันที่ส่งตรวจให้พี่จา
        ];

        XLSX.writeFile(workbook, `สรุปส่งงานร่างรายงาน_${title.replace(/\//g, '-')}.xlsx`);
    };

    return (
        <>
            <div className="bg-white rounded-[2rem] p-2 sm:p-5 shadow-sm border border-slate-100 mb-6 h-fit relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-200 to-amber-200 opacity-50"></div>

                <div className="flex justify-between items-start mb-3 pt-2 px-2 sm:px-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        {isAdmin && (
                            <button
                                onClick={() => setIsEditMeetingOpen(true)}
                                className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                                title="แก้ไขข้อมูลการประชุม"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const mid = meetingId || tasks[0]?.meeting_id;
                                    if (!mid) return;
                                    if (confirm("ต้องการ Unpublish การประชุมนี้ใช่หรือไม่? (ข้อมูลจะถูกย้ายไปที่ถังขยะ)")) {
                                        const res = await toggleMeetingDelete(mid, true);
                                        if (res.success && onRefresh) onRefresh();
                                        else if (!res.success) alert("Error: " + res.error);
                                    }
                                }}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                title="Unpublish การประชุม"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            ปิดงาน {closedCount}/{total}
                        </span>

                        {isAdmin && (
                            <button
                                onClick={() => setIsCreateSubjectOpen(true)}
                                className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                สร้างวาระ
                            </button>
                        )}

                        <div className="flex gap-1.5 flex-wrap justify-end">
                            {isResume && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsReportOpen(true);
                                    }}
                                    className="bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <span>สถานะปัจจุบัน</span>
                                </button>
                            )}
                            {isDraft && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDirectExcelExport();
                                    }}
                                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    <span>Export Excel</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-5 px-2 sm:px-0">
                    {subtitle && (
                        <p className="text-sm text-red-600 font-bold mb-3">{subtitle}</p>
                    )}

                    <div className="text-xs text-blue-600 leading-relaxed">
                        <span className="font-bold mr-1 inline">เอกสารรอตรวจอยู่ที่ :</span>
                        <span className="opacity-90">{holderSummaryString || "-"}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 px-2 sm:px-4 mb-2 text-[10px] md:text-xs text-black font-semibold uppercase tracking-wider">
                        <div className="col-span-3 text-left">วาระ/เรื่อง</div>
                        <div className="col-span-2 text-left">ผู้รับผิดชอบ</div>
                        <div className="col-span-4 flex justify-center items-center">สถานะ</div>
                        <div className="col-span-2 flex justify-center items-center">ด่วน</div>
                        <div className="col-span-1"></div>
                    </div>

                    {tasks.map(task => {
                        const isExpanded = expandedTaskId === task.id;
                        const history = historyMap[`${task.sheet}|${task.work}|${task.meetingNo}|${task.subject}`] || [];

                        let statusText = "";
                        let statusClass = "";

                        if (task.status === "ปิดงาน") {
                            statusText = "ปิดงาน";
                            statusClass = "bg-slate-100 text-slate-400";
                        } else if (task.status && task.status !== "Pending") {
                            statusText = task.status;
                            statusClass = "bg-emerald-100 text-emerald-600";
                        } else {
                            const holderName = formatName(task.currentHolder || task.responsible);
                            const responsibleName = formatName(task.responsible);

                            if (task.currentHolder && holderName !== responsibleName) {
                                statusText = `ส่ง ${holderName}`;
                                statusClass = "bg-[#FFF0F0] text-[#C00000]";
                            } else {
                                const sortedHistory = [...history].sort((a, b) => b.order - a.order);
                                for (let i = 0; i < sortedHistory.length; i++) {
                                    const h = sortedHistory[i];
                                    if (h.id === task.id) continue;
                                    if (h.status === "ตรวจแล้ว") {
                                        statusText = `${formatName(h.currentHolder)} แล้ว`;
                                        statusClass = "bg-[#EBF9ED] text-[#036338]";
                                        break;
                                    }
                                }
                            }
                        }

                        return (
                            <div key={task.id || task.subject_id}>
                                <TaskRow
                                    task={task}
                                    onClick={onTaskClick}
                                    statusText={statusText}
                                    statusClass={statusClass}
                                    isAdmin={isAdmin}
                                    onRefresh={onRefresh}
                                />
                                {isExpanded && (
                                    <TaskDetailInline
                                        currentTask={task}
                                        history={history}
                                        onForward={onForwardClick}
                                        isAdmin={isAdmin}
                                        onRefresh={onRefresh}
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

            {isAdmin && (meetingId || tasks[0]?.meeting_id) && (
                <EditMeetingModal
                    isOpen={isEditMeetingOpen}
                    onClose={() => setIsEditMeetingOpen(false)}
                    meetingId={meetingId || tasks[0]?.meeting_id || ""}
                    initialMeetingNo={tasks[0]?.meetingNo || title.replace("ครั้งที่", "").trim()}
                    initialRemarkDate={tasks[0]?.remarkDate || subtitle || ""}
                    onSuccess={() => onRefresh && onRefresh()}
                />
            )}

            {isAdmin && (meetingId || tasks[0]?.meeting_id) && (
                <CreateSubjectModal
                    isOpen={isCreateSubjectOpen}
                    onClose={() => setIsCreateSubjectOpen(false)}
                    meetingId={meetingId || tasks[0]?.meeting_id || ""}
                    users={allUsers}
                    onSuccess={() => onRefresh && onRefresh()}
                />
            )}
        </>
    );
}
