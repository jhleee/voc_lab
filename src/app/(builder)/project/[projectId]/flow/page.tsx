'use client';

import { use } from 'react';
import { FlowCanvas } from '@/components/builder/flow/flow-canvas';

interface FlowPageProps {
  params: Promise<{ projectId: string }>;
}

export default function FlowPage({ params }: FlowPageProps) {
  const { projectId } = use(params);

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <FlowCanvas projectId={projectId} />
    </div>
  );
}
