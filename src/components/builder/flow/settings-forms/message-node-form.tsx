'use client';

import { useState } from 'react';
import { useNodeSettings } from '@/hooks/use-node-settings';
import { FormSection, FormField, FormDivider } from './form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { FlowNodeData, MessageNodeData, MessageItem, MessageType } from '@/types/flow-nodes';

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: 'text', label: '텍스트' },
  { value: 'image', label: '이미지' },
  { value: 'button', label: '버튼' },
  { value: 'card', label: '카드' },
  { value: 'carousel', label: '캐러셀' },
  { value: 'link', label: '링크' },
];

interface MessageNodeFormProps {
  data: FlowNodeData;
}

export function MessageNodeForm({ data }: MessageNodeFormProps) {
  const nodeData = data as MessageNodeData;
  const { updateFormData } = useNodeSettings();

  const messages = nodeData.messages || [];

  const addMessage = () => {
    const newMessage: MessageItem = {
      id: `msg_${Date.now()}`,
      type: 'text',
      content: '',
    };
    updateFormData({
      messages: [...messages, newMessage],
    });
  };

  const updateMessage = (index: number, updates: Partial<MessageItem>) => {
    const newMessages = messages.map((msg, i) =>
      i === index ? { ...msg, ...updates } : msg
    );
    updateFormData({ messages: newMessages });
  };

  const deleteMessage = (index: number) => {
    updateFormData({
      messages: messages.filter((_, i) => i !== index),
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
            placeholder="메시지"
          />
        </FormField>
      </FormSection>

      <FormDivider />

      <FormSection
        title="메시지 목록"
        description="순차적으로 출력할 메시지들을 설정합니다."
      >
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="p-4 border rounded-lg bg-muted/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm font-medium">메시지 {index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteMessage(index)}
                  disabled={messages.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="메시지 타입">
                  <Select
                    value={message.type}
                    onValueChange={(value) =>
                      updateMessage(index, { type: value as MessageType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESSAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="내용">
                <Textarea
                  value={message.content}
                  onChange={(e) =>
                    updateMessage(index, { content: e.target.value })
                  }
                  placeholder="메시지 내용을 입력하세요. 변수: {{session.userName}}"
                  rows={3}
                />
              </FormField>

              {message.type === 'image' && (
                <FormField label="이미지 URL">
                  <Input
                    value={message.imageUrl || ''}
                    onChange={(e) =>
                      updateMessage(index, { imageUrl: e.target.value })
                    }
                    placeholder="https://example.com/image.png"
                  />
                </FormField>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={addMessage}
          >
            <Plus className="h-4 w-4 mr-2" />
            메시지 추가
          </Button>
        </div>
      </FormSection>

      <FormDivider />

      <FormSection title="응답 설정">
        <div className="flex items-center justify-between">
          <Label htmlFor="waitForResponse" className="flex flex-col gap-1">
            <span className="text-sm font-medium">사용자 응답 대기</span>
            <span className="text-xs text-muted-foreground font-normal">
              활성화하면 사용자 입력을 기다립니다. (Blocking)
            </span>
          </Label>
          <Switch
            id="waitForResponse"
            checked={nodeData.waitForResponse}
            onCheckedChange={(checked) =>
              updateFormData({ waitForResponse: checked })
            }
          />
        </div>

        {nodeData.waitForResponse && (
          <FormField
            label="타임아웃 (초)"
            description="응답 대기 시간. 0은 무제한입니다."
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
        )}
      </FormSection>
    </div>
  );
}
