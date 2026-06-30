import type { DailyReportRow } from '../types';
import { formatTime } from '../lib/format';

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  LATE: 'bg-amber-100 text-amber-800',
  LEAVE: 'bg-blue-100 text-blue-800',
  WFH: 'bg-purple-100 text-purple-800',
  HALF_DAY: 'bg-orange-100 text-orange-800',
  ABSENT: 'bg-red-100 text-red-800',
};

interface AttendanceListProps {
  rows: DailyReportRow[];
}

export default function AttendanceList({ rows }: AttendanceListProps) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">No records for this filter.</div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-left">
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Check-in</th>
              <th className="pb-2 pr-4 font-medium">Check-out</th>
              <th className="pb-2 pr-4 font-medium">Min. Late</th>
              <th className="pb-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4 font-medium text-gray-900">{row.name}</td>
                <td className="py-2.5 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row.status] ?? ''}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-gray-600">{formatTime(row.check_in_time)}</td>
                <td className="py-2.5 pr-4 text-gray-600">{formatTime(row.check_out_time)}</td>
                <td className="py-2.5 pr-4 text-gray-600">{row.minutes_late || '—'}</td>
                <td className="py-2.5 text-gray-500 max-w-[200px] truncate">{row.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{row.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row.status] ?? ''}`}>
                {row.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex gap-3">
              <span>In: {formatTime(row.check_in_time)}</span>
              <span>Out: {formatTime(row.check_out_time)}</span>
              {row.minutes_late > 0 && <span className="text-amber-600">{row.minutes_late}m late</span>}
            </div>
            {row.reason && (
              <p className="text-xs text-gray-500 mt-1 italic">{row.reason}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
