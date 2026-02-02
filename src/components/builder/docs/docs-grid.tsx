'use client';

import { Loader2 } from 'lucide-react';
import { DocCard } from './doc-card';
import type { Document } from '@/types';

interface DocsGridProps {
  documents: Document[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onProcess?: (id: string) => void;
}

export function DocsGrid({ documents, isLoading, onDelete, onProcess }: DocsGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2">문서를 불러오는 중...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">문서가 없습니다.</p>
        <p className="text-sm text-muted-foreground mt-1">
          파일을 드래그하여 업로드하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <DocCard
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          onProcess={onProcess}
        />
      ))}
    </div>
  );
}
