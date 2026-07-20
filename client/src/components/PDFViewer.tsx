import React from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, title }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-100 overflow-hidden">
      {title && <h1 className="text-2xl font-bold p-4 flex-shrink-0 border-b border-gray-200">{title}</h1>}
      
      {/* PDF 顯示區域 - 使用 iframe 自動支持翻頁和縮放 */}
      <div className="flex-grow overflow-hidden w-full min-h-0">
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=Fit`}
          className="w-full h-full border-none"
          title={title || 'PDF Viewer'}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          allow="fullscreen"
        />
      </div>
    </div>
  );
};
