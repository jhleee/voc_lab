'use client';

import { create } from 'zustand';
import type { PromptCategory, Prompt, PromptVersion } from '@/types';

interface PromptState {
  // 데이터
  categories: PromptCategory[];
  selectedPromptId: string | null;
  selectedVersionId: string | null;
  currentContent: string;

  // UI 상태
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;

  // 액션
  setCategories: (categories: PromptCategory[]) => void;
  selectPrompt: (promptId: string | null) => void;
  selectVersion: (versionId: string | null) => void;
  setCurrentContent: (content: string) => void;
  setIsDirty: (isDirty: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;

  // 복합 액션
  addCategory: (category: PromptCategory) => void;
  updateCategory: (categoryId: string, data: Partial<PromptCategory>) => void;
  deleteCategory: (categoryId: string) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (promptId: string, data: Partial<Prompt>) => void;
  deletePrompt: (promptId: string) => void;
  addVersion: (promptId: string, version: PromptVersion) => void;
  setPromptActive: (promptId: string, categoryId: string) => void;

  // 헬퍼
  getSelectedPrompt: () => Prompt | null;
  getSelectedVersion: () => PromptVersion | null;
  getLatestVersion: (promptId: string) => PromptVersion | null;
  reset: () => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  // 초기 상태
  categories: [],
  selectedPromptId: null,
  selectedVersionId: null,
  currentContent: '',
  isDirty: false,
  isLoading: false,
  isSaving: false,

  // 기본 액션
  setCategories: (categories) => set({ categories }),

  selectPrompt: (promptId) => {
    const state = get();
    if (promptId === state.selectedPromptId) return;

    // 프롬프트 선택 시 최신 버전 선택 및 내용 로드
    let content = '';
    let versionId: string | null = null;

    if (promptId) {
      const prompt = state.categories
        .flatMap(c => c.prompts || [])
        .find(p => p.id === promptId);

      if (prompt?.versions && prompt.versions.length > 0) {
        const latestVersion = prompt.versions[0]; // 내림차순 정렬됨
        content = latestVersion.content;
        versionId = latestVersion.id;
      }
    }

    set({
      selectedPromptId: promptId,
      selectedVersionId: versionId,
      currentContent: content,
      isDirty: false,
    });
  },

  selectVersion: (versionId) => {
    const state = get();
    if (versionId === state.selectedVersionId) return;

    // 버전 선택 시 해당 내용 로드
    let content = state.currentContent;

    if (versionId && state.selectedPromptId) {
      const prompt = state.categories
        .flatMap(c => c.prompts || [])
        .find(p => p.id === state.selectedPromptId);

      const version = prompt?.versions?.find(v => v.id === versionId);
      if (version) {
        content = version.content;
      }
    }

    set({
      selectedVersionId: versionId,
      currentContent: content,
      isDirty: false,
    });
  },

  setCurrentContent: (content) => {
    const state = get();
    const version = state.getSelectedVersion();
    const isDirty = version ? version.content !== content : content !== '';
    set({ currentContent: content, isDirty });
  },

  setIsDirty: (isDirty) => set({ isDirty }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),

  // 복합 액션
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category],
  })),

  updateCategory: (categoryId, data) => set((state) => ({
    categories: state.categories.map(c =>
      c.id === categoryId ? { ...c, ...data } : c
    ),
  })),

  deleteCategory: (categoryId) => set((state) => ({
    categories: state.categories.filter(c => c.id !== categoryId),
    selectedPromptId: state.categories
      .find(c => c.id === categoryId)
      ?.prompts?.some(p => p.id === state.selectedPromptId)
        ? null
        : state.selectedPromptId,
  })),

  addPrompt: (prompt) => set((state) => ({
    categories: state.categories.map(c =>
      c.id === prompt.categoryId
        ? { ...c, prompts: [...(c.prompts || []), prompt] }
        : c
    ),
  })),

  updatePrompt: (promptId, data) => set((state) => ({
    categories: state.categories.map(c => ({
      ...c,
      prompts: c.prompts?.map(p =>
        p.id === promptId ? { ...p, ...data } : p
      ),
    })),
  })),

  deletePrompt: (promptId) => set((state) => ({
    categories: state.categories.map(c => ({
      ...c,
      prompts: c.prompts?.filter(p => p.id !== promptId),
    })),
    selectedPromptId: state.selectedPromptId === promptId ? null : state.selectedPromptId,
  })),

  addVersion: (promptId, version) => set((state) => ({
    categories: state.categories.map(c => ({
      ...c,
      prompts: c.prompts?.map(p =>
        p.id === promptId
          ? { ...p, versions: [version, ...(p.versions || [])] }
          : p
      ),
    })),
    selectedVersionId: version.id,
    isDirty: false,
  })),

  setPromptActive: (promptId, categoryId) => set((state) => ({
    categories: state.categories.map(c =>
      c.id === categoryId
        ? {
            ...c,
            prompts: c.prompts?.map(p => ({
              ...p,
              isActive: p.id === promptId,
            })),
          }
        : c
    ),
  })),

  // 헬퍼
  getSelectedPrompt: () => {
    const state = get();
    if (!state.selectedPromptId) return null;
    return state.categories
      .flatMap(c => c.prompts || [])
      .find(p => p.id === state.selectedPromptId) || null;
  },

  getSelectedVersion: () => {
    const state = get();
    const prompt = state.getSelectedPrompt();
    if (!prompt || !state.selectedVersionId) return null;
    return prompt.versions?.find(v => v.id === state.selectedVersionId) || null;
  },

  getLatestVersion: (promptId) => {
    const state = get();
    const prompt = state.categories
      .flatMap(c => c.prompts || [])
      .find(p => p.id === promptId);
    return prompt?.versions?.[0] || null;
  },

  reset: () => set({
    categories: [],
    selectedPromptId: null,
    selectedVersionId: null,
    currentContent: '',
    isDirty: false,
    isLoading: false,
    isSaving: false,
  }),
}));
