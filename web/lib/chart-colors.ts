export const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
} as const;

export const DEPARTMENT_COLORS = [
  COLORS.indigo,
  COLORS.emerald,
  COLORS.violet,
  COLORS.sky,
  COLORS.amber,
  COLORS.rose,
];

export const LEAVE_STATUS_COLORS = {
  APPROVED: COLORS.emerald,
  REJECTED: COLORS.rose,
  PENDING: COLORS.amber,
} as const;

export const LEAVE_TYPE_COLORS: Record<string, string> = {
  SICK: COLORS.rose,
  CASUAL: COLORS.sky,
  ANNUAL: COLORS.emerald,
};
