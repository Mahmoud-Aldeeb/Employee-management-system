import mongoose, { type Types } from 'mongoose';
import type { Attendance } from '../attendance/schemas/attendance.schema.js';
import { AttendanceStatus } from '../common/enums/attendance-status.enum.js';
import { DayType } from '../common/enums/day-type.enum.js';
import { LeaveStatus } from '../common/enums/leave-status.enum.js';
import { LeaveType } from '../common/enums/leave-type.enum.js';
import { Role } from '../common/enums/role.enum.js';
import type { Employee } from '../employees/schemas/employee.schema.js';
import type { LeaveApplication } from '../leave/schemas/leave-application.schema.js';
import type { Payslip } from '../payslips/schemas/payslip.schema.js';
import type { Salary } from '../salaries/schemas/salary.schema.js';
import type { User } from '../users/schemas/user.schema.js';
import { DEMO_ADMIN_EMAIL, DEMO_EMAIL_DOMAIN } from './demo.constants.js';
import { describeValues } from '../audit/audit-diff.js';
import { AuditAction, type AuditChange } from '../audit/audit.types.js';
import type { AuditLog } from '../audit/schemas/audit-log.schema.js';
import { cairoDay, formatCairoDate } from '../common/utils/cairo-time.js';
import { fullName } from '../employees/employee-name.js';
import { formatLeavePeriod } from '../leave/leave-period.js';
import {
  leaveDecisionContent,
  leaveRequestedContent,
  payslipIssuedContent,
} from '../notifications/notification-content.js';
import type { NotificationContent } from '../notifications/notification.types.js';
import type { Notification } from '../notifications/schemas/notification.schema.js';

type WithId<T> = T & { _id: Types.ObjectId };

export interface DemoDataset {
  users: Array<WithId<Pick<User, 'email' | 'password' | 'role'>>>;
  employees: Array<
    WithId<
      Pick<
        Employee,
        | 'userId'
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'phone'
        | 'position'
        | 'department'
        | 'joinDate'
        | 'bio'
      >
    >
  >;
  salaries: Array<
    Pick<Salary, 'employeeId' | 'basicSalary' | 'allowances' | 'deductions'>
  >;
  attendance: Array<
    Pick<
      Attendance,
      | 'employeeId'
      | 'date'
      | 'checkIn'
      | 'checkOut'
      | 'status'
      | 'workingHours'
      | 'dayType'
    >
  >;
  leaves: Array<
    Pick<
      LeaveApplication,
      'employeeId' | 'type' | 'startDate' | 'endDate' | 'reason' | 'status'
    > & {
      createdAt: Date;
    }
  >;
  payslips: Array<
    Pick<
      Payslip,
      | 'employeeId'
      | 'month'
      | 'year'
      | 'basicSalary'
      | 'allowances'
      | 'deductions'
      | 'netSalary'
    > & { createdAt: Date }
  >;
  auditLogs: Array<
    Pick<
      AuditLog,
      | 'action'
      | 'actorId'
      | 'actorEmail'
      | 'targetLabel'
      | 'changes'
      | 'isDemo'
      | 'createdAt'
    >
  >;
  notifications: Array<
    Pick<
      Notification,
      'userId' | 'type' | 'title' | 'message' | 'link' | 'readAt' | 'createdAt'
    >
  >;
}

export interface DemoDatasetInput {
  now: Date;
  passwordHash: string;
}

interface DemoPerson {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  joinDate: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bio: string;
}

interface LeaveTemplate {
  person: number;
  type: LeaveType;
  status: LeaveStatus;
  from: number;
  to: number;
  filedDaysAgo: number;
  reason: string;
}

