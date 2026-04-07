import { useState } from "react";
import { Task, addRemarkToLastAction, reopenTask } from "../lib/api";
import { formatName } from "../lib/format";
import EditSubjectModal from "./EditSubjectModal";

interface TaskDetailInlineProps {
    currentTask: Task;
    history: Task[];
    onForward: (task: Task, actionType: "SUBMIT" | "RETURN" | "CLOSE") => void;
    isAdmin?: boolean;
    userRole?: string;
    currentUserName?: string;
    onRefresh?: () => void;
}

export default function TaskDetailInline({ currentTask, history, onForward, isAdmin, userRole, currentUserName, onRefresh }: TaskDetailInlineProps) {
    const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
    
    // Inline Add Remark State
    const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
    const [remarkText, setRemarkText] = useState("");
    const [submittingRemark, setSubmittingRemark] = useState(false);

    // Show forward button if status is empty (Pending) 
    const canForward = !currentTask.status;

    return (
        <>
            <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-b-2xl p-2 sm:p-4 mb-3 mx-0 sm:mx-2 -mt-4 border-x border-b border-indigo-50/50 shadow-inner relative z-0 animate-in slide-in-from-top-2 duration-200">

            {/* ECM and Note Section */}
            {(currentTask.ecm || currentTask.note) && (
                <div className="mb-5 pt-2 space-y-2">
                    {currentTask.ecm && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex justify-between items-start">
                            <p className="text-xs text-amber-900 font-bold mb-0 flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5">📌</span>
                                <span className="font-bold">ECM: </span>
                                {currentTask.ecm}
                            </p>
                        </div>
                    )}
                    {currentTask.note && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex justify-between items-start">
                            <p className="text-xs text-amber-900 font-bold mb-0 flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5">📌</span>
                                <span className="font-bold">Note: </span>
                                {currentTask.note}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Always show edit button for ADMIN above action buttons */}
            {isAdmin && (
                <div className="mb-4 flex justify-end px-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditSubjectOpen(true); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        แก้ไขข้อมูลวาระ
                    </button>
                </div>
            )}

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

            {/* Re-open Button Area (Only for Closed Tasks) */}
            {currentTask.status === "ปิดงาน" && (isAdmin || userRole === 'Owner') && (
                <div className="flex justify-center mb-4 px-2">
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm("ต้องการย้อนสถานะงานนี้ใช่หรือไม่?")) {
                                const res = await reopenTask(currentTask.id);
                                if (res.success && onRefresh) onRefresh();
                                else if (!res.success) alert("Error: " + res.error);
                            }
                        }}
                        className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold border border-orange-200 shadow-sm active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        <span>ย้อนสถานะเพื่อดำเนินต่อ</span>
                    </button>
                </div>
            )}

            {/* Timeline Area */}
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Timeline</h4>
                <div className="space-y-5 px-1">
                    {history.filter(h => h.status).length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">ยังไม่มีการดำเนินการ</p>
                    ) : (
                        [...history].reverse().filter(h => h.status).map((item, index) => { // Reverse and Filter empty status
                            const isLastAction = index === 0;
                            const holderNick = formatName(item.currentHolder || item.responsible).toLowerCase().trim();
                            const myNick = (currentUserName || "").toLowerCase().trim();
                            const canAddRemark = isLastAction && currentTask.status !== "ปิดงาน" && (isAdmin || (myNick && myNick === holderNick));

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
                                            
                                            {/* Add Remark Section */}
                                            {canAddRemark && !editingRemarkId && (
                                                <div className="flex justify-end mt-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingRemarkId(item.id); setRemarkText(""); }} 
                                                        className="text-[10px] bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-all border border-amber-200/50 shadow-sm hover:shadow-md active:scale-95"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                        </svg>
                                                        เพิ่มหมายเหตุ
                                                    </button>
                                                </div>
                                            )}
                                            {editingRemarkId === item.id && (
                                                <div className="mt-3 bg-white p-3 rounded-lg border border-amber-200">
                                                    <textarea 
                                                        value={remarkText}
                                                        onChange={e => setRemarkText(e.target.value)}
                                                        placeholder="พิมพ์หมายเหตุเพิ่มเติม..."
                                                        className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-amber-400 min-h-[60px] resize-none mb-2"
                                                        disabled={submittingRemark}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex justify-end gap-2 text-[10px]">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEditingRemarkId(null); }}
                                                            className="text-slate-500 hover:text-slate-700 px-2 py-1"
                                                            disabled={submittingRemark}
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!remarkText.trim()) return;
                                                                
                                                                // Find pending row (empty status)
                                                                const pendingRow = history.find(h => !h.status);
                                                                if (!pendingRow) {
                                                                    alert("ไม่สามารถเพิ่มหมายเหตุได้เนื่องจากไม่มีลำดับรอตรวจสอบ");
                                                                    return;
                                                                }

                                                                setSubmittingRemark(true);
                                                                const res = await addRemarkToLastAction(item, pendingRow.id, pendingRow.order, remarkText);
                                                                setSubmittingRemark(false);
                                                                
                                                                if (res.success) {
                                                                    setEditingRemarkId(null);
                                                                    if (onRefresh) onRefresh();
                                                                } else {
                                                                    alert("เกิดข้อผิดพลาด: " + res.error);
                                                                }
                                                            }}
                                                            className="font-bold bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                                            disabled={!remarkText.trim() || submittingRemark}
                                                        >
                                                            {submittingRemark ? "กำลังบันทึก..." : "บันทึก"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            </div>

            {isAdmin && (
                <EditSubjectModal
                    isOpen={isEditSubjectOpen}
                    onClose={() => setIsEditSubjectOpen(false)}
                    subjectId={currentTask.subject_id || ""}
                    initialData={{
                        subject: currentTask.subject,
                        ecm: currentTask.ecm || "",
                        note: currentTask.note || "",
                        urgent: currentTask.urgent,
                        dueDate: currentTask.dueDate || "",
                        responsible: currentTask.responsible,
                        meeting_id: currentTask.meeting_id || "",
                        sheet: currentTask.sheet,
                        work: currentTask.work
                    }}
                    onSuccess={() => onRefresh && onRefresh()}
                />
            )}
        </>
    );
}
