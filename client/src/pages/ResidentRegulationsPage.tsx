import React from 'react';
import { Download, Printer, ExternalLink } from 'lucide-react';

const PDF_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663774839574/uXjZAyFbVclALdhK.pdf';

const ResidentRegulationsPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* 頁面標題 */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">住戶管理規約</h1>
          <p className="text-sm text-muted-foreground">美樹大悅社區住戶管理規約（修訂版）</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const printWindow = window.open(PDF_URL, "_blank");
              if (printWindow) {
                printWindow.addEventListener("load", () => printWindow.print());
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
            title="列印"
          >
            <Printer className="w-4 h-4" />
            列印
          </button>
          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title="下載"
          >
            <Download className="w-4 h-4" />
            下載
          </a>
        </div>
      </div>

      {/* PDF 預覽區域 */}
      <div className="flex-grow w-full overflow-hidden bg-gray-100">
        <iframe
          src={`${PDF_URL}#toolbar=1&navpanes=0&scrollbar=1&view=Fit`}
          className="w-full h-full border-none"
          title="住戶管理規約 PDF"
          style={{ display: 'block' }}
          allow="fullscreen"
        />
      </div>
    </div>
  );
};

export default ResidentRegulationsPage;
