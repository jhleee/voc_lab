'use client';

// =============================================================================
// Flow Execution Hook
// =============================================================================
// 플로우 실행 엔진을 관리하는 React 훅
// =============================================================================

import { useState, useCallback, useRef } from 'react';
import type { Session, SessionMessage } from '@/types/session';
import type { FlowDefinition, TurnResult, TriggerInput } from '@/lib/execution/flow-engine';
import { FlowEngine, createFlowEngine } from '@/lib/execution/flow-engine';
import { createSessionStore } from '@/lib/session-store';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FlowExecutionState {
  session: Session | null;
  messages: SessionMessage[];
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseFlowExecutionReturn extends FlowExecutionState {
  // Actions
  startSession: (flow: FlowDefinition, projectId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  stopSession: () => void;
  clearMessages: () => void;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useFlowExecution(): UseFlowExecutionReturn {
  const [state, setState] = useState<FlowExecutionState>({
    session: null,
    messages: [],
    isRunning: false,
    isLoading: false,
    error: null,
  });

  const engineRef = useRef<FlowEngine | null>(null);
  const sessionStoreRef = useRef(createSessionStore());

  // ---------------------------------------------------------------------------
  // Start Session
  // ---------------------------------------------------------------------------

  const startSession = useCallback(async (flow: FlowDefinition, projectId: string) => {
    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      // Create new engine
      const engine = createFlowEngine(flow, sessionStoreRef.current);
      engineRef.current = engine;

      // Start session
      const session = await engine.startSession(projectId);

      setState((s) => ({
        ...s,
        session,
        messages: [],
        isRunning: true,
        isLoading: false,
      }));

      // Execute initial turn (start node)
      const trigger: TriggerInput = {
        type: 'user_message',
        payload: { message: '' }, // Empty message for initial trigger
      };

      const result = await engine.executeTurn(session.id, trigger);

      if (result.messages.length > 0) {
        setState((s) => ({
          ...s,
          messages: [...s.messages, ...result.messages],
        }));
      }

      // Update session status
      const updatedSession = await engine.getSession(session.id);
      setState((s) => ({
        ...s,
        session: updatedSession,
        isRunning: result.sessionStatus !== 'COMPLETED' && result.sessionStatus !== 'ERROR',
      }));

    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start session',
      }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Send Message
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(async (message: string) => {
    if (!engineRef.current || !state.session) {
      setState((s) => ({ ...s, error: 'No active session' }));
      return;
    }

    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      // Add user message to UI immediately
      const userMessage: SessionMessage = {
        id: `user_${Date.now()}`,
        direction: 'inbound',
        content: message,
        contentType: 'text',
        createdAt: new Date().toISOString(),
      };

      setState((s) => ({
        ...s,
        messages: [...s.messages, userMessage],
      }));

      // Execute turn
      const trigger: TriggerInput = {
        type: 'user_message',
        payload: { message },
      };

      const result = await engineRef.current.executeTurn(state.session.id, trigger);

      // Add bot messages
      if (result.messages.length > 0) {
        setState((s) => ({
          ...s,
          messages: [...s.messages, ...result.messages],
        }));
      }

      // Update session
      const updatedSession = await engineRef.current.getSession(state.session.id);
      setState((s) => ({
        ...s,
        session: updatedSession,
        isLoading: false,
        isRunning: result.sessionStatus !== 'COMPLETED' && result.sessionStatus !== 'ERROR',
        error: result.error || null,
      }));

    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [state.session]);

  // ---------------------------------------------------------------------------
  // Stop Session
  // ---------------------------------------------------------------------------

  const stopSession = useCallback(() => {
    engineRef.current = null;
    setState({
      session: null,
      messages: [],
      isRunning: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Clear Messages
  // ---------------------------------------------------------------------------

  const clearMessages = useCallback(() => {
    setState((s) => ({ ...s, messages: [] }));
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    ...state,
    startSession,
    sendMessage,
    stopSession,
    clearMessages,
  };
}
