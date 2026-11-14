import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import usePageTitle from '../hooks/usePageTitle';

// ─── useFetch Tests ────────────────────────────────────────────────────────────
describe('useFetch Hook — Unit Tests', () => {
  it('should start with loading=true and data=null', () => {
    const fetchFn = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useFetch(fetchFn, []));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('should set data when fetch resolves', async () => {
    const mockData = { employees: [{ id: 1, name: 'Ahmed' }] };
    const fetchFn = vi.fn().mockResolvedValue({ data: mockData });
    const { result } = renderHook(() => useFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should set error message when fetch fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue({
      response: { data: { error: 'Not found' } },
    });
    const { result } = renderHook(() => useFetch(fetchFn, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Not found');
    expect(result.current.data).toBeNull();
  });
});

// ─── useDebounce Tests ─────────────────────────────────────────────────────────
describe('useDebounce Hook — Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  it('should not update the value before delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'hello' } }
    );
    rerender({ value: 'world' });
    vi.advanceTimersByTime(300); // less than delay
    expect(result.current).toBe('hello'); // still old value
  });

  it('should update value after delay elapses', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: 'hello' } }
    );
    rerender({ value: 'world' });
    vi.advanceTimersByTime(400);
    await waitFor(() => {
      expect(result.current).toBe('world');
    });
  });
});

// ─── usePageTitle Tests ────────────────────────────────────────────────────────
describe('usePageTitle Hook — Unit Tests', () => {
  it('should set document.title with page name', () => {
    renderHook(() => usePageTitle('Dashboard'));
    expect(document.title).toBe('Dashboard — Employee MS');
  });

  it('should use fallback title when no title is provided', () => {
    renderHook(() => usePageTitle(null));
    expect(document.title).toBe('Employee Management System');
  });

  it('should update document.title when title prop changes', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'Employees' },
    });
    expect(document.title).toBe('Employees — Employee MS');
    rerender({ title: 'Settings' });
    expect(document.title).toBe('Settings — Employee MS');
  });
});
