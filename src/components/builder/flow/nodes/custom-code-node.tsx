'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './base-node';
import type { CustomCodeNodeData, FlowNode } from '@/types/flow-nodes';

function CustomCodeNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as CustomCodeNodeData;
  const codePreview = nodeData.code?.split('\n').slice(0, 3).join('\n') || '';

  return (
    <BaseNode data={nodeData} selected={selected} className="min-w-[200px]">
      <div className="space-y-1">
        {codePreview && (
          <pre className="text-[10px] text-muted-foreground font-mono bg-muted/50 p-1 rounded line-clamp-3 overflow-hidden">
            {codePreview}
          </pre>
        )}
        <div className="text-xs text-muted-foreground">
          타임아웃: {nodeData.timeout / 1000}초
        </div>
      </div>
    </BaseNode>
  );
}

export const CustomCodeNode = memo(CustomCodeNodeComponent);
