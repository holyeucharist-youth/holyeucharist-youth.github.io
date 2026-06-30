import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { Download } from 'lucide-react';
import { todayIso, currentMonthIso } from '../lib/format';

export type FilterMode = 'day' | 'month' | 'range';

export interface FilterState {
  mode: FilterMode;
  date: string;
  month: string;
  from: string;
  to: string;
  userEmail: string;
  status: string;
}

interface FilterBarProps {
  userOptions?: { email: string; name: string }[];
  onExport?: () => void;
}

export function useFilterState(): FilterState {
  const [params] = useSearchParams();
  return {
    mode:      (params.get('mode') as FilterMode) || 'day',
    date:      params.get('date')      || todayIso(),
    month:     params.get('month')     || currentMonthIso(),
    from:      params.get('from')      || todayIso(),
    to:        params.get('to')        || todayIso(),
    userEmail: params.get('userEmail') || '',
    status:    params.get('status')    || '',
  };
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Working', LATE: 'Late', LEAVE: 'Leave',
  HALF_DAY: 'Half Day', ABSENT: 'Absent',
};

export default function FilterBar({ userOptions = [], onExport }: FilterBarProps) {
  const [params, setParams] = useSearchParams();
  const filter = useFilterState();

  function set(updates: Partial<Record<string, string>>) {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k);
    });
    setParams(next, { replace: true });
  }

  return (
    <Box
      sx={{
        position: 'sticky', top: 0, zIndex: 20,
        bgcolor: 'background.paper',
        borderBottom: '1px solid', borderColor: 'divider',
        px: 3, py: 1.25,
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5,
      }}
    >
      {/* Mode switcher */}
      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter.mode}
        onChange={(_, v: FilterMode) => { if (v) set({ mode: v }); }}
        sx={{ '& .MuiToggleButton-root': { px: 1.75, py: 0.5, fontSize: '0.8rem' } }}
      >
        <ToggleButton value="day">Day</ToggleButton>
        <ToggleButton value="month">Month</ToggleButton>
        <ToggleButton value="range">Range</ToggleButton>
      </ToggleButtonGroup>

      {/* Day picker */}
      {filter.mode === 'day' && (
        <TextField
          type="date"
          size="small"
          slotProps={{ htmlInput: { max: todayIso() } }}
          value={filter.date}
          onChange={(e) => set({ date: e.target.value })}
          sx={{ width: 155 }}
        />
      )}

      {/* Month picker */}
      {filter.mode === 'month' && (
        <TextField
          type="month"
          size="small"
          value={filter.month}
          onChange={(e) => set({ month: e.target.value })}
          sx={{ width: 155 }}
        />
      )}

      {/* Range pickers */}
      {filter.mode === 'range' && (
        <>
          <TextField
            type="date" size="small" label="From"
            slotProps={{ htmlInput: { max: filter.to || todayIso() }, inputLabel: { shrink: true } }}
            value={filter.from}
            onChange={(e) => set({ from: e.target.value })}
            sx={{ width: 155 }}
          />
          <TextField
            type="date" size="small" label="To"
            slotProps={{ htmlInput: { min: filter.from, max: todayIso() }, inputLabel: { shrink: true } }}
            value={filter.to}
            onChange={(e) => set({ to: e.target.value })}
            sx={{ width: 155 }}
          />
          {userOptions.length > 0 && (
            <Select
              size="small"
              value={filter.userEmail}
              onChange={(e) => set({ userEmail: e.target.value })}
              displayEmpty
              sx={{ minWidth: 140, fontSize: '0.875rem' }}
            >
              <MenuItem value=""><em>All users</em></MenuItem>
              {userOptions.map((u) => (
                <MenuItem key={u.email} value={u.email} sx={{ fontSize: '0.875rem' }}>{u.name}</MenuItem>
              ))}
            </Select>
          )}
          <Select
            size="small"
            value={filter.status}
            onChange={(e) => set({ status: e.target.value })}
            displayEmpty
            sx={{ minWidth: 130, fontSize: '0.875rem' }}
          >
            <MenuItem value=""><em>All statuses</em></MenuItem>
            {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
              <MenuItem key={val} value={val} sx={{ fontSize: '0.875rem' }}>{lbl}</MenuItem>
            ))}
          </Select>
        </>
      )}

      {/* Export — right-aligned */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        onClick={onExport}
        startIcon={<Download size={13} />}
        sx={{ ml: 'auto', fontSize: '0.8rem', borderColor: 'divider', color: 'text.secondary' }}
      >
        Export CSV
      </Button>
    </Box>
  );
}
