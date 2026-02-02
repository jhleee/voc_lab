'use client';

// =============================================================================
// Flow Store
// =============================================================================
// 플로우 에디터 전역 상태 관리 (Zustand)
// - 노드/엣지 관리
// - 변수 시스템
// - 자동 저장
// =============================================================================

import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type {
  FlowVariables,
  VariableReference,
  AvailableVariable,
  VariableValidationError,
  SystemVariables,
  SessionVariables,
} from '@/types/variables';
import type { FlowNodeData, FlowNodeType } from '@/types/flow-nodes';
import { DEFAULT_FLOW_VARIABLES } from '@/types/variables';
import { createAutoSaveManager, type AutoSaveManager } from '@/lib/auto-save';
import {
  resolveVariableValue,
  validateVariableReferences,
  getAvailableVariables,
  interpolateVariables,
} from '@/lib/variable-resolver';
import { generateNodeId, createDefaultNodeData } from '@/lib/node-registry';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface SavePayload {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

export interface FlowState {
  // ---------------------------------------------------------------------------
  // Data State
  // ---------------------------------------------------------------------------
  projectId: string | null;
  flowId: string | null;
  flowName: string;
  flowVersion: number;
  isPublished: boolean;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  variables: FlowVariables;
  selectedNodeId: string | null;

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  currentExecutingNodeId: string | null;

  // ---------------------------------------------------------------------------
  // Flow Actions
  // ---------------------------------------------------------------------------
  initializeFlow: (params: {
    projectId: string;
    flowId: string;
    flowName: string;
    flowVersion?: number;
    isPublished?: boolean;
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
  }) => void;
  setFlowName: (name: string) => void;
  publishFlow: () => Promise<void>;
  unpublishFlow: () => Promise<void>;

  // ---------------------------------------------------------------------------
  // Node Actions
  // ---------------------------------------------------------------------------
  setNodes: (nodes: Node<FlowNodeData>[]) => void;
  addNode: (type: FlowNodeType, position?: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<Node<FlowNodeData>>) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // ---------------------------------------------------------------------------
  // Edge Actions
  // ---------------------------------------------------------------------------
  setEdges: (edges: Edge[]) => void;
  addEdge: (edge: Edge) => void;
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  deleteEdge: (edgeId: string) => void;

  // ---------------------------------------------------------------------------
  // Selection Actions
  // ---------------------------------------------------------------------------
  selectNode: (nodeId: string | null) => void;
  getSelectedNode: () => Node<FlowNodeData> | null;

  // ---------------------------------------------------------------------------
  // Execution State
  // ---------------------------------------------------------------------------
  setCurrentExecutingNode: (nodeId: string | null) => void;

  // ---------------------------------------------------------------------------
  // Variable Actions
  // ---------------------------------------------------------------------------
  setSystemVariable: (key: string, value: unknown) => void;
  setSessionVariable: (key: string, value: unknown) => void;
  setNodeOutput: (nodeId: string, output: unknown, nodeLabel?: string) => void;
  clearNodeOutputs: () => void;

  // ---------------------------------------------------------------------------
  // Variable Helpers
  // ---------------------------------------------------------------------------
  resolveVariable: (ref: VariableReference) => unknown;
  validateVariables: (text: string) => VariableValidationError[];
  interpolate: (text: string) => string;
  getAvailableVars: () => AvailableVariable[];

  // ---------------------------------------------------------------------------
  // Node Helpers
  // ---------------------------------------------------------------------------
  getNode: (nodeId: string) => Node<FlowNodeData> | undefined;
  getNodesByType: (type: FlowNodeType) => Node<FlowNodeData>[];

  // ---------------------------------------------------------------------------
  // Save/Load Actions
  // ---------------------------------------------------------------------------
  markDirty: () => void;
  saveFlow: () => Promise<void>;
  loadFlow: (projectId: string, flowId: string) => Promise<void>;

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  reset: () => void;
}

// -----------------------------------------------------------------------------
// Auto-Save Manager Instance
// -----------------------------------------------------------------------------

let autoSaveManager: AutoSaveManager<SavePayload> | null = null;

// -----------------------------------------------------------------------------
// Store Creation
// -----------------------------------------------------------------------------

export const useFlowStore = create<FlowState>((set, get) => ({
  // ---------------------------------------------------------------------------
  // Initial State
  // ---------------------------------------------------------------------------
  projectId: null,
  flowId: null,
  flowName: '',
  flowVersion: 1,
  isPublished: false,
  nodes: [],
  edges: [],
  variables: DEFAULT_FLOW_VARIABLES,
  selectedNodeId: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  lastSaved: null,
  saveError: null,
  currentExecutingNodeId: null,

  // ---------------------------------------------------------------------------
  // Flow Actions
  // ---------------------------------------------------------------------------
  initializeFlow: ({ projectId, flowId, flowName, flowVersion, isPublished, nodes, edges }) => {
    // 이전 자동 저장 취소
    autoSaveManager?.cancel();

    // 새 자동 저장 매니저 생성
    autoSaveManager = createAutoSaveManager<SavePayload>({
      delay: 500,
      onSave: async (data) => {
        await get().saveFlow();
      },
      onError: (error) => {
        set({ saveError: error.message });
      },
      onSuccess: () => {
        set({ saveError: null });
      },
      onSaveStart: () => {
        set({ isSaving: true });
      },
    });

    set({
      projectId,
      flowId,
      flowName,
      flowVersion: flowVersion ?? 1,
      isPublished: isPublished ?? false,
      nodes,
      edges,
      isDirty: false,
      lastSaved: new Date(),
      saveError: null,
      variables: {
        ...DEFAULT_FLOW_VARIABLES,
        system: {
          ...DEFAULT_FLOW_VARIABLES.system,
          projectId,
          botId: flowId,
        },
      },
    });
  },

  setFlowName: (name) => {
    set({ flowName: name });
    get().markDirty();
  },

  publishFlow: async () => {
    const state = get();
    if (!state.flowId || !state.projectId) return;

    try {
      const response = await fetch(
        `/api/projects/${state.projectId}/flows/${state.flowId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: true }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to publish flow');
      }

      set({ isPublished: true });
    } catch (error) {
      console.error('Failed to publish flow:', error);
      throw error;
    }
  },

  unpublishFlow: async () => {
    const state = get();
    if (!state.flowId || !state.projectId) return;

    try {
      const response = await fetch(
        `/api/projects/${state.projectId}/flows/${state.flowId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: false }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to unpublish flow');
      }

      set({ isPublished: false });
    } catch (error) {
      console.error('Failed to unpublish flow:', error);
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // Node Actions
  // ---------------------------------------------------------------------------
  setNodes: (nodes) => {
    set({ nodes });
    get().markDirty();
  },

  addNode: (type, position) => {
    const state = get();
    const newNode: Node<FlowNodeData> = {
      id: generateNodeId(type),
      type,
      position: position || {
        x: 250 + Math.random() * 100,
        y: 150 + state.nodes.length * 80,
      },
      data: createDefaultNodeData(type),
    };
    set({ nodes: [...state.nodes, newNode] });
    get().markDirty();
  },

  updateNode: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
    get().markDirty();
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as FlowNodeData }
          : node
      ),
    }));
    get().markDirty();
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
    get().markDirty();
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const newNode: Node<FlowNodeData> = {
      ...node,
      id: generateNodeId(node.type as FlowNodeType),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (복사본)`,
      } as FlowNodeData,
      selected: false,
    };

    set({ nodes: [...state.nodes, newNode] });
    get().markDirty();
  },

  // ---------------------------------------------------------------------------
  // Edge Actions
  // ---------------------------------------------------------------------------
  setEdges: (edges) => {
    set({ edges });
    get().markDirty();
  },

  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge] }));
    get().markDirty();
  },

  updateEdge: (edgeId, updates) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
    }));
    get().markDirty();
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
    get().markDirty();
  },

  // ---------------------------------------------------------------------------
  // Selection Actions
  // ---------------------------------------------------------------------------
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  getSelectedNode: () => {
    const state = get();
    if (!state.selectedNodeId) return null;
    return state.nodes.find((node) => node.id === state.selectedNodeId) || null;
  },

  // ---------------------------------------------------------------------------
  // Execution State
  // ---------------------------------------------------------------------------
  setCurrentExecutingNode: (nodeId) => {
    set({ currentExecutingNodeId: nodeId });
  },

  // ---------------------------------------------------------------------------
  // Variable Actions
  // ---------------------------------------------------------------------------
  setSystemVariable: (key, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        system: {
          ...state.variables.system,
          [key]: value,
        } as SystemVariables,
      },
    }));
  },

  setSessionVariable: (key, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        session: {
          ...state.variables.session,
          [key]: value,
        } as SessionVariables,
      },
    }));
  },

  setNodeOutput: (nodeId, output, nodeLabel) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);

    set((state) => ({
      variables: {
        ...state.variables,
        nodes: {
          ...state.variables.nodes,
          [nodeId]: {
            nodeId,
            nodeLabel: nodeLabel || node?.data.label || nodeId,
            nodeType: node?.type || 'unknown',
            output: output as never,
            executedAt: new Date().toISOString(),
            success: true,
          },
        },
      },
    }));
  },

  clearNodeOutputs: () => {
    set((state) => ({
      variables: {
        ...state.variables,
        nodes: {},
      },
    }));
  },

  // ---------------------------------------------------------------------------
  // Variable Helpers
  // ---------------------------------------------------------------------------
  resolveVariable: (ref) => {
    const state = get();
    return resolveVariableValue(state.variables, ref);
  },

  validateVariables: (text) => {
    const state = get();
    return validateVariableReferences(text, state.variables);
  },

  interpolate: (text) => {
    const state = get();
    const result = interpolateVariables(text, state.variables);
    return result.result;
  },

  getAvailableVars: () => {
    const state = get();
    return getAvailableVariables(state.variables);
  },

  // ---------------------------------------------------------------------------
  // Node Helpers
  // ---------------------------------------------------------------------------
  getNode: (nodeId) => {
    return get().nodes.find((node) => node.id === nodeId);
  },

  getNodesByType: (type) => {
    return get().nodes.filter((node) => node.type === type);
  },

  // ---------------------------------------------------------------------------
  // Save Actions
  // ---------------------------------------------------------------------------
  markDirty: () => {
    set({ isDirty: true });

    const state = get();
    if (autoSaveManager && state.flowId) {
      autoSaveManager.trigger({
        nodes: state.nodes,
        edges: state.edges,
      });
    }
  },

  saveFlow: async () => {
    const state = get();
    if (!state.flowId || !state.projectId) return;

    set({ isSaving: true, saveError: null });

    try {
      const response = await fetch(
        `/api/projects/${state.projectId}/flows/${state.flowId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.flowName,
            nodes: state.nodes,
            edges: state.edges,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('플로우 저장에 실패했습니다.');
      }

      set({
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      });
    } catch (error) {
      set({
        isSaving: false,
        saveError: (error as Error).message,
      });
      throw error;
    }
  },

  loadFlow: async (projectId: string, flowId: string) => {
    set({ isLoading: true, saveError: null });

    try {
      const response = await fetch(
        `/api/projects/${projectId}/flows/${flowId}`
      );

      if (!response.ok) {
        throw new Error('플로우를 불러오는데 실패했습니다.');
      }

      const flow = await response.json();

      // initializeFlow 호출
      get().initializeFlow({
        projectId,
        flowId: flow.id,
        flowName: flow.name,
        flowVersion: flow.version,
        isPublished: flow.isPublished,
        nodes: flow.nodes,
        edges: flow.edges,
      });

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        saveError: (error as Error).message,
      });
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  reset: () => {
    autoSaveManager?.cancel();
    autoSaveManager = null;

    set({
      projectId: null,
      flowId: null,
      flowName: '',
      flowVersion: 1,
      isPublished: false,
      nodes: [],
      edges: [],
      variables: DEFAULT_FLOW_VARIABLES,
      selectedNodeId: null,
      isDirty: false,
      isSaving: false,
      isLoading: false,
      lastSaved: null,
      saveError: null,
      currentExecutingNodeId: null,
    });
  },
}));
