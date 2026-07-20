import { trpc } from "@/lib/trpc";
import { Building2, ClipboardList, FileText, Wrench } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardHome() {
  const [, setLocation] = useLocation();
  const { data: residents } = trpc.residents.list.useQuery(undefined);
  const { data: repairs } = trpc.repairRequests.list.useQuery({});

  const pendingCount = repairs?.filter((r) => r.status === "pending").length ?? 0;
  const inProgressCount = repairs?.filter((r) => r.status === "in_progress").length ?? 0;
  const completedCount = repairs?.filter((r) => r.status === "completed").length ?? 0;

  const stats = [
    {
      label: "住戶總數",
      value: residents?.length ?? 0,
      icon: Building2,
      color: "text-amber-600",
      bg: "bg-amber-50",
      path: "/residents",
    },
    {
      label: "報修總數",
      value: repairs?.length ?? 0,
      icon: Wrench,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/repair-requests",
    },
    {
      label: "待處理報修",
      value: pendingCount,
      icon: ClipboardList,
      color: "text-rose-600",
      bg: "bg-rose-50",
      path: "/repair-requests",
    },
    {
      label: "列印表單",
      value: "4 種",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: "/print-forms",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight">
          管理總覽
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          歡迎使用社區住戶管理系統，請由左側選單進入各功能模組。
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setLocation(stat.path)}
            className="group bg-card border border-border rounded-xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-serif font-semibold text-foreground">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Repair status summary */}
      {(repairs?.length ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-serif font-semibold text-foreground mb-4">
            報修進度概況
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-amber-600">{pendingCount}</div>
              <div className="text-xs text-muted-foreground mt-1">待處理</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-600">{inProgressCount}</div>
              <div className="text-xs text-muted-foreground mt-1">處理中</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-emerald-600">{completedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">已完成</div>
            </div>
          </div>
          {/* Progress bar */}
          {(repairs?.length ?? 0) > 0 && (
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-amber-400 transition-all"
                style={{ width: `${(pendingCount / (repairs?.length ?? 1)) * 100}%` }}
              />
              <div
                className="bg-blue-400 transition-all"
                style={{ width: `${(inProgressCount / (repairs?.length ?? 1)) * 100}%` }}
              />
              <div
                className="bg-emerald-400 transition-all"
                style={{ width: `${(completedCount / (repairs?.length ?? 1)) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "管理住戶資料", desc: "新增、編輯、搜尋住戶資訊", path: "/residents" },
          { icon: Wrench, label: "報修統計表", desc: "記錄報修事項與追蹤進度", path: "/repair-requests" },
          { icon: FileText, label: "列印表單", desc: "匯出各式社區表格 PDF", path: "/print-forms" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className="group bg-card border border-border rounded-xl p-5 text-left hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-3 mb-2">
              <item.icon className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm text-foreground">{item.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
