'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Upload, AlertCircle } from 'lucide-react';
import { DocsSearch } from '@/components/builder/docs/docs-search';
import { DocsGrid } from '@/components/builder/docs/docs-grid';
import { useDocuments } from '@/hooks/use-documents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Allowed file extensions for upload
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isValidFileExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.includes(ext) : false;
}

export default function DocsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    processDocument,
  } = useDocuments({ projectId });

  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
  };

  const handleProcess = async (id: string) => {
    await processDocument(id);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setUploadError(null);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Validate files before processing
      const invalidFiles: string[] = [];
      const oversizedFiles: string[] = [];
      const validFiles = files.filter((file) => {
        if (!isValidFileExtension(file.name)) {
          invalidFiles.push(file.name);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(file.name);
          return false;
        }
        return true;
      });

      // Show error messages for invalid files
      const errors: string[] = [];
      if (invalidFiles.length > 0) {
        errors.push(`지원하지 않는 파일 형식: ${invalidFiles.join(', ')}`);
      }
      if (oversizedFiles.length > 0) {
        errors.push(`파일 크기 초과 (최대 10MB): ${oversizedFiles.join(', ')}`);
      }
      if (errors.length > 0) {
        setUploadError(errors.join('\n'));
      }

      if (validFiles.length === 0) return;

      // Upload files
      setIsUploading(true);
      try {
        for (const file of validFiles) {
          await uploadDocument(file);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [uploadDocument]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadError(null);
      setIsUploading(true);

      try {
        for (const file of Array.from(files)) {
          if (!isValidFileExtension(file.name)) {
            setUploadError(`지원하지 않는 파일 형식: ${file.name}`);
            continue;
          }
          if (file.size > MAX_FILE_SIZE) {
            setUploadError(`파일 크기 초과 (최대 10MB): ${file.name}`);
            continue;
          }
          await uploadDocument(file);
        }
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [uploadDocument]
  );

  return (
    <div
      className="h-full p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">문서 관리</h1>
          <p className="text-muted-foreground">
            챗봇이 참조할 문서를 관리합니다.
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md"
            multiple
            onChange={handleFileInput}
            disabled={isUploading}
          />
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            {isUploading ? '업로드 중...' : '파일 업로드'}
          </span>
        </label>
      </div>

      <div className="mb-6 max-w-md">
        <DocsSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      {(uploadError || error) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {uploadError || error}
          </AlertDescription>
        </Alert>
      )}

      <div
        className={cn(
          'relative min-h-[400px] rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-transparent'
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
        <DocsGrid
          documents={filteredDocuments}
          isLoading={isLoading}
          onDelete={handleDelete}
          onProcess={handleProcess}
        />
      </div>
    </div>
  );
}
