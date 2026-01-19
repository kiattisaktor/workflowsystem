"use client";

import { useState } from "react";
import { setPassword } from "../lib/api";

interface SetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    lineUserId: string;
}

export default function SetPasswordModal({ isOpen, onClose, lineUserId }: SetPasswordModalProps) {
    const [password, setPasswordState] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            return;
        }
        if (password.length < 6) {
            setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
            return;
        }

        setLoading(true);
        const result = await setPassword(lineUserId, password);
        setLoading(false);

        if (result.success) {
            alert("ตั้งรหัสผ่านเรียบร้อยแล้ว");
            onClose();
        } else {
            setError(result.error || "Failed to set password");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">ตั้งรหัสผ่านสำหรับเข้าใช้งานผ่าน Web</h3>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                รหัสผ่านใหม่
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPasswordState(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "บันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
