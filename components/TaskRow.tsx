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
            className="group relative grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 mb-3 rounded-2xl transition-all cursor-pointer bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:border-amber-100 items-center min-h-[64px]"
        >
            {/* Col 1: Subject (3 spans) - Increased from 2 */}
            <div className="col-span-3 flex items-center gap-3 overflow-hidden pl-1">
                <div className="flex flex-col min-w-0 w-full">
                    {/* Removed truncate to allow wrapping */}
                    <span title={task.subject} className="text-xs font-bold text-slate-700 group-hover:text-amber-700 transition-colors whitespace-normal break-words">
                        {task.subject}
                    </span>
                </div>
            </div>

            {/* Mobile Wrapper -> Contents to unwrap grid items */}
            <div className="contents">
                {/* Col 2: Responsible (2 spans) - Reduced from 3 */}
                <div className="col-span-2 flex justify-start items-center">
                    <div className="flex items-center gap-2">
                        {/* Mobile Label Removed */}
                        <span className="truncate text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-100 group-hover:border-amber-100 group-hover:bg-amber-50">
                            {formatName(task.responsible)}
                        </span>
                    </div>
                </div>

                {/* Col 3: Status (5 spans) */}
                <div className="col-span-5 flex justify-center items-center">
                    {statusText && (
                        <span className={`text-[10px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm whitespace-normal break-words text-center leading-tight ${statusClass || 'bg-slate-100 text-slate-400'}`}>
                            {statusText}
                        </span>
                    )}
                </div>

                {/* Col 4: Urgent (2 spans) */}
                <div className="col-span-2 flex justify-center items-center pl-0">
                    {isUrgent ? (
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-sm sm:text-lg animate-pulse filter drop-shadow-sm leading-none" title="ด่วน">🔥</span>
                            {task.dueDate && (
                                <span className="text-[9px] sm:text-[10px] text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded mt-0.5 whitespace-nowrap scale-90 sm:scale-100 origin-center">
                                    {task.dueDate}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="block w-6"></span>
                    )}
                </div>
            </div>
        </div>
    );
}
