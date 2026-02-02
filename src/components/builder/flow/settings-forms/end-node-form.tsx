'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField } from './form-section';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { FlowNodeData, EndNodeData } from '@/types/flow-nodes';

interface EndNodeFormProps {
  data: FlowNodeData;
}

export function EndNodeForm({ data }: EndNodeFormProps) {
  const nodeData = data as EndNodeData;
  const { updateField } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="종료"
          />
        </FormField>

        <div className="flex items-center justify-between">
          <Label htmlFor="preserveSession" className="flex flex-col gap-1">
            <span className="text-sm font-medium">세션 데이터 보관</span>
            <span className="text-xs text-muted-foreground font-normal">
              종료 후에도 세션 데이터를 유지합니다.
            </span>
          </Label>
          <Switch
            id="preserveSession"
            checked={nodeData.preserveSession}
            onCheckedChange={(checked) => updateField('preserveSession', checked)}
          />
        </div>
      </FormSection>
    </div>
  );
}
