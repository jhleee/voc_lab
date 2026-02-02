import { ProjectDashboard } from '@/components/builder/dashboard/project-dashboard';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  return <ProjectDashboard projectId={projectId} />;
}
