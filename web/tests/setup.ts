import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { navigationState } from "./mocks/navigation";
import { server } from "./msw/server";

vi.mock("next/navigation", async () => {
  const { router, navigationState: state } = await import("./mocks/navigation");

  return {
    useRouter: () => router,
    usePathname: () => state.pathname,
    useParams: () => state.params,
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  navigationState.pathname = "/dashboard";
  navigationState.params = {};
});

afterAll(() => server.close());
