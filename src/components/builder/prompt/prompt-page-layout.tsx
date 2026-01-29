'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PromptSidebar } from './prompt-sidebar';
import { PromptEditorPanel } from './prompt-editor-panel';
import { usePromptStore } from '@/hooks/use-prompt-store';
import { mockPromptCategories, getPromptsWithVersions } from '@/lib/mock-data';
import type { PromptCategory } from '@/types';

export function PromptPageLayout() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { setCategories, setIsLoading, isLoading, reset } = usePromptStore();
  const [initialized, setInitialized] = useState(false);

  // 컴포넌트 언마운트 시 스토어 초기화
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setIsLoading(true);
      try {
        // TODO: API 호출로 대체
        // const response = await fetch(`/api/projects/${projectId}/prompt-categories`);
        // const data = await response.json();

        // Mock 데이터 사용 (프로젝트별 필터링)
        const prompts = getPromptsWithVersions();
        const categoriesWithPrompts: PromptCategory[] = mockPromptCategories
          .filter(cat => cat.projectId === projectId || cat.projectId === 'project-1')
          .map(cat => ({
            ...cat,
            prompts: prompts.filter(p => p.categoryId === cat.id),
          }));

        if (!cancelled) {
          setCategories(categoriesWithPrompts);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [projectId, setCategories, setIsLoading]);

  if (isLoading && !initialized) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      <PromptSidebar projectId={projectId} />
      <PromptEditorPanel projectId={projectId} />
    </div>
  );
}
