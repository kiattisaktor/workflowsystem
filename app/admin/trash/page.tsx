"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import {
    getDeletedItems,
    toggleMeetingDelete,
    toggleSubjectDelete,
    permanentDeleteMeeting,
    permanentDeleteSubject
} from "../../../lib/api";

export default function TrashPage() {
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [deletedMeetings, setDeletedMeetings] = useState<any[]>([]);
    const [deletedSubjects, setDeletedSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        const { meetings, subjects } = await getDeletedItems();
        setDeletedMeetings(meetings);
        setDeletedSubjects(subjects);
        setLoading(false);
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.isAdmin) {
            fetchData();
        }
    }, [authLoading, isAuthenticated, user]);

    // Auth & Permission Guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        } else if (!authLoading && isAuthenticated && !user?.isAdmin) {
            router.push("/");
        }
    }, [authLoading, isAuthenticated, user, router]);

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
    }

    if (!user?.isAdmin) return null;

    const handleRestoreMeeting = async (id: string) => {
        if (confirm("ต้องการนำการประชุมนี้กลับไปที่ Dashboard ใช่หรือไม่?")) {
            const res = await toggleMeetingDelete(id, false);
            if (res.success) fetchData();
            else alert("Error: " + res.error);
        }
    };

    const handleRestoreSubject = async (id: string) => {
        if (confirm("ต้องการนำวาระนี้กลับไปที่ Dashboard ใช่หรือไม่?")) {
            const res = await toggleSubjectDelete(id, false);
            if (res.success) fetchData();
            else alert("Error: " + res.error);
        }
    };

    const handleDeleteMeeting = async (id: string) => {
        if (confirm("!!! คำเตือน !!!\nคุณกำลังจะลบการประชุมนี้ 'ถาวร' รวมถึงวาระทั้งหมดที่อยู่ภายในด้วย\nต้องการดำเนินการต่อใช่หรือไม่?")) {
            const res = await permanentDeleteMeeting(id);
            if (res.success) fetchData();
            else alert("Error: " + res.error);
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (confirm("!!! คำเตือน !!!\nคุณกำลังจะลบวาระนี้ 'ถาวร'\nต้องการดำเนินการต่อใช่หรือไม่?")) {
            const res = await permanentDeleteSubject(id);
            if (res.success) fetchData();
            else alert("Error: " + res.error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-6 sm:px-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">จัดการข้อมูลที่ถูกลบ (Trash)</h1>
                            <p className="text-sm text-slate-500">กู้คืนหรือลบข้อมูลถาวรสำหรับการประชุมและวาระ</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-12">
                {/* Section: Meetings */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">การประชุมที่ Unpublish ({deletedMeetings.length})</h2>
                    </div>

                    {deletedMeetings.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 font-medium">ไม่มีการประชุมที่ถูก Unpublish</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deletedMeetings.map((m) => (
                                <div key={m.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 flex gap-2">
                                        <button
                                            onClick={() => handleRestoreMeeting(m.id)}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                                            title="Restore"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMeeting(m.id)}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                                            title="Delete Permanently"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M9.25 12l.35-4.5h5.8l.35 4.5M21 12h-3.25l-.35 4.5h-10.8l-.35-4.5H3m5.5-3V4.5A1.5 1.5 0 0 1 10 3h4a1.5 1.5 0 0 1 1.5 1.5V9" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{m.sheet} | {m.work}</div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">ครั้งที่ {m.meeting_no}</h3>
                                    <p className="text-sm text-red-500 font-bold mb-4">{m.remark_date}</p>
                                    <div className="text-[10px] text-slate-400">ถูกสร้างเมื่อ: {new Date(m.created_at).toLocaleDateString("th-TH")}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <hr className="border-slate-200" />

                {/* Section: Subjects */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">วาระที่ถูกลบ ({deletedSubjects.length})</h2>
                    </div>

                    {deletedSubjects.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 font-medium">ไม่มีวาระที่ถูกลบ</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">วาระ / เรื่อง</th>
                                        <th className="px-6 py-4">สังกัดการประชุม</th>
                                        <th className="px-6 py-4">ผู้รับผิดชอบ</th>
                                        <th className="px-6 py-4 text-center w-32">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deletedSubjects.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-700 text-sm">{s.subject_name}</div>
                                                {s.ecm && <div className="text-[10px] text-slate-400 mt-1 font-medium">ECM: {s.ecm}</div>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-bold text-slate-600">
                                                    ครั้งที่ {s.meetings?.meeting_no} ({s.meetings?.remark_date})
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    {s.meetings?.sheet} | {s.meetings?.work}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-medium text-slate-500">
                                                {s.responsible || "-"}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleRestoreSubject(s.id)}
                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                                                        title="Restore"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubject(s.id)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                                                        title="Delete Permanently"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M9.25 12l.35-4.5h5.8l.35 4.5M21 12h-3.25l-.35 4.5h-10.8l-.35-4.5H3m5.5-3V4.5A1.5 1.5 0 0 1 10 3h4a1.5 1.5 0 0 1 1.5 1.5V9" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
