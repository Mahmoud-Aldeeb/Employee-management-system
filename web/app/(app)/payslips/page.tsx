import type { Metadata } from 'next';
import PayslipsView from '@/components/payslips/PayslipsView';

export const metadata: Metadata = { title: 'Payslips' };

export default function PayslipsPage() {
  return <PayslipsView />;
}