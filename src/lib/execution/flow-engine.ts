// =============================================================================
// Flow Execution Engine
// =============================================================================
// 플로우 실행 엔진 - 턴 기반 실행 루프
// =============================================================================

import type { Node, Edge } from '@xyflow/react';
import type {
  Session,
  SessionStore,
  ExecutionContext,
  ExecutionResult,
  NodeExecutionRecord,
  SessionMessage,
} from '@/types/session';
import type { FlowNodeData, FlowNodeType } from '@/types/flow-nodes';
import {
  MAX_NODE_VISITS_PER_TURN,
  MAX_TOTAL_NODES_PER_TURN,
} from '@/types/session';
import { getNodeExecutor } from './node-executor';

// SessionManager type - only used for optional server-side persistence
// The actual class should only be imported in server code
interface SessionManager {
  endSession(sessionId: string, summary?: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FlowDefinition {
  id: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

export interface TurnResult {
  success: boolean;
  messages: SessionMessage[];
  sessionStatus: Session['status'];
  currentNodeId: string | null;
  error?: string;
}

export interface TriggerInput {
  type: 'user_message' | 'api_call' | 'timeout' | 'approval';
  payload?: {
    message?: string;
    approved?: boolean;
    rejectReason?: string;
    data?: unknown;
  };
}

// -----------------------------------------------------------------------------
// Flow Engine
// -----------------------------------------------------------------------------

export class FlowEngine {
  private flow: FlowDefinition;
  private sessionStore: SessionStore;
  private sessionManager?: SessionManager;

  constructor(flow: FlowDefinition, sessionStore: SessionStore) {
    this.flow = flow;
    this.sessionStore = sessionStore;
    // Check if the store is a SessionManager for extended functionality
    if ('endSession' in sessionStore) {
      this.sessionManager = sessionStore as unknown as SessionManager;
    }
  }

  // ---------------------------------------------------------------------------
  // Start a new session
  // ---------------------------------------------------------------------------

  async startSession(projectId: string): Promise<Session> {
    // Find start node
    const startNode = this.flow.nodes.find((n) => n.type === 'start');
    if (!startNode) {
      throw new Error('Flow has no start node');
    }

    const session = await this.sessionStore.create({
      projectId,
      flowId: this.flow.id,
      startNodeId: startNode.id,
    });

    return session;
  }

  // ---------------------------------------------------------------------------
  // Execute a turn
  // ---------------------------------------------------------------------------

  async executeTurn(
    sessionId: string,
    trigger: TriggerInput
  ): Promise<TurnResult> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      return {
        success: false,
        messages: [],
        sessionStatus: 'ERROR',
        currentNodeId: null,
        error: 'Session not found',
      };
    }

    // Reset turn counters
    let updatedSession = await this.sessionStore.update(sessionId, {
      status: 'ACTIVE',
      turnNodeCount: 0,
      nodeVisitCounts: {},
    });

    // Process user message if provided
    if (trigger.type === 'user_message' && trigger.payload?.message) {
      updatedSession = await this.sessionStore.update(sessionId, {
        messages: [
          ...updatedSession.messages,
          {
            id: `msg_${Date.now()}`,
            direction: 'inbound',
            content: trigger.payload.message,
            contentType: 'text',
            createdAt: new Date().toISOString(),
          },
        ],
        variables: {
          ...updatedSession.variables,
          session: {
            ...updatedSession.variables.session,
            lastUserInput: trigger.payload.message,
          },
        },
      });
    }

    const collectedMessages: SessionMessage[] = [];
    let currentNodeId = updatedSession.currentNodeId;

    // Execute nodes until blocking or end
    while (currentNodeId) {
      const node = this.flow.nodes.find((n) => n.id === currentNodeId);
      if (!node) {
        return {
          success: false,
          messages: collectedMessages,
          sessionStatus: 'ERROR',
          currentNodeId,
          error: `Node not found: ${currentNodeId}`,
        };
      }

      // Check loop prevention
      const loopCheck = this.checkLoopPrevention(updatedSession, currentNodeId);
      if (!loopCheck.allowed) {
        return {
          success: false,
          messages: collectedMessages,
          sessionStatus: 'ERROR',
          currentNodeId,
          error: loopCheck.reason,
        };
      }

      // Update visit counts
      updatedSession = await this.sessionStore.update(sessionId, {
        turnNodeCount: updatedSession.turnNodeCount + 1,
        nodeVisitCounts: {
          ...updatedSession.nodeVisitCounts,
          [currentNodeId]: (updatedSession.nodeVisitCounts[currentNodeId] || 0) + 1,
        },
      });

      // Create execution context
      const context: ExecutionContext = {
        session: updatedSession,
        currentNode: {
          id: node.id,
          type: node.type || 'unknown',
          data: node.data,
        },
        trigger,
      };

      // Execute node
      const executor = getNodeExecutor(node.type as FlowNodeType);
      const startTime = new Date().toISOString();
      let result: ExecutionResult;

      try {
        result = await executor.execute(context);
      } catch (error) {
        result = {
          type: 'error',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }

      // Record execution
      const executionRecord: NodeExecutionRecord = {
        nodeId: currentNodeId,
        nodeType: node.type || 'unknown',
        startedAt: startTime,
        endedAt: new Date().toISOString(),
        status: result.type === 'error' ? 'error' : 'success',
        output: result.output,
        error: result.error?.message,
      };

      // Update session with execution record
      updatedSession = await this.sessionStore.update(sessionId, {
        executionHistory: [...updatedSession.executionHistory, executionRecord],
        variables: {
          ...updatedSession.variables,
          nodes: {
            ...updatedSession.variables.nodes,
            [currentNodeId]: {
              nodeId: currentNodeId,
              nodeLabel: node.data?.label || currentNodeId,
              nodeType: node.type || 'unknown',
              output: result.output as import('@/types/variables').VariableValue,
              executedAt: new Date().toISOString(),
              success: result.type !== 'error',
              error: result.error?.message,
            },
          },
          ...(result.variableUpdates || {}),
        },
      });

      // Collect messages
      if (result.messages) {
        collectedMessages.push(...result.messages);
        updatedSession = await this.sessionStore.update(sessionId, {
          messages: [...updatedSession.messages, ...result.messages],
        });
      }

      // Handle result
      switch (result.type) {
        case 'end':
          await this.sessionStore.update(sessionId, {
            status: 'COMPLETED',
            currentNodeId: null,
          });
          // Persist session if manager available
          if (this.sessionManager) {
            try {
              await this.sessionManager.endSession(sessionId);
            } catch (e) {
              console.error('Failed to persist session:', e);
            }
          }
          return {
            success: true,
            messages: collectedMessages,
            sessionStatus: 'COMPLETED',
            currentNodeId: null,
          };

        case 'wait':
          await this.sessionStore.update(sessionId, {
            status: 'WAITING_INPUT',
            currentNodeId,
          });
          return {
            success: true,
            messages: collectedMessages,
            sessionStatus: 'WAITING_INPUT',
            currentNodeId,
          };

        case 'error':
          await this.sessionStore.update(sessionId, {
            status: 'ERROR',
            currentNodeId,
          });
          return {
            success: false,
            messages: collectedMessages,
            sessionStatus: 'ERROR',
            currentNodeId,
            error: result.error?.message,
          };

        case 'continue':
          // Find next node
          const nextNodeId = this.findNextNode(
            currentNodeId,
            node.type as FlowNodeType,
            result.output
          );

          if (!nextNodeId) {
            // No next node - treat as end
            await this.sessionStore.update(sessionId, {
              status: 'COMPLETED',
              currentNodeId: null,
            });
            // Persist session if manager available
            if (this.sessionManager) {
              try {
                await this.sessionManager.endSession(sessionId);
              } catch (e) {
                console.error('Failed to persist session:', e);
              }
            }
            return {
              success: true,
              messages: collectedMessages,
              sessionStatus: 'COMPLETED',
              currentNodeId: null,
            };
          }

          currentNodeId = nextNodeId;
          await this.sessionStore.update(sessionId, {
            currentNodeId: nextNodeId,
          });
          break;
      }
    }

    // Should not reach here
    return {
      success: true,
      messages: collectedMessages,
      sessionStatus: updatedSession.status,
      currentNodeId,
    };
  }

  // ---------------------------------------------------------------------------
  // Find next node based on edges
  // ---------------------------------------------------------------------------

  private findNextNode(
    currentNodeId: string,
    nodeType: FlowNodeType,
    output: unknown
  ): string | null {
    // Get outgoing edges from current node
    const outgoingEdges = this.flow.edges.filter(
      (e) => e.source === currentNodeId
    );

    if (outgoingEdges.length === 0) {
      return null;
    }

    // For condition nodes, select based on output
    if (nodeType === 'condition') {
      const outputData = output as { selectedConditionId?: string; isDefault?: boolean };

      if (outputData.selectedConditionId) {
        // Find edge with matching sourceHandle
        const matchingEdge = outgoingEdges.find(
          (e) => e.sourceHandle === outputData.selectedConditionId
        );
        if (matchingEdge) {
          return matchingEdge.target;
        }
      }

      // Default edge (no sourceHandle or 'default')
      const defaultEdge = outgoingEdges.find(
        (e) => !e.sourceHandle || e.sourceHandle === 'default'
      );
      return defaultEdge?.target || outgoingEdges[0]?.target || null;
    }

    // For intent classifier, select based on intent
    if (nodeType === 'intent_classifier') {
      const outputData = output as { intentId?: string };

      if (outputData.intentId) {
        const matchingEdge = outgoingEdges.find(
          (e) => e.sourceHandle === outputData.intentId
        );
        if (matchingEdge) {
          return matchingEdge.target;
        }
      }

      // Default edge
      const defaultEdge = outgoingEdges.find(
        (e) => !e.sourceHandle || e.sourceHandle === 'default'
      );
      return defaultEdge?.target || outgoingEdges[0]?.target || null;
    }

    // For other nodes, take the first edge
    return outgoingEdges[0]?.target || null;
  }

  // ---------------------------------------------------------------------------
  // Loop prevention
  // ---------------------------------------------------------------------------

  private checkLoopPrevention(
    session: Session,
    nodeId: string
  ): { allowed: boolean; reason?: string } {
    // Check total nodes in turn
    if (session.turnNodeCount >= MAX_TOTAL_NODES_PER_TURN) {
      return {
        allowed: false,
        reason: `턴당 최대 노드 실행 횟수(${MAX_TOTAL_NODES_PER_TURN})를 초과했습니다.`,
      };
    }

    // Check same node visits
    const nodeVisits = session.nodeVisitCounts[nodeId] || 0;
    if (nodeVisits >= MAX_NODE_VISITS_PER_TURN) {
      return {
        allowed: false,
        reason: `동일 노드 최대 실행 횟수(${MAX_NODE_VISITS_PER_TURN})를 초과했습니다.`,
      };
    }

    return { allowed: true };
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  getFlow(): FlowDefinition {
    return this.flow;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionStore.get(sessionId);
  }
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

export function createFlowEngine(
  flow: FlowDefinition,
  sessionStore: SessionStore
): FlowEngine {
  return new FlowEngine(flow, sessionStore);
}
