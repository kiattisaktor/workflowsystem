"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { createMeeting, getResumeMeetings, createMeetingFromTemplate } from "../../../lib/api";

export default function CreateTaskPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [sheet, setSheet] = useState<"Board" | "Excom">("Board");
  const [work, setWork] = useState("Resume");
  const [meetingNo, setMeetingNo] = useState("");
  const [remarkDate, setRemarkDate] = useState("");

  // Template state
  const [resumeTemplates, setResumeTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isFetchingTemplates, setIsFetchingTemplates] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch Resume Templates when work is "ร่างรายงาน"
  useEffect(() => {
    if (work === "ร่างรายงาน") {
      setIsFetchingTemplates(true);
      getResumeMeetings(sheet).then(templates => {
        setResumeTemplates(templates);
        setIsFetchingTemplates(false);
      });
    } else {
      setResumeTemplates([]);
      setSelectedTemplateId("");
    }
  }, [work, sheet]);

  // Handle Template Selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = resumeTemplates.find(t => t.id === templateId);
      if (template) {
        setMeetingNo(template.meeting_no || "");
      }
    }
  };

  // Permission guard
  const canCreate = user?.isAdmin || user?.canCreateTask === true;

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  if (!canCreate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-slate-500 mb-4">คุณไม่มีสิทธิ์ในการสร้างการประชุม กรุณาติดต่อ Admin</p>
          <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-semibold">
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingNo.trim()) {
      alert("กรุณากรอกครั้งที่ประชุม");
      return;
    }

    setLoading(true);
    let result;
    
    if (work === "ร่างรายงาน" && selectedTemplateId) {
      result = await createMeetingFromTemplate({
        sheet,
        work,
        meetingNo,
        remarkDate,
        templateMeetingId: selectedTemplateId
      });
    } else {
      result = await createMeeting({
        sheet,
        work,
        meetingNo,
        remarkDate,
      });
    }
    
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Brief delay then redirect back
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50 to-transparent -z-10"></div>

      <div className="max-w-xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-800">สร้างการประชุม</h1>
        </div>

        {/* Success Banner */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
            <span className="text-2xl">✅</span>
            <span className="font-semibold">สร้างการประชุมสำเร็จแล้ว! กำลังกลับหน้าหลัก...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">

          {/* Row 1: Sheet + Work */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">ประเภท</label>
              <div className="flex gap-2">
                {(["Board", "Excom"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSheet(s)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${sheet === s
                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 shadow-sm"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">งาน</label>
              <select
                value={work}
                onChange={e => setWork(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold"
              >
                <option value="Resume">Resume</option>
                <option value="ร่างรายงาน">ร่างรายงาน</option>
                <option value="Conduct">Conduct</option>
              </select>
            </div>
          </div>

          {/* Template Selection (Only for Report Draft) */}
          {work === "ร่างรายงาน" && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <label className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-1">
                    <span className="text-xl">📋</span> เลือกต้นแบบวาระจาก Resume
                </label>
                <select
                    value={selectedTemplateId}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    disabled={isFetchingTemplates}
                >
                    <option value="">-- ไม่ใช้ต้นแบบ (เริ่มจากว่าง) --</option>
                    {resumeTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.meeting_no} ({t.remark_date || 'ไม่มีหมายเหตุ'})</option>
                    ))}
                </select>
                {isFetchingTemplates && <p className="text-[10px] text-amber-500 animate-pulse">กำลังโหลดต้นแบบ...</p>}
                {!isFetchingTemplates && resumeTemplates.length === 0 && <p className="text-[10px] text-amber-500">ไม่พบต้นแบบ Resume ในหมวด {sheet}</p>}
                <p className="text-[10px] text-amber-600 opacity-75">
                    * เมื่อเลือกต้นแบบ ระบบจะดึง "ครั้งที่ประชุม" และ "รายชื่อวาระ" มาให้โดยอัตโนมัติ
                </p>
              </div>
          )}

          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  ครั้งที่ประชุม <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={meetingNo}
                  onChange={e => setMeetingNo(e.target.value)}
                  placeholder="เช่น 1/2569"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  หมายเหตุการประชุม
                </label>
                <input
                  type="text"
                  value={remarkDate}
                  onChange={e => setRemarkDate(e.target.value)}
                  placeholder="เช่น ส่งเอกสารให้กรรมการ วันที่ 21 ม.ค. 69"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังสร้าง..." : (selectedTemplateId ? "➕ สร้างร่างรายงานจากต้นแบบ" : "➕ สร้างการประชุม")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
