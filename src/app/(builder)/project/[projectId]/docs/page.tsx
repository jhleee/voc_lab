'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { DocsSearch } from '@/components/builder/docs/docs-search';
import { DocsGrid } from '@/components/builder/docs/docs-grid';
import { mockDocuments } from '@/lib/mock-data';
import type { Document } from '@/types';
import { cn } from '@/lib/utils';

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    // TODO: Implement actual deletion API call
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // TODO: Implement actual file upload API
    // For demo, create mock documents
    const newDocs: Document[] = files.map((file, index) => ({
      id: `doc-new-${Date.now()}-${index}`,
      title: file.name,
      content: `업로드된 파일: ${file.name}`,
      fileType: getFileType(file.name),
      fileSize: file.size,
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    setDocuments((prev) => [...newDocs, ...prev]);
  }, []);

  return (
    <div
      className="h-full p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">문서 관리</h1>
        <p className="text-muted-foreground">
          챗봇이 참조할 문서를 관리합니다.
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <DocsSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div
        className={cn(
          'relative min-h-[400px] rounded-lg border-2 border-dashed transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-transparent'
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 rounded-lg">
            <Upload className="h-12 w-12 text-primary mb-4" />
            <p className="text-lg font-medium">파일을 여기에 놓으세요</p>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, TXT, MD 파일 지원
            </p>
          </div>
        )}
        <DocsGrid documents={filteredDocuments} onDelete={handleDelete} />
      </div>
    </div>
  );
}

function getFileType(filename: string): Document['fileType'] {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'doc';
    case 'md':
      return 'md';
    default:
      return 'txt';
  }
}