const PEOPLE: DemoPerson[] = [
  {
    firstName: 'Salma',
    lastName: 'Farouk',
    position: 'Senior UI Designer',
    department: 'Design',
    joinDate: '2023-02-01',
    basicSalary: 6500,
    allowances: 800,
    deductions: 450,
    bio: 'Designs the product experience from research to polish.',
  },
  {
    firstName: 'Khaled',
    lastName: 'Mansour',
    position: 'Backend Engineer',
    department: 'Engineering',
    joinDate: '2022-06-15',
    basicSalary: 7800,
    allowances: 900,
    deductions: 520,
    bio: 'Builds and scales the platform APIs.',
  },
  {
    firstName: 'Hana',
    lastName: 'Younes',
    position: 'Frontend Engineer',
    department: 'Engineering',
    joinDate: '2023-09-01',
    basicSalary: 7200,
    allowances: 850,
    deductions: 480,
    bio: 'Works on the web app and the design system.',
  },
  {
    firstName: 'Tamer',
    lastName: 'Wahba',
    position: 'Account Executive',
    department: 'Sales',
    joinDate: '2024-01-10',
    basicSalary: 5200,
    allowances: 1200,
    deductions: 350,
    bio: 'Owns the mid-market accounts.',
  },
  {
    firstName: 'Nadine',
    lastName: 'Fouad',
    position: 'HR Specialist',
    department: 'Human Resources',
    joinDate: '2022-11-20',
    basicSalary: 5600,
    allowances: 600,
    deductions: 380,
    bio: 'Recruiting, onboarding and employee relations.',
  },
  {
    firstName: 'Amr',
    lastName: 'Zaki',
    position: 'Financial Analyst',
    department: 'Finance',
    joinDate: '2021-08-05',
    basicSalary: 6900,
    allowances: 700,
    deductions: 470,
    bio: 'Budgeting, forecasting and monthly close.',
  },
  {
    firstName: 'Reem',
    lastName: 'Shawky',
    position: 'Content Strategist',
    department: 'Marketing',
    joinDate: '2024-05-02',
    basicSalary: 5000,
    allowances: 500,
    deductions: 330,
    bio: 'Plans and writes the editorial calendar.',
  },
  {
    firstName: 'Ziad',
    lastName: 'Hamdy',
    position: 'Operations Coordinator',
    department: 'Operations',
    joinDate: '2023-04-17',
    basicSalary: 4800,
    allowances: 450,
    deductions: 310,
    bio: 'Keeps day-to-day operations on schedule.',
  },
  {
    firstName: 'Farida',
    lastName: 'Lotfy',
    position: 'Support Lead',
    department: 'Customer Success',
    joinDate: '2022-03-07',
    basicSalary: 6100,
    allowances: 650,
    deductions: 420,
    bio: 'Leads the customer support team.',
  },
  {
    firstName: 'Ali',
    lastName: 'Kamel',
    position: 'Systems Administrator',
    department: 'IT Support',
    joinDate: '2021-12-12',
    basicSalary: 6400,
    allowances: 700,
    deductions: 440,
    bio: 'Infrastructure, access and internal tooling.',
  },
  {
    firstName: 'Dalia',
    lastName: 'Nasser',
    position: 'Product Manager',
    department: 'Product Management',
    joinDate: '2022-09-26',
    basicSalary: 8800,
    allowances: 1100,
    deductions: 610,
    bio: 'Owns the roadmap for the core product.',
  },
  {
    firstName: 'Yara',
    lastName: 'Emad',
    position: 'Full-stack Engineer',
    department: 'Engineering',
    joinDate: '2025-02-03',
    basicSalary: 7000,
    allowances: 800,
    deductions: 470,
    bio: 'Ships features across the stack.',
  },
];

const LEAVE_TEMPLATES: LeaveTemplate[] = [
  {
    person: 0,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    from: -21,
    to: -17,
    filedDaysAgo: 35,
    reason: 'Family trip to Alexandria',
  },
  {
    person: 0,
    type: LeaveType.CASUAL,
    status: LeaveStatus.PENDING,
    from: 6,
    to: 7,
    filedDaysAgo: 1,
    reason: 'Passport renewal appointment',
  },
  {
    person: 1,
    type: LeaveType.SICK,
    status: LeaveStatus.APPROVED,
    from: -9,
    to: -8,
    filedDaysAgo: 9,
    reason: 'Flu and fever',
  },
  {
    person: 2,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    from: -1,
    to: 2,
    filedDaysAgo: 12,
    reason: 'Short break after the release',
  },
  {
    person: 3,
    type: LeaveType.CASUAL,
    status: LeaveStatus.APPROVED,
    from: 0,
    to: 0,
    filedDaysAgo: 6,
    reason: 'Moving to a new apartment',
  },
  {
    person: 4,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    from: 9,
    to: 13,
    filedDaysAgo: 20,
    reason: 'Wedding leave',
  },
  {
    person: 5,
    type: LeaveType.SICK,
    status: LeaveStatus.PENDING,
    from: 3,
    to: 4,
    filedDaysAgo: 0,
    reason: 'Dental surgery recovery',
  },
  {
    person: 6,
    type: LeaveType.CASUAL,
    status: LeaveStatus.PENDING,
    from: 8,
    to: 8,
    filedDaysAgo: 2,
    reason: 'University graduation ceremony',
  },
  {
    person: 7,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.REJECTED,
    from: -5,
    to: -3,
    filedDaysAgo: 14,
    reason: 'Extra vacation days during release week',
  },
  {
    person: 8,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.PENDING,
    from: 14,
    to: 18,
    filedDaysAgo: 3,
    reason: 'Summer vacation',
  },
  {
    person: 9,
    type: LeaveType.CASUAL,
    status: LeaveStatus.REJECTED,
    from: 2,
    to: 2,
    filedDaysAgo: 4,
    reason: 'Personal errand during the audit',
  },
  {
    person: 10,
    type: LeaveType.SICK,
    status: LeaveStatus.APPROVED,
    from: -14,
    to: -12,
    filedDaysAgo: 15,
    reason: 'Medical check-up and recovery',
  },
];

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const HISTORY_DAYS = 30;
const PAYSLIP_MONTHS = 3;
const OPEN_SHIFT_COUNT = 8;
const ABSENCE_RATE = 0.06;
const LATE_RATE = 0.12;
const DEMO_SEED = 20_261_119;
const AUDIT_DECISION_DELAY_HOURS = 5;

