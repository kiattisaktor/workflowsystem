"use client";

import { useState, useEffect } from "react";
import { updateSubject, getMeetings, getUsers, User } from "../lib/api";

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  initialData: {
    subject: string;
    ecm: string;
    note: string;
    urgent: boolean;
    dueDate: string;
    responsible: string;
    meeting_id: string;
    sheet: string;
    work: string;
  };
  onSuccess: () => void;
}

export default function EditSubjectModal({
  isOpen,
  onClose,
  subjectId,
  initialData,
  onSuccess,
}: EditSubjectModalProps) {
  const [subject, setSubject] = useState(initialData.subject);
  const [ecm, setEcm] = useState(initialData.ecm);
  const [note, setNote] = useState(initialData.note);
  const [urgent, setUrgent] = useState(initialData.urgent);
  const [dueDate, setDueDate] = useState(initialData.dueDate);
  const [responsible, setResponsible] = useState(initialData.responsible);
  const [meetingId, setMeetingId] = useState(initialData.meeting_id);

  const [meetings, setMeetings] = useState<Array<{ id: string; meeting_no: string; remark_date: string }>>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject(initialData.subject);
      setEcm(initialData.ecm);
      setNote(initialData.note);
      setUrgent(initialData.urgent);
      setDueDate(initialData.dueDate);
      setResponsible(initialData.responsible);
      setMeetingId(initialData.meeting_id);

      // Fetch meetings for moving
      getMeetings(initialData.sheet, initialData.work).then(setMeetings);
      getUsers().then(setAllUsers);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert("กรุณากรอกหัวข้อ/วาระ");
      return;
    }

    setLoading(true);
    const result = await updateSubject(subjectId, {
      subject_name: subject,
      ecm,
      note,
      urgent,
      due_date: dueDate,
      responsible,
      meeting_id: meetingId,
    });
    setLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  };

  const ownerUsers = allUsers.filter(u => u.role === "Owner" || u.isAdmin || u.role === "Inspector");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-8">
            <div className="pt-1.5 px-1">
               <h2 className="text-xl font-bold text-slate-800 leading-relaxed">แก้ไขข้อมูลวาระ</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 transition-colors rounded-full hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Move to Meeting */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 mb-6">
              <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">ย้ายวาระไปที่การประชุมครั้งอื่น</label>
              <select
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-blue-100 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    ครั้งที่ {m.meeting_no} ({m.remark_date})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-blue-400 mt-2 px-1">
                * หากย้าย ประวัติการส่งงานเดิมจะย้ายตามมาด้วยอัตโนมัติ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">วาระ/เรื่อง</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="เช่น 4.1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ECM</label>
                <input
                  type="text"
                  value={ecm}
                  onChange={(e) => setEcm(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="เลข ECM"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ผู้รับผิดชอบ</label>
                <select
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="">-- เลือก --</option>
                  {ownerUsers.map(u => (
                    <option key={u.id} value={u.nickName || u.name}>{u.nickName || u.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ถึงวันที่</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={urgent}
                      onChange={(e) => setUrgent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-red-500 rounded-full transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700">ด่วน</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">หมายเหตุ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
              >
                {loading ? "กำลังบันทึก..." : "💾 บันทึกวาระ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
