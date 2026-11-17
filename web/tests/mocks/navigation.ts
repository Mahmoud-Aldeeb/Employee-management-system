import { vi } from "vitest";

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationState: {
  pathname: string;
  params: Record<string, string>;
} = {
  pathname: "/dashboard",
  params: {},
};
