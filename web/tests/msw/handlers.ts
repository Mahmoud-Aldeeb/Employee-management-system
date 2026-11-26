import { http, HttpResponse } from "msw";
import type { SessionUser } from "@/types";

export const admin: SessionUser = {
  id: "u1",
  email: "admin@test.local",
  role: "ADMIN",
};
export const employee: SessionUser = {
  id: "u2",
  email: "sara@test.local",
  role: "EMPLOYEE",
};

export const signedIn = (user: SessionUser) =>
  http.get("/api/auth/session", () => HttpResponse.json({ user }));

export const signedOut = [
  http.get("/api/auth/session", () =>
    HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
  ),
  http.post("/api/auth/refresh", () =>
    HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
  ),
];

export const profile = (data: Record<string, unknown>) =>
  http.get("/api/profile", () => HttpResponse.json(data));

export const unreadCount = (count: number) =>
  http.get("/api/notifications/unread-count", () =>
    HttpResponse.json({ count }),
  );

export const demoStatus = (enabled: boolean) =>
  http.get("/api/demo/status", () => HttpResponse.json({ enabled }));

export const defaultHandlers = [unreadCount(0), demoStatus(false)];
