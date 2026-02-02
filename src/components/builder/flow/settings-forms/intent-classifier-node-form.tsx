'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import type { FlowNodeData, IntentClassifierNodeData, IntentDefinition } from '@/types/flow-nodes';

interface IntentClassifierNodeFormProps {
  data: FlowNodeData;
}

export function IntentClassifierNodeForm({ data }: IntentClassifierNodeFormProps) {
  const nodeData = data as IntentClassifierNodeData;
  const { updateFormData } = useNodeSettings();

  const intents = nodeData.intents || [];

  const addIntent = () => {
    const newIntent: IntentDefinition = {
      id: `intent_${Date.now()}`,
      name: `의도 ${intents.length + 1}`,
      description: '',
      examples: [],
    };
    updateFormData({
      intents: [...intents, newIntent],
    });
  };

  const updateIntent = (index: number, updates: Partial<IntentDefinition>) => {
    const newIntents = intents.map((intent, i) =>
      i === index ? { ...intent, ...updates } : intent
    );
    updateFormData({ intents: newIntents });
  };

  const deleteIntent = (index: number) => {
    updateFormData({
      intents: intents.filter((_, i) => i !== index),
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
            placeholder="의도 분류"
          />
        </FormField>

        <FormField
          label={`신뢰도 임계값: ${((nodeData.confidenceThreshold || 0.7) * 100).toFixed(0)}%`}
          description="이 값 미만의 신뢰도는 '기타' 의도로 분류됩니다."
        >
          <Slider
            value={[(nodeData.confidenceThreshold || 0.7) * 100]}
            onValueChange={([value]) =>
              updateFormData({ confidenceThreshold: value / 100 })
            }
            min={0}
            max={100}
            step={5}
            className="mt-2"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection
        title="의도 목록"
        description="분류할 의도들을 정의합니다. 각 의도마다 별도의 분기 핸들러가 생성됩니다."
      >
        <div className="space-y-4">
          {intents.map((intent, index) => (
            <div
              key={intent.id}
              className="p-4 border rounded-lg bg-muted/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">의도 {index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteIntent(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FormField label="의도 이름" required>
                <Input
                  value={intent.name}
                  onChange={(e) =>
                    updateIntent(index, { name: e.target.value })
                  }
                  placeholder="예: 예약"
                />
              </FormField>

              <FormField label="설명" description="AI가 이 의도를 구분하는 데 도움이 됩니다.">
                <Textarea
                  value={intent.description || ''}
                  onChange={(e) =>
                    updateIntent(index, { description: e.target.value })
                  }
                  placeholder="예: 사용자가 예약을 원할 때"
                  rows={2}
                />
              </FormField>

              <FormField
                label="예시 발화"
                description="한 줄에 하나씩 입력 (Few-shot 학습용)"
              >
                <Textarea
                  value={intent.examples.join('\n')}
                  onChange={(e) =>
                    updateIntent(index, {
                      examples: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  placeholder="예약하고 싶어요&#10;예약 좀 해주세요&#10;예약 가능한가요?"
                  rows={4}
                  className="font-mono text-sm"
                />
              </FormField>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addIntent}>
            <Plus className="h-4 w-4 mr-2" />
            의도 추가
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>기타 의도:</strong> 정의된 의도에 해당하지 않거나 신뢰도가 낮은 경우 &quot;기타&quot; 핸들러로 분기합니다.
          </p>
        </div>
      </FormSection>
    </div>
  );
}
