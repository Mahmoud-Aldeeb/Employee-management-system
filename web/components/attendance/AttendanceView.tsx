'use client';

import { CalendarIcon, DownloadIcon, ListIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import { useAttendance } from '@/hooks/use-attendance';
import { cairoDateKey, dayKey } from '@/lib/dates';
import { getErrorMessage } from '@/lib/errors';
import { exportToCSV, type CsvColumn } from '@/lib/export-csv';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceHistory from './AttendanceHistory';
import AttendanceStats from './AttendanceStats';
import CheckInCard from './CheckInCard';

type ViewMode = 'table' | 'calendar';

const EXPORT_COLUMNS: CsvColumn[] = [
  { label: 'Date', key: 'date' },
  { label: 'Status', key: 'status' },
  { label: 'Check In', key: 'checkIn' },
  { label: 'Check Out', key: 'checkOut' },
  { label: 'Working Hours', key: 'workingHours' },
  { label: 'Day Type', key: 'dayType' },
];

const toggleClass = (active: boolean) =>
  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
  }`;

export default function AttendanceView() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { data, isPending, isError, error } = useAttendance();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error, 'Failed to load attendance'));
  }, [isError, error]);

  if (isPending) return <Loading fullScreen={false} />;

  if (!data) {
    return <p className="py-12 text-center text-slate-500">Failed to load attendance</p>;
  }

  const history = data.data;
  const todayRecord = history.find((record) => dayKey(record.date) === cairoDateKey());

  const handleExport = () => {
    if (!exportToCSV(history, 'attendance_history', EXPORT_COLUMNS)) {
      toast.error('No attendance records to export');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your work hours and daily check-ins</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <DownloadIcon className="size-4" /> Export CSV
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={toggleClass(viewMode === 'table')}
            >
              <ListIcon className="size-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={toggleClass(viewMode === 'calendar')}
            >
              <CalendarIcon className="size-3.5" /> Calendar
            </button>
          </div>
        </div>
      </div>

      {data.employee.isDeleted ? (
        <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-rose-600">
            You can no longer clock in or out because your employee records have been marked as
            deleted.
          </p>
        </div>
      ) : (
        <div className="mb-6 sm:mb-8">
          <CheckInCard todayRecord={todayRecord} />
        </div>
      )}

      <AttendanceStats history={history} />

      {viewMode === 'calendar' ? (
        <AttendanceCalendar history={history} />
      ) : (
        <AttendanceHistory history={history} />
      )}
    </div>
  );
}