import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { MapPin, Trash2, Clock, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { getCurrentPosition } from '../lib/geolocation';
import { formatDate } from '../lib/format';
import type { TimeConfig, Location, Holiday } from '../types';
import Spinner from '../components/Spinner';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const headSx = { fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', bgcolor: 'grey.50' };
const cellSx = { py: 1.25, fontSize: '0.875rem' };

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} color="text.secondary">
        {title}
      </Typography>
    </Box>
  );
}

export default function AdminConfigPage() {
  const qc = useQueryClient();

  const timeQ = useQuery({ queryKey: ['config', 'time'], queryFn: () => api<TimeConfig>('/api/v1/config/time') });
  const [timeForm, setTimeForm] = useState<Partial<TimeConfig>>({});
  const [timeSaved, setTimeSaved] = useState(false);

  useEffect(() => { if (timeQ.data) setTimeForm(timeQ.data); }, [timeQ.data]);

  const timeMutation = useMutation({
    mutationFn: (data: Partial<TimeConfig>) => api('/api/v1/config/time', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config', 'time'] }); setTimeSaved(true); setTimeout(() => setTimeSaved(false), 2000); },
  });

  function toggleWorkingDay(day: number) {
    const current = timeForm.workingDays ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    setTimeForm((f) => ({ ...f, workingDays: next }));
  }

  const locsQ = useQuery({ queryKey: ['config', 'locations'], queryFn: () => api<{ locations: Location[] }>('/api/v1/config/locations') });
  const [locGeo, setLocGeo] = useState<{ loading: boolean; lat?: number; lng?: number; accuracy?: number; error?: string }>({ loading: false });

  const addLocMutation = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      api('/api/v1/config/locations', { method: 'POST', body: JSON.stringify({ name: `Office (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng, radiusMeters: 100 }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config', 'locations'] }); setLocGeo({ loading: false }); },
    onError: () => setLocGeo((g) => ({ ...g, error: 'Failed to save location.' })),
  });

  const delLocMutation = useMutation({
    mutationFn: (id: number) => api(`/api/v1/config/locations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'locations'] }),
  });

  async function captureAndAdd() {
    setLocGeo({ loading: true });
    try {
      const pos = await getCurrentPosition();
      setLocGeo({ loading: false, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy });
      addLocMutation.mutate({ lat: pos.lat, lng: pos.lng });
    } catch {
      setLocGeo({ loading: false, error: 'Could not get GPS. Enable location access.' });
    }
  }

  const holsQ = useQuery({ queryKey: ['config', 'holidays'], queryFn: () => api<{ holidays: Holiday[] }>('/api/v1/config/holidays') });
  const [newHol, setNewHol] = useState({ date: '', name: '' });

  const addHolMutation = useMutation({
    mutationFn: () => api('/api/v1/config/holidays', { method: 'POST', body: JSON.stringify({ date: newHol.date, name: newHol.name }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config', 'holidays'] }); setNewHol({ date: '', name: '' }); },
  });

  const delHolMutation = useMutation({
    mutationFn: (id: number) => api(`/api/v1/config/holidays/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'holidays'] }),
  });

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
        <Typography variant="caption" color="text.disabled">Admin › Configuration</Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>System Configuration</Typography>
      </Box>

      <Box sx={{ flex: 1, px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 720 }}>

        {/* ── Time Config ── */}
        <Card variant="outlined">
          <PanelHeader icon={<Clock size={14} color="#6b7280" />} title="Time Configuration" />
          <Box sx={{ p: 3 }}>
            {timeQ.isLoading ? (
              <Box sx={{ py: 4 }}><Spinner /></Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField label="Expected Login Time" type="time" value={timeForm.expectedLoginTime ?? ''}
                    onChange={(e) => setTimeForm((f) => ({ ...f, expectedLoginTime: e.target.value }))}
                    slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField label="Grace Period (minutes)" type="number"
                    slotProps={{ htmlInput: { min: 0, max: 240 } }}
                    value={timeForm.gracePeriodMinutes ?? ''}
                    onChange={(e) => setTimeForm((f) => ({ ...f, gracePeriodMinutes: parseInt(e.target.value) }))} fullWidth />
                  <TextField label="Expected Logout Time" type="time" value={timeForm.expectedLogoutTime ?? ''}
                    onChange={(e) => setTimeForm((f) => ({ ...f, expectedLogoutTime: e.target.value }))}
                    slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  <TextField label="Timezone" value={timeForm.timezone ?? ''}
                    onChange={(e) => setTimeForm((f) => ({ ...f, timezone: e.target.value }))} fullWidth />
                  <TextField label="Min GPS Accuracy (meters)" type="number"
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={timeForm.minGpsAccuracyMeters ?? ''}
                    onChange={(e) => setTimeForm((f) => ({ ...f, minGpsAccuracyMeters: parseInt(e.target.value) }))} fullWidth />
                </Box>

                {/* Geofencing toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 2.5, py: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Geofencing</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {timeForm.geofencingEnabled
                        ? 'Employees must be within the office radius to mark attendance.'
                        : 'Location check disabled — mark attendance from anywhere.'}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!timeForm.geofencingEnabled}
                        onChange={(e) => setTimeForm((f) => ({ ...f, geofencingEnabled: e.target.checked }))}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Working days */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Working Days</Typography>
                  <ToggleButtonGroup
                    value={timeForm.workingDays ?? []}
                    onChange={(_, next: number[]) => setTimeForm((f) => ({ ...f, workingDays: next }))}
                    sx={{ flexWrap: 'wrap', gap: 0.75 }}
                  >
                    {DAYS.map((day, i) => (
                      <ToggleButton key={i} value={i} size="small"
                        onClick={() => toggleWorkingDay(i)}
                        selected={timeForm.workingDays?.includes(i) ?? false}
                        sx={{ px: 2, py: 0.75, borderRadius: '8px !important', border: '1px solid !important', borderColor: 'divider !important', '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main !important' } }}>
                        {day}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MuiButton variant="contained" size="medium" disabled={timeMutation.isPending}
                    onClick={() => timeMutation.mutate(timeForm)}>
                    {timeMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </MuiButton>
                  {timeSaved && <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>Saved!</Typography>}
                  {timeMutation.isError && <Typography variant="body2" color="error.main">Save failed.</Typography>}
                </Box>
              </Box>
            )}
          </Box>
        </Card>

        {/* ── Office Locations ── */}
        <Card variant="outlined">
          <PanelHeader icon={<MapPin size={14} color="#6b7280" />} title="Office Locations" />
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Stand at the office and tap "Add Current Location". The geofence radius is 100 m.
            </Typography>
            {locsQ.isLoading ? (
              <Box sx={{ py: 3 }}><Spinner /></Box>
            ) : (
              <>
                {(locsQ.data?.locations ?? []).length > 0 && (
                  <TableContainer sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headSx}>Name</TableCell>
                          <TableCell sx={headSx}>Coordinates</TableCell>
                          <TableCell sx={{ ...headSx, width: 48 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(locsQ.data?.locations ?? []).map((loc) => (
                          <TableRow key={loc.id} hover>
                            <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{loc.name}</TableCell>
                            <TableCell sx={{ ...cellSx, color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · {loc.radius_meters}m
                            </TableCell>
                            <TableCell sx={cellSx} align="center">
                              <IconButton size="small" color="error" onClick={() => delLocMutation.mutate(loc.id)}>
                                <Trash2 size={15} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                <MuiButton variant="contained" startIcon={<MapPin size={15} />}
                  disabled={locGeo.loading || addLocMutation.isPending} onClick={captureAndAdd}>
                  {locGeo.loading ? 'Getting GPS…' : addLocMutation.isPending ? 'Saving…' : 'Add Current Location'}
                </MuiButton>
                {locGeo.accuracy !== undefined && !locGeo.error && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Captured · {locGeo.lat?.toFixed(5)}, {locGeo.lng?.toFixed(5)} · accuracy {Math.round(locGeo.accuracy)}m
                  </Typography>
                )}
                {locGeo.error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{locGeo.error}</Alert>}
                {addLocMutation.isSuccess && <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>Location saved.</Alert>}
              </>
            )}
          </Box>
        </Card>

        {/* ── Holidays ── */}
        <Card variant="outlined">
          <PanelHeader icon={<Calendar size={14} color="#6b7280" />} title="Holidays" />
          <Box sx={{ p: 3 }}>
            {holsQ.isLoading ? (
              <Box sx={{ py: 3 }}><Spinner /></Box>
            ) : (
              <>
                {(holsQ.data?.holidays ?? []).length > 0 && (
                  <TableContainer sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={headSx}>Holiday</TableCell>
                          <TableCell sx={headSx}>Date</TableCell>
                          <TableCell sx={{ ...headSx, width: 48 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(holsQ.data?.holidays ?? []).map((hol) => (
                          <TableRow key={hol.id} hover>
                            <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{hol.name}</TableCell>
                            <TableCell sx={{ ...cellSx, color: 'text.secondary' }}>{formatDate(hol.date)}</TableCell>
                            <TableCell sx={cellSx} align="center">
                              <IconButton size="small" color="error" onClick={() => delHolMutation.mutate(hol.id)}>
                                <Trash2 size={15} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                <Divider sx={{ mb: 2.5 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                  <TextField type="date" size="small" label="Date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={newHol.date} onChange={(e) => setNewHol((f) => ({ ...f, date: e.target.value }))}
                    sx={{ width: 155 }} />
                  <TextField size="small" label="Holiday name" placeholder="e.g. Christmas"
                    value={newHol.name} onChange={(e) => setNewHol((f) => ({ ...f, name: e.target.value }))}
                    sx={{ flex: '1 1 160px' }} />
                  <MuiButton variant="contained" size="medium" disabled={!newHol.date || !newHol.name || addHolMutation.isPending}
                    onClick={() => addHolMutation.mutate()}>
                    {addHolMutation.isPending ? 'Adding…' : 'Add Holiday'}
                  </MuiButton>
                </Box>
              </>
            )}
          </Box>
        </Card>

      </Box>
    </Box>
  );
}
