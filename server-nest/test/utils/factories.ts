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

const WEEKEND_DAYS = [5, 6];

export function leaveWindow(minDaysAhead = 3, workingDays = 2) {
  const cursor = new Date(`${dateFromNow(minDaysAhead)}T00:00:00.000Z`);
  while (WEEKEND_DAYS.includes(cursor.getUTCDay()))
    cursor.setUTCDate(cursor.getUTCDate() + 1);

  const start = cursor.toISOString().slice(0, 10);
  let counted = 1;
  while (counted < workingDays) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (!WEEKEND_DAYS.includes(cursor.getUTCDay())) counted += 1;
  }

  return { start, end: cursor.toISOString().slice(0, 10) };
}
