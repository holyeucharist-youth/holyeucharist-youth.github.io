import { Link, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { LayoutDashboard, Users, Settings, ClipboardCheck } from 'lucide-react';

const navItems = [
  { label: 'Dashboard',     to: '/admin',            icon: LayoutDashboard },
  { label: 'Users',         to: '/admin/users',      icon: Users },
  { label: 'Config',        to: '/admin/config',     icon: Settings },
  { label: 'My Attendance', to: '/admin/attendance', icon: ClipboardCheck },
];

export default function AdminSidebar() {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        width: 208,
        flexShrink: 0,
        bgcolor: 'grey.900',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <List dense disablePadding sx={{ py: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2, mb: 0.5, display: 'block',
            color: 'grey.600', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          Navigation
        </Typography>

        {navItems.map(({ label, to, icon: Icon }) => {
          const active = isActive(to);
          return (
            <ListItem key={to} disablePadding>
              <ListItemButton
                component={Link}
                to={to}
                selected={active}
                sx={{
                  borderLeft: '2px solid',
                  borderColor: active ? 'primary.light' : 'transparent',
                  pl: 1.75,
                  py: 1.1,
                  color: active ? 'white' : 'grey.400',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                  '&:hover': { bgcolor: 'grey.800', color: 'grey.100' },
                  transition: 'all 0.15s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <Icon size={15} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <span style={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}>
                      {label}
                    </span>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
