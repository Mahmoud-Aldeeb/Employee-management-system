import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 400));

    expect(result.current).toBe("hello");
  });

  it("updates only after the delay has fully elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      {
        initialProps: { value: "hello" },
      },
    );

    rerender({ value: "world" });
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(result.current).toBe("hello");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("world");
  });

  it("restarts the timer when the value keeps changing", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      {
        initialProps: { value: "a" },
      },
    );

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: "abc" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("abc");
  });
});
