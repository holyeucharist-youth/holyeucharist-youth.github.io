import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary:    { main: '#2563eb', dark: '#1d4ed8', light: '#3b82f6' },
    secondary:  { main: '#64748b' },
    success:    { main: '#16a34a' },
    warning:    { main: '#d97706' },
    error:      { main: '#dc2626' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text:       { primary: '#111827', secondary: '#6b7280' },
    divider:    '#e5e7eb',
  },
  typography: {
    fontFamily: [
      'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif',
    ].join(','),
    fontSize: 14,
    h6:       { fontWeight: 600 },
    subtitle1:{ fontWeight: 600 },
    subtitle2:{ fontWeight: 600, fontSize: '0.8rem', color: '#6b7280' },
    caption:  { fontSize: '0.72rem' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      defaultProps:   { elevation: 0, variant: 'outlined' },
      styleOverrides: { root: { borderColor: '#e5e7eb' } },
    },
    MuiPaper: {
      styleOverrides: { outlined: { borderColor: '#e5e7eb' } },
    },
    MuiButton: {
      defaultProps:   { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 } },
    },
    MuiToggleButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderBottom: '1px solid #e5e7eb',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(37,99,235,0.04)',
          },
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #f3f4f6',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { height: 22, fontSize: '0.7rem', fontWeight: 700 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiSelect: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiSwitch: {
      defaultProps: { color: 'primary' },
    },
  },
});
