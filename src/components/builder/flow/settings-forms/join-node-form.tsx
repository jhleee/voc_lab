'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField } from './form-section';
import { Input } from '@/components/ui/input';
import type { FlowNodeData, JoinNodeData } from '@/types/flow-nodes';

interface JoinNodeFormProps {
  data: FlowNodeData;
}

export function JoinNodeForm({ data }: JoinNodeFormProps) {
  const nodeData = data as JoinNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="병합"
          />
        </FormField>

        <FormField
          label="예상 분기 수"
          description="이 Join 노드에 연결될 Parallel 분기의 수입니다."
        >
          <Input
            type="number"
            min={2}
            max={10}
            value={nodeData.expectedBranches}
            onChange={(e) =>
              updateFormData({ expectedBranches: parseInt(e.target.value) || 2 })
            }
          />
        </FormField>
      </FormSection>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>동작 방식:</strong> 모든 병렬 분기가 완료되면 다음 노드로 진행합니다. (AND 조건)
        </p>
      </div>
    </div>
  );
}
