'use client';

import { DocCard } from './doc-card';
import type { Document } from '@/types';

interface DocsGridProps {
  documents: Document[];
  onDelete?: (id: string) => void;
}

export function DocsGrid({ documents, onDelete }: DocsGridProps) {
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
        <DocCard key={doc.id} document={doc} onDelete={onDelete} />
      ))}
    </div>
  );
}
