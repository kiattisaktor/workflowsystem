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
            className="grid grid-cols-12 gap-2 p-4 mb-2 rounded-2xl transition-all cursor-pointer bg-white border border-slate-100 shadow-sm hover:shadow-md items-center min-h-[60px]"
        >
            {/* Col 1: Subject (4 spans) - Left Align, No Badge */}
            <div className="col-span-4 flex items-center gap-2 overflow-hidden pl-2">
                <div className="flex flex-col min-w-0">
                    <span title={task.subject} className="truncate text-sm font-bold text-slate-800">{task.subject}</span>
                </div>
            </div>

            {/* Col 2: Responsible (4 spans) - Left Align */}
            <div className="col-span-4 flex justify-start items-center px-1">
                <span className="truncate text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                    {formatName(task.responsible)}
                </span>
            </div>

            {/* Col 3: Status (3 spans) - Center */}
            <div className="col-span-3 flex justify-center items-center text-center">
                {statusText && (
                    <span className={`truncate text-[10px] font-bold px-2 py-1 rounded-full ${statusClass || 'bg-slate-100 text-slate-400'}`}>
                        {statusText}
                    </span>
                )}
            </div>

            {/* Col 4: Urgent (1 span) - Center */}
            <div className="col-span-1 flex justify-center items-center">
                {isUrgent && <span className="text-lg animate-pulse">🔥</span>}
            </div>
        </div>
    );
}
