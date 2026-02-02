import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAutoSaveManager } from './auto-save';

describe('auto-save', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createAutoSaveManager', () => {
    it('should debounce trigger calls', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const manager = createAutoSaveManager<{ value: number }>({
        delay: 500,
        onSave,
      });

      manager.trigger({ value: 1 });
      manager.trigger({ value: 2 });
      manager.trigger({ value: 3 });

      expect(onSave).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(500);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ value: 3 });

      manager.cancel();
    });

    it('should call onSaveStart when save begins', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onSaveStart = vi.fn();
      const manager = createAutoSaveManager<string>({
        delay: 100,
        onSave,
        onSaveStart,
      });

      manager.trigger('test');
      await vi.advanceTimersByTimeAsync(100);

      expect(onSaveStart).toHaveBeenCalled();

      manager.cancel();
    });

    it('should call onSuccess after successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();
      const manager = createAutoSaveManager<string>({
        delay: 100,
        onSave,
        onSuccess,
      });

      manager.trigger('test');
      await vi.advanceTimersByTimeAsync(100);
      await vi.runAllTimersAsync();

      expect(onSuccess).toHaveBeenCalled();

      manager.cancel();
    });

    it('should call onError when save fails', async () => {
      const error = new Error('Save failed');
      let callCount = 0;
      const onSave = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          return Promise.reject(error);
        }
        // After first failure, succeed to stop the retry loop
        return Promise.resolve();
      });
      const onError = vi.fn();
      const manager = createAutoSaveManager<string>({
        delay: 100,
        onSave,
        onError,
      });

      manager.trigger('test');

      // First attempt
      await vi.advanceTimersByTimeAsync(100);
      // Wait for the promise to settle
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(error);

      manager.cancel();
    });

    it('should cancel pending save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const manager = createAutoSaveManager<string>({
        delay: 500,
        onSave,
      });

      manager.trigger('test');
      manager.cancel();

      await vi.advanceTimersByTimeAsync(500);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should use custom delay', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const manager = createAutoSaveManager<string>({
        delay: 1000,
        onSave,
      });

      manager.trigger('test');

      await vi.advanceTimersByTimeAsync(500);
      expect(onSave).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(500);
      expect(onSave).toHaveBeenCalledTimes(1);

      manager.cancel();
    });

    it('should support immediate save with flush', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const manager = createAutoSaveManager<string>({
        delay: 1000,
        onSave,
      });

      manager.trigger('immediate');
      await manager.flush();

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith('immediate');

      manager.cancel();
    });

    it('should report saving state correctly', async () => {
      let resolveSave: () => void;
      const savePromise = new Promise<void>(resolve => {
        resolveSave = resolve;
      });
      const onSave = vi.fn().mockReturnValue(savePromise);
      const manager = createAutoSaveManager<string>({
        delay: 100,
        onSave,
      });

      expect(manager.isSaving()).toBe(false);

      manager.trigger('test');
      await vi.advanceTimersByTimeAsync(100);

      expect(manager.isSaving()).toBe(true);

      resolveSave!();
      await vi.runAllTimersAsync();

      expect(manager.isSaving()).toBe(false);

      manager.cancel();
    });

    it('should report hasPending correctly', () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const manager = createAutoSaveManager<string>({
        delay: 500,
        onSave,
      });

      expect(manager.hasPending()).toBe(false);

      manager.trigger('test');
      expect(manager.hasPending()).toBe(true);

      manager.cancel();
      expect(manager.hasPending()).toBe(false);
    });
  });
});
