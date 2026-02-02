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
import type { FlowNodeData, APIConnectorNodeData, HttpMethod, AuthType } from '@/types/flow-nodes';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'oauth2', label: 'OAuth 2.0' },
];

interface APIConnectorNodeFormProps {
  data: FlowNodeData;
}

export function APIConnectorNodeForm({ data }: APIConnectorNodeFormProps) {
  const nodeData = data as APIConnectorNodeData;
  const { updateFormData } = useNodeSettings();

  return (
    <div className="space-y-6">
      <FormSection title="기본 설정">
        <FormField label="노드 이름" htmlFor="label" required>
          <Input
            id="label"
            value={nodeData.label}
            onChange={(e) => updateFormData({ label: e.target.value })}
            placeholder="API 호출"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection title="요청 설정">
        <div className="grid grid-cols-4 gap-3">
          <FormField label="Method">
            <Select
              value={nodeData.method}
              onValueChange={(value) =>
                updateFormData({ method: value as HttpMethod })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="col-span-3">
            <FormField label="URL" required>
              <Input
                value={nodeData.url}
                onChange={(e) => updateFormData({ url: e.target.value })}
                placeholder="https://api.example.com/endpoint"
                className="font-mono text-sm"
              />
            </FormField>
          </div>
        </div>

        <FormField
          label="Headers"
          description="JSON 형식으로 입력합니다."
        >
          <Textarea
            value={JSON.stringify(nodeData.headers, null, 2)}
            onChange={(e) => {
              try {
                const headers = JSON.parse(e.target.value);
                updateFormData({ headers });
              } catch {
                // JSON 파싱 실패 시 무시
              }
            }}
            placeholder='{"Content-Type": "application/json"}'
            rows={3}
            className="font-mono text-sm"
          />
        </FormField>

        {nodeData.method !== 'GET' && (
          <FormField
            label="Request Body"
            description="요청 본문. 변수 사용 가능: {{session.userId}}"
          >
            <Textarea
              value={nodeData.body || ''}
              onChange={(e) => updateFormData({ body: e.target.value })}
              placeholder='{"userId": "{{session.userId}}"}'
              rows={5}
              className="font-mono text-sm"
            />
          </FormField>
        )}
      </FormSection>

      <FormDivider />

      <FormSection title="인증 설정">
        <FormField label="인증 방식">
          <Select
            value={nodeData.auth.type}
            onValueChange={(value) =>
              updateFormData({
                auth: { ...nodeData.auth, type: value as AuthType },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTH_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {nodeData.auth.type === 'api_key' && (
          <>
            <FormField label="Header 이름">
              <Input
                value={nodeData.auth.headerName || ''}
                onChange={(e) =>
                  updateFormData({
                    auth: { ...nodeData.auth, headerName: e.target.value },
                  })
                }
                placeholder="X-API-Key"
              />
            </FormField>
            <FormField label="API Key">
              <Input
                type="password"
                value={nodeData.auth.apiKey || ''}
                onChange={(e) =>
                  updateFormData({
                    auth: { ...nodeData.auth, apiKey: e.target.value },
                  })
                }
                placeholder="your-api-key"
              />
            </FormField>
          </>
        )}

        {nodeData.auth.type === 'bearer' && (
          <FormField label="Bearer Token">
            <Input
              type="password"
              value={nodeData.auth.token || ''}
              onChange={(e) =>
                updateFormData({
                  auth: { ...nodeData.auth, token: e.target.value },
                })
              }
              placeholder="your-bearer-token"
            />
          </FormField>
        )}

        {nodeData.auth.type === 'basic' && (
          <>
            <FormField label="사용자명">
              <Input
                value={nodeData.auth.username || ''}
                onChange={(e) =>
                  updateFormData({
                    auth: { ...nodeData.auth, username: e.target.value },
                  })
                }
                placeholder="username"
              />
            </FormField>
            <FormField label="비밀번호">
              <Input
                type="password"
                value={nodeData.auth.password || ''}
                onChange={(e) =>
                  updateFormData({
                    auth: { ...nodeData.auth, password: e.target.value },
                  })
                }
                placeholder="password"
              />
            </FormField>
          </>
        )}
      </FormSection>

      <FormDivider />

      <FormSection title="재시도 정책">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="최대 재시도 횟수">
            <Input
              type="number"
              min={0}
              max={10}
              value={nodeData.retryPolicy.maxRetries}
              onChange={(e) =>
                updateFormData({
                  retryPolicy: {
                    ...nodeData.retryPolicy,
                    maxRetries: parseInt(e.target.value) || 0,
                  },
                })
              }
            />
          </FormField>
          <FormField label="재시도 간격 (ms)">
            <Input
              type="number"
              min={0}
              step={100}
              value={nodeData.retryPolicy.retryDelay}
              onChange={(e) =>
                updateFormData({
                  retryPolicy: {
                    ...nodeData.retryPolicy,
                    retryDelay: parseInt(e.target.value) || 0,
                  },
                })
              }
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  );
}
