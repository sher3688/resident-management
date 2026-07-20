import React from 'react';
import { Streamdown } from 'streamdown';
import regulationsContent from './ResidentRegulations.md?raw';

export default function ResidentRegulations() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">美樹大悅住戶管理規約</h1>
      <Streamdown>{regulationsContent}</Streamdown>
    </div>
  );
}
