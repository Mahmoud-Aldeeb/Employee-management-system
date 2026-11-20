import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";
import type { PortalRole, SessionUser } from "@/types";

export const SESSION_KEY = ["session"] as const;

interface SessionResponse {
  user: SessionUser;
}

interface LoginVariables {
  email: string;
  password: string;
  portal: PortalRole;
}

async function fetchSession() {
  try {
    const { data } = await api.get<SessionResponse>("/auth/session");
    return data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401)
      return null;
    throw error;
  }
}

function removeUserData(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== SESSION_KEY[0],
  });
}

export function storeSession(queryClient: QueryClient, user: SessionUser) {
  removeUserData(queryClient);
  queryClient.setQueryData(SESSION_KEY, user);
}

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, portal }: LoginVariables) => {
      const { data } = await api.post<SessionResponse>("/auth/login", {
        email,
        password,
        role_type: portal,
      });
      return data.user;
    },
    onSuccess: (user) => storeSession(queryClient, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      removeUserData(queryClient);
      queryClient.setQueryData(SESSION_KEY, null);
    },
  });
}

export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.data) router.replace("/dashboard");
  }, [session.data, router]);

  return session;
}

export function useRequireAuth() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.isPending && !session.data) router.replace("/login");
  }, [session.isPending, session.data, router]);

  return session;
}

interface ChangePasswordVariables {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (variables: ChangePasswordVariables) => {
      await api.post("/auth/change-password", variables);
    },
  });
}
