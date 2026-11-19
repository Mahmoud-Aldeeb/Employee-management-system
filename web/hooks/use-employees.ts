import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Employee, EmploymentStatus, Role } from "@/types";
import { invalidateAppData } from "@/lib/invalidate";

export const EMPLOYEES_KEY = ["employees"] as const;

export interface EmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department?: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  joinDate: string;
  password: string;
  role: Role;
  bio: string;
}

export type EmployeeUpdatePayload = Partial<EmployeePayload> & {
  employmentStatus?: EmploymentStatus;
};

export function useEmployees(
  department = "",
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, { department }],
    queryFn: async () => {
      const { data } = await api.get<Employee[]>("/employees", {
        params: department ? { department } : undefined,
      });
      return data;
    },
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EmployeePayload) => {
      const { data } = await api.post("/employees", input);
      return data;
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: EmployeeUpdatePayload;
    }) => {
      const { data } = await api.put(`/employees/${id}`, input);
      return data;
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => invalidateAppData(queryClient),
  });
}
