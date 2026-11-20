export type DemoRole = 'admin' | 'employee';

export const DEMO_EMAIL_DOMAIN = 'demo.example.com';
export const DEMO_ADMIN_EMAIL = `admin@${DEMO_EMAIL_DOMAIN}`;
export const DEMO_EMPLOYEE_EMAIL = `salma.farouk@${DEMO_EMAIL_DOMAIN}`;
export const DEMO_EMAIL_PATTERN = new RegExp(
  `@${DEMO_EMAIL_DOMAIN.replaceAll('.', '\\.')}$`,
  'i',
);

export function isDemoEmail(email: string) {
  return email.toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}
