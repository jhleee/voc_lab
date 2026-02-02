// =============================================================================
// Auto-Save Manager
// =============================================================================
// 변경사항 자동 저장을 위한 디바운스 매니저
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AutoSaveConfig<T> {
  /** 디바운스 지연 시간 (ms) - 기본 500ms */
  delay?: number;
  /** 저장 함수 */
  onSave: (data: T) => Promise<void>;
  /** 에러 핸들러 */
  onError?: (error: Error) => void;
  /** 성공 핸들러 */
  onSuccess?: () => void;
  /** 저장 시작 핸들러 */
  onSaveStart?: () => void;
}

export interface AutoSaveManager<T> {
  /** 저장 트리거 (디바운스됨) */
  trigger: (data: T) => void;
  /** 대기 중인 저장 취소 */
  cancel: () => void;
  /** 즉시 저장 실행 */
  flush: () => Promise<void>;
  /** 현재 저장 중인지 여부 */
  isSaving: () => boolean;
  /** 대기 중인 데이터가 있는지 여부 */
  hasPending: () => boolean;
}

// -----------------------------------------------------------------------------
// Create Auto-Save Manager
// -----------------------------------------------------------------------------

/**
 * 자동 저장 매니저를 생성합니다.
 * @param config 설정 옵션
 * @returns AutoSaveManager 인스턴스
 */
export function createAutoSaveManager<T>({
  delay = 500,
  onSave,
  onError,
  onSuccess,
  onSaveStart,
}: AutoSaveConfig<T>): AutoSaveManager<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestData: T | null = null;
  let saving = false;

  const executeSave = async () => {
    if (!latestData || saving) return;

    saving = true;
    const dataToSave = latestData;
    latestData = null;

    onSaveStart?.();

    try {
      await onSave(dataToSave);
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
      // 실패 시 데이터 복원하여 재시도 가능하게
      if (latestData === null) {
        latestData = dataToSave;
      }
    } finally {
      saving = false;

      // 저장 중 새 데이터가 도착했으면 다시 스케줄
      if (latestData !== null) {
        timeoutId = setTimeout(executeSave, delay);
      }
    }
  };

  return {
    trigger: (data: T) => {
      latestData = data;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(executeSave, delay);
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      latestData = null;
    },

    flush: async () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      await executeSave();
    },

    isSaving: () => saving,

    hasPending: () => latestData !== null || timeoutId !== null,
  };
}
