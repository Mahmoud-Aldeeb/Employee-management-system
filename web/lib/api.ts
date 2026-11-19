import axios, { type InternalAxiosRequestConfig } from "axios";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const NO_REFRESH_URLS = ["/auth/login", "/auth/refresh"];
const REFRESH_LOCK = "ems-refresh-session";

export const api = axios.create({ baseURL: "/api" });

let refreshing: Promise<unknown> | null = null;

function requestRefresh() {
  const refresh = () => api.post("/auth/refresh");

  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request(REFRESH_LOCK, refresh);
  }

  return refresh();
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) throw error;

    const original = error.config as RetryableConfig;
    const shouldRefresh =
      error.response?.status === 401 &&
      !original._retry &&
      !NO_REFRESH_URLS.includes(original.url ?? "");

    if (!shouldRefresh) throw error;

    original._retry = true;
    refreshing ??= requestRefresh().finally(() => {
      refreshing = null;
    });

    try {
      await refreshing;
    } catch {
      throw error;
    }

    return api(original);
  },
);
