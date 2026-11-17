export function employeePayload(
  email: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    firstName: 'Test',
    lastName: 'Employee',
    email,
    phone: '01000000000',
    position: 'Developer',
    department: 'Engineering',
    basicSalary: 5000,
    allowances: 500,
    deductions: 200,
    joinDate: '2026-01-01',
    password: 'Temp#12345',
    ...overrides,
  };
}

export function dateFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
