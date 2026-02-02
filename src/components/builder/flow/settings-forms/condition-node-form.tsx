'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VariableInput } from '../variable-picker';
import { Plus, Trash2 } from 'lucide-react';
import type { FlowNodeData, ConditionNodeData, ConditionDefinition } from '@/types/flow-nodes';

interface ConditionNodeFormProps {
  data: FlowNodeData;
}

export function ConditionNodeForm({ data }: ConditionNodeFormProps) {
  const nodeData = data as ConditionNodeData;
  const { updateFormData } = useNodeSettings();

  const conditions = nodeData.conditions || [];

  const addCondition = () => {
    const newCondition: ConditionDefinition = {
      id: `cond_${Date.now()}`,
      label: `조건 ${conditions.length + 1}`,
      expression: '',
    };
    updateFormData({
      conditions: [...conditions, newCondition],
    });
  };

  const updateCondition = (index: number, updates: Partial<ConditionDefinition>) => {
    const newConditions = conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    updateFormData({ conditions: newConditions });
  };

  const deleteCondition = (index: number) => {
    updateFormData({
      conditions: conditions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="조건 분기"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection
        title="조건 목록"
        description="위에서부터 순서대로 평가되며, 첫 번째로 만족하는 조건으로 분기합니다."
      >
        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <div
              key={condition.id}
              className="p-4 border rounded-lg bg-muted/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">조건 {index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FormField label="분기 라벨">
                <Input
                  value={condition.label}
                  onChange={(e) =>
                    updateCondition(index, { label: e.target.value })
                  }
                  placeholder="예: VIP 고객"
                />
              </FormField>

              <VariableInput
                label="조건식"
                value={condition.expression}
                onChange={(expression) => updateCondition(index, { expression })}
                placeholder='{{session.amount}} >= 100000'
              />
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-2" />
            조건 추가
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>기본 경로:</strong> 모든 조건이 불일치하면 &quot;기본&quot; 핸들러로 분기합니다.
          </p>
        </div>
      </FormSection>
    </div>
  );
}
