'use client';

import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  Square,
  MessageSquare,
  AlertTriangle,
  Brain,
  Search,
  GitBranch,
  GitFork,
  GitMerge,
  Globe,
  Code,
  UserPlus,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNodeMetadata, CATEGORY_COLORS } from '@/lib/node-registry';
import type { FlowNodeData, NodeHandleConfig, FlowNodeType } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Icon Map
// -----------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Play,
  Square,
  MessageSquare,
  AlertTriangle,
  Brain,
  Search,
  GitBranch,
  GitFork,
  GitMerge,
  Globe,
  Code,
  UserPlus,
  CheckCircle,
};

// -----------------------------------------------------------------------------
// Position Map
// -----------------------------------------------------------------------------

const POSITION_MAP: Record<string, Position> = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
};

// -----------------------------------------------------------------------------
// Base Node Props
// -----------------------------------------------------------------------------

interface BaseNodeProps {
  data: FlowNodeData;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
}

// -----------------------------------------------------------------------------
// Base Node Component
// -----------------------------------------------------------------------------

function BaseNodeComponent({ data, selected, children, className }: BaseNodeProps) {
  const metadata = getNodeMetadata(data.type as FlowNodeType);

  if (!metadata) {
    return (
      <div className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg">
        <span className="text-sm text-gray-500">Unknown node type</span>
      </div>
    );
  }

  const Icon = ICON_MAP[metadata.icon] || Circle;
  const handles = metadata.getHandles(data);
  const categoryColors = CATEGORY_COLORS[metadata.category];

  return (
    <div
      className={cn(
        'relative px-4 py-3 shadow-md rounded-lg border-2 min-w-[180px] transition-all',
        categoryColors.bg,
        categoryColors.border,
        selected && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {/* Render Handles */}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={POSITION_MAP[handle.position]}
          className={cn(
            'w-3 h-3 !border-2',
            handle.type === 'source' ? '!bg-white !border-gray-400' : '!bg-gray-400 !border-gray-500'
          )}
          style={
            handle.offsetPercent !== undefined
              ? {
                  left: handle.position === 'top' || handle.position === 'bottom'
                    ? `${handle.offsetPercent}%`
                    : undefined,
                  top: handle.position === 'left' || handle.position === 'right'
                    ? `${handle.offsetPercent}%`
                    : undefined,
                }
              : undefined
          }
        />
      ))}

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4 shrink-0', categoryColors.text)} />
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>

      {/* Node Content */}
      {children}

      {/* Node Description */}
      {data.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {data.description}
        </p>
      )}

      {/* Handle Labels */}
      {handles
        .filter((h) => h.label && h.position === 'bottom')
        .map((handle) => (
          <div
            key={`label-${handle.id}`}
            className="absolute text-[10px] text-muted-foreground whitespace-nowrap"
            style={{
              bottom: -18,
              left: handle.offsetPercent !== undefined ? `${handle.offsetPercent}%` : '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {handle.label}
          </div>
        ))}
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
