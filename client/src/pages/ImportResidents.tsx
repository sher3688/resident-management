import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImportResultItem {
  success: boolean;
  unitNumber: string;
  error?: string;
}

type ImportResult = ImportResultItem[];

export default function ImportResidentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    items: ImportResult;
    successCount: number;
    errorCount: number;
    errors: Array<{ unitNumber: string; error: string }>;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const utils = trpc.useUtils();
  const importMutation = trpc.residents.importBatch.useMutation({
    onSuccess: (data) => {
      const successCount = data.filter((r) => r.success).length;
      const errorCount = data.filter((r) => !r.success).length;
      const errors = data.filter((r) => !r.success).map((r) => ({
        unitNumber: r.unitNumber,
        error: r.error || "未知錯誤",
      }));
      setResult({ items: data, successCount, errorCount, errors });
      setImporting(false);
      if (errorCount === 0) {
        toast.success(`成功匯入 ${successCount} 筆住戶資料`);
        utils.residents.list.invalidate();
        setFile(null);
        setJsonData(null);
      } else {
        toast.error(`匯入完成，但有 ${errorCount} 筆失敗`);
      }
    },
    onError: (err) => {
      setImporting(false);
      toast.error("匯入失敗：" + err.message);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // 檢查檔案類型
    const validTypes = [
      "application/json",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(f.type) && !f.name.endsWith(".json")) {
      toast.error("請選擇 JSON 或 Excel 檔案");
      return;
    }

    setFile(f);
    setResult(null);

    // 如果是 JSON，直接讀取
    if (f.type === "application/json" || f.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (!Array.isArray(data)) {
            toast.error("JSON 必須是陣列格式");
            return;
          }
          setJsonData(data);
          toast.success(`已讀取 ${data.length} 筆資料`);
        } catch (err) {
          toast.error("JSON 格式錯誤：" + (err instanceof Error ? err.message : "未知錯誤"));
        }
      };
      reader.readAsText(f);
    } else {
      toast.info("Excel 檔案請先轉換為 JSON 格式後上傳");
    }
  }

  function handleImport() {
    if (!jsonData || jsonData.length === 0) {
      toast.error("沒有可匯入的資料");
      return;
    }

    setImporting(true);
    importMutation.mutate({ residents: jsonData });
  }

  function downloadTemplate() {
    const template = [
      {
        unitNumber: "A01",
        ownerName: "範例住戶",
        ownerPhone: "0912-345-678",
        coResident1Name: "同住人1",
        coResident1Phone: "0912-345-679",
        coResident2Name: null,
        coResident2Phone: null,
        coResident3Name: null,
        coResident3Phone: null,
        coResident4Name: null,
        coResident4Phone: null,
        carParkingNumber: "B1-001",
        carPlateNumber: "ABC-1234",
        motorcycleParkingNumber: "101",
        motorcyclePlateNumber: "DEF-5678",
        bicycleParkingNumber: null,
        address: "台北市中山區中山路一段一號",
        emergencyContactName: "緊急連絡人",
        emergencyContactRelation: "配偶",
        emergencyContactPhone: "0912-345-680",
        emergencyContactAddress: "台北市中山區中山路一段",
        emergencyContact2Name: "第二緊急連絡人",
        emergencyContact2Relation: "子女",
        emergencyContact2Phone: "0912-345-681",
        emergencyContact2Address: "台北市信義區信義路五段",
        notes: null,
      },
    ];

    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "residents_template.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已下載範例 JSON 檔案");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          批次匯入住戶資料
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          上傳 JSON 檔案以批次新增住戶資料到系統
        </p>
      </div>

      {/* Instructions */}
      <Card className="bg-muted/50 border-border p-5">
        <h3 className="font-medium text-sm mb-3">使用說明</h3>
        <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
          <li>準備 JSON 格式的住戶資料檔案（可參考下方範例）</li>
          <li>每筆資料必須包含：戶號、區權人姓名</li>
          <li>其他欄位（電話、同住人、車位等）為選填</li>
          <li>系統會逐筆驗證並匯入，失敗的記錄會顯示錯誤訊息</li>
          <li>匯入完成後，新資料會立即出現在客戶資料庫中</li>
        </ul>
      </Card>

      {/* Upload area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                點擊選擇檔案
              </span>
            </label>
            <input
              id="file-input"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-1">或拖放 JSON 檔案到此</p>
          </div>
        </div>
      </div>

      {/* File info */}
      {file && (
        <Card className="bg-card border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {jsonData ? `${jsonData.length} 筆資料` : "讀取中..."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFile(null);
                setJsonData(null);
                setResult(null);
              }}
            >
              移除
            </Button>
          </div>
        </Card>
      )}

      {/* Preview button */}
      {jsonData && jsonData.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          className="w-full"
        >
          預覽資料（{jsonData.length} 筆）
        </Button>
      )}

      {/* Import result */}
      {result && (
        <Alert className={result.errorCount === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}>
          <div className="flex items-start gap-3">
            {result.errorCount === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-sm">
                {result.errorCount === 0 ? "匯入成功" : "匯入完成（有錯誤）"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                成功：{result.successCount} 筆 {result.errorCount > 0 && `/ 失敗：${result.errorCount} 筆`}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium">失敗的記錄：</p>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors?.slice(0, 5).map((err: { unitNumber: string; error: string }, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • 戶號 {err.unitNumber}：{err.error}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        • 還有 {result.errors.length - 5} 筆失敗...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          下載範例 JSON
        </Button>
        <Button
          onClick={handleImport}
          disabled={!jsonData || jsonData.length === 0 || importing}
          className="flex-1 gap-2"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              匯入中...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              開始匯入 ({jsonData?.length ?? 0} 筆)
            </>
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>資料預覽</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {jsonData?.slice(0, 10).map((item, idx) => (
              <Card key={idx} className="bg-muted/50 border-border p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-foreground">戶號：</span>
                    <span className="text-muted-foreground">{item.unitNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">區權人：</span>
                    <span className="text-muted-foreground">{item.ownerName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">電話：</span>
                    <span className="text-muted-foreground">{item.ownerPhone ?? "—"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">汽車位：</span>
                    <span className="text-muted-foreground">{item.carParkingNumber ?? "—"}</span>
                  </div>
                  {item.coResident1Name && (
                    <div className="col-span-2">
                      <span className="font-medium text-foreground">同住人：</span>
                      <span className="text-muted-foreground">
                        {[item.coResident1Name, item.coResident2Name, item.coResident3Name, item.coResident4Name]
                          .filter(Boolean)
                          .join("、")}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
            {jsonData && jsonData.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                還有 {jsonData.length - 10} 筆資料...
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
