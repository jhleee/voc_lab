'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { defaultPrompt } from '@/lib/mock-data';

export function PromptEditor() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement actual prompt save API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLastSaved(new Date());
    setIsSaving(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">시스템 프롬프트</h2>
          <p className="text-sm text-muted-foreground">
            챗봇의 기본 행동 방식을 정의합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              마지막 저장: {lastSaved.toLocaleTimeString('ko-KR')}
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="flex-1 min-h-[500px] font-mono text-sm resize-none"
        placeholder="시스템 프롬프트를 입력하세요..."
      />
    </div>
  );
}
