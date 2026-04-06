"use client";

import { useState, useEffect } from "react";
import { updateMeeting } from "../lib/api";

interface EditMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  initialMeetingNo: string;
  initialRemarkDate: string;
  onSuccess: () => void;
}

export default function EditMeetingModal({
  isOpen,
  onClose,
  meetingId,
  initialMeetingNo,
  initialRemarkDate,
  onSuccess,
}: EditMeetingModalProps) {
  const [meetingNo, setMeetingNo] = useState(initialMeetingNo);
  const [remarkDate, setRemarkDate] = useState(initialRemarkDate);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMeetingNo(initialMeetingNo);
      setRemarkDate(initialRemarkDate);
    }
  }, [isOpen, initialMeetingNo, initialRemarkDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingNo.trim() || !remarkDate.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);
    const result = await updateMeeting(meetingId, {
      meeting_no: meetingNo,
      remark_date: remarkDate,
    });
    setLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="pt-1.5 px-1">
               <h2 className="text-xl font-bold text-slate-800 leading-relaxed">แก้ไขข้อมูลการประชุม</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 transition-colors rounded-full hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ครั้งที่ประชุม</label>
              <input
                type="text"
                value={meetingNo}
                onChange={(e) => setMeetingNo(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="เช่น 1/2569"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">หมายเหตุการประชุม</label>
              <input
                type="text"
                value={remarkDate}
                onChange={(e) => setRemarkDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="เช่น ส่งเอกสารให้กรรมการ วันที่ 21 ม.ค. 69"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
              >
                {loading ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-3">
                * การแก้ไขจะมีผลกับวาระทั้งหมดภายใต้การประชุมครั้งนี้
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
