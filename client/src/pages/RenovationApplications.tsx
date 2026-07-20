import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Printer, Plus, Edit, Trash2 } from "lucide-react";

// 施工類型常數
const CONSTRUCTION_TYPE_RENOVATION = '施工裝潢';
const CONSTRUCTION_TYPES_REQUIRING_DEPOSIT = ['施工裝潢'];

// 裝保金狀態常數
const DECORATION_DEPOSIT_STATUS = {
  NOT_PAID: 'notPaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

const DECORATION_DEPOSIT_STATUS_LABELS: Record<string, string> = {
  notPaid: '未繳',
  paid: '已繳',
  refunded: '已退款',
};

// 狀態配置
const STATUS_CONFIG: Record<string, { label: string; borderColor: string; bgColor: string }> = {
  pending: { label: "待審核", borderColor: "border-yellow-400", bgColor: "bg-yellow-50" },
  approved: { label: "已批准", borderColor: "border-blue-400", bgColor: "bg-blue-50" },
  completed: { label: "已完成", borderColor: "border-green-400", bgColor: "bg-green-50" },
  rejected: { label: "已拒絕", borderColor: "border-red-400", bgColor: "bg-red-50" },
};

export default function RenovationApplicationsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    unitNumber: "",
    applicationDate: "",
    constructionStartDate: "",
    constructionEndDate: "",
    constructionContent: "",
    consentLetterPasted: "",
    applicantName: "",
    applicantPhone: "",
    registeredBy: "",
    status: "pending" as const,
    decorationDeposit: "",
    decorationDepositStatus: "notPaid" as const,
    notes: "",
  });

  // 查詢所有裝修申請
  const { data: applications = [], refetch } = trpc.renovationApplications.list.useQuery();

  // 新增/編輯 mutation
  const createMutation = trpc.renovationApplications.create.useMutation({
    onSuccess: () => {
      toast.success("新增成功");
      refetch();
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "新增失敗");
    },
  });

  const updateMutation = trpc.renovationApplications.update.useMutation({
    onSuccess: () => {
      toast.success("更新成功");
      refetch();
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteMutation = trpc.renovationApplications.delete.useMutation({
    onSuccess: () => {
      toast.success("刪除成功");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const resetForm = () => {
    setFormData({
      unitNumber: "",
      applicationDate: "",
      constructionStartDate: "",
      constructionEndDate: "",
      constructionContent: "",
      consentLetterPasted: "",
      applicantName: "",
      applicantPhone: "",
      registeredBy: "",
      status: "pending" as const,
      decorationDeposit: "",
      decorationDepositStatus: "notPaid" as const,
      notes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unitNumber || !formData.applicationDate || !formData.constructionContent || 
        !formData.applicantName || !formData.applicantPhone) {
      toast.error("請填寫必填欄位");
      return;
    }

    if (editingId) {
      const submitData = isRenovationType(formData.constructionContent)
        ? { ...formData, decorationDeposit: '30000' }
        : formData;
      updateMutation.mutate({ id: editingId, ...submitData });
    } else {
      const submitData = isRenovationType(formData.constructionContent)
        ? { ...formData, decorationDeposit: '30000' }
        : formData;
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (app: any) => {
    setFormData({
      unitNumber: app.unitNumber || "",
      applicationDate: app.applicationDate || "",
      constructionStartDate: app.constructionStartDate || "",
      constructionEndDate: app.constructionEndDate || "",
      constructionContent: app.constructionContent || "",
      consentLetterPasted: app.consentLetterPasted || "",
      applicantName: app.applicantName || "",
      applicantPhone: app.applicantPhone || "",
      registeredBy: app.registeredBy || "",
      status: app.status || "pending",
      decorationDeposit: isRenovationType(app.constructionContent) ? '30000' : (app.decorationDeposit || ""),
      decorationDepositStatus: app.decorationDepositStatus || "notPaid",
      notes: app.notes || "",
    });
    setEditingId(app.id);
    setIsOpen(true);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=900,height=600");
    if (!printWindow) return;

    const sortedApplications = [...filteredApplications].sort((a, b) => {
      return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>裝修申請記錄</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          h1 { text-align: center; }
        </style>
      </head>
      <body>
        <h1>裝修申請記錄</h1>
        <table>
          <thead>
            <tr>
              <th>戶別</th>
              <th>申請日期</th>
              <th>施工內容</th>
              <th>申請人</th>
              <th>電話</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            ${sortedApplications.map((app: any) => `
              <tr>
                <td>${app.unitNumber}</td>
                <td>${app.applicationDate}</td>
                <td>${app.constructionContent}</td>
                <td>${app.applicantName}</td>
                <td>${app.applicantPhone}</td>
                <td>${STATUS_CONFIG[app.status]?.label || app.status}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // 判斷是否需要繳納裝保金
  const isRenovationType = (constructionContent: string) => {
    return CONSTRUCTION_TYPES_REQUIRING_DEPOSIT.some(type => 
      constructionContent.includes(type)
    );
  };

  // 判斷完工日期是否已過期
  const isCompletionDatePassed = (completionDate: string) => {
    if (!completionDate) return false;
    return new Date(completionDate) < new Date();
  };

  // 按申請日期排序（最新優先）
  const sortedApplications = [...applications].sort((a, b) => {
    return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
  });

  // 篩選和搜尋
  const filteredApplications = sortedApplications.filter(app => {
    const matchesSearch = app.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.constructionContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 分離施工裝潢和其他項目
  const renovationApplications = filteredApplications.filter(app => 
    isRenovationType(app.constructionContent) && app.status !== 'completed'
  );
  const otherApplications = filteredApplications.filter(app => 
    !isRenovationType(app.constructionContent) && app.status !== 'completed'
  );
  
  // 分離已完成的案件
  const completedRenovationApplications = filteredApplications.filter(app => 
    isRenovationType(app.constructionContent) && app.status === 'completed'
  );
  const completedOtherApplications = filteredApplications.filter(app => 
    !isRenovationType(app.constructionContent) && app.status === 'completed'
  );

  // 統計數據
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    completed: applications.filter(a => a.status === 'completed').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const renderApplicationCard = (app: any) => {
    const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
    const isCompleted = isCompletionDatePassed(app.constructionEndDate);
    
    return (
      <div
        key={app.id}
        className={`border-l-4 rounded-lg p-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold font-mono">{app.unitNumber}</h3>
            <p className="text-sm text-gray-600">{statusConfig.label}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(app)}
              className="gap-1"
            >
              <Edit className="w-4 h-4" />
              編輯
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (window.confirm("確定要刪除嗎？")) {
                  deleteMutation.mutate({ id: app.id });
                }
              }}
              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              刪除
            </Button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p className="font-medium text-gray-800">{app.constructionContent}</p>
          <p className="text-gray-600">申請人：{app.applicantName}</p>
          <p className="text-gray-600">電話：{app.applicantPhone}</p>
          <p className="text-gray-600">申請日期：{app.applicationDate}</p>
          {app.constructionStartDate && (
            <p className="text-gray-600">施工開始：{app.constructionStartDate}</p>
          )}
          {app.constructionEndDate && (
            <p className={isCompleted ? "text-red-600 font-medium" : "text-gray-600"}>
              施工完工：{app.constructionEndDate}
              {isCompleted && " (已過期)"}
            </p>
          )}
          {isRenovationType(app.constructionContent) && (
            <p className="text-gray-600">
              裝保金：30,000 元 ({DECORATION_DEPOSIT_STATUS_LABELS[app.decorationDepositStatus || 'notPaid']})
            </p>
          )}
          {app.notes && (
            <p className="text-gray-600">備註：{app.notes}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-yellow-400 text-white rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-sm">全部</div>
        </div>
        <div className="bg-blue-400 text-white rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{stats.pending}</div>
          <div className="text-sm">待審核</div>
        </div>
        <div className="bg-purple-400 text-white rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{stats.approved}</div>
          <div className="text-sm">已批准</div>
        </div>
        <div className="bg-green-400 text-white rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{stats.completed}</div>
          <div className="text-sm">已完成</div>
        </div>
        <div className="bg-gray-400 text-white rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{stats.rejected}</div>
          <div className="text-sm">已拒絕</div>
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <div className="flex gap-4">
        <Input
          placeholder="搜尋戶別、申請人、施工內容..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="pending">待審核</SelectItem>
            <SelectItem value="approved">已批准</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="rejected">已拒絕</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2">
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          列印
        </Button>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4" />
              新增裝修
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "編輯申請" : "新增申請"}</DialogTitle>
              <DialogDescription>
                {editingId ? "編輯裝修申請記錄" : "填寫新的裝修申請記錄"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>戶別 *</Label>
                  <Input
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    placeholder="例：A9-2F"
                  />
                </div>
                <div>
                  <Label>申請日期 *</Label>
                  <Input
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>施工開始日期</Label>
                  <Input
                    type="date"
                    value={formData.constructionStartDate}
                    onChange={(e) => setFormData({ ...formData, constructionStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>施工完工日期</Label>
                  <Input
                    type="date"
                    value={formData.constructionEndDate}
                    onChange={(e) => setFormData({ ...formData, constructionEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>施工內容 *</Label>
                <Input
                  value={formData.constructionContent}
                  onChange={(e) => setFormData({ ...formData, constructionContent: e.target.value })}
                  placeholder="例：廚具施工、施工裝潢"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>申請人姓名 *</Label>
                  <Input
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    placeholder="申請人姓名"
                  />
                </div>
                <div>
                  <Label>申請人電話 *</Label>
                  <Input
                    value={formData.applicantPhone}
                    onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                    placeholder="電話號碼"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>登記人員</Label>
                  <Input
                    value={formData.registeredBy}
                    onChange={(e) => setFormData({ ...formData, registeredBy: e.target.value })}
                    placeholder="登記人員"
                  />
                </div>
                <div>
                  <Label>狀態</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待審核</SelectItem>
                      <SelectItem value="approved">已批准</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="rejected">已拒絕</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>同意書張貼與否</Label>
                  <Input
                    value={formData.consentLetterPasted}
                    onChange={(e) => setFormData({ ...formData, consentLetterPasted: e.target.value })}
                    placeholder="已貼/未貼"
                  />
                </div>
              </div>

              {/* 只在施工內容包含「施工裝潢」時顯示裝保金欄位 */}
              {isRenovationType(formData.constructionContent) && (
                <>
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <Label>裝潢施工保金金額</Label>
                      <div className="text-lg font-semibold text-gray-700 p-2 border rounded bg-gray-50">
                        30,000 元
                      </div>
                    </div>
                    <div>
                      <Label>裝保金狀態</Label>
                      <Select value={formData.decorationDepositStatus} onValueChange={(value: any) => setFormData({ ...formData, decorationDepositStatus: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notPaid">未繳</SelectItem>
                          <SelectItem value="paid">已繳</SelectItem>
                          <SelectItem value="refunded">已退款</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label>備註</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="備註"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "更新" : "新增"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 進行中的案件 */}
      {(renovationApplications.length > 0 || otherApplications.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">進行中的案件</h2>
          
          {/* 施工裝潢卡片 */}
          {renovationApplications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">施工裝潢申請 ({renovationApplications.length} 筆)</h3>
              <div className="space-y-3">
                {renovationApplications.map(app => renderApplicationCard(app))}
              </div>
            </div>
          )}

          {/* 其他施工卡片 */}
          {otherApplications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">其他施工申請 ({otherApplications.length} 筆)</h3>
              <div className="space-y-3">
                {otherApplications.map(app => renderApplicationCard(app))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 已完成區塊 */}
      {(completedRenovationApplications.length > 0 || completedOtherApplications.length > 0) && (
        <div className="mt-8 pt-8 border-t-2 border-gray-300">
          <h2 className="text-2xl font-bold mb-4 text-gray-600">已完成區塊（備查）</h2>
          
          {/* 已完成施工裝潢 */}
          {completedRenovationApplications.length > 0 && (
            <div className="mb-6 bg-amber-50 p-6 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold mb-3 text-amber-900">已完成施工裝潢 ({completedRenovationApplications.length} 筆)</h3>
              <div className="space-y-3">
                {completedRenovationApplications.map(app => renderApplicationCard(app))}
              </div>
            </div>
          )}

          {/* 已完成其他施工 */}
          {completedOtherApplications.length > 0 && (
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold mb-3 text-slate-900">已完成其他施工 ({completedOtherApplications.length} 筆)</h3>
              <div className="space-y-3">
                {completedOtherApplications.map(app => renderApplicationCard(app))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 空狀態 */}
      {applications.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <p>暫無記錄</p>
        </div>
      )}

      {/* 搜尋結果為空 */}
      {applications.length > 0 && filteredApplications.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <p>沒有符合條件的記錄</p>
        </div>
      )}
    </div>
  );
}
