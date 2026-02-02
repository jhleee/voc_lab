'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FlowNodeData, RAGSearchNodeData } from '@/types/flow-nodes';

interface RAGSearchNodeFormProps {
  data: FlowNodeData;
}

export function RAGSearchNodeForm({ data }: RAGSearchNodeFormProps) {
  const nodeData = data as RAGSearchNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="RAG 검색"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="문서셋 설정">
        <FormField
          label="문서셋 ID"
          description="검색할 문서셋(폴더)의 ID를 입력합니다."
          required
        >
          <Input
            value={nodeData.documentSetId}
            onChange={(e) => updateFormData({ documentSetId: e.target.value })}
            placeholder="document-set-id"
          />
        </FormField>

        <FormField label="버전" description="문서셋 버전을 선택합니다.">
          <Select
            value={nodeData.documentSetVersion}
            onValueChange={(value) =>
              updateFormData({ documentSetVersion: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신</SelectItem>
              {/* TODO: 버전 목록을 동적으로 로드 */}
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="검색 설정">
        <FormField
          label={`Top-K: ${nodeData.topK}`}
          description="검색 결과로 반환할 최대 문서 수"
        >
          <Slider
            value={[nodeData.topK]}
            onValueChange={([value]) => updateFormData({ topK: value })}
            min={1}
            max={20}
            step={1}
            className="mt-2"
          />
        </FormField>

        <FormField
          label={`유사도 임계값: ${(nodeData.similarityThreshold * 100).toFixed(0)}%`}
          description="이 값 이상의 유사도를 가진 문서만 반환됩니다."
        >
          <Slider
            value={[nodeData.similarityThreshold * 100]}
            onValueChange={([value]) =>
              updateFormData({ similarityThreshold: value / 100 })
            }
            min={0}
            max={100}
            step={5}
            className="mt-2"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="응답 생성">
        <FormField
          label="페르소나 설정"
          description="LLM이 응답을 생성할 때 적용할 스타일 및 지침"
        >
          <Textarea
            value={nodeData.persona || ''}
            onChange={(e) => updateFormData({ persona: e.target.value })}
            placeholder="예: 친절하고 전문적인 상담원처럼 답변해주세요."
            rows={4}
          />
        </FormField>
      </FormSection>
    </div>
  );
}
