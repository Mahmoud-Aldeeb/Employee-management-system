import type { Metadata } from 'next';
import LeaveView from '@/components/leave/LeaveView';

export const metadata: Metadata = { title: 'Leave Management' };

export default function LeavePage() {
  return <LeaveView />;
}