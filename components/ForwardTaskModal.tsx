"use client";

import { useState, useEffect } from "react";
import { User, getUsers } from "../lib/api";

interface ForwardTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (nextUserName: string, remark: string) => void;
    loading: boolean;
    mode: "SUBMIT" | "RETURN" | "CLOSE";
    responsibleName?: string; // For Return mode
}

export default function ForwardTaskModal({ isOpen, onClose, onConfirm, loading, mode, responsibleName }: ForwardTaskModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [remark, setRemark] = useState("");

    useEffect(() => {
        if (isOpen) {
            getUsers().then(setUsers);
            setRemark("");

            // Pre-select logic
            if (mode === "RETURN" && responsibleName) {
                setSelectedUser(responsibleName);
            } else {
                setSelectedUser("");
            }
        }
    }, [isOpen, mode, responsibleName]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For CLOSE, we don't need a user. For others we do.
        if (mode !== "CLOSE" && !selectedUser) return;
        onConfirm(selectedUser, remark);
    };

    // Filter users for SUBMIT (Inspectors only)
    const inspectorUsers = users.filter(u => u.role === "Inspector");
    const displayUsers = mode === "SUBMIT" ? inspectorUsers : users;

    const getTitle = () => {
        if (mode === "SUBMIT") return "ส่งต่องาน (ส่งตรวจ)";
        if (mode === "RETURN") return "ส่งต่องาน (ตรวจแล้ว)";
        return "ปิดงาน";
    };

    const getButtonText = () => {
        if (loading) return "กำลังดำเนินการ...";
        if (mode === "SUBMIT") return "ยืนยันส่งตรวจ";
        if (mode === "RETURN") return "ยืนยัน (ตรวจแล้ว)";
        return "ยืนยันปิดงาน";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
            <div className="bg-[var(--surface)] p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border)] transform transition-all scale-100">
                <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)] tracking-tight">{getTitle()}</h2>

                <form onSubmit={handleSubmit}>
                    {mode !== "CLOSE" && (
                        <div className="mb-5">
                            <label className="block text-sm font-semibold mb-2 text-[var(--muted)] uppercase tracking-wide">
                                {mode === "RETURN" ? "ส่งคืนผู้รับผิดชอบ" : "มอบหมายให้"}
                            </label>

                            {mode === "RETURN" ? (
                                <div className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-[var(--foreground)] font-bold">
                                    {selectedUser || "ไม่ระบุ"}
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        required
                                    >
                                        <option value="">-- เลือกผู้ตรวจ --</option>
                                        {displayUsers.map((u) => (
                                            <option key={u.id} value={u.nickName || u.name}>
                                                {u.nickName || u.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--muted)]">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mb-8">
                        <label className="block text-sm font-semibold mb-2 text-[var(--muted)] uppercase tracking-wide">บันทึกช่วยจำ / Message</label>
                        <textarea
                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 h-32 text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all resize-none"
                            placeholder={mode === "CLOSE" ? "สรุปผลการดำเนินการปิดงาน..." : "เพิ่มรายละเอียดงาน..."}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-6 py-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] bg-transparent hover:bg-[var(--background)] rounded-xl transition-colors"
                            onClick={onClose}
                            disabled={loading}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className={`px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${mode === 'CLOSE' ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                                }`}
                            disabled={loading || (mode !== "CLOSE" && !selectedUser)}
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
