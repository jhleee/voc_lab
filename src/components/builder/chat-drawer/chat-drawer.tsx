'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatInput } from './chat-input';
import { useChatDrawer } from '@/hooks/use-chat-drawer';
import { mockChatMessages } from '@/lib/mock-data';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

export function ChatDrawer() {
  const { isOpen, close } = useChatDrawer();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // TODO: Implement actual chat API call
    // Simulating response delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add mock assistant response
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `"${content}"에 대해 답변드리겠습니다. 이것은 테스트 응답입니다.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>챗봇 테스트</SheetTitle>
            <Button variant="ghost" size="icon" onClick={close}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">입력 중...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </SheetContent>
    </Sheet>
  );
}
