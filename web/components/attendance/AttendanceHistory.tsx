import { format } from 'date-fns';
import { getDayTypeDisplay, getWorkingHoursDisplay } from '@/lib/attendance';
import { dayFromKey } from '@/lib/dates';
import { describeLocationProof } from '@/lib/location-proof';
import type { AttendanceRecord } from '@/types';

const STATUS_BADGE = {
  PRESENT: 'badge-success',
  LATE: 'badge-warning',
  ABSENT: 'badge-danger',
} as const;

function formatTime(value: string | null) {
  return value ? format(new Date(value), 'hh:mm a') : '-';
}

function LocationCell({ record }: { record: AttendanceRecord }) {
  const checkIn = describeLocationProof(record.checkInLocation);
  const checkOut = describeLocationProof(record.checkOutLocation);

  if (!checkIn && !checkOut) return <>-</>;

  return (
    <div className="space-y-0.5 text-xs">
      {checkIn && <p className="text-slate-600">In: {checkIn}</p>}
      {checkOut && (
        <p className={record.checkOutLocation?.status === 'INSIDE' ? 'text-slate-600' : 'text-amber-600'}>
          Out: {checkOut}
        </p>
      )}
    </div>
  );
}

export default function AttendanceHistory({ history }: { history: AttendanceRecord[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th className="hidden md:table-cell">Working Hours</th>
              <th className="hidden md:table-cell">Day Type</th>
              <th className="hidden lg:table-cell">Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              history.map((record) => {
                const dayType = getDayTypeDisplay(record);
                return (
                  <tr key={record._id}>
                    <td className="whitespace-nowrap font-medium text-slate-900">
                      {format(dayFromKey(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="whitespace-nowrap text-slate-600">{formatTime(record.checkIn)}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatTime(record.checkOut)}</td>
                    <td className="hidden font-medium text-slate-600 md:table-cell">
                      {getWorkingHoursDisplay(record)}
                    </td>
                    <td className="hidden md:table-cell">
                      {dayType ? (
                        <span className={`badge ${dayType.className}`}>{dayType.label}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <LocationCell record={record} />
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[record.status]}`}>{record.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}