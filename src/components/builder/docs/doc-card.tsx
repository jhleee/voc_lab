'use client';

import {
  FileText,
  FileType,
  File,
  MoreVertical,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Document, DocumentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface DocCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  onProcess?: (id: string) => void;
}

const fileTypeIcons = {
  pdf: FileText,
  doc: FileType,
  txt: File,
  md: FileText,
};

const fileTypeLabels = {
  pdf: 'PDF',
  doc: 'DOC',
  txt: 'TXT',
  md: 'MD',
};

const statusConfig: Record<
  DocumentStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  PENDING: { label: '대기 중', icon: RefreshCw, color: 'bg-yellow-500/10 text-yellow-600' },
  PROCESSING: { label: '처리 중', icon: Loader2, color: 'bg-blue-500/10 text-blue-600' },
  EMBEDDING: { label: '임베딩 중', icon: Loader2, color: 'bg-purple-500/10 text-purple-600' },
  READY: { label: '완료', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600' },
  ERROR: { label: '오류', icon: AlertCircle, color: 'bg-red-500/10 text-red-600' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocCard({ document, onDelete, onProcess }: DocCardProps) {
  const Icon = fileTypeIcons[document.fileType];
  const status = document.status || 'PENDING';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const isProcessing = status === 'PROCESSING' || status === 'EMBEDDING';

  const handleDelete = () => {
    const confirmed = window.confirm(
      `"${document.title}" 문서를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (confirmed && onDelete) {
      onDelete(document.id);
    }
  };

  const handleProcess = () => {
    if (onProcess && !isProcessing) {
      onProcess(document.id);
    }
  };

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium line-clamp-1">
                {document.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {fileTypeLabels[document.fileType]} • {formatFileSize(document.fileSize)}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(status === 'PENDING' || status === 'ERROR') && (
                <DropdownMenuItem onClick={handleProcess}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  처리 시작
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn('text-xs', statusInfo.color)}>
            <StatusIcon className={cn('h-3 w-3 mr-1', isProcessing && 'animate-spin')} />
            {statusInfo.label}
          </Badge>
          {document._count?.chunks !== undefined && document._count.chunks > 0 && (
            <span className="text-xs text-muted-foreground">
              {document._count.chunks} 청크
            </span>
          )}
        </div>
        {document.content && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {document.content.slice(0, 150)}
            {document.content.length > 150 ? '...' : ''}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(document.updatedAt).toLocaleDateString('ko-KR')} 수정됨
        </p>
      </CardContent>
    </Card>
  );
}
