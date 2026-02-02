// =============================================================================
// Node Components Export
// =============================================================================

import { StartNode } from './start-node';
import { EndNode } from './end-node';
import { MessageNode } from './message-node';
import { ErrorFallbackNode } from './error-fallback-node';
import { IntentClassifierNode } from './intent-classifier-node';
import { RAGSearchNode } from './rag-search-node';
import { ConditionNode } from './condition-node';
import { ParallelNode } from './parallel-node';
import { JoinNode } from './join-node';
import { APIConnectorNode } from './api-connector-node';
import { CustomCodeNode } from './custom-code-node';
import { EscalationNode } from './escalation-node';
import { ApprovalNode } from './approval-node';

// Re-export individual components
export {
  StartNode,
  EndNode,
  MessageNode,
  ErrorFallbackNode,
  IntentClassifierNode,
  RAGSearchNode,
  ConditionNode,
  ParallelNode,
  JoinNode,
  APIConnectorNode,
  CustomCodeNode,
  EscalationNode,
  ApprovalNode,
};

export { BaseNode } from './base-node';

// Node types map for ReactFlow
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  message: MessageNode,
  error_fallback: ErrorFallbackNode,
  intent_classifier: IntentClassifierNode,
  rag_search: RAGSearchNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  join: JoinNode,
  api_connector: APIConnectorNode,
  custom_code: CustomCodeNode,
  escalation: EscalationNode,
  approval: ApprovalNode,
} as const;
