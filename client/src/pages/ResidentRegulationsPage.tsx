import React, { useState, useRef } from 'react';
import { Download, Printer, Upload, FileUp, CheckCircle2, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const ResidentRegulationsPage: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查詢目前規約
  const { data: regulation, refetch: refetchRegulation, isLoading } = trpc.regulationSettings.getRegulation.useQuery();
  const pdfUrl = regulation?.pdfUrl || '';
  const lastUpdated = regulation?.updatedAt ? new Date(regulation.updatedAt).toLocaleString('zh-TW') : '';

  // 更新規約
  const updateMutation = trpc.regulationSettings.updateRegulation.useMutation({
    onSuccess: () => {
      toast.success('規約已更新');
      setShowUpload(false);
      setSelectedFile(null);
      setUploadName('');
      refetchRegulation();
    },
    onError: (err) => {
      toast.error('更新失敗：' + err.message);
      setUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('只支援 PDF 和 Word 檔案');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('檔案大小不能超過 10MB');
        return;
      }
      setSelectedFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('請選擇檔案');
      return;
    }

    setUploading(true);
    try {
      // 上傳檔案到 S3
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('檔案上傳失敗');
      }

      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.url;

      // 更新資料庫中的規約 URL
      updateMutation.mutate({
        pdfUrl: fileUrl,
        description: `住戶管理規約 - ${uploadName}`,
      });
    } catch (error: any) {
      toast.error(error.message || '上傳失敗');
      setUploading(false);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print());
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* 頁面標題 */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">住戶管理規約</h1>
          <p className="text-sm text-muted-foreground">美樹大悅社區住戶管理規約</p>
        </div>
        <div className="flex gap-2 items-center">
          {lastUpdated && (
            <span className="text-xs text-gray-400 flex items-center gap-1 mr-2">
              <Clock className="w-3 h-3" />
              最近更新：{lastUpdated}
            </span>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
            title="列印"
          >
            <Printer className="w-4 h-4" />
            列印
          </button>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
              title="下載"
            >
              <Download className="w-4 h-4" />
              下載
            </a>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title="上傳新規約"
          >
            <Upload className="w-4 h-4" />
            上傳替換
          </button>
        </div>
      </div>

      {/* 上傳替換對話框 */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">上傳新規約</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">選擇 PDF 或 Word 檔案</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
              <p className="text-xs text-gray-400">
                上傳後將替換目前的規約文件，所有用戶看到的都會是最新版本。
              </p>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowUpload(false);
                  setSelectedFile(null);
                  setUploadName('');
                }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    上傳中...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4" />
                    確認上傳
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF 預覽區域 */}
      <div className="flex-grow w-full overflow-hidden bg-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">載入中...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=Fit`}
            className="w-full h-full border-none"
            title="住戶管理規約 PDF"
            style={{ display: 'block' }}
            allow="fullscreen"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">尚未上傳規約</p>
              <p className="text-sm text-muted-foreground mb-4">請點擊右上角「上傳替換」按鈕上傳規約文件</p>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Upload className="w-4 h-4" />
                上傳規約
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentRegulationsPage;
