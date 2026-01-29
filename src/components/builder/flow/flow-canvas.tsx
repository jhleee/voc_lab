'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StartNode } from './nodes/start-node';
import { MessageNode } from './nodes/message-node';

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
};

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: '시작' },
  },
  {
    id: 'message-1',
    type: 'message',
    position: { x: 200, y: 150 },
    data: { label: '인사 메시지', content: '안녕하세요! 무엇을 도와드릴까요?' },
  },
  {
    id: 'message-2',
    type: 'message',
    position: { x: 200, y: 280 },
    data: { label: '옵션 안내', content: '1. 주문 조회\n2. 환불 문의\n3. 기타 문의' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'start-1', target: 'message-1', animated: true },
  { id: 'e2-3', source: 'message-1', target: 'message-2' },
];

export function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(3);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addMessageNode = useCallback(() => {
    // TODO: Implement node creation with modal for content input
    const newNode: Node = {
      id: `message-${nodeIdCounter}`,
      type: 'message',
      position: { x: 200 + Math.random() * 100, y: 350 + Math.random() * 100 },
      data: { label: `메시지 ${nodeIdCounter}`, content: '새 메시지 내용...' },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
  }, [nodeIdCounter, setNodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/20"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <Panel position="top-left" className="m-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                노드 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={addMessageNode}>
                <MessageSquare className="h-4 w-4 mr-2" />
                메시지 노드
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Panel>
      </ReactFlow>
    </div>
  );
}
