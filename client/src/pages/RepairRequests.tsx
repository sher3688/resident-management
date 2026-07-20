import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function RepairRequests() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchUnit, setSearchUnit] = useState<string>("");
  const [formData, setFormData] = useState({
    unitNumber: "",
    description: "",
    status: "pending" as const,
    completedDate: "",
    notes: "",
  });

  const { data: repairs = [], isLoading, refetch } = trpc.repairRequests.list.useQuery({});
  const createMutation = trpc.repairRequests.create.useMutation();
  const updateMutation = trpc.repairRequests.update.useMutation();
  const deleteMutation = trpc.repairRequests.delete.useMutation();

  function normalizeUnitNumber(unitNumber: string): string {
    // 移除 F 字尾，只保留數字部分
    return unitNumber.replace(/F$/, "").trim();
  }

  function extractKeywords(text: string): string {
    // 轉換為小寫
    let normalized = text.toLowerCase().trim();
    // 只保留中文字符和空格，移除所有其他字符
    normalized = normalized.replace(/[^\u4e00-\u9fff\s]/g, "");
    // 整理空格
    normalized = normalized.replace(/\s+/g, " ").trim();

    // 提取關鍵詞（每個字或詞）
    const keywords = normalized.split(/\s+/).filter((word) => word.length > 0);
    // 排序並去重，然後組合成字串
    const uniqueKeywords = Array.from(new Set(keywords)).sort().join(" ");
    console.log(`extractKeywords("${text}") => "${uniqueKeywords}"`);
    return uniqueKeywords;
  }

  function findDuplicates(repairs: any[]) {
    const duplicateMap = new Map<string, any[]>();

    // 按戶號分組
    const unitGroups = new Map<string, any[]>();
    repairs.forEach((repair) => {
      const normalizedUnit = normalizeUnitNumber(repair.unitNumber);
      if (!unitGroups.has(normalizedUnit)) {
        unitGroups.set(normalizedUnit, []);
      }
      unitGroups.get(normalizedUnit)!.push(repair);
    });

    // 在每個戶號組內尋找重複
    unitGroups.forEach((group, normalizedUnit) => {
      if (group.length < 2) return; // 少於 2 筆記錄，不是重複

      // 提取每個記錄的關鍵詞（每個字作為一個關鍵詞）
      const groupData = group.map((repair) => {
        const keywordStr = extractKeywords(repair.description);
        // 將每個字作為一個關鍵詞
        const keywords = new Set<string>();
        for (const char of keywordStr) {
          if (char && char.length > 0) {
            keywords.add(char);
          }
        }
        return { repair, keywords };
      });

      // 尋找有相同關鍵詞的記錄
      for (let i = 0; i < groupData.length; i++) {
        for (let j = i + 1; j < groupData.length; j++) {
          const keywords1 = groupData[i].keywords;
          const keywords2 = groupData[j].keywords;

          // 檢查是否有相同的關鍵詞
          const commonKeywords = Array.from(keywords1).filter((k) =>
            keywords2.has(k)
          );

          if (commonKeywords.length > 0) {
            // 找到重複，添加到 duplicateMap
            const key1 = `${normalizedUnit}_${groupData[i].repair.id}`;
            const key2 = `${normalizedUnit}_${groupData[j].repair.id}`;

            if (!duplicateMap.has(key1)) {
              duplicateMap.set(key1, [groupData[i].repair]);
            }
            if (!duplicateMap.get(key1)!.includes(groupData[j].repair)) {
              duplicateMap.get(key1)!.push(groupData[j].repair);
            }

            if (!duplicateMap.has(key2)) {
              duplicateMap.set(key2, duplicateMap.get(key1)!);
            }
          }
        }
      }
    });

    return duplicateMap;
  }

  const duplicateMap = findDuplicates(repairs);

  const filteredRepairs = repairs
    .filter((r: any) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchUnit && !r.unitNumber.includes(searchUnit)) return false;
      return true;
    })
    .sort((a: any, b: any) => new Date(b.repairDate).getTime() - new Date(a.repairDate).getTime());

  const handleSubmit = async () => {
    if (!formData.unitNumber || !formData.description) {
      toast.error("請填寫必要欄位");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          unitNumber: formData.unitNumber,
          description: formData.description,
          status: formData.status as any,
          completionDate: formData.completedDate,
          notes: formData.notes,
        });
        toast.success("更新成功");
      } else {
        await createMutation.mutateAsync({
          unitNumber: formData.unitNumber,
          description: formData.description,
          status: formData.status as any,
          completionDate: formData.completedDate,
          notes: formData.notes,
        });
        toast.success("新增成功");
      }
      setIsDialogOpen(false);
        setFormData({
          unitNumber: "",
          description: "",
          status: "pending" as const,
          completedDate: "",
          notes: "",
        });
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error("操作失敗");
    }
  };

  const handleEdit = (repair: any) => {
    setEditingId(repair.id);
    setFormData({
      unitNumber: repair.unitNumber || "",
      description: repair.description || "",
      status: repair.status || "pending",
      completedDate: repair.completedDate ? repair.completedDate.split("T")[0] : "",
      notes: repair.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("確認刪除此報修記錄？")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("刪除成功");
        refetch();
      } catch (error) {
        toast.error("刪除失敗");
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>報修統計表</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .status-pending { background-color: #FFF9C4; }
              .status-in_progress { background-color: #E1F5FE; }
              .status-completed { background-color: #C8E6C9; }
              .status-resident_self_repair { background-color: #FFA7D9; }
            </style>
          </head>
          <body>
            <h2>報修統計表</h2>
            <table>
              <tr>
                <th>戶號</th>
                <th>報修日期</th>
                <th>狀況描述</th>
                <th>維修進度</th>
                <th>備註</th>
              </tr>
              ${filteredRepairs
                .map(
                  (r: any) => `
                <tr class="status-${r.status}">
                  <td>${r.unitNumber}</td>
                  <td>${new Date(r.repairDate).toLocaleString("zh-TW")}</td>
                  <td>${r.description}</td>
                  <td>${r.status}</td>
                  <td>${r.notes || ""}</td>
                </tr>
              `
                )
                .join("")}
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportCSV = () => {
    const headers = ["戶號", "報修日期", "狀況描述", "維修進度", "備註"];
    const data = filteredRepairs.map((r: any) => [
      r.unitNumber,
      new Date(r.repairDate).toLocaleString("zh-TW"),
      r.description,
      r.status,
      r.notes || "",
    ]);

    let csv = headers.join(",") + "\n";
    data.forEach((row: any) => {
      csv += row.map((cell: any) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `報修統計表_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("CSV 導出成功");
  };

  const handleExportExcel = () => {
    const headers = ["戶號", "報修日期", "狀況描述", "維修進度", "備註"];
    const data = filteredRepairs.map((r: any) => [
      r.unitNumber,
      new Date(r.repairDate).toLocaleString("zh-TW"),
      r.description,
      r.status,
      r.notes || "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "報修統計表");
    XLSX.writeFile(wb, `報修統計表_${new Date().toISOString().split("T")[0]}.xls`);
    toast.success("Excel 導出成功");
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "待處理",
      in_progress: "處理中",
      completed: "已完成",
      resident_self_repair: "住戶自行修繕",
    };
    return labels[status] || status;
  };

  if (isLoading) return <div className="p-4">加載中...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">報修統計表</h1>
        <p className="text-gray-600">共 {filteredRepairs.length} 筆報修記錄</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 bg-yellow-500 text-white">
          <div className="text-3xl font-bold">{repairs.length}</div>
          <div>全部</div>
        </Card>
        <Card className="p-4 bg-blue-500 text-white">
          <div className="text-3xl font-bold">
            {repairs.filter((r: any) => r.status === "pending").length}
          </div>
          <div>待處理</div>
        </Card>
        <Card className="p-4 bg-purple-500 text-white">
          <div className="text-3xl font-bold">
            {repairs.filter((r: any) => r.status === "in_progress").length}
          </div>
          <div>處理中</div>
        </Card>
        <Card className="p-4 bg-green-500 text-white">
          <div className="text-3xl font-bold">
            {repairs.filter((r: any) => r.status === "completed").length}
          </div>
          <div>已完成</div>
        </Card>
        <Card className="p-4 bg-gray-500 text-white">
          <div className="text-3xl font-bold">
            {repairs.filter((r: any) => r.status === "resident_self_repair").length}
          </div>
          <div>已取消</div>
        </Card>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="搜選戶號..."
          value={searchUnit}
          onChange={(e) => setSearchUnit(e.target.value)}
          className="flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="pending">待處理</SelectItem>
            <SelectItem value="in_progress">處理中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="resident_self_repair">住戶自行修繕</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handlePrint} variant="outline">
          列印
        </Button>
        <Button onClick={handleExportCSV} variant="outline">
          匯出 CSV
        </Button>
        <Button onClick={handleExportExcel} variant="outline">
          匯出 Excel
        </Button>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({
              unitNumber: "",
              description: "",
              status: "pending" as const,
              completedDate: "",
              notes: "",
            });
            setIsDialogOpen(true);
          }}
          className="ml-auto"
        >
          + 新增報修
        </Button>
      </div>

      <div className="space-y-4">
        {filteredRepairs.map((repair: any) => {
          const isDuplicate = Array.from(duplicateMap.values()).some(
            (group) => group.length > 1 && group.includes(repair)
          );
          const duplicateGroup = Array.from(duplicateMap.values()).find(
            (group) => group.includes(repair)
          );
          const previousRepair = isDuplicate
            ? duplicateGroup
                ?.filter((r) => r.id !== repair.id)
                .sort(
                  (a: any, b: any) =>
                    new Date(b.repairDate).getTime() - new Date(a.repairDate).getTime()
                )[0]
            : null;

          const statusColor: { [key: string]: string } = {
            pending: "border-l-4 border-yellow-500 bg-yellow-50",
            in_progress: "border-l-4 border-blue-500 bg-blue-50",
            completed: "border-l-4 border-green-500 bg-green-50",
            resident_self_repair: "border-l-4 border-pink-500 bg-pink-50",
          };

          return (
            <Card
              key={repair.id}
              className={`p-4 ${statusColor[repair.status] || "border-l-4 border-gray-500"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{repair.unitNumber}</h3>
                    {isDuplicate && (
                      <span className="text-red-500 text-xl">★</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{getStatusLabel(repair.status)}</p>
                  <p className="mt-2">{repair.description}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>報修日期：{new Date(repair.repairDate).toLocaleString("zh-TW")}</p>
                    {previousRepair && (
                      <p className="text-red-600">
                        前次報修：{new Date(previousRepair.repairDate).toLocaleString("zh-TW")}
                      </p>
                    )}
                    {repair.completedDate && (
                      <p>
                        完成日期：{new Date(repair.completedDate).toLocaleString("zh-TW")}
                      </p>
                    )}
                  </div>
                  {repair.notes && <p className="mt-2 text-sm">{repair.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(repair)}
                    variant="outline"
                    size="sm"
                  >
                    編輯
                  </Button>
                  <Button
                    onClick={() => handleDelete(repair.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    刪除
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯報修" : "新增報修"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>戶號</Label>
              <Input
                value={formData.unitNumber}
                onChange={(e) =>
                  setFormData({ ...formData, unitNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label>狀況描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>維修進度</Label>
              <Select value={formData.status} onValueChange={(value) =>
                setFormData({ ...formData, status: value as any })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待處理</SelectItem>
                  <SelectItem value="in_progress">處理中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="resident_self_repair">住戶自行修繕</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>完成日期</Label>
              <Input
                type="date"
                value={formData.completedDate}
                onChange={(e) =>
                  setFormData({ ...formData, completedDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>備註</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
