import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResidentRegulationsPage: React.FC = () => {
  const pdfUrl = "/manus-storage/community-regulations_78d9a688.pdf";

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      {/* 頁面標題 */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">住戶管理規約</h1>
          </div>
          <p className="text-slate-600">美樹大悅社區住戶管理規約</p>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 max-w-md w-full text-center">
          <div className="mb-6">
            <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">規約文件</h2>
            <p className="text-slate-600 mb-4">點擊下方按鈕在您的設備上打開或下載規約文件</p>
          </div>

          <div className="space-y-3">
            {/* 在線查看按鈕 */}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button className="w-full h-12 text-base font-semibold" size="lg">
                <FileText className="w-5 h-5 mr-2" />
                在線查看規約
              </Button>
            </a>

            {/* 下載按鈕 */}
            <a href={pdfUrl} download="住戶管理規約.pdf">
              <Button variant="outline" className="w-full h-12 text-base font-semibold" size="lg">
                <Download className="w-5 h-5 mr-2" />
                下載規約 PDF
              </Button>
            </a>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            建議使用 PDF 閱讀器應用程式以獲得最佳閱讀體驗
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResidentRegulationsPage;
