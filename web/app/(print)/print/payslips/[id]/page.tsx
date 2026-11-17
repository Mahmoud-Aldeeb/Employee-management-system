import type { Metadata } from 'next';
import PrintPayslipView from '@/components/payslips/PrintPayslipView';

export const metadata: Metadata = { title: 'Payslip' };

export default function PrintPayslipPage() {
  return <PrintPayslipView />;
}