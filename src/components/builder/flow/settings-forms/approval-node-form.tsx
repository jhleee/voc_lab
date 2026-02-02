'use client';

import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FlowNodeData, ApprovalNodeData } from '@/types/flow-nodes';

interface ApprovalNodeFormProps {
  data: FlowNodeData;
}

export function ApprovalNodeForm({ data }: ApprovalNodeFormProps) {
  const nodeData = data as ApprovalNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="승인 요청"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="상담원 설정">
        <FormField
          label="승인 요청 정보"
          description="상담원 대시보드에 표시될 승인 요청 내용"
        >
          <Textarea
            value={nodeData.approvalRequestInfo}
            onChange={(e) => updateFormData({ approvalRequestInfo: e.target.value })}
            placeholder="[환불 요청]&#10;- 주문번호: {{session.orderId}}&#10;- 금액: {{session.amount}}원&#10;- 사유: {{session.reason}}"
            rows={5}
          />
        </FormField>

        <FormField
          label="추가 메시지"
          description="승인 요청에 추가로 표시할 정보"
        >
          <Input
            value={nodeData.additionalMessage || ''}
            onChange={(e) => updateFormData({ additionalMessage: e.target.value })}
            placeholder="환불 규정에 따라 검토 부탁드립니다."
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="사용자 설정">
        <FormField
          label="대기 메시지"
          description="승인 대기 중 사용자에게 표시될 메시지"
        >
          <Input
            value={nodeData.waitingMessage}
            onChange={(e) => updateFormData({ waitingMessage: e.target.value })}
            placeholder="처리 중입니다. 잠시만 기다려주세요."
          />
        </FormField>

        <FormField
          label="타임아웃 (분)"
          description="승인 대기 최대 시간. 0은 무제한입니다."
        >
          <Input
            type="number"
            min={0}
            value={nodeData.timeout || 0}
            onChange={(e) =>
              updateFormData({ timeout: parseInt(e.target.value) || 0 })
            }
          />
        </FormField>
      </FormSection>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>분기 경로:</strong><br />
          • 승인 시 → &quot;승인&quot; 핸들러로 진행<br />
          • 거절 시 → &quot;거절&quot; 핸들러로 진행 (거절 사유: nodes.[노드ID].rejectReason)
        </p>
      </div>
    </div>
  );
}
