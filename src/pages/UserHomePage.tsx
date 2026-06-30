import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import { CheckCircle, Clock, MapPin, AlertCircle, RefreshCw, ClipboardList, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { getCurrentPosition } from '../lib/geolocation';
import { formatTime } from '../lib/format';
import { useAuth } from '../lib/auth';
import Spinner from '../components/Spinner';
import type {
  TodayResponse, StatsResponse, MarkAttendanceRequest, MarkAttendanceResponse,
  CheckoutResponse, AttendanceStatus, TimeConfig,
} from '../types';

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Working', LATE: 'Late', LEAVE: 'Leave',
  HALF_DAY: 'Half Day', ABSENT: 'Absent',
};

const STATUS_OPTIONS: AttendanceStatus[] = ['PRESENT', 'LATE', 'LEAVE', 'HALF_DAY'];
const NEEDS_REASON: AttendanceStatus[]   = ['LATE', 'LEAVE', 'HALF_DAY'];
const ON_SITE: AttendanceStatus[]        = ['PRESENT', 'LATE', 'HALF_DAY'];
const STAT_ORDER: AttendanceStatus[]     = ['PRESENT', 'LATE', 'LEAVE', 'HALF_DAY', 'ABSENT'];

const statBorderColor: Record<string, string> = {
  PRESENT: '#22c55e', LATE: '#f59e0b', LEAVE: '#3b82f6', HALF_DAY: '#fb923c', ABSENT: '#f87171',
};
const statNumColor: Record<string, string> = {
  PRESENT: '#15803d', LATE: '#b45309', LEAVE: '#1d4ed8', HALF_DAY: '#c2410c', ABSENT: '#b91c1c',
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
    <Chip
      label={STATUS_LABEL[status] ?? status}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.72rem', ...(chipSx[status] ?? {}) }}
    />
  );
}

function getMinutesInTz(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value   ?? '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    return h * 60 + m;
  } catch {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes();
  }
}

function inferStatus(cfg: TimeConfig): AttendanceStatus {
  const current = getMinutesInTz(cfg.timezone);
  const [h, m] = cfg.expectedLoginTime.split(':').map(Number);
  return current > h * 60 + m + cfg.gracePeriodMinutes ? 'LATE' : 'PRESENT';
}

