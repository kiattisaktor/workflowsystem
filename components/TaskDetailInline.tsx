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
        <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-b-2xl p-4 mb-3 mx-2 -mt-4 border-x border-b border-indigo-50/50 shadow-inner relative z-0 animate-in slide-in-from-top-2 duration-200">

            {/* Note Section */}
            <div className="mb-5 pt-2">
                {currentTask.note && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs text-amber-900 font-bold mb-0 flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">📌</span>
                            {currentTask.note}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Button Area */}
            {canForward && (
                <div className="grid grid-cols-3 gap-3 mb-4 px-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onForward(currentTask, "SUBMIT");
                        }}
                        className="col-span-1 bg-[#FFF0F0] hover:bg-red-50 text-[#C00000] text-[10px] py-1.5 px-3 rounded-full flex items-center justify-center gap-1 transition-colors font-bold border border-red-100 shadow-sm"
                    >
                        <span>ส่งตรวจ</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onForward(currentTask, "RETURN");
                        }}
                        className="col-span-1 bg-[#EBF9ED] hover:bg-emerald-50 text-[#036338] text-[10px] py-1.5 px-3 rounded-full flex items-center justify-center gap-1 transition-colors font-bold border border-emerald-100 shadow-sm"
                    >
                        <span>ตรวจแล้ว</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onForward(currentTask, "CLOSE");
                        }}
                        className="col-span-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] py-1.5 px-3 rounded-full flex items-center justify-center gap-1 transition-colors font-bold border border-slate-200 shadow-sm"
                    >
                        <span>ปิดงาน</span>
                    </button>
                </div>
            )}

            {/* Timeline Area */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Timeline</h4>
                <div className="space-y-5 px-1">
                    {history.filter(h => h.status).length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">ยังไม่มีการดำเนินการ</p>
                    ) : (
                        [...history].reverse().filter(h => h.status).map((item, index) => { // Reverse and Filter empty status
                            // Determine Action String
                            let actionText = "";
                            const sender = formatName(item.currentHolder || item.responsible); // Fallback
                            const receiver = formatName(item.assignedTo || "");

                            // "ส่งตรวจ" Logic
                            if (item.status === "ส่งตรวจ") {
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
                                <div key={index} className="flex gap-4 relative">
                                    {/* Timeline Line */}
                                    <div className="w-0.5 bg-slate-100 absolute top-2 bottom-[-20px] left-[5px] z-0"></div>
                                    <div className="w-3 h-3 rounded-full ring-4 ring-white bg-indigo-400 z-10 mt-1.5 shrink-0 shadow-sm relative"></div>

                                    <div className="w-full">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                                            <p className="text-xs font-bold text-slate-700 mb-1">
                                                {actionText}
                                            </p>
                                            {item.remark && (
                                                <p className="text-xs text-slate-600 mb-2 mt-2 bg-white p-2 rounded border border-slate-100">"{item.remark}"</p>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-1 text-right">
                                                {item.timestamp ? new Date(item.timestamp).toLocaleString("th-TH") : "-"}
                                            </p>
                                        </div>
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
