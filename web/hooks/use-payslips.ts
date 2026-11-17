import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Employee, Payslip } from "@/types";

export const PAYSLIPS_KEY = ["payslips"] as const;

type RawPayslip = Omit<Payslip, "employeeId"> & {
  employeeId: string | Employee;
};

export interface PayslipInput {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

function normalize(payslip: RawPayslip): Payslip {
  const { employeeId } = payslip;
  if (typeof employeeId === "string") return { ...payslip, employeeId };
  return {
    ...payslip,
    employeeId: employeeId._id,
    employee: payslip.employee ?? employeeId,
  };
}

export function usePayslips() {
  return useQuery({
    queryKey: PAYSLIPS_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ data: RawPayslip[] }>("/payslips");
      return data.data.map(normalize);
    },
  });
}

export function usePayslip(id: string) {
  return useQuery({
    queryKey: [...PAYSLIPS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<RawPayslip>(`/payslips/${id}`);
      return normalize(data);
    },
    retry: false,
  });
}

export function useCreatePayslip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PayslipInput) => {
      await api.post("/payslips", input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYSLIPS_KEY }),
  });
}
