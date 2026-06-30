import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import { api } from '../lib/api';
import { getPref, setPref } from '../lib/prefs';
import { useFilterState } from '../components/FilterBar';
import FilterBar from '../components/FilterBar';
import Scorecard from '../components/Scorecard';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import { formatDate, formatTime } from '../lib/format';
import type {
  DailyReportResponse, MonthlyReportRow, MonthlyReportResponse,
  RangeReportResponse, User, AttendanceStatus,
} from '../types';

type SortKey = keyof MonthlyReportRow;

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Working', LATE: 'Late', LEAVE: 'Leave', HALF_DAY: 'Half Day', ABSENT: 'Absent',
};

const chipSx: Record<string, object> = {
  PRESENT:  { bgcolor: '#dcfce7', color: '#15803d' },
  LATE:     { bgcolor: '#fef3c7', color: '#b45309' },
  LEAVE:    { bgcolor: '#dbeafe', color: '#1d4ed8' },
  HALF_DAY: { bgcolor: '#ffedd5', color: '#c2410c' },
  ABSENT:   { bgcolor: '#fee2e2', color: '#b91c1c' },
};

function StatusChip({ status }: { status: string }) {
  return (
    <Chip label={STATUS_LABEL[status] ?? status} size="small"
      sx={{ fontWeight: 700, fontSize: '0.7rem', ...(chipSx[status] ?? {}) }} />
  );
}

function attendancePct(row: MonthlyReportRow): number {
  if (!row.total_marked) return 0;
  return +((row.present + row.late * 0.5 + row.wfh) / row.total_marked * 100).toFixed(1);
}

