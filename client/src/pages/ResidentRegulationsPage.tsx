import React from 'react';
import { FileText } from 'lucide-react';

const ResidentRegulationsPage: React.FC = () => {
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
      <div className="flex-grow p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="prose prose-slate max-w-none">
              <h2>社區規約</h2>
              <p>請聯繫管理員上傳最新的社區規約文件。</p>
              <p className="text-slate-500 mt-4">
                目前系統尚未設定規約文件，管理員可透過後台設定相關文件連結。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentRegulationsPage;
