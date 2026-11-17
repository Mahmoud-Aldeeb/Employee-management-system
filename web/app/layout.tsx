import type { Metadata } from 'next';
import { Fira_Code, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Employee Management System',
    template: '%s — Employee MS',
  },
  description:
    'Secure internal dashboard for employee attendance tracking, leave applications, profile management, and payroll payslips.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Employee Management System',
    description: 'Secure internal HR portal for tracking workforce productivity.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${firaCode.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}