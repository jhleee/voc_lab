'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FlowNodeData, CustomCodeNodeData } from '@/types/flow-nodes';

interface CustomCodeNodeFormProps {
  data: FlowNodeData;
}

export function CustomCodeNodeForm({ data }: CustomCodeNodeFormProps) {
  const nodeData = data as CustomCodeNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="커스텀 코드"
          />
        </FormField>

        <FormField
          label="타임아웃 (ms)"
          description="최대 10,000ms (10초)"
        >
          <Input
            type="number"
            min={100}
            max={10000}
            step={100}
            value={nodeData.timeout}
            onChange={(e) =>
              updateFormData({ timeout: Math.min(10000, parseInt(e.target.value) || 1000) })
            }
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection
        title="JavaScript 코드"
        description="샌드박스 환경에서 실행됩니다. 네트워크/파일 시스템 접근 불가."
      >
        <div className="p-3 bg-muted rounded-lg text-xs font-mono space-y-1 mb-3">
          <p><strong>사용 가능한 변수:</strong></p>
          <p className="text-muted-foreground">• input.system - 시스템 변수 (읽기)</p>
          <p className="text-muted-foreground">• input.session - 세션 변수 (읽기)</p>
          <p className="text-muted-foreground">• input.nodes - 노드 결과 (읽기)</p>
          <p className="mt-2"><strong>사용 가능한 함수:</strong></p>
          <p className="text-muted-foreground">• setVariable(&quot;session.key&quot;, value)</p>
          <p className="text-muted-foreground">• return {'{'} success: true, data: ... {'}'}</p>
          <p className="mt-2"><strong>사용 가능한 라이브러리:</strong></p>
          <p className="text-muted-foreground">• Lodash (_), Day.js (dayjs), UUID (uuid)</p>
        </div>

        <Textarea
          value={nodeData.code}
          onChange={(e) => updateFormData({ code: e.target.value })}
          placeholder="// 코드를 입력하세요"
          rows={15}
          className="font-mono text-sm"
        />
      </FormSection>
    </div>
  );
}
