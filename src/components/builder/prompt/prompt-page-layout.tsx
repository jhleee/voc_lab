'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PromptSidebar } from './prompt-sidebar';
import { PromptEditorPanel } from './prompt-editor-panel';
import { usePromptStore } from '@/hooks/use-prompt-store';
import type { PromptCategory } from '@/types';

export function PromptPageLayout() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { setCategories, setIsLoading, isLoading, reset } = usePromptStore();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      try {
        // 먼저 기본 카테고리 초기화 시도
        await fetch(`/api/projects/${projectId}/prompt-categories`, {
          method: 'PUT',
        });

        // 카테고리 목록 조회
        const response = await fetch(`/api/projects/${projectId}/prompt-categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data: PromptCategory[] = await response.json();

        if (!cancelled) {
          setCategories(data);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        if (!cancelled) {
          setError('카테고리를 불러오는데 실패했습니다.');
        }
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

  if (error) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <p className="text-destructive">{error}</p>
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
