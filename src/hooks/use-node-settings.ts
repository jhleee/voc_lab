'use client';

// =============================================================================
// Node Settings Store
// =============================================================================
// 노드 설정 패널 상태 관리
// =============================================================================

import { create } from 'zustand';
import type { FlowNodeData, FlowNodeType } from '@/types/flow-nodes';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface NodeSettingsState {
  // ---------------------------------------------------------------------------
  // Panel State
  // ---------------------------------------------------------------------------
  isOpen: boolean;
  nodeId: string | null;
  nodeType: FlowNodeType | null;

  // ---------------------------------------------------------------------------
  // Form State
  // ---------------------------------------------------------------------------
  formData: FlowNodeData | null;
  originalData: FlowNodeData | null;
  isDirty: boolean;
  validationErrors: Record<string, string>;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  open: (nodeId: string, nodeType: FlowNodeType, data: FlowNodeData) => void;
  close: () => void;
  updateField: <K extends keyof FlowNodeData>(field: K, value: FlowNodeData[K]) => void;
  updateFormData: (updates: Partial<FlowNodeData>) => void;
  setValidationError: (field: string, error: string | null) => void;
  clearValidationErrors: () => void;
  revert: () => void;
  getFormData: () => FlowNodeData | null;
}

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useNodeSettings = create<NodeSettingsState>((set, get) => ({
  // ---------------------------------------------------------------------------
  // Initial State
  // ---------------------------------------------------------------------------
  isOpen: false,
  nodeId: null,
  nodeType: null,
  formData: null,
  originalData: null,
  isDirty: false,
  validationErrors: {},

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  open: (nodeId, nodeType, data) => {
    set({
      isOpen: true,
      nodeId,
      nodeType,
      formData: JSON.parse(JSON.stringify(data)), // Deep copy
      originalData: JSON.parse(JSON.stringify(data)),
      isDirty: false,
      validationErrors: {},
    });
  },

  close: () => {
    set({
      isOpen: false,
      nodeId: null,
      nodeType: null,
      formData: null,
      originalData: null,
      isDirty: false,
      validationErrors: {},
    });
  },

  updateField: (field, value) => {
    const state = get();
    if (!state.formData) return;

    const newFormData = {
      ...state.formData,
      [field]: value,
    };

    set({
      formData: newFormData as FlowNodeData,
      isDirty: JSON.stringify(newFormData) !== JSON.stringify(state.originalData),
    });
  },

  updateFormData: (updates) => {
    const state = get();
    if (!state.formData) return;

    const newFormData = {
      ...state.formData,
      ...updates,
    };

    set({
      formData: newFormData as FlowNodeData,
      isDirty: JSON.stringify(newFormData) !== JSON.stringify(state.originalData),
    });
  },

  setValidationError: (field, error) => {
    set((state) => ({
      validationErrors: error
        ? { ...state.validationErrors, [field]: error }
        : Object.fromEntries(
            Object.entries(state.validationErrors).filter(([k]) => k !== field)
          ),
    }));
  },

  clearValidationErrors: () => {
    set({ validationErrors: {} });
  },

  revert: () => {
    const state = get();
    if (!state.originalData) return;

    set({
      formData: JSON.parse(JSON.stringify(state.originalData)),
      isDirty: false,
      validationErrors: {},
    });
  },

  getFormData: () => {
    return get().formData;
  },
}));
