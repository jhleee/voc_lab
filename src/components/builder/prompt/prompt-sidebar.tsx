'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  ChevronRight,
  MoreVertical,
  Trash2,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePromptStore } from '@/hooks/use-prompt-store';
import { cn } from '@/lib/utils';
import type { PromptCategory, Prompt } from '@/types';

interface PromptSidebarProps {
  projectId: string;
}

export function PromptSidebar({ projectId }: PromptSidebarProps) {
  const {
    categories,
    selectedPromptId,
    selectPrompt,
    addCategory,
    deleteCategory,
    addPrompt,
    deletePrompt,
    setPromptActive,
    updatePrompt,
  } = usePromptStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingPromptToCategory, setAddingPromptToCategory] = useState<string | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/prompt-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to create category');

      const newCategory: PromptCategory = await response.json();
      addCategory(newCategory);
      setExpandedCategories(prev => new Set([...prev, newCategory.id]));
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('카테고리 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [newCategoryName, projectId, addCategory, isLoading]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    const confirmed = window.confirm(
      '이 카테고리와 포함된 모든 프롬프트가 삭제됩니다. 계속하시겠습니까?'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/prompt-categories/${categoryId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete category');
      deleteCategory(categoryId);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  }, [projectId, deleteCategory]);

  const handleAddPrompt = useCallback(async (categoryId: string) => {
    if (!newPromptName.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPromptName.trim(),
          categoryId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create prompt');

      const newPrompt: Prompt = await response.json();
      addPrompt(newPrompt);
      selectPrompt(newPrompt.id);
      setNewPromptName('');
      setAddingPromptToCategory(null);
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('프롬프트 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [newPromptName, projectId, addPrompt, selectPrompt, isLoading]);

  const handleDeletePrompt = useCallback(async (promptId: string, promptName: string) => {
    const confirmed = window.confirm(
      `"${promptName}" 프롬프트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/prompts/${promptId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete prompt');
      deletePrompt(promptId);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('프롬프트 삭제에 실패했습니다.');
    }
  }, [projectId, deletePrompt]);

  const handleToggleActive = useCallback(async (prompt: Prompt) => {
    if (prompt.isActive) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/prompts/${prompt.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        }
      );

      if (!response.ok) throw new Error('Failed to update prompt');

      setPromptActive(prompt.id, prompt.categoryId);

      // 업데이트된 프롬프트 데이터 적용
      const updatedPrompt: Prompt = await response.json();
      updatePrompt(prompt.id, updatedPrompt);
    } catch (error) {
      console.error('Failed to activate prompt:', error);
      alert('프롬프트 활성화에 실패했습니다.');
    }
  }, [projectId, setPromptActive, updatePrompt]);

  return (
    <div className="w-[280px] border-r flex flex-col bg-muted/30">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">프롬프트 목록</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsAddingCategory(true)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isAddingCategory && (
            <div className="mb-2 p-2 rounded-lg bg-background border">
              <Input
                autoFocus
                placeholder="카테고리 이름"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }
                }}
                className="h-8 text-sm"
                disabled={isLoading}
              />
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleAddCategory}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '추가'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                  disabled={isLoading}
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              selectedPromptId={selectedPromptId}
              onSelectPrompt={selectPrompt}
              onDeleteCategory={() => handleDeleteCategory(category.id)}
              onDeletePrompt={handleDeletePrompt}
              onToggleActive={handleToggleActive}
              isAddingPrompt={addingPromptToCategory === category.id}
              onStartAddPrompt={() => setAddingPromptToCategory(category.id)}
              onCancelAddPrompt={() => {
                setAddingPromptToCategory(null);
                setNewPromptName('');
              }}
              newPromptName={newPromptName}
              onNewPromptNameChange={setNewPromptName}
              onAddPrompt={() => handleAddPrompt(category.id)}
              isLoading={isLoading}
            />
          ))}

          {categories.length === 0 && !isAddingCategory && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>카테고리가 없습니다</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsAddingCategory(true)}
              >
                카테고리 추가
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface CategoryItemProps {
  category: PromptCategory;
  isExpanded: boolean;
  onToggle: () => void;
  selectedPromptId: string | null;
  onSelectPrompt: (id: string) => void;
  onDeleteCategory: () => void;
  onDeletePrompt: (id: string, name: string) => void;
  onToggleActive: (prompt: Prompt) => void;
  isAddingPrompt: boolean;
  onStartAddPrompt: () => void;
  onCancelAddPrompt: () => void;
  newPromptName: string;
  onNewPromptNameChange: (name: string) => void;
  onAddPrompt: () => void;
  isLoading: boolean;
}

function CategoryItem({
  category,
  isExpanded,
  onToggle,
  selectedPromptId,
  onSelectPrompt,
  onDeleteCategory,
  onDeletePrompt,
  onToggleActive,
  isAddingPrompt,
  onStartAddPrompt,
  onCancelAddPrompt,
  newPromptName,
  onNewPromptNameChange,
  onAddPrompt,
  isLoading,
}: CategoryItemProps) {
  const prompts = category.prompts || [];

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle} className="mb-1">
      <div className="flex items-center group">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="flex-1 justify-start h-9 px-2">
            <ChevronRight
              className={cn(
                'h-4 w-4 mr-1 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
            <span className="truncate">{category.name}</span>
            <span className="ml-auto text-xs text-muted-foreground mr-1">
              {prompts.length}
            </span>
          </Button>
        </CollapsibleTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onStartAddPrompt}>
              <Plus className="mr-2 h-4 w-4" />
              프롬프트 추가
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDeleteCategory}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              카테고리 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="ml-4 border-l pl-2 space-y-0.5">
          {prompts.map((prompt) => (
            <PromptItem
              key={prompt.id}
              prompt={prompt}
              isSelected={selectedPromptId === prompt.id}
              onSelect={() => onSelectPrompt(prompt.id)}
              onDelete={() => onDeletePrompt(prompt.id, prompt.name)}
              onToggleActive={() => onToggleActive(prompt)}
            />
          ))}

          {isAddingPrompt && (
            <div className="p-2 rounded-lg bg-background border">
              <Input
                autoFocus
                placeholder="프롬프트 이름"
                value={newPromptName}
                onChange={(e) => onNewPromptNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAddPrompt();
                  if (e.key === 'Escape') onCancelAddPrompt();
                }}
                className="h-8 text-sm"
                disabled={isLoading}
              />
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={onAddPrompt}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '추가'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={onCancelAddPrompt}
                  disabled={isLoading}
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {prompts.length === 0 && !isAddingPrompt && (
            <div className="py-2 px-2 text-xs text-muted-foreground">
              프롬프트가 없습니다
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface PromptItemProps {
  prompt: Prompt;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function PromptItem({
  prompt,
  isSelected,
  onSelect,
  onDelete,
  onToggleActive,
}: PromptItemProps) {
  return (
    <div
      className={cn(
        'flex items-center group rounded-md',
        isSelected && 'bg-accent'
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex-1 justify-start h-8 px-2 text-sm',
          isSelected && 'bg-transparent'
        )}
        onClick={onSelect}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full mr-2 flex-shrink-0',
            prompt.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
          )}
          title={prompt.isActive ? '활성화됨' : '비활성화됨'}
        />
        <span className="truncate">{prompt.name}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!prompt.isActive && (
            <DropdownMenuItem onClick={onToggleActive}>
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              활성화
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
