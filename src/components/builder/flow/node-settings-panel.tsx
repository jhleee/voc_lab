'use client';

// =============================================================================
// Node Settings Panel
// =============================================================================
// 노드 설정을 편집하는 우측 슬라이드 패널
// =============================================================================

import { useCallback, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, RotateCcw, Save } from 'lucide-react';
import { useNodeSettings } from '@/hooks/use-node-settings';
import { useFlowStore } from '@/hooks/use-flow-store';
import { getNodeMetadata, CATEGORY_LABELS } from '@/lib/node-registry';
import { cn } from '@/lib/utils';

// Form Components
import { StartNodeForm } from './settings-forms/start-node-form';
import { EndNodeForm } from './settings-forms/end-node-form';
import { MessageNodeForm } from './settings-forms/message-node-form';
import { ConditionNodeForm } from './settings-forms/condition-node-form';
import { IntentClassifierNodeForm } from './settings-forms/intent-classifier-node-form';
import { RAGSearchNodeForm } from './settings-forms/rag-search-node-form';
import { APIConnectorNodeForm } from './settings-forms/api-connector-node-form';
import { CustomCodeNodeForm } from './settings-forms/custom-code-node-form';
import { ApprovalNodeForm } from './settings-forms/approval-node-form';
import { ParallelNodeForm } from './settings-forms/parallel-node-form';
import { JoinNodeForm } from './settings-forms/join-node-form';
import { ErrorFallbackNodeForm } from './settings-forms/error-fallback-node-form';
import { EscalationNodeForm } from './settings-forms/escalation-node-form';

import type { FlowNodeType, FlowNodeData } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Form Component Map
// -----------------------------------------------------------------------------

const FORM_COMPONENTS: Record<FlowNodeType, React.ComponentType<{ data: FlowNodeData }>> = {
  start: StartNodeForm,
  end: EndNodeForm,
  message: MessageNodeForm,
  error_fallback: ErrorFallbackNodeForm,
  intent_classifier: IntentClassifierNodeForm,
  rag_search: RAGSearchNodeForm,
  condition: ConditionNodeForm,
  parallel: ParallelNodeForm,
  join: JoinNodeForm,
  api_connector: APIConnectorNodeForm,
  custom_code: CustomCodeNodeForm,
  escalation: EscalationNodeForm,
  approval: ApprovalNodeForm,
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function NodeSettingsPanel() {
  const {
    isOpen,
    nodeId,
    nodeType,
    formData,
    isDirty,
    validationErrors,
    close,
    revert,
    getFormData,
  } = useNodeSettings();

  const { updateNodeData, selectNode } = useFlowStore();

  // 메타데이터 조회
  const metadata = nodeType ? getNodeMetadata(nodeType) : null;

  // 저장 핸들러
  const handleSave = useCallback(() => {
    if (!nodeId || !formData) return;

    // 유효성 검사 에러가 있으면 저장하지 않음
    if (Object.keys(validationErrors).length > 0) return;

    updateNodeData(nodeId, formData);
    close();
  }, [nodeId, formData, validationErrors, updateNodeData, close]);

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // TODO: 변경사항 있으면 확인 대화상자
    }
    close();
    selectNode(null);
  }, [isDirty, close, selectNode]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape: 닫기
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }

      // Ctrl/Cmd + S: 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel, handleSave]);

  // 폼 컴포넌트 선택
  const FormComponent = nodeType ? FORM_COMPONENTS[nodeType] : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <SheetContent className="w-[500px] sm:w-[600px] flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                {metadata?.displayName || '노드'} 설정
                {isDirty && (
                  <span className="text-xs text-orange-500 font-normal">
                    (수정됨)
                  </span>
                )}
              </SheetTitle>
              {metadata && (
                <p className="text-sm text-muted-foreground mt-1">
                  {CATEGORY_LABELS[metadata.category]} 노드
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* 유효성 검사 에러 표시 */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">입력 오류</p>
                    <ul className="mt-1 text-destructive/80">
                      {Object.values(validationErrors).map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 폼 렌더링 */}
            {FormComponent && formData && (
              <FormComponent data={formData} />
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={revert}
              disabled={!isDirty}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              되돌리기
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || Object.keys(validationErrors).length > 0}
              >
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
