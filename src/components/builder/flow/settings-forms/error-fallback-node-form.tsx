'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FlowNodeData, ErrorFallbackNodeData } from '@/types/flow-nodes';

const RESTART_OPTIONS = [
  { value: 'last_success', label: '마지막 성공 노드부터 재실행' },
  { value: 'failed_node', label: '실패한 노드부터 재실행' },
];

interface ErrorFallbackNodeFormProps {
  data: FlowNodeData;
}

export function ErrorFallbackNodeForm({ data }: ErrorFallbackNodeFormProps) {
  const nodeData = data as ErrorFallbackNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="에러 폴백"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="폴백 설정">
        <FormField
          label="폴백 메시지"
          description="에러 발생 시 사용자에게 표시할 메시지"
        >
          <Textarea
            value={nodeData.fallbackMessage}
            onChange={(e) => updateFormData({ fallbackMessage: e.target.value })}
            placeholder="죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            rows={3}
          />
        </FormField>

        <FormField
          label="재시작 옵션"
          description="재시도 시 어디서부터 다시 실행할지 선택합니다."
        >
          <Select
            value={nodeData.restartOption}
            onValueChange={(value) =>
              updateFormData({ restartOption: value as ErrorFallbackNodeData['restartOption'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESTART_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>설정 범위:</strong> 이 노드는 특정 노드에 개별 에러 폴백으로 지정하거나,
          전역 에러 폴백으로 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
