import type { Metadata } from 'next';
import TeamCalendarView from '@/components/team-calendar/TeamCalendarView';

export const metadata: Metadata = { title: 'Team Calendar' };

export default function TeamCalendarPage() {
  return <TeamCalendarView />;
}