function formatTzTime(timezone: string): string {
  try {
    return new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

function formatHHMM(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

type GeoState = { loading: boolean; lat?: number; lng?: number; accuracy?: number; error?: string };

export default function UserHomePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen]   = useState(false);
  const [status, setStatus]         = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason]         = useState('');
  const [geoState, setGeoState]     = useState<GeoState>({ loading: false });
  const [submitError, setSubmitError] = useState('');
  const [officeTime, setOfficeTime] = useState('');

  const configQ = useQuery({ queryKey: ['config', 'time'], queryFn: () => api<TimeConfig>('/api/v1/config/time') });
  const todayQ  = useQuery({ queryKey: ['attendance', 'today'], queryFn: () => api<TodayResponse>('/api/v1/attendance/today') });
  const statsQ  = useQuery({ queryKey: ['users', 'me', 'stats', 'month'], queryFn: () => api<StatsResponse>('/api/v1/users/me/stats?period=month') });

  useEffect(() => {
    const tz = configQ.data?.timezone ?? 'UTC';
    setOfficeTime(formatTzTime(tz));
    const t = setInterval(() => setOfficeTime(formatTzTime(tz)), 30_000);
    return () => clearInterval(t);
  }, [configQ.data?.timezone]);

  const geofencingEnabled = configQ.data?.geofencingEnabled ?? true;

  async function fetchGeo() {
    setGeoState({ loading: true });
    try {
      const pos = await getCurrentPosition();
      setGeoState({ loading: false, ...pos });
    } catch {
      setGeoState({ loading: false, error: 'Could not get location. Please enable GPS.' });
    }
  }

  function resetForm() { setReason(''); setGeoState({ loading: false }); setSubmitError(''); }

  function openModal() {
    const inferred = configQ.data ? inferStatus(configQ.data) : 'PRESENT';
    setStatus(inferred); resetForm(); setModalOpen(true);
    if (geofencingEnabled && ON_SITE.includes(inferred)) void fetchGeo();
  }

  function handleStatusChange(s: AttendanceStatus) {
    setStatus(s); setGeoState({ loading: false }); setSubmitError('');
    if (geofencingEnabled && ON_SITE.includes(s)) void fetchGeo();
  }

  const markMutation = useMutation({
    mutationFn: (body: MarkAttendanceRequest) =>
      api<MarkAttendanceResponse>('/api/v1/attendance/mark', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance', 'today'] }); qc.invalidateQueries({ queryKey: ['users', 'me', 'stats'] }); setModalOpen(false); resetForm(); },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        const msgs: Record<string, string> = {
          outside_geofence:         "You're not at the office location. Move closer and try again.",
          gps_accuracy_too_low:     'GPS signal is weak. Move to an open area and retry.',
          already_marked:           "You've already marked attendance today.",
          reason_required:          'Please provide a reason.',
          reason_required_for_late: 'You are past the grace period. Select Late and add a reason.',
          location_required:        'Location required. Enable GPS and retry.',
        };
        setSubmitError(msgs[err.code] ?? err.message);
        if (err.code === 'reason_required_for_late') setStatus('LATE');
      } else { setSubmitError('Something went wrong. Please try again.'); }
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api<CheckoutResponse>('/api/v1/attendance/checkout', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance', 'today'] }),
  });

  async function handleSubmit() {
    setSubmitError('');
    const body: MarkAttendanceRequest = { status };
    if (NEEDS_REASON.includes(status) && reason.trim()) body.reason = reason.trim();
    if (geoState.lat !== undefined) { body.lat = geoState.lat; body.lng = geoState.lng; body.accuracy = geoState.accuracy; }
    markMutation.mutate(body);
  }

  const needsGeo    = geofencingEnabled && ON_SITE.includes(status);
  const geoReady    = !needsGeo || (geoState.lat !== undefined && !geoState.loading);
  const reasonReady = !NEEDS_REASON.includes(status) || reason.trim().length > 0;
  const canSubmit   = geoReady && reasonReady;
  const record      = todayQ.data?.record;
  const stats       = statsQ.data?.counts;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Box sx={{ maxWidth: '1152px', mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>

        {/* ── Left column ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Greeting */}
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Hi, {user?.name?.split(' ')[0] ?? 'there'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>{today}</Typography>
          </Box>

          {/* Today card */}
          {todayQ.isLoading ? (
            <Card sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <Spinner size="lg" />
            </Card>

          ) : record ? (
            /* Marked */
            <Card sx={{ borderWidth: 2, borderColor: chipSx[record.status] ? (chipSx[record.status] as { bgcolor?: string }).bgcolor ?? 'divider' : 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'success.main' }}>
                  <CheckCircle size={18} />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">Today's Attendance</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StatusChip status={record.status} />
                  {record.minutes_late > 0 && (
                    <Chip
                      label={`${record.minutes_late} min late`}
                      size="small"
                      sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                  <Clock size={14} />
                  <Typography variant="body2">
                    {record.check_out_time ? (
                      <>In <strong>{formatTime(record.check_in_time)}</strong> · Out <strong>{formatTime(record.check_out_time)}</strong></>
                    ) : (
                      <>Checked in at <strong>{formatTime(record.check_in_time)}</strong></>
                    )}
                  </Typography>
                </Box>

                {record.reason && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                    "{record.reason}"
                  </Typography>
                )}

                {!record.check_out_time && (
                  <MuiButton
                    variant="outlined" color="inherit" fullWidth
                    sx={{ mt: 2.5, borderColor: 'divider', color: 'text.primary' }}
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? 'Checking out…' : 'Check Out'}
                  </MuiButton>
                )}
              </CardContent>
            </Card>

          ) : (
            /* Not marked */
            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <ClipboardList size={30} color="#2563eb" />
                </Box>
                <Typography variant="h6" fontWeight={700} mb={0.5}>You haven't marked attendance today</Typography>
                {officeTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3, color: 'text.secondary' }}>
                    <Clock size={13} />
                    <Typography variant="body2">Office time: {officeTime}</Typography>
                  </Box>
                )}
                <MuiButton
                  variant="contained" size="large" fullWidth
                  onClick={openModal} disabled={configQ.isLoading}
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  Mark Attendance
                </MuiButton>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* ── Stats sidebar ── */}
        <Card>
          <CardHeader
            title="This Month"
            titleTypographyProps={{ variant: 'subtitle2', textTransform: 'uppercase', letterSpacing: 1 }}
            sx={{ pb: 0 }}
          />
          <CardContent sx={{ pt: 1.5 }}>
            {statsQ.isLoading ? (
              <Box sx={{ py: 4 }}><Spinner /></Box>
            ) : stats ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {STAT_ORDER.map((key) => {
                  const count = stats[key as keyof typeof stats] ?? 0;
                  return (
                    <Paper
                      key={key}
                      variant="outlined"
                      sx={{
                        borderLeft: `4px solid ${statBorderColor[key]}`,
                        borderColor: `${statBorderColor[key]} !important`,
                        borderLeftColor: `${statBorderColor[key]} !important`,
                        borderWidth: '1px',
                        borderLeftWidth: '4px',
                        px: 2, py: 1.25,
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="h5" fontWeight={700} sx={{ color: statNumColor[key], lineHeight: 1 }}>
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{STATUS_LABEL[key]}</Typography>
                    </Paper>
                  );
                })}
              </Box>
            ) : null}
          </CardContent>
        </Card>

      </Box>

      {/* ── Mark Attendance Dialog ── */}
      <Dialog
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
          Mark Attendance
          <IconButton onClick={() => { setModalOpen(false); resetForm(); }} size="small"
            sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Login time banner */}
            {configQ.data && (
              <Alert
                severity={status === 'LATE' ? 'warning' : 'info'}
                icon={<Clock size={16} />}
                sx={{ borderRadius: 2 }}
              >
                Login by <strong>{formatHHMM(configQ.data.expectedLoginTime)}</strong>
                {' · '}Grace <strong>{configQ.data.gracePeriodMinutes} min</strong>
                {status === 'LATE' && <strong> · You are late</strong>}
              </Alert>
            )}

            {/* Status toggle */}
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Select Status</Typography>
              <ToggleButtonGroup
                exclusive
                value={status}
                onChange={(_, v: AttendanceStatus | null) => { if (v) handleStatusChange(v); }}
                sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, width: '100%' }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <ToggleButton
                    key={s} value={s}
                    sx={{
                      py: 1.5, borderRadius: '8px !important',
                      border: '2px solid !important',
                      borderColor: status === s ? 'primary.main !important' : 'divider !important',
                      fontWeight: 700, fontSize: '0.875rem',
                      '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* GPS section */}
            {needsGeo && (
              <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MapPin size={16} color={geoState.error ? '#dc2626' : '#2563eb'} />
                    {geoState.loading ? (
                      <Typography variant="body2" color="text.secondary">Getting location…</Typography>
                    ) : geoState.error ? (
                      <Typography variant="body2" color="error.main" fontSize="0.8rem">{geoState.error}</Typography>
                    ) : geoState.accuracy !== undefined ? (
                      <Typography variant="body2">Captured · <strong>{Math.round(geoState.accuracy)}m</strong> accuracy</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Location not captured</Typography>
                    )}
                  </Box>
                  {geoState.loading ? <Spinner size="sm" /> : (geoState.error || geoState.lat === undefined) ? (
                    <MuiButton size="small" startIcon={<RefreshCw size={12} />} onClick={() => void fetchGeo()} sx={{ minWidth: 0 }}>
                      Retry
                    </MuiButton>
                  ) : null}
                </Box>
              </Paper>
            )}

            {/* Reason */}
            {NEEDS_REASON.includes(status) && (
              <TextField
                label="Reason *"
                multiline rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter your reason…"
                fullWidth
              />
            )}

            {/* Submit error */}
            {submitError && (
              <Alert severity="error" icon={<AlertCircle size={16} />} sx={{ borderRadius: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <MuiButton variant="outlined" color="inherit" fullWidth
            onClick={() => { setModalOpen(false); resetForm(); }}
            sx={{ borderColor: 'divider', color: 'text.primary', borderRadius: 2 }}>
            Cancel
          </MuiButton>
          <MuiButton variant="contained" fullWidth
            disabled={!canSubmit || markMutation.isPending}
            onClick={handleSubmit}
            sx={{ borderRadius: 2 }}>
            {markMutation.isPending ? 'Submitting…' : 'Submit'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
