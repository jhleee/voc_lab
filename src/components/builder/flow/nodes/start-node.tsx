'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Play } from 'lucide-react';

type StartNodeData = {
  label: string;
};

type StartNodeType = Node<StartNodeData, 'start'>;

function StartNodeComponent({ data }: NodeProps<StartNodeType>) {
  return (
    <div className="px-4 py-2 shadow-md rounded-full bg-green-500 text-white border-2 border-green-600">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-700"
      />
    </div>
  );
}

export const StartNode = memo(StartNodeComponent);