const NOTIFICATION_READ_DELAY_HOURS = 2;

interface NotificationInput {
  now: Date;
  adminId: Types.ObjectId;
  demoEmployee: { userId: Types.ObjectId; employeeId: Types.ObjectId };
  names: string[];
  leaves: DemoDataset['leaves'];
  payslips: DemoDataset['payslips'];
}

const SALARY_HISTORY = [
  { person: 1, from: 7200, daysAgo: 20 },
  { person: 10, from: 8200, daysAgo: 45 },
];

const POSITION_HISTORY = {
  person: 2,
  from: 'Frontend Developer',
  daysAgo: 12,
};

interface AuditLogInput {
  now: Date;
  actor: { id: Types.ObjectId; email: string };
  staff: Array<{ person: DemoPerson; employeeId: Types.ObjectId }>;
  leaves: DemoDataset['leaves'];
  payslips: DemoDataset['payslips'];
}

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function between(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

function daysFrom(base: Date, offset: number) {
  return new Date(base.getTime() + offset * DAY_MS);
}

function isWorkday(day: Date) {
  const weekday = day.getUTCDay();
  return weekday !== 5 && weekday !== 6;
}

function dayTypeFor(hours: number) {
  if (hours >= 8) return DayType.FULL_DAY;
  if (hours >= 6) return DayType.THREE_QUARTER_DAY;
  if (hours >= 4) return DayType.HALF_DAY;
  return DayType.SHORT_DAY;
}

function isOnApprovedLeave(
  leaves: DemoDataset['leaves'],
  employeeId: Types.ObjectId,
  day: Date,
) {
  return leaves.some(
    (leave) =>
      leave.status === LeaveStatus.APPROVED &&
      leave.employeeId.equals(employeeId) &&
      leave.startDate.getTime() <= day.getTime() &&
      day.getTime() <= leave.endDate.getTime(),
  );
}

function buildShift(
  employeeId: Types.ObjectId,
  day: Date,
  random: () => number,
): DemoDataset['attendance'][number] {
  const late = random() < LATE_RATE;
  const startMinute = Math.round(
    late ? between(random, 425, 470) : between(random, 375, 418),
  );
  const hours = Math.round(between(random, 6.5, 9.5) * 100) / 100;
  const checkIn = new Date(day.getTime() + startMinute * 60_000);

  return {
    employeeId,
    date: day,
    checkIn,
    checkOut: new Date(checkIn.getTime() + hours * HOUR_MS),
    status: late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    workingHours: hours,
    dayType: dayTypeFor(hours),
  };
}

function buildAuditLogs({
  now,
  actor,
  staff,
  leaves,
  payslips,
}: AuditLogInput): DemoDataset['auditLogs'] {
  const names = staff.map(({ person }) => fullName(person));
  const nameByEmployee = new Map(
    staff.map(
      ({ person, employeeId }) =>
        [String(employeeId), fullName(person)] as const,
    ),
  );

  const entry = (
    action: AuditAction,
    targetLabel: string,
    changes: AuditChange[],
    createdAt: Date,
  ): DemoDataset['auditLogs'][number] => ({
    action,
    actorId: actor.id,
    actorEmail: actor.email,
    targetLabel,
    changes,
    isDemo: true,
    createdAt: new Date(Math.min(now.getTime(), createdAt.getTime())),
  });

  const decisions = LEAVE_TEMPLATES.flatMap((template, index) => {
    if (template.status === LeaveStatus.PENDING) return [];

    const leave = leaves[index];
    const period = `${formatCairoDate(leave.startDate)} - ${formatCairoDate(leave.endDate)}`;

    return [
      entry(
        template.status === LeaveStatus.APPROVED
          ? AuditAction.LEAVE_APPROVED
          : AuditAction.LEAVE_REJECTED,
        `${names[template.person]} (${period})`,
        [{ field: 'status', from: LeaveStatus.PENDING, to: template.status }],
        new Date(
          leave.createdAt.getTime() + AUDIT_DECISION_DELAY_HOURS * HOUR_MS,
        ),
      ),
    ];
  });

  const newestPayslip = Math.max(
    ...payslips.map((payslip) => payslip.createdAt.getTime()),
  );
  const issued = payslips
    .filter((payslip) => payslip.createdAt.getTime() === newestPayslip)
    .map((payslip) =>
      entry(
        AuditAction.PAYSLIP_CREATED,
        `${nameByEmployee.get(String(payslip.employeeId)) ?? ''} - ${String(payslip.month).padStart(2, '0')}/${payslip.year}`,
        describeValues({
          month: payslip.month,
          year: payslip.year,
          basicSalary: payslip.basicSalary,
          allowances: payslip.allowances,
          deductions: payslip.deductions,
          netSalary: payslip.netSalary,
        }),
        payslip.createdAt,
      ),
    );

  const raises = SALARY_HISTORY.map(({ person, from, daysAgo }) =>
    entry(
      AuditAction.SALARY_UPDATED,
      names[person],
      [{ field: 'basicSalary', from, to: PEOPLE[person].basicSalary }],
      new Date(now.getTime() - daysAgo * DAY_MS),
    ),
  );

  const retitled = entry(
    AuditAction.EMPLOYEE_UPDATED,
    names[POSITION_HISTORY.person],
    [
      {
        field: 'position',
        from: POSITION_HISTORY.from,
        to: PEOPLE[POSITION_HISTORY.person].position,
      },
    ],
    new Date(now.getTime() - POSITION_HISTORY.daysAgo * DAY_MS),
  );

  return [...decisions, ...issued, ...raises, retitled];
}

function buildNotifications({
  now,
  adminId,
  demoEmployee,
  names,
  leaves,
  payslips,
}: NotificationInput): DemoDataset['notifications'] {
  const entry = (
    userId: Types.ObjectId,
    content: NotificationContent,
    createdAt: Date,
    read: boolean,
  ): DemoDataset['notifications'][number] => {
    const created = new Date(Math.min(now.getTime(), createdAt.getTime()));

    return {
      userId,
      ...content,
      readAt: read
        ? new Date(
            Math.min(
              now.getTime(),
              created.getTime() + NOTIFICATION_READ_DELAY_HOURS * HOUR_MS,
            ),
          )
        : null,
      createdAt: created,
    };
  };

  const periodOf = (index: number) =>
    formatLeavePeriod(leaves[index].startDate, leaves[index].endDate);

  const pending = LEAVE_TEMPLATES.flatMap((template, index) =>
    template.status === LeaveStatus.PENDING ? [{ template, index }] : [],
  );
  const oldestFiled = Math.max(
    ...pending.map(({ template }) => template.filedDaysAgo),
  );

  const requests = pending.map(({ template, index }) =>
    entry(
      adminId,
      leaveRequestedContent({
        employeeName: names[template.person],
        leaveType: template.type,
        period: periodOf(index),
      }),
      leaves[index].createdAt,
      template.filedDaysAgo === oldestFiled,
    ),
  );

  const decisions = LEAVE_TEMPLATES.flatMap((template, index) =>
    template.person === 0 && template.status !== LeaveStatus.PENDING
      ? [
          entry(
            demoEmployee.userId,
            leaveDecisionContent({
              status: template.status,
              leaveType: template.type,
              period: periodOf(index),
            }),
            new Date(
              leaves[index].createdAt.getTime() +
                AUDIT_DECISION_DELAY_HOURS * HOUR_MS,
            ),
            true,
          ),
        ]
      : [],
  );

  const latestPayslip = payslips
    .filter((payslip) => payslip.employeeId.equals(demoEmployee.employeeId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const issued = latestPayslip
    ? [
        entry(
          demoEmployee.userId,
          payslipIssuedContent(
            `${String(latestPayslip.month).padStart(2, '0')}/${latestPayslip.year}`,
          ),
          latestPayslip.createdAt,
          false,
        ),
      ]
    : [];

  return [...requests, ...decisions, ...issued];
}

export function buildDemoDataset({
  now,
  passwordHash,
}: DemoDatasetInput): DemoDataset {
  const random = createRandom(DEMO_SEED);
  const today = cairoDay(now);

  const staff = PEOPLE.map((person, index) => ({
    person,
    index,
    userId: new mongoose.Types.ObjectId(),
    employeeId: new mongoose.Types.ObjectId(),
    email:
      `${person.firstName}.${person.lastName}@${DEMO_EMAIL_DOMAIN}`.toLowerCase(),
  }));

  const users: DemoDataset['users'] = [
    {
      _id: new mongoose.Types.ObjectId(),
      email: DEMO_ADMIN_EMAIL,
      password: passwordHash,
      role: Role.ADMIN,
    },
    ...staff.map(({ userId, email }) => ({
      _id: userId,
      email,
      password: passwordHash,
      role: Role.EMPLOYEE,
    })),
  ];

  const employees: DemoDataset['employees'] = staff.map(
    ({ person, index, userId, employeeId, email }) => ({
      _id: employeeId,
      userId,
      firstName: person.firstName,
      lastName: person.lastName,
      email,
      phone: `01000000${String(index).padStart(3, '0')}`,
      position: person.position,
      department: person.department,
      joinDate: new Date(`${person.joinDate}T00:00:00.000Z`),
      bio: person.bio,
    }),
  );

  const salaries: DemoDataset['salaries'] = staff.map(
    ({ person, employeeId }) => ({
      employeeId,
      basicSalary: person.basicSalary,
      allowances: person.allowances,
      deductions: person.deductions,
    }),
  );

  const leaves: DemoDataset['leaves'] = LEAVE_TEMPLATES.map((template) => ({
    employeeId: staff[template.person].employeeId,
    type: template.type,
    startDate: daysFrom(today, template.from),
    endDate: daysFrom(today, template.to),
    reason: template.reason,
    status: template.status,
    createdAt: new Date(now.getTime() - template.filedDaysAgo * DAY_MS),
  }));

  const attendance: DemoDataset['attendance'] = [];
  const pastWorkdays = Array.from({ length: HISTORY_DAYS }, (_, index) =>
    daysFrom(today, index - HISTORY_DAYS),
  ).filter(isWorkday);

  for (const { employeeId } of staff) {
    for (const day of pastWorkdays) {
      if (isOnApprovedLeave(leaves, employeeId, day) || random() < ABSENCE_RATE)
        continue;
      attendance.push(buildShift(employeeId, day, random));
    }
  }

  if (isWorkday(today)) {
    staff.slice(1, 1 + OPEN_SHIFT_COUNT).forEach(({ employeeId }, position) => {
      if (isOnApprovedLeave(leaves, employeeId, today)) return;

      const earliest = today.getTime() - 2 * HOUR_MS + 60_000;
      const wanted = now.getTime() - (35 + position * 11) * 60_000;

      attendance.push({
        employeeId,
        date: today,
        checkIn: new Date(Math.min(now.getTime(), Math.max(earliest, wanted))),
        checkOut: null,
        status: AttendanceStatus.PRESENT,
        workingHours: null,
        dayType: null,
      });
    });
  }

  const payslips: DemoDataset['payslips'] = [];

  for (const { person, employeeId } of staff) {
    for (let monthsBack = 1; monthsBack <= PAYSLIP_MONTHS; monthsBack += 1) {
      const target = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsBack, 1),
      );

      payslips.push({
        employeeId,
        month: target.getUTCMonth() + 1,
        year: target.getUTCFullYear(),
        basicSalary: person.basicSalary,
        allowances: person.allowances,
        deductions: person.deductions,
        netSalary: person.basicSalary + person.allowances - person.deductions,
        createdAt: new Date(
          Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 1, 10),
        ),
      });
    }
  }

  const auditLogs = buildAuditLogs({
    now,
    actor: { id: users[0]._id, email: DEMO_ADMIN_EMAIL },
    staff,
    leaves,
    payslips,
  });

  const notifications = buildNotifications({
    now,
    adminId: users[0]._id,
    demoEmployee: {
      userId: staff[0].userId,
      employeeId: staff[0].employeeId,
    },
    names: staff.map(({ person }) => fullName(person)),
    leaves,
    payslips,
  });

  return {
    users,
    employees,
    salaries,
    attendance,
    leaves,
    payslips,
    auditLogs,
    notifications,
  };
}
