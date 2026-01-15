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
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-xl font-bold mb-1">สถานะเอกสารประชุม...</h1>
                        {profile && (
                            <p className="text-indigo-100 text-xs">สวัสดี {profile.displayName}</p>
                        )}
                    </div>
                </div>

                {/* Main Tabs (Board / Excom) */}
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-1 flex mb-4">
                    {(["Board", "Excom"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                ? 'bg-white/20 text-white shadow-sm'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Work Filters (Resume, Report, Conduct) */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {workOptions.map((work) => (
                        <button
                            key={work}
                            onClick={() => onWorkChange(work)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${activeWork === work
                                ? 'bg-white text-purple-600 border-white shadow-sm font-bold'
                                : 'bg-transparent text-indigo-100 border-white/30 hover:bg-white/10'
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
