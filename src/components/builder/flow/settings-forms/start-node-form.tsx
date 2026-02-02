'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField } from './form-section';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FlowNodeData, StartNodeData } from '@/types/flow-nodes';

const TRIGGER_OPTIONS = [
  { value: 'user_message', label: '사용자 메시지' },
  { value: 'chat_open', label: '채팅창 오픈' },
  { value: 'api_call', label: 'API 호출' },
  { value: 'email_received', label: '이메일 수신' },
];

interface StartNodeFormProps {
  data: FlowNodeData;
}

export function StartNodeForm({ data }: StartNodeFormProps) {
  const nodeData = data as StartNodeData;
  const { updateField } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="시작"
          />
        </FormField>

        <FormField
          label="트리거 유형"
          htmlFor="triggerType"
          description="플로우가 시작되는 조건을 선택합니다."
        >
          <Select
            value={nodeData.triggerType}
            onValueChange={(value) => updateField('triggerType', value as StartNodeData['triggerType'])}
          >
            <SelectTrigger id="triggerType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>
    </div>
  );
}
