import { Task } from "../lib/api";
import { formatName } from "../lib/format";

interface TaskRowProps {
    task: Task;
    onClick: (task: Task) => void;
    statusText?: string;
    statusClass?: string;
}

export default function TaskRow({ task, onClick, statusText, statusClass }: TaskRowProps) {
    // Status Logic:
    // If status is "ปิดงาน", use specific text/style.
    const isClosed = task.status === "ปิดงาน";

    // Urgent
    const isUrgent = task.urgent;

    return (
        <div
            onClick={() => onClick(task)}
            className="group relative flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 mb-3 rounded-2xl transition-all cursor-pointer bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:border-amber-100 items-start sm:items-center min-h-[auto] sm:min-h-[64px]"
        >
            {/* Col 1: Subject (Desktop: 2 spans) */}
            <div className="w-full sm:col-span-2 flex items-center gap-3 overflow-hidden pl-1">
                <div className="flex flex-col min-w-0 w-full">
                    {/* Reduced font size as requested */}
                    <span title={task.subject} className="truncate text-sm sm:text-xs font-bold text-slate-700 group-hover:text-amber-700 transition-colors">
                        {task.subject}
                    </span>
                </div>
            </div>

            {/* Mobile Wrapper for Details */}
            <div className="flex w-full sm:contents justify-between items-center mt-1 sm:mt-0">
                {/* Col 2: Responsible (Desktop: 3 spans) */}
                <div className="sm:col-span-3 flex justify-start items-center">
                    <div className="flex items-center gap-2">
                        {/* Mobile Label */}
                        <span className="sm:hidden text-[10px] text-slate-400 font-medium">ผู้รับผิดชอบ</span>
                        <span className="truncate text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group-hover:border-amber-100 group-hover:bg-amber-50">
                            {formatName(task.responsible)}
                        </span>
                    </div>
                </div>

                {/* Col 3: Status (Desktop: 5 spans) */}
                <div className="sm:col-span-5 flex justify-end sm:justify-center items-center">
                    {statusText && (
                        /* Removed truncate, added whitespace-normal and break-words for wrapping */
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-normal break-words text-center leading-tight ${statusClass || 'bg-slate-100 text-slate-400'}`}>
                            {statusText}
                        </span>
                    )}
                </div>

                {/* Col 4: Urgent (Desktop: 2 spans) */}
                <div className="sm:col-span-2 flex justify-end sm:justify-center items-center pl-0">
                    {isUrgent ? (
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-lg animate-pulse filter drop-shadow-sm leading-none" title="ด่วน">🔥</span>
                            {task.dueDate && (
                                <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
                                    {task.dueDate}
                                </span>
                            )}
                        </div>
                    ) : (
                        // Placeholder to maintain grid spacing on desktop
                        <span className="hidden sm:block w-6"></span>
                    )}
                </div>
            </div>
        </div>
    );
}
