import { Task } from "../lib/api";
import { formatName } from "../lib/format";

interface TaskDetailInlineProps {
    currentTask: Task;
    history: Task[];
    onForward: (task: Task, actionType: "SUBMIT" | "RETURN" | "CLOSE") => void;
}

export default function TaskDetailInline({ currentTask, history, onForward }: TaskDetailInlineProps) {

    // Show forward button if status is empty (Pending) 
    const canForward = !currentTask.status;

    return (
        <div className="bg-slate-50/80 rounded-b-2xl p-4 mb-3 mx-2 -mt-3 border-x border-b border-indigo-100 shadow-inner relative z-0 animate-in slide-in-from-top-2 duration-200">

            {/* Note Section */}
            <div className="mb-4">
                {currentTask.note && (
                    <p className="text-xs text-slate-800 font-semibold mb-2">Note: {currentTask.note}</p>
                )}
            </div>

            {/* Action Button Area */}
            {canForward && (
                <div className="flex justify-end gap-2 mb-4 flex-wrap">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onForward(currentTask, "SUBMIT");
                        }}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-colors font-bold shadow-sm"
                    >
                        ส่งตรวจ
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onForward(currentTask, "RETURN");
                        }}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-colors font-bold shadow-sm"
                    >
                        ตรวจแล้ว
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onForward(currentTask, "CLOSE");
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-colors font-bold shadow-sm border border-red-100"
                    >
                        ปิดงาน
                    </button>
                </div>
            )}

            {/* Timeline Area */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Timeline การส่งต่อ</h4>
                <div className="space-y-4">
                    {history.filter(h => h.status).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">ยังไม่มีการดำเนินการ</p>
                    ) : (
                        [...history].reverse().filter(h => h.status).map((item, index) => { // Reverse and Filter empty status
                            // Determine Action String
                            let actionText = "";
                            const sender = formatName(item.currentHolder || item.responsible); // Fallback
                            const receiver = formatName(item.assignedTo || "");

                            // "ส่งตรวจ" Logic
                            if (item.status === "ส่งตรวจ") {
                                // Add (ผู้รับผิดชอบ) if sender is responsible
                                // We don't strictly know if they are 'Responsible' role, but usually yes.
                                // Or we check vs item.responsible field?
                                // item.responsible is the 'owner' of the task?
                                // If item.currentHolder == item.responsible
                                const senderLabel = item.currentHolder === item.responsible ? `${sender} (ผู้รับผิดชอบ)` : sender;
                                actionText = `${senderLabel} > ส่งตรวจ ${receiver}`;
                            }
                            // "ตรวจแล้ว" Logic
                            else if (item.status === "ตรวจแล้ว") {
                                actionText = `${sender} > ตรวจแล้ว`;
                            }
                            // "ปิดงาน" Logic
                            else if (item.status === "ปิดงาน") {
                                actionText = `${sender} > ปิดงาน`;
                            }
                            // Fallback / Initial
                            else {
                                actionText = `${sender} (เริ่มต้น)`;
                            }

                            return (
                                <div key={index} className="flex gap-3 relative">
                                    {/* Timeline Line (simplified) */}
                                    <div className="w-1 bg-indigo-100 absolute top-2 bottom-[-16px] left-[5px] rounded-full"></div>
                                    <div className="w-3 h-3 rounded-full bg-indigo-500 z-10 mt-1.5 shrink-0 border-2 border-white shadow-sm"></div>

                                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm w-full">
                                        <p className="text-xs font-bold text-slate-700 mb-1">
                                            {actionText}
                                        </p>
                                        {item.remark && (
                                            <p className="text-xs text-slate-600 mb-2">"{item.remark}"</p>
                                        )}
                                        <p className="text-[10px] text-slate-400">
                                            {item.timestamp ? new Date(item.timestamp).toLocaleString("th-TH") : "-"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
