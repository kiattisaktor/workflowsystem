"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { getAllUsersAdmin, updateUser, deleteUser, updateUserSortOrderBatch } from "../../../lib/api";

// DND Kit Imports
[
  "useSortable",
  "SortableContext",
  "verticalListSortingStrategy",
  "arrayMove",
  "DndContext",
  "closestCenter",
  "KeyboardSensor",
  "PointerSensor",
  "useSensor",
  "useSensors"
];
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminUser {
  uuid: string;
  lineUserId: string;
  displayName: string;
  nickName: string;
  role: string;
  userManager: string;
  canCreateTask: boolean;
  isAdmin: boolean;
  createdAt: string;
  sortOrder: number;
}

const ROLES = ["Owner", "Inspector", "No Role"];

export default function ManageUsersPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickName, setEditNickName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editCanCreate, setEditCanCreate] = useState(false);
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editSortOrder, setEditSortOrder] = useState(0);

  // Move Hooks to the top to follow Rules of Hooks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require a small drag before starting
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch users
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsersAdmin();
    setUsers(data);
    setLoading(false);
  };

  // Permission guard
  const isAdmin = user?.isAdmin;

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Admin Only</h2>
          <p className="text-slate-500 mb-4">เฉพาะ Admin เท่านั้นที่เข้าถึงหน้านี้ได้</p>
          <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-800 font-semibold">
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const startEdit = (u: AdminUser) => {
    setEditingId(u.uuid);
    setEditNickName(u.nickName);
    setEditRole(u.role);
    setEditCanCreate(u.canCreateTask);
    setEditIsAdmin(u.isAdmin);
    setEditSortOrder(u.sortOrder);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (uuid: string) => {
    setSaving(uuid);
    const result = await updateUser(uuid, {
      nick_name: editNickName,
      role: editRole,
      can_create_task: editCanCreate,
      is_admin: editIsAdmin,
      sort_order: editSortOrder,
    });
    setSaving(null);

    if (result.success) {
      setEditingId(null);
      loadUsers();
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = users.findIndex((u) => u.uuid === active.id);
      const newIndex = users.findIndex((u) => u.uuid === over.id);

      const newUsersOrder = arrayMove(users, oldIndex, newIndex);
      
      // Update local state immediately for snappy feel
      setUsers(newUsersOrder);

      // Prepare batch update
      const updates = newUsersOrder.map((user, index) => ({
        id: user.uuid,
        sort_order: index + 1
      }));

      const result = await updateUserSortOrderBatch(updates);
      if (!result.success) {
        alert("เกิดข้อผิดพลาดขณะบันทึกลำดับระงับ: " + result.error);
        loadUsers(); // Rollback
      }
    }
  };



  const handleDelete = async (uuid: string, displayName: string) => {
    if (!confirm(`ต้องการลบ "${displayName}" จริงหรือไม่?`)) return;

    const result = await deleteUser(uuid);
    if (result.success) {
      loadUsers();
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-50 to-transparent -z-10"></div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">จัดการ Users</h1>
            <p className="text-sm text-slate-400">{users.length} users ในระบบ</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading users...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 w-10"></th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">ชื่อ</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">NickName</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Username</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">สิทธิ์ Admin</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">สร้าง Task</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600">จัดการ</th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={users.map(u => u.uuid)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {users.map(u => (
                        <SortableUserRow
                          key={u.uuid}
                          u={u}
                          editingId={editingId}
                          editNickName={editNickName}
                          setEditNickName={setEditNickName}
                          editSortOrder={editSortOrder}
                          setEditSortOrder={setEditSortOrder}
                          editRole={editRole}
                          setEditRole={setEditRole}
                          ROLES={ROLES}
                          editIsAdmin={editIsAdmin}
                          setEditIsAdmin={setEditIsAdmin}
                          editCanCreate={editCanCreate}
                          setEditCanCreate={setEditCanCreate}
                          saving={saving}
                          saveEdit={saveEdit}
                          cancelEdit={cancelEdit}
                          startEdit={startEdit}
                          handleDelete={handleDelete}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map(u => (
                <div key={u.uuid} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-slate-800">{u.displayName}</div>
                      <div className="text-xs text-slate-400">{u.nickName || "-"} · {u.userManager || "-"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {u.isAdmin && (
                        <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          u.role === "Owner"
                            ? "bg-blue-100 text-blue-700"
                            : u.role === "Inspector"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-400"
                        }`}>
                        {u.role}
                      </span>
                    </div>
                  </div>

                  {editingId === u.uuid ? (
                    <div className="space-y-2 mt-3">
                      <input
                        value={editNickName}
                        onChange={e => setEditNickName(e.target.value)}
                        placeholder="NickName"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                      />
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editIsAdmin}
                          onChange={e => setEditIsAdmin(e.target.checked)}
                          className="w-4 h-4 rounded text-violet-600"
                        />
                        <span className="text-sm text-slate-600 font-bold">สิทธิ์ Admin</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editCanCreate}
                          onChange={e => setEditCanCreate(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <span className="text-sm text-slate-600">สร้าง Task ได้</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(u.uuid)}
                          disabled={saving === u.uuid}
                          className="flex-1 text-sm bg-emerald-500 text-white py-2 rounded-lg"
                        >
                          {saving === u.uuid ? "..." : "บันทึก"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 text-sm bg-slate-100 text-slate-600 py-2 rounded-lg"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-500">สร้าง Task: {u.canCreateTask ? "✅" : "❌"}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(u.uuid, u.displayName)}
                          className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-component for Sortable Table Row ---
interface SortableUserRowProps {
  u: AdminUser;
  editingId: string | null;
  editNickName: string;
  setEditNickName: (val: string) => void;
  editSortOrder: number;
  setEditSortOrder: (val: number) => void;
  editRole: string;
  setEditRole: (val: string) => void;
  ROLES: string[];
  editIsAdmin: boolean;
  setEditIsAdmin: (val: boolean) => void;
  editCanCreate: boolean;
  setEditCanCreate: (val: boolean) => void;
  saving: string | null;
  saveEdit: (uuid: string) => Promise<void>;
  cancelEdit: () => void;
  startEdit: (u: AdminUser) => void;
  handleDelete: (uuid: string, displayName: string) => Promise<void>;
}

function SortableUserRow({
  u,
  editingId,
  editNickName,
  setEditNickName,
  editSortOrder,
  setEditSortOrder,
  editRole,
  setEditRole,
  ROLES,
  editIsAdmin,
  setEditIsAdmin,
  editCanCreate,
  setEditCanCreate,
  saving,
  saveEdit,
  cancelEdit,
  startEdit,
  handleDelete
}: SortableUserRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: u.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isDragging ? 'bg-indigo-50/50' : ''}`}
    >
      <td className="px-4 py-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800">{u.displayName}</div>
        {u.lineUserId && (
          <div className="text-xs text-slate-400 truncate max-w-[150px]">LINE: {u.lineUserId.slice(0, 10)}...</div>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600">{u.nickName || "-"}</td>
      <td className="px-4 py-3 text-slate-500">{u.userManager || "-"}</td>
      <td className="px-4 py-3">
        {editingId === u.uuid ? (
          <select
            value={editRole}
            onChange={e => setEditRole(e.target.value)}
            className="px-2 py-1 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            {ROLES.map((r: string) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        ) : (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            u.role === "Owner"
              ? "bg-blue-100 text-blue-700"
              : u.role === "Inspector"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-400"
          }`}>
            {u.role}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {editingId === u.uuid ? (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={editIsAdmin}
              onChange={e => setEditIsAdmin(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-checked:bg-violet-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
        ) : (
          <span className={u.isAdmin ? 'text-violet-600 font-bold' : 'text-slate-300'}>
            {u.isAdmin ? "ADMIN" : "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {editingId === u.uuid ? (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={editCanCreate}
              onChange={e => setEditCanCreate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
          </label>
        ) : (
          <span>{u.canCreateTask ? "✅" : "❌"}</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {editingId === u.uuid ? (
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => saveEdit(u.uuid)}
              disabled={saving === u.uuid}
              className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {saving === u.uuid ? "..." : "บันทึก"}
            </button>
            <button
              onClick={cancelEdit}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => startEdit(u)}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              แก้ไข
            </button>
            <button
              onClick={() => handleDelete(u.uuid, u.displayName)}
              className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              ลบ
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
