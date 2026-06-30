import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

type ScorecardVariant = 'total' | 'present' | 'late' | 'leave' | 'halfday' | 'absent';

interface ScorecardProps {
  label: string;
  value: number;
  variant?: ScorecardVariant;
  active?: boolean;
  onClick?: () => void;
}

const borderColor: Record<ScorecardVariant, string> = {
  total:   '#9ca3af',
  present: '#22c55e',
  late:    '#f59e0b',
  leave:   '#3b82f6',
  halfday: '#fb923c',
  absent:  '#f87171',
};

const numColor: Record<ScorecardVariant, string> = {
  total:   '#374151',
  present: '#15803d',
  late:    '#b45309',
  leave:   '#1d4ed8',
  halfday: '#c2410c',
  absent:  '#b91c1c',
};

export default function Scorecard({ label, value, variant = 'total', active = false, onClick }: ScorecardProps) {
  return (
    <Paper
      component={onClick ? 'button' : 'div'}
      variant="outlined"
      onClick={onClick}
      sx={{
        borderLeft: `4px solid ${borderColor[variant]}`,
        borderColor: `${borderColor[variant]} !important`,
        borderWidth: '1px',
        borderLeftWidth: '4px',
        borderStyle: 'solid',
        borderLeftColor: borderColor[variant],
        outline: active ? `2px solid ${borderColor[variant]}` : 'none',
        outlineOffset: 2,
        p: 2,
        textAlign: 'left',
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, outline 0.15s',
        boxShadow: active ? 2 : 1,
        '&:hover': onClick ? { boxShadow: 3 } : {},
        bgcolor: 'background.paper',
        borderRadius: 2,
        display: 'block',
        background: 'white',
      }}
    >
      <Typography variant="h4" fontWeight={700} sx={{ color: numColor[variant], lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {label}
      </Typography>
    </Paper>
  );
}