export default function AdminDashboardPage() {
  const filter = useFilterState();

  const [pageSize, setPageSize]   = useState(() => getPref('dash_pageSize', 10));
  const [dayPage, setDayPage]     = useState(() => getPref('dash_dayPage', 1));
  const [monthPage, setMonthPage] = useState(() => getPref('dash_monthPage', 1));
  const [rangePage, setRangePage] = useState(() => getPref('dash_rangePage', 1));

  function goSize(s: number) { setPageSize(s); setPref('dash_pageSize', s); setDayPage(1); setMonthPage(1); setRangePage(1); }
  function goDayPage(p: number)   { setDayPage(p);   setPref('dash_dayPage', p); }
  function goMonthPage(p: number) { setMonthPage(p); setPref('dash_monthPage', p); }
  function goRangePage(p: number) { setRangePage(p); setPref('dash_rangePage', p); }

  const [activeCard, setActiveCard] = useState<AttendanceStatus | null>(
    () => getPref<AttendanceStatus | null>('dash_activeCard', null)
  );
  function pickCard(s: AttendanceStatus | null) { setActiveCard(s); setPref('dash_activeCard', s); setDayPage(1); }

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const usersQ = useQuery({ queryKey: ['users'], queryFn: () => api<{ users: User[] }>('/api/v1/users') });

  const dailyQ = useQuery({
    queryKey: ['reports', 'daily', filter.date, activeCard],
    queryFn: () => {
      const qs = activeCard ? `&status=${activeCard}` : '';
      return api<DailyReportResponse>(`/api/v1/reports/daily?date=${filter.date}${qs}`);
    },
    enabled: filter.mode === 'day',
  });

  const monthlyQ = useQuery({
    queryKey: ['reports', 'monthly', filter.month],
    queryFn: () => api<MonthlyReportResponse>(`/api/v1/reports/monthly?month=${filter.month}`),
    enabled: filter.mode === 'month',
  });

  const rangeQ = useQuery({
    queryKey: ['reports', 'range', filter.from, filter.to, filter.userEmail, filter.status],
    queryFn: () => {
      const params = new URLSearchParams({ from: filter.from, to: filter.to });
      if (filter.userEmail) params.set('userEmail', filter.userEmail);
      if (filter.status)    params.set('status', filter.status);
      return api<RangeReportResponse>(`/api/v1/reports/range?${params}`);
    },
    enabled: filter.mode === 'range',
  });

  function handleExport() {
    const token = localStorage.getItem('att_access') ?? '';
    const base  = import.meta.env.VITE_API_BASE_URL as string;
    let url: string;
    if (filter.mode === 'day') {
      url = `${base}/api/v1/reports/export?type=csv&report=range&from=${filter.date}&to=${filter.date}`;
    } else if (filter.mode === 'month') {
      url = `${base}/api/v1/reports/export?type=csv&report=monthly&from=${filter.month}-01&to=${filter.month}-31`;
    } else {
      const p = new URLSearchParams({ type: 'csv', report: 'range', from: filter.from, to: filter.to });
      if (filter.userEmail) p.set('userEmail', filter.userEmail);
      if (filter.status)    p.set('status', filter.status);
      url = `${base}/api/v1/reports/export?${p}`;
    }
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'attendance_export.csv' });
        a.click(); URL.revokeObjectURL(a.href);
      });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a); else { setSortKey(key); setSortAsc(true); }
  }

  const sc = dailyQ.data?.scorecards;
  const allDailyRows  = dailyQ.data?.list ?? [];
  const dailyRows     = allDailyRows.slice((dayPage - 1) * pageSize, dayPage * pageSize);

  const allMonthlyRows = [...(monthlyQ.data?.rows ?? [])].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string')
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });
  const monthlyRows = allMonthlyRows.slice((monthPage - 1) * pageSize, monthPage * pageSize);

  const allRangeRows = rangeQ.data?.rows ?? [];
  const rangeRows    = allRangeRows.slice((rangePage - 1) * pageSize, rangePage * pageSize);

  const userOptions = (usersQ.data?.users ?? []).map((u) => ({ email: u.email, name: u.name }));

  const cellSx = { py: 1.25, fontSize: '0.875rem' };
  const headSx = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'grey.50' };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
        <Typography variant="caption" color="text.disabled">Admin › Reports</Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Attendance Reports</Typography>
      </Box>

      <FilterBar userOptions={userOptions} onExport={handleExport} />

      <Box sx={{ flex: 1, px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── Day Mode ── */}
        {filter.mode === 'day' && (
          dailyQ.isLoading ? (
            <Box sx={{ py: 10 }}><Spinner size="lg" /></Box>
          ) : (
            <>
              {sc && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' }, gap: 2 }}>
                  <Scorecard label="Total Logged In" value={sc.totalLoggedIn} variant="total"
                    active={activeCard === null} onClick={() => pickCard(null)} />
                  <Scorecard label="Working" value={sc.present} variant="present"
                    active={activeCard === 'PRESENT'} onClick={() => pickCard('PRESENT')} />
                  <Scorecard label="Leave" value={sc.leave} variant="leave"
                    active={activeCard === 'LEAVE'} onClick={() => pickCard('LEAVE')} />
                  <Scorecard label="Late" value={sc.late} variant="late"
                    active={activeCard === 'LATE'} onClick={() => pickCard('LATE')} />
                </Box>
              )}

              <Card variant="outlined">
                {allDailyRows.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography color="text.disabled">No records for this date.</Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {['Name','Status','Check-in','Check-out','Min Late','Reason'].map((h) => (
                              <TableCell key={h} sx={headSx}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailyRows.map((row, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{row.name}</TableCell>
                              <TableCell sx={cellSx}><StatusChip status={row.status} /></TableCell>
                              <TableCell sx={cellSx}>{formatTime(row.check_in_time)}</TableCell>
                              <TableCell sx={cellSx}>{formatTime(row.check_out_time)}</TableCell>
                              <TableCell sx={cellSx}>{row.minutes_late || '—'}</TableCell>
                              <TableCell sx={{ ...cellSx, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'text.secondary' }}>{row.reason || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ px: 2 }}>
                      <Pagination total={allDailyRows.length} page={dayPage} pageSize={pageSize} onPage={goDayPage} onPageSize={goSize} />
                    </Box>
                  </>
                )}
              </Card>
            </>
          )
        )}

        {/* ── Month Mode ── */}
        {filter.mode === 'month' && (
          <Card variant="outlined">
            {monthlyQ.isLoading ? (
              <Box sx={{ py: 10 }}><Spinner size="lg" /></Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {([['name','Name'],['present','Working'],['late','Late'],['leaves','Leave'],['half_day','Half Day'],['absent','Absent']] as [SortKey,string][]).map(([key, label]) => (
                          <TableCell key={key} sx={{ ...headSx, cursor: 'pointer', '&:hover': { color: 'text.primary' } }} onClick={() => toggleSort(key)}>
                            {label}{sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''}
                          </TableCell>
                        ))}
                        <TableCell sx={headSx}>Att%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyRows.map((row) => (
                        <TableRow key={row.email} hover>
                          <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{row.name}</TableCell>
                          <TableCell sx={{ ...cellSx, color: '#15803d' }}>{row.present}</TableCell>
                          <TableCell sx={{ ...cellSx, color: '#b45309' }}>{row.late}</TableCell>
                          <TableCell sx={{ ...cellSx, color: '#1d4ed8' }}>{row.leaves}</TableCell>
                          <TableCell sx={{ ...cellSx, color: '#c2410c' }}>{row.half_day}</TableCell>
                          <TableCell sx={{ ...cellSx, color: '#b91c1c' }}>{row.absent}</TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{attendancePct(row)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ px: 2 }}>
                  <Pagination total={allMonthlyRows.length} page={monthPage} pageSize={pageSize} onPage={goMonthPage} onPageSize={goSize} />
                </Box>
              </>
            )}
          </Card>
        )}

        {/* ── Range Mode ── */}
        {filter.mode === 'range' && (
          <Card variant="outlined">
            {rangeQ.isLoading ? (
              <Box sx={{ py: 10 }}><Spinner size="lg" /></Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Date','Name','Status','Check-in','Check-out','Min Late','Reason'].map((h) => (
                          <TableCell key={h} sx={headSx}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rangeRows.map((row, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.name}</TableCell>
                          <TableCell sx={cellSx}><StatusChip status={row.status} /></TableCell>
                          <TableCell sx={cellSx}>{formatTime(row.check_in_time)}</TableCell>
                          <TableCell sx={cellSx}>{formatTime(row.check_out_time)}</TableCell>
                          <TableCell sx={cellSx}>{row.minutes_late || '—'}</TableCell>
                          <TableCell sx={{ ...cellSx, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'text.secondary' }}>{row.reason || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ px: 2 }}>
                  <Pagination total={allRangeRows.length} page={rangePage} pageSize={pageSize} onPage={goRangePage} onPageSize={goSize} />
                </Box>
              </>
            )}
          </Card>
        )}

      </Box>
    </Box>
  );
}
