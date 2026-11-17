import axios, { type InternalAxiosRequestConfig } from "axios";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const NO_REFRESH_URLS = ["/auth/login", "/auth/refresh"];

export const api = axios.create({ baseURL: "/api" });

let refreshing: Promise<unknown> | null = null;

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
    refreshing ??= api.post("/auth/refresh").finally(() => {
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
