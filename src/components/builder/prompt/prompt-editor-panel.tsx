'use client';

import { useCallback } from 'react';
import { Save, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VersionDropdown } from './version-dropdown';
import { usePromptStore } from '@/hooks/use-prompt-store';
import { cn } from '@/lib/utils';
import type { PromptVersion } from '@/types';

interface PromptEditorPanelProps {
  projectId: string;
}

export function PromptEditorPanel({ projectId: _projectId }: PromptEditorPanelProps) {
  const {
    selectedPromptId,
    currentContent,
    isDirty,
    isSaving,
    setCurrentContent,
    setIsSaving,
    getSelectedPrompt,
    getSelectedVersion,
    addVersion,
    updatePrompt,
    setPromptActive,
  } = usePromptStore();

  // projectId will be used when API integration is complete
  void _projectId;

  const prompt = getSelectedPrompt();
  const version = getSelectedVersion();

  const handleSave = useCallback(async () => {
    if (!prompt || !currentContent.trim()) return;

    setIsSaving(true);
    try {
      // TODO: API 호출로 대체
      // const response = await fetch(
      //   `/api/projects/${projectId}/prompts/${prompt.id}/versions`,
      //   {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ content: currentContent }),
      //   }
      // );
      // const newVersion = await response.json();

      // Mock 버전 생성
      const latestVersion = prompt.versions?.[0];
      const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

      // 내용이 동일하면 새 버전 생성하지 않음
      if (latestVersion && latestVersion.content === currentContent) {
        return;
      }

      const newVersion: PromptVersion = {
        id: `ver-${Date.now()}`,
        version: newVersionNumber,
        content: currentContent,
        promptId: prompt.id,
        createdAt: new Date(),
      };

      addVersion(prompt.id, newVersion);
    } catch (error) {
      console.error('Failed to save prompt:', error);
    } finally {
      setIsSaving(false);
    }
  }, [prompt, currentContent, addVersion, setIsSaving]);

  const handleRevert = useCallback(() => {
    if (!version) return;
    setCurrentContent(version.content);
  }, [version, setCurrentContent]);

  const handleToggleActive = useCallback(() => {
    if (!prompt) return;
    if (!prompt.isActive) {
      setPromptActive(prompt.id, prompt.categoryId);
    }
  }, [prompt, setPromptActive]);

  if (!selectedPromptId || !prompt) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">프롬프트를 선택하세요</p>
          <p className="text-sm">왼쪽 목록에서 편집할 프롬프트를 선택해 주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="prompt-name" className="text-xs text-muted-foreground mb-1 block">
              프롬프트 이름
            </Label>
            <Input
              id="prompt-name"
              value={prompt.name}
              onChange={(e) => updatePrompt(prompt.id, { name: e.target.value })}
              className="text-lg font-semibold h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActive}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                prompt.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  prompt.isActive ? 'bg-green-500' : 'bg-muted-foreground/50'
                )}
              />
              {prompt.isActive ? '활성' : '비활성'}
            </button>
          </div>
        </div>
      </div>

      {/* 편집기 */}
      <div className="flex-1 flex flex-col min-h-0">
        <Textarea
          value={currentContent}
          onChange={(e) => setCurrentContent(e.target.value)}
          className="flex-1 min-h-[400px] font-mono text-sm resize-none"
          placeholder="프롬프트 내용을 입력하세요..."
        />
      </div>

      {/* 하단 액션 바 */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VersionDropdown />
          {isDirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              저장되지 않은 변경사항
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevert}
            disabled={!isDirty || isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            되돌리기
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving || !currentContent.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
