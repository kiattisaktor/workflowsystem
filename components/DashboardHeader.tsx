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
}

export default function DashboardHeader({
    profile,
    totalTasks,
    completedTasks,
    activeTab,
    onTabChange,
    activeWork,
    onWorkChange,
    workOptions
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
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                สวัสดี, {profile.displayName}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Tabs (Board / Excom) */}
                <div className="bg-white/60 p-1.5 rounded-2xl flex mb-6 shadow-sm ring-1 ring-slate-100">
                    {(["Board", "Excom"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab
                                ? 'bg-amber-100 text-amber-800 shadow-sm ring-1 ring-amber-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Work Filters (Resume, Report, Conduct) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    {workOptions.map((work) => (
                        <button
                            key={work}
                            onClick={() => onWorkChange(work)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeWork === work
                                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {work}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
