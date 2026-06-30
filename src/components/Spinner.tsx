import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const px = { sm: 16, md: 24, lg: 40 };

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <CircularProgress size={px[size]} thickness={4} />
    </Box>
  );
}
