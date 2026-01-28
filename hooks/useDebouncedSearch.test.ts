/**
 * Tests for debounced search hooks
 * 
 * Validates:
 * - 300ms debounce delay
 * - Loading indicator during search
 * - Cleanup on unmount
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedSearch, useDebounce, useDebouncedCallback } from './useDebouncedSearch';

// Mock timers
jest.useFakeTimers();

describe('useDebouncedSearch', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useDebouncedSearch('initial'));

    expect(result.current.value).toBe('initial');
    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isSearching).toBe(false);
  });

  it('should debounce value changes by 300ms', () => {
    const { result } = renderHook(() => useDebouncedSearch(''));

    // Change value
    act(() => {
      result.current.setValue('test');
    });

    // Value should update immediately
    expect(result.current.value).toBe('test');
    expect(result.current.debouncedValue).toBe('');
    expect(result.current.isSearching).toBe(true);

    // Fast-forward 299ms (not enough)
    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(result.current.debouncedValue).toBe('');
    expect(result.current.isSearching).toBe(true);

    // Fast-forward 1ms more (total 300ms)
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.debouncedValue).toBe('test');
    expect(result.current.isSearching).toBe(false);
  });

  it('should show loading indicator during debounce', () => {
    const { result } = renderHook(() => useDebouncedSearch(''));

    act(() => {
      result.current.setValue('searching');
    });

    expect(result.current.isSearching).toBe(true);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isSearching).toBe(false);
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result } = renderHook(() => useDebouncedSearch(''));

    // First change
    act(() => {
      result.current.setValue('a');
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Second change before first completes
    act(() => {
      result.current.setValue('ab');
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Third change
    act(() => {
      result.current.setValue('abc');
    });

    // Only the last value should be debounced
    expect(result.current.debouncedValue).toBe('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.debouncedValue).toBe('abc');
  });

  it('should reset value and debounced value', () => {
    const { result } = renderHook(() => useDebouncedSearch('initial'));

    act(() => {
      result.current.setValue('changed');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.value).toBe('changed');
    expect(result.current.debouncedValue).toBe('changed');

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('');
    expect(result.current.debouncedValue).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('should cleanup timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useDebouncedSearch(''));

    act(() => {
      result.current.setValue('test');
    });

    expect(result.current.isSearching).toBe(true);

    unmount();

    // Should not throw error
    act(() => {
      jest.advanceTimersByTime(300);
    });
  });

  it('should support custom delay', () => {
    const { result } = renderHook(() => useDebouncedSearch('', 500));

    act(() => {
      result.current.setValue('test');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.debouncedValue).toBe('');

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.debouncedValue).toBe('test');
  });
});

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'changed' });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('changed');
  });

  it('should work with non-string values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it('should work with objects', () => {
    const obj1 = { id: 1, name: 'Test' };
    const obj2 = { id: 2, name: 'Updated' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: obj1 } }
    );

    expect(result.current).toBe(obj1);

    rerender({ value: obj2 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(obj2);
  });
});

describe('useDebouncedCallback', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should debounce callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('test');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous callback on rapid calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('first');
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current('third');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Only the last call should execute
    expect(callback).toHaveBeenCalledWith('third');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple arguments', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('arg1', 'arg2', 'arg3');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should update callback reference', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useDebouncedCallback(cb, 300),
      { initialProps: { cb: callback1 } }
    );

    act(() => {
      result.current('test');
    });

    // Update callback before timeout
    rerender({ cb: callback2 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should call the updated callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith('test');
  });

  it('should cleanup timeout on unmount', () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('test');
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });
});
