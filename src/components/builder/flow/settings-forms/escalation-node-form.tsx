'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FlowNodeData, EscalationNodeData } from '@/types/flow-nodes';

interface EscalationNodeFormProps {
  data: FlowNodeData;
}

export function EscalationNodeForm({ data }: EscalationNodeFormProps) {
  const nodeData = data as EscalationNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="상담원 연결"
          />
        </FormField>
      </FormSection>

      <FormSection title="상담원 전달 정보">
        <FormField
          label="요약 템플릿"
          description="상담원에게 전달할 대화 요약 템플릿 (비워두면 AI 자동 요약)"
        >
          <Textarea
            value={nodeData.summaryTemplate || ''}
            onChange={(e) => updateFormData({ summaryTemplate: e.target.value })}
            placeholder="[사용자 정보]&#10;- 이름: {{session.userName}}&#10;&#10;[문의 내용]&#10;{{session.lastUserInput}}"
            rows={6}
          />
        </FormField>
      </FormSection>

      <div className="p-3 bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-800 rounded-lg">
        <p className="text-xs text-pink-700 dark:text-pink-300">
          <strong>주의:</strong> 상담원에게 제어권이 완전히 이전됩니다.
          상담원이 대화를 종료하면 세션이 종료되며, 플로우로 복귀하지 않습니다.
        </p>
      </div>
    </div>
  );
}
