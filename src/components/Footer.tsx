import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MuiLink from '@mui/material/Link';
import { currentYear } from '../lib/format';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'background.paper', mt: 'auto' }}>
      <Divider />
      <Box
        sx={{
          maxWidth: '1152px', mx: 'auto', px: 2, py: 1.5,
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center', justifyContent: 'space-between', gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {currentYear()} Office Attendance
        </Typography>
        <Box sx={{ display: 'flex', gap: 2.5 }}>
          <MuiLink href="#" variant="caption" color="text.secondary" underline="hover">Privacy</MuiLink>
          <MuiLink href="#" variant="caption" color="text.secondary" underline="hover">Help</MuiLink>
        </Box>
      </Box>
    </Box>
  );
}
