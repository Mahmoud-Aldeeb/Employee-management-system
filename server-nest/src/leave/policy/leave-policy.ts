export interface LeavePolicy {
  annualFirstYear: number;
  annualStandard: number;
  annualSenior: number;
  seniorAfterYears: number;
  annualWaitingMonths: number;
  casualPerYear: number;
  casualMaxPerRequest: number;
  weekendDays: readonly number[];
}

export const EGYPT_LEAVE_POLICY: LeavePolicy = {
  annualFirstYear: 15,
  annualStandard: 21,
  annualSenior: 30,
  seniorAfterYears: 10,
  annualWaitingMonths: 6,
  casualPerYear: 7,
  casualMaxPerRequest: 2,
  weekendDays: [5, 6],
};

export const LEAVE_POLICY = Symbol('LEAVE_POLICY');
