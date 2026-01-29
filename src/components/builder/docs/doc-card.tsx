'use client';

import { FileText, FileType, File, MoreVertical, Trash2 } from 'lucide-react';
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
import type { Document } from '@/types';

interface DocCardProps {
  document: Document;
  onDelete?: (id: string) => void;
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocCard({ document, onDelete }: DocCardProps) {
  const Icon = fileTypeIcons[document.fileType];

  const handleDelete = () => {
    // TODO: Implement actual document deletion with confirmation
    if (onDelete) {
      onDelete(document.id);
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
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {document.content}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {document.updatedAt.toLocaleDateString('ko-KR')} 수정됨
        </p>
      </CardContent>
    </Card>
  );
}
