'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronsUpDown, Plus, FolderKanban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { mockProjects } from '@/lib/mock-data';
import type { Project } from '@/types';

interface ProjectSwitcherProps {
  onProjectCreate?: () => void;
}

export function ProjectSwitcher({ onProjectCreate }: ProjectSwitcherProps) {
  const router = useRouter();
  const params = useParams();
  const [projects] = useState<Project[]>(mockProjects);

  const currentProject = projects.find((p) => p.id === params.projectId);

  const handleProjectSelect = (project: Project) => {
    router.push(`/project/${project.id}/flow`);
  };

  const handleCreateProject = () => {
    // TODO: Implement project creation modal/flow
    if (onProjectCreate) {
      onProjectCreate();
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <FolderKanban className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentProject?.name ?? '프로젝트 선택'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentProject ? '활성 프로젝트' : '프로젝트가 없습니다'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              프로젝트
            </DropdownMenuLabel>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <FolderKanban className="size-4 shrink-0" />
                </div>
                {project.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateProject} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                새 프로젝트 만들기
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
