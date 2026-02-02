'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import { BaseNode } from './base-node';
import type { RAGSearchNodeData, FlowNode } from '@/types/flow-nodes';

function RAGSearchNodeComponent({ data, selected }: NodeProps<FlowNode>) {
  const nodeData = data as RAGSearchNodeData;

  return (
    <BaseNode data={nodeData} selected={selected}>
      <div className="space-y-1 text-xs text-muted-foreground">
        {nodeData.documentSetId ? (
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span className="truncate max-w-[120px]">
              {nodeData.documentSetId}
            </span>
          </div>
        ) : (
          <p>문서셋을 선택하세요</p>
        )}
        <div className="flex gap-2">
          <span>Top-K: {nodeData.topK}</span>
          <span>임계값: {(nodeData.similarityThreshold * 100).toFixed(0)}%</span>
        </div>
      </div>
    </BaseNode>
  );
}

export const RAGSearchNode = memo(RAGSearchNodeComponent);
