"use client";

import { useState, useEffect } from "react";
import { User, createSubject } from "../lib/api";

interface CreateSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    meetingId: string;
    users: User[];
    onSuccess?: () => void;
}

export default function CreateSubjectModal({ isOpen, onClose, meetingId, users, onSuccess }: CreateSubjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [ecm, setEcm] = useState("");
    const [note, setNote] = useState("");
    const [urgent, setUrgent] = useState(false);
    const [dueDate, setDueDate] = useState("");
    const [responsible, setResponsible] = useState("");

    // Reset form when opened
    useEffect(() => {
        if (isOpen) {
            setSubject("");
            setEcm("");
            setNote("");
            setUrgent(false);
            setDueDate("");
            setResponsible("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim()) {
            alert("กรุณากรอกหัวข้อ/วาระ");
            return;
        }

        setLoading(true);
        const result = await createSubject({
            meetingId,
            subject: subject.trim(),
            ecm: ecm.trim(),
            note: note.trim(),
            urgent,
            dueDate,
            responsible,
            currentHolder: responsible // Task starts with the responsible person
        });
        setLoading(false);

        if (result.success) {
            if (onSuccess) onSuccess();
            onClose();
        } else {
            alert("เกิดข้อผิดพลาด: " + result.error);
        }
    };

    const ownerUsers = users.filter(u => u.role === "Owner" || u.isAdmin || u.role === "Inspector");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                    <h2 className="text-xl font-bold text-white tracking-tight">เพิ่มวาระใหม่</h2>
                    <p className="text-emerald-100 text-xs mt-1">ระบุรายละเอียดของวาระที่ต้องการเพิ่มภายในการประชุมนี้</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">วาระ / เรื่อง <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="เช่น 4.1 (ลับ) ..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* ECM */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ECM</label>
                            <input
                                type="text"
                                value={ecm}
                                onChange={e => setEcm(e.target.value)}
                                placeholder="เลข ECM (ถ้ามี)"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                            />
                        </div>
                        {/* Responsible */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ผู้รับผิดชอบ</label>
                            <select
                                value={responsible}
                                onChange={e => setResponsible(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                            >
                                <option value="">-- ยังไม่ระบุ --</option>
                                {ownerUsers.map(u => (
                                    <option key={u.id} value={u.nickName || u.name}>{u.nickName || u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:items-end">
                        {/* Due Date */}
                        <div className="w-full sm:w-auto max-w-[220px]">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">วันครบกำหนด</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                            />
                        </div>
                        {/* Urgent */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 h-[48px] w-full sm:w-auto">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={urgent}
                                    onChange={e => setUrgent(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-checked:bg-red-500 rounded-full peer-focus:ring-2 peer-focus:ring-red-300 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                            <span className="text-sm font-bold text-slate-700">🔥 ด่วน</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">หมายเหตุเพิ่มเติม</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            placeholder="รายละเอียดเพิ่มเติม..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            disabled={loading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                        >
                            {loading ? "กำลังบันทึก..." : "➕ บันทึกวาระ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
