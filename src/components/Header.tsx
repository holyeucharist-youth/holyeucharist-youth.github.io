import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { CheckSquare, LogOut, LayoutDashboard, Users, Settings, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

const adminNav = [
  { label: 'Dashboard',    to: '/admin',            icon: LayoutDashboard },
  { label: 'Users',        to: '/admin/users',      icon: Users },
  { label: 'Config',       to: '/admin/config',     icon: Settings },
  { label: 'My Attendance', to: '/admin/attendance', icon: ClipboardCheck },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: 'grey.900', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 40 }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 56, px: { xs: 2, sm: 3 } }}>
        {/* Logo */}
        <Box
          component={Link}
          to={user?.role === 'ADMIN' ? '/admin' : '/'}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'white', mr: 3 }}
        >
          <CheckSquare size={18} color="#60a5fa" />
          <Typography variant="body2" sx={{ fontWeight: 700 }} color="white" noWrap>
            Office Attendance
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {user && (
          <>
            <IconButton
              onClick={(e) => setAnchor(e.currentTarget)}
              size="small"
              sx={{ gap: 0.75, color: 'grey.300', '&:hover': { bgcolor: 'grey.800' }, borderRadius: 2, px: 1 }}
            >
              <Avatar
                sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}
              >
                {user.name?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              <Typography variant="caption" sx={{ color: 'grey.300', fontWeight: 500, display: { xs: 'none', sm: 'block' }, maxWidth: 140 }} noWrap>
                {user.name}
              </Typography>
            </IconButton>

            <Menu
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={() => setAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { elevation: 4, sx: { mt: 0.5, minWidth: 210, borderRadius: 2, border: '1px solid', borderColor: 'divider' } } }}
            >
              {/* User info */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
              </Box>
              <Divider />

              {/* Mobile-only admin nav */}
              {user.role === 'ADMIN' && (
                <Box sx={{ display: { lg: 'none' } }}>
                  <Typography variant="caption" sx={{ px: 2, py: 0.75, display: 'block', color: 'text.disabled', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Navigation
                  </Typography>
                  {adminNav.map(({ label, to, icon: Icon }) => (
                    <MenuItem
                      key={to}
                      component={Link}
                      to={to}
                      selected={isActive(to)}
                      onClick={() => setAnchor(null)}
                      sx={{ fontSize: '0.875rem', gap: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}><Icon size={14} /></ListItemIcon>
                      <ListItemText primary={<span style={{ fontSize: '0.875rem' }}>{label}</span>} />
                    </MenuItem>
                  ))}
                  <Divider />
                </Box>
              )}

              <MenuItem onClick={() => { setAnchor(null); signOut(); }} sx={{ color: 'error.main', gap: 1 }}>
                <ListItemIcon sx={{ minWidth: 28, color: 'error.main' }}><LogOut size={14} /></ListItemIcon>
                <ListItemText primary={<span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sign out</span>} />
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
