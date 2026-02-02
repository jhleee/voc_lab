'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { FlowNodeData, ParallelNodeData, ParallelBranch } from '@/types/flow-nodes';

interface ParallelNodeFormProps {
  data: FlowNodeData;
}

export function ParallelNodeForm({ data }: ParallelNodeFormProps) {
  const nodeData = data as ParallelNodeData;
  const { updateFormData } = useNodeSettings();

  const branches = nodeData.branches || [];

  const addBranch = () => {
    const newBranch: ParallelBranch = {
      id: `branch_${Date.now()}`,
      label: `분기 ${branches.length + 1}`,
    };
    updateFormData({
      branches: [...branches, newBranch],
    });
  };

  const updateBranch = (index: number, updates: Partial<ParallelBranch>) => {
    const newBranches = branches.map((branch, i) =>
      i === index ? { ...branch, ...updates } : branch
    );
    updateFormData({ branches: newBranches });
  };

  const deleteBranch = (index: number) => {
    updateFormData({
      branches: branches.filter((_, i) => i !== index),
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
            placeholder="병렬"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection
        title="병렬 분기"
        description="동시에 실행될 분기들을 정의합니다. 각 분기는 Non-blocking 노드만 포함해야 합니다."
      >
        <div className="space-y-3">
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
            >
              <span className="text-sm text-muted-foreground w-16">
                분기 {index + 1}
              </span>
              <Input
                value={branch.label}
                onChange={(e) => updateBranch(index, { label: e.target.value })}
                placeholder="분기 이름"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteBranch(index)}
                disabled={branches.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addBranch}>
            <Plus className="h-4 w-4 mr-2" />
            분기 추가
          </Button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>주의:</strong> Parallel~Join 구간 내에서는 Blocking 노드(메시지 응답 대기, HITL 등)를 사용할 수 없습니다.
          </p>
        </div>
      </FormSection>
    </div>
  );
}
