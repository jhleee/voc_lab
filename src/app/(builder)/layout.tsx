'use client';

import { MessageCircle } from 'lucide-react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/builder/sidebar/app-sidebar';
import { ChatDrawer } from '@/components/builder/chat-drawer/chat-drawer';
import { useChatDrawer } from '@/hooks/use-chat-drawer';

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggle } = useChatDrawer();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggle}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>챗봇 테스트</p>
              </TooltipContent>
            </Tooltip>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
        <ChatDrawer />
      </SidebarProvider>
    </TooltipProvider>
  );
}
