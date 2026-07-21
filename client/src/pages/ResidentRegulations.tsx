import React from 'react';
import { Streamdown } from 'streamdown';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import regulationsContent from './ResidentRegulations.md?raw';

export default function ResidentRegulations() {
  const handleExportMarkdown = () => {
    const blob = new Blob([regulationsContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `住戶管理規約_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">美樹大悅住戶管理規約</h1>
        <Button onClick={handleExportMarkdown} variant="outline" className="gap-2">
          <FileDown className="w-4 h-4" />
          匯出 Markdown
        </Button>
      </div>
      <Streamdown>{regulationsContent}</Streamdown>
    </div>
  );
}
