'use client';

import { Check, ChevronDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePromptStore } from '@/hooks/use-prompt-store';
import { cn } from '@/lib/utils';

export function VersionDropdown() {
  const {
    selectedVersionId,
    selectVersion,
    getSelectedPrompt,
  } = usePromptStore();

  const prompt = getSelectedPrompt();
  const versions = prompt?.versions || [];
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  if (!prompt || versions.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[140px]">
        <History className="h-4 w-4 mr-2" />
        버전 없음
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-[140px] justify-between">
          <span className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            v{selectedVersion?.version || versions[0]?.version}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="px-3 py-2 border-b">
          <h4 className="font-medium text-sm">버전 히스토리</h4>
          <p className="text-xs text-muted-foreground">
            총 {versions.length}개의 버전
          </p>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-1">
            {versions.map((version, index) => (
              <button
                key={version.id}
                onClick={() => selectVersion(version.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent',
                  selectedVersionId === version.id && 'bg-accent'
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    버전 {version.version}
                    {index === 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">(최신)</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(version.createdAt)}
                  </span>
                </div>
                {selectedVersionId === version.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
