'use client';

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { nodeTypes } from './nodes';
import { NodeSettingsPanel } from './node-settings-panel';
import { useNodeSettings } from '@/hooks/use-node-settings';
import { useFlowStore } from '@/hooks/use-flow-store';
import {
  getNodesByCategory,
  CATEGORY_LABELS,
} from '@/lib/node-registry';
import type { FlowNodeType, FlowNodeData } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Icon Map
// -----------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Play: LucideIcons.Play,
  Square: LucideIcons.Square,
  MessageSquare: LucideIcons.MessageSquare,
  AlertTriangle: LucideIcons.AlertTriangle,
  Brain: LucideIcons.Brain,
  Search: LucideIcons.Search,
  GitBranch: LucideIcons.GitBranch,
  GitFork: LucideIcons.GitFork,
  GitMerge: LucideIcons.GitMerge,
  Globe: LucideIcons.Globe,
  Code: LucideIcons.Code,
  UserPlus: LucideIcons.UserPlus,
  CheckCircle: LucideIcons.CheckCircle,
};

// -----------------------------------------------------------------------------
// Flow Canvas Component
// -----------------------------------------------------------------------------

export function FlowCanvas() {
  // Flow store state and actions
  const {
    nodes,
    edges,
    selectedNodeId,
    setNodes,
    setEdges,
    addNode: storeAddNode,
    selectNode,
    initializeFlow,
  } = useFlowStore();

  const { open: openSettings } = useNodeSettings();

  // Initialize flow on mount (if no nodes exist)
  useEffect(() => {
    if (nodes.length === 0) {
      initializeFlow({
        projectId: 'default-project',
        flowId: 'default-flow',
        flowName: '새 플로우',
        nodes: [{
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: {
            type: 'start',
            label: '시작',
            triggerType: 'user_message',
          } as FlowNodeData,
        }],
        edges: [],
      });
    }
  }, [initializeFlow, nodes.length]);

  // Handle node changes (drag, select, remove)
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<FlowNodeData>>[]) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  // Handle edge changes (select, remove)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges(addEdge(params, edges)),
    [edges, setEdges]
  );

  // Add new node
  const handleAddNode = useCallback(
    (type: FlowNodeType) => {
      storeAddNode(type);
    },
    [storeAddNode]
  );

  // Handle node click - open settings panel
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<FlowNodeData>) => {
      selectNode(node.id);
      const nodeType = node.type as FlowNodeType;
      openSettings(node.id, nodeType, node.data);
    },
    [selectNode, openSettings]
  );

  // Handle pane click - deselect node
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const categories = getNodesByCategory();

  return (
    <div className="h-full w-full">
      <NodeSettingsPanel />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/20"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />

        {/* Node Add Panel */}
        <Panel position="top-left" className="m-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                노드 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
              {Object.entries(categories).map(([category, catNodes], idx) => (
                <div key={category}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  </DropdownMenuLabel>
                  {catNodes.map((metadata) => {
                    const Icon = ICON_MAP[metadata.icon] || LucideIcons.Circle;
                    return (
                      <DropdownMenuItem
                        key={metadata.type}
                        onClick={() => handleAddNode(metadata.type)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {metadata.displayName}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Panel>

        {/* Status Panel */}
        <Panel position="top-right" className="m-4">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border text-sm">
            <span className="text-muted-foreground">
              노드: {nodes.length} | 연결: {edges.length}
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
