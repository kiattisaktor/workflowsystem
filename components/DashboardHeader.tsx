import Link from "next/link";

interface Profile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

interface DashboardHeaderProps {
    profile: Profile | null;
    totalTasks: number;
    completedTasks: number;
    activeTab: "Board" | "Excom";
    onTabChange: (tab: "Board" | "Excom") => void;
    activeWork: string;
    onWorkChange: (work: string) => void;
    workOptions: string[];
    onLogout?: () => void;
    canCreateTask?: boolean;
    isAdmin?: boolean;
    tabCounts?: Record<string, number>;
    workCounts?: Record<string, number>;
}

export default function DashboardHeader({
    profile,
    totalTasks,
    completedTasks,
    activeTab,
    onTabChange,
    activeWork,
    onWorkChange,
    workOptions,
    onLogout,
    canCreateTask,
    isAdmin,
    tabCounts = {},
    workCounts = {}
}: DashboardHeaderProps) {
    return (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl p-6 shadow-sm border border-amber-100 mb-6 relative overflow-hidden">
            {/* Decorative circles - subtler */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-yellow-200/20 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-amber-200/20 blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">สถานะเอกสารประชุม</h1>
                        {profile && (
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    สวัสดี, {profile.displayName}
                                </div>
                                {onLogout && (
                                    <button
                                        onClick={onLogout}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:bg-red-50 px-3 py-0.5 rounded-full transition-colors"
                                    >
                                        ออกจากระบบ
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {(canCreateTask || isAdmin) && (
                            <Link
                                href="/tasks/create"
                                className="text-xs font-bold bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                สร้างการประชุม
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                href="/admin/trash"
                                className="text-xs font-bold bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M9.25 12l.35-4.5h5.8l.35 4.5M21 12h-3.25l-.35 4.5h-10.8l-.35-4.5H3m5.5-3V4.5A1.5 1.5 0 0 1 10 3h4a1.5 1.5 0 0 1 1.5 1.5V9" />
                                </svg>
                                ถังขยะ
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                href="/admin/users"
                                className="text-xs font-bold bg-violet-500 text-white px-4 py-2 rounded-xl hover:bg-violet-600 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-1.053M18 8.625a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.75 8.625a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0Z" />
                                </svg>
                                จัดการ Users
                            </Link>
                        )}
                    </div>
                </div>

                {/* Main Tabs (Board / Excom) */}
                <div className="bg-white/60 p-1.5 rounded-2xl flex mb-6 shadow-sm ring-1 ring-slate-100">
                    {(["Board", "Excom"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === tab
                                ? 'bg-amber-100 text-amber-800 shadow-sm ring-1 ring-amber-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {tab}
                            {tabCounts[tab] > 0 && (
                                <span className="bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm">
                                    {tabCounts[tab]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Work Filters (Resume, Report, Conduct) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    {workOptions.map((work) => (
                        <button
                            key={work}
                            onClick={() => onWorkChange(work)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${activeWork === work
                                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {work}
                            {workCounts[work] > 0 && (
                                <span className="bg-red-500 text-white text-[10px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                                    {workCounts[work]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
