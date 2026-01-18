import React from "react";
import { Task } from "../lib/api";
import { formatName } from "../lib/format";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tasks: Task[];
}

export default function ReportModal({ isOpen, onClose, title, tasks }: ReportModalProps) {
    if (!isOpen) return null;

    // Sort by Work (Agenda No) naturally
    const sortedTasks = [...tasks].sort((a, b) => {
        const workA = a.work || "";
        const workB = b.work || "";
        return workA.localeCompare(workB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const handleCopy = () => {
        let text = `สรุปวาระการประชุม ${title}\n\n`;
        sortedTasks.forEach((t, i) => {
            const status = t.status || "Pending";
            const responsible = formatName(t.responsible);
            text += `${t.work ? t.work + " " : ""}${t.subject}\n`;
            text += `   - ECM: ${t.ecm || "-"}\n`;
            text += `   - Note: ${t.note || "-"}\n`;
            text += `   - สถานะ: ${status} (${responsible})\n`;
            text += "\n";
        });
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">สรุปวาระการประชุม</h2>
                        <p className="text-sm text-slate-500">{title}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold transition-colors"
                        >
                            📋 Copy Text
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 sm:p-6 overflow-y-auto grow bg-slate-50/30">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 w-[20%]">วาระ/เรื่อง</th>
                                    <th className="px-4 py-3 w-[30%]">ECM</th>
                                    <th className="px-4 py-3 w-[35%]">Note</th>
                                    <th className="px-4 py-3 w-[15%]">สถานะ/ผู้รับผิดชอบ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-slate-800 align-top">
                                            <div className="font-semibold mb-1">{task.subject}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 align-top">
                                            {task.ecm ? (
                                                <div className="bg-amber-50 text-amber-900 border border-amber-100 px-2 py-1 rounded text-xs">
                                                    {task.ecm}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 align-top">
                                            {task.note ? (
                                                <div className="bg-amber-50 text-amber-900 border border-amber-100 px-2 py-1 rounded text-xs">
                                                    {task.note}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${task.status === "ปิดงาน" ? "bg-slate-100 text-slate-500" :
                                                    task.status === "ตรวจแล้ว" ? "bg-emerald-100 text-emerald-700" :
                                                        task.status === "ส่งตรวจ" ? "bg-red-50 text-red-700" :
                                                            "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    {task.status || "Pending"}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {formatName(task.responsible)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Copy Button (Fixed at bottom if needed, or just rely on top) */}
                <div className="sm:hidden p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        📋 Copy Summary Text
                    </button>
                </div>

            </div>
        </div>
    );
}
