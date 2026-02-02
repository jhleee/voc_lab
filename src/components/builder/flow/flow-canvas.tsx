'use client';

import { useCallback, useEffect, useState } from 'react';
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
import type { Connection, NodeChange, EdgeChange, Node, Edge, IsValidConnection } from '@xyflow/react';
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
import { ValidationPanel } from './validation-panel';
import { useNodeSettings } from '@/hooks/use-node-settings';
import { useFlowStore } from '@/hooks/use-flow-store';
import {
  getNodesByCategory,
  CATEGORY_LABELS,
} from '@/lib/node-registry';
import { isValidConnection, validateConnection } from '@/lib/edge-validator';
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

interface FlowCanvasProps {
  projectId: string;
}

export function FlowCanvas({ projectId }: FlowCanvasProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Flow store state and actions
  const {
    nodes,
    edges,
    flowId,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
    setNodes,
    setEdges,
    addNode: storeAddNode,
    selectNode,
    initializeFlow,
    loadFlow,
  } = useFlowStore();

  const { open: openSettings } = useNodeSettings();

  // Initialize flow on mount
  useEffect(() => {
    const initFlow = async () => {
      if (isInitialized) return;

      try {
        // 프로젝트의 플로우 목록 조회
        const response = await fetch(`/api/projects/${projectId}/flows`);
        const flows = await response.json();

        if (flows.length > 0) {
          // 첫 번째 플로우 로드
          await loadFlow(projectId, flows[0].id);
        } else {
          // 새 플로우 생성
          const createResponse = await fetch(`/api/projects/${projectId}/flows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '새 플로우' }),
          });
          const newFlow = await createResponse.json();
          await loadFlow(projectId, newFlow.id);
        }
      } catch (error) {
        console.error('Failed to initialize flow:', error);
        // 폴백: 로컬 초기화
        initializeFlow({
          projectId,
          flowId: 'local-flow',
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
      } finally {
        setIsInitialized(true);
      }
    };

    initFlow();
  }, [projectId, isInitialized, loadFlow, initializeFlow]);

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

  // Handle new connections with validation
  const onConnect = useCallback(
    (params: Connection) => {
      const validation = validateConnection(params, nodes, edges);
      if (validation.valid) {
        setEdges(addEdge(params, edges));
      }
      // 유효하지 않은 연결은 무시됨
    },
    [nodes, edges, setEdges]
  );

  // Connection validation for visual feedback
  const checkIsValidConnection: IsValidConnection<Edge> = useCallback(
    (connection) => {
      // ReactFlow may pass either Edge or Connection
      const conn: Connection = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      };
      return isValidConnection(conn, nodes, edges);
    },
    [nodes, edges]
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

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">플로우 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
        isValidConnection={checkIsValidConnection}
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
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border text-sm flex items-center gap-3">
            <span className="text-muted-foreground">
              노드: {nodes.length} | 연결: {edges.length}
            </span>
            <span className="text-muted-foreground">|</span>
            {isSaving ? (
              <span className="text-blue-500 flex items-center gap-1">
                <span className="animate-pulse">●</span> 저장 중...
              </span>
            ) : isDirty ? (
              <span className="text-orange-500">● 변경됨</span>
            ) : (
              <span className="text-green-500">✓ 저장됨</span>
            )}
          </div>
        </Panel>

        {/* Validation Panel */}
        <Panel position="bottom-left" className="m-4 w-80">
          <ValidationPanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}
