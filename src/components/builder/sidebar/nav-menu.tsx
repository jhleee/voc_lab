'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { GitBranch, FileText, MessageSquare, History } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Flow',
    icon: GitBranch,
    href: 'flow',
    description: '대화 흐름 설계',
  },
  {
    title: 'Docs',
    icon: FileText,
    href: 'docs',
    description: '참조 문서 관리',
  },
  {
    title: 'Prompt',
    icon: MessageSquare,
    href: 'prompt',
    description: '시스템 프롬프트 편집',
  },
  {
    title: 'Sessions',
    icon: History,
    href: 'sessions',
    description: '대화 기록 조회',
  },
];

export function NavMenu() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  if (!projectId) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>메뉴</SidebarGroupLabel>
      <SidebarMenu>
        {menuItems.map((item) => {
          const href = `/project/${projectId}/${item.href}`;
          const isActive = pathname === href;

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.description}>
                <Link href={href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
