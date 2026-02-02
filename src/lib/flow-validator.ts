// =============================================================================
// Flow Validator
// =============================================================================
// 플로우 전체의 유효성을 검증합니다.
// - Start 노드 존재 확인
// - End/Escalation 도달 가능 경로 확인
// - 고립된 노드 감지
// - 필수 필드 검증
// =============================================================================

import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, FlowNodeType } from '@/types/flow-nodes';
import { getNodeMetadata } from './node-registry';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  nodeLabel?: string;
  field?: string;
}

export interface FlowValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    hasStartNode: boolean;
    hasEndNode: boolean;
    reachableNodeCount: number;
    orphanedNodeCount: number;
  };
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * 노드에서 도달 가능한 모든 노드 ID를 찾습니다 (BFS)
 */
function getReachableNodes(
  startNodeId: string,
  edges: Edge[]
): Set<string> {
  const reachable = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (reachable.has(currentId)) continue;
    reachable.add(currentId);

    // 이 노드에서 나가는 모든 엣지 찾기
    const outgoingEdges = edges.filter((e) => e.source === currentId);
    for (const edge of outgoingEdges) {
      if (!reachable.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return reachable;
}

/**
 * 노드가 종료 노드(end/escalation)에 도달할 수 있는지 확인합니다 (DFS)
 */
function canReachEndNode(
  nodeId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  visited: Set<string> = new Set()
): boolean {
  if (visited.has(nodeId)) return false;
  visited.add(nodeId);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return false;

  // 종료 노드에 도달
  if (node.type === 'end' || node.type === 'escalation') {
    return true;
  }

  // 나가는 엣지를 따라 탐색
  const outgoingEdges = edges.filter((e) => e.source === nodeId);

  // 나가는 엣지가 없는 비종료 노드는 막다른 길
  if (outgoingEdges.length === 0) {
    return false;
  }

  // 하나라도 종료 노드에 도달할 수 있으면 true
  for (const edge of outgoingEdges) {
    if (canReachEndNode(edge.target, nodes, edges, new Set(visited))) {
      return true;
    }
  }

  return false;
}

// -----------------------------------------------------------------------------
// Main Validation Function
// -----------------------------------------------------------------------------

/**
 * 플로우의 유효성을 검증합니다.
 */
export function validateFlow(
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): FlowValidationResult {
  const issues: ValidationIssue[] = [];
  let issueId = 0;
  const createIssue = (
    severity: ValidationSeverity,
    message: string,
    nodeId?: string,
    field?: string
  ): ValidationIssue => {
    const node = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
    return {
      id: `issue_${++issueId}`,
      severity,
      message,
      nodeId,
      nodeLabel: node?.data?.label,
      field,
    };
  };

  // ---------------------------------------------------------------------------
  // 1. Start 노드 확인
  // ---------------------------------------------------------------------------
  const startNodes = nodes.filter((n) => n.type === 'start');
  const hasStartNode = startNodes.length > 0;

  if (startNodes.length === 0) {
    issues.push(createIssue('error', '시작 노드가 없습니다. 플로우에는 반드시 시작 노드가 필요합니다.'));
  } else if (startNodes.length > 1) {
    issues.push(createIssue('warning', `시작 노드가 ${startNodes.length}개 있습니다. 일반적으로 하나만 필요합니다.`));
  }

  // ---------------------------------------------------------------------------
  // 2. End 노드 확인
  // ---------------------------------------------------------------------------
  const endNodes = nodes.filter((n) => n.type === 'end' || n.type === 'escalation');
  const hasEndNode = endNodes.length > 0;

  if (endNodes.length === 0) {
    issues.push(createIssue('warning', '종료 노드(End/Escalation)가 없습니다. 플로우가 정상 종료되지 않을 수 있습니다.'));
  }

  // ---------------------------------------------------------------------------
  // 3. 도달 가능성 분석
  // ---------------------------------------------------------------------------
  let reachableNodeIds = new Set<string>();

  if (startNodes.length > 0) {
    // 모든 Start 노드에서 도달 가능한 노드 수집
    for (const startNode of startNodes) {
      const reachableFromStart = getReachableNodes(startNode.id, edges);
      reachableFromStart.forEach((id) => reachableNodeIds.add(id));
    }

    // 고립된 노드 찾기
    const orphanedNodes = nodes.filter((n) => !reachableNodeIds.has(n.id));
    for (const orphan of orphanedNodes) {
      issues.push(
        createIssue(
          'warning',
          `'${orphan.data?.label || orphan.id}' 노드는 시작 노드에서 도달할 수 없습니다.`,
          orphan.id
        )
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 4. 종료 노드 도달 가능성 확인
  // ---------------------------------------------------------------------------
  if (hasStartNode && hasEndNode) {
    for (const startNode of startNodes) {
      if (!canReachEndNode(startNode.id, nodes, edges)) {
        issues.push(
          createIssue(
            'error',
            `'${startNode.data?.label || '시작'}' 노드에서 종료 노드로 도달할 수 없는 경로가 있습니다.`,
            startNode.id
          )
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. 막다른 길 노드 찾기 (출력이 없는 비종료 노드)
  // ---------------------------------------------------------------------------
  const terminalTypes: FlowNodeType[] = ['end', 'escalation'];

  for (const node of nodes) {
    if (terminalTypes.includes(node.type as FlowNodeType)) continue;
    if (!reachableNodeIds.has(node.id)) continue; // 이미 고립된 노드는 스킵

    const hasOutgoing = edges.some((e) => e.source === node.id);
    if (!hasOutgoing) {
      issues.push(
        createIssue(
          'warning',
          `'${node.data?.label || node.id}' 노드에서 나가는 연결이 없습니다.`,
          node.id
        )
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 6. 필수 필드 검증
  // ---------------------------------------------------------------------------
  for (const node of nodes) {
    const nodeData = node.data;
    const metadata = getNodeMetadata(node.type as FlowNodeType);

    // 라벨 검증
    if (!nodeData?.label || nodeData.label.trim() === '') {
      issues.push(
        createIssue(
          'warning',
          `'${metadata?.displayName || node.type}' 노드에 이름이 없습니다.`,
          node.id,
          'label'
        )
      );
    }

    // 타입별 추가 검증
    switch (node.type) {
      case 'message': {
        const msgData = nodeData as { messages?: unknown[] };
        if (!msgData.messages || msgData.messages.length === 0) {
          issues.push(
            createIssue('error', '메시지 노드에 메시지가 없습니다.', node.id, 'messages')
          );
        }
        break;
      }

      case 'condition': {
        const condData = nodeData as { conditions?: unknown[] };
        if (!condData.conditions || condData.conditions.length === 0) {
          issues.push(
            createIssue('warning', '조건 노드에 조건이 정의되지 않았습니다.', node.id, 'conditions')
          );
        }
        break;
      }

      case 'intent_classifier': {
        const intentData = nodeData as { intents?: unknown[] };
        if (!intentData.intents || intentData.intents.length === 0) {
          issues.push(
            createIssue('warning', '의도 분류 노드에 의도가 정의되지 않았습니다.', node.id, 'intents')
          );
        }
        break;
      }

      case 'api_connector': {
        const apiData = nodeData as { url?: string };
        if (!apiData.url || apiData.url.trim() === '') {
          issues.push(
            createIssue('error', 'API 커넥터 노드에 URL이 없습니다.', node.id, 'url')
          );
        }
        break;
      }

      case 'custom_code': {
        const codeData = nodeData as { code?: string };
        if (!codeData.code || codeData.code.trim() === '') {
          issues.push(
            createIssue('warning', '코드 실행 노드에 코드가 없습니다.', node.id, 'code')
          );
        }
        break;
      }

      case 'rag_search': {
        const ragData = nodeData as { knowledgeBases?: unknown[] };
        if (!ragData.knowledgeBases || ragData.knowledgeBases.length === 0) {
          issues.push(
            createIssue('warning', 'RAG 검색 노드에 지식 베이스가 선택되지 않았습니다.', node.id, 'knowledgeBases')
          );
        }
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 결과 생성
  // ---------------------------------------------------------------------------
  const hasErrors = issues.some((i) => i.severity === 'error');
  const orphanedNodeCount = nodes.length - reachableNodeIds.size;

  return {
    valid: !hasErrors,
    issues,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hasStartNode,
      hasEndNode,
      reachableNodeCount: reachableNodeIds.size,
      orphanedNodeCount,
    },
  };
}

// -----------------------------------------------------------------------------
// Issue Filtering Helpers
// -----------------------------------------------------------------------------

export function getErrorIssues(result: FlowValidationResult): ValidationIssue[] {
  return result.issues.filter((i) => i.severity === 'error');
}

export function getWarningIssues(result: FlowValidationResult): ValidationIssue[] {
  return result.issues.filter((i) => i.severity === 'warning');
}

export function getIssuesForNode(
  result: FlowValidationResult,
  nodeId: string
): ValidationIssue[] {
  return result.issues.filter((i) => i.nodeId === nodeId);
}
