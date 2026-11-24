import type { Metadata } from 'next';
import AuditLogView from '@/components/audit-log/AuditLogView';

export const metadata: Metadata = { title: 'Audit Log' };

export default function AuditLogPage() {
  return <AuditLogView />;
}