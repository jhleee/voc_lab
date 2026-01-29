'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

type MessageNodeData = {
  label: string;
  content?: string;
};

type MessageNodeType = Node<MessageNodeData, 'message'>;

function MessageNodeComponent({ data }: NodeProps<MessageNodeType>) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-background border-2 border-border min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">{data.label}</span>
      </div>
      {data.content && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {data.content}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400"
      />
    </div>
  );
}

export const MessageNode = memo(MessageNodeComponent);
