import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useAuth } from '../../context/AuthContext.jsx';
import { useColorMode } from '../../context/ColorModeContext.jsx';
import NotificationBell from '../NotificationBell.jsx';
import { useLivePoll } from '../../hooks/useLivePoll.js';
import { fetchPendingDocuments } from '../../api/documents';

const PENDING_POLL_MS = 8000;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);

  // Live badge, isolated to this one component — it re-renders on its own poll
  // tick without touching the rest of the page, the same "likes counter" pattern
  // already used for the Regulator Overview page's 30s poll.
  const isSigner = isAuthenticated && user?.role === 'signer';
  const pendingCount = useLivePoll(
    () => (isSigner ? fetchPendingDocuments().then((d) => d.length) : Promise.resolve(null)),
    isSigner ? PENDING_POLL_MS : 60000
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
    setProfileAnchor(null);
  };

  const handleProfile = () => {
    navigate('/profile');
    setDrawerOpen(false);
    setProfileAnchor(null);
  };

  const navLinks = [];
  if (isAuthenticated && user?.role === 'user') {
    navLinks.push({ to: '/dashboard', label: 'My Documents' });
  }
  if (isSigner) {
    navLinks.push({ to: '/signer', label: 'Pending Signatures', badge: pendingCount });
  }

  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 68 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'text.primary',
            }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34 }}>
              <ShieldOutlinedIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              DocChain
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {isMobile ? (
            <>
              {isSigner && (
                <Badge badgeContent={pendingCount ?? 0} color="warning" sx={{ mr: 2 }}>
                  <ShieldOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </Badge>
              )}
              {isAuthenticated && <NotificationBell />}
              <IconButton
                aria-label="Toggle dark mode"
                onClick={toggleColorMode}
                sx={{ mr: 0.5 }}
              >
                {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
              <IconButton
                edge="end"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuRoundedIcon />
              </IconButton>

              <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 260, pt: 2 }} role="presentation">
                  {isAuthenticated && (
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${user?.name} · ${user?.role}`}
                        onClick={handleProfile}
                        sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500 }}
                      />
                    </Box>
                  )}
                  <List>
                    {navLinks.map((link) => (
                      <ListItemButton
                        key={link.to}
                        component={RouterLink}
                        to={link.to}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <ListItemText primary={link.label} />
                        {!!link.badge && <Badge badgeContent={link.badge} color="warning" />}
                      </ListItemButton>
                    ))}
                  </List>
                  <Divider />
                  <List>
                    {isAuthenticated ? (
                      <>
                        <ListItemButton onClick={handleProfile}>
                          <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
                          <ListItemText primary="Profile" />
                        </ListItemButton>
                        <ListItemButton onClick={handleLogout}>
                          <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                          <ListItemText primary="Log out" />
                        </ListItemButton>
                      </>
                    ) : (
                      <>
                        <ListItemButton
                          component={RouterLink}
                          to="/login"
                          onClick={() => setDrawerOpen(false)}
                        >
                          <ListItemText primary="Log in" />
                        </ListItemButton>
                        <ListItemButton
                          component={RouterLink}
                          to="/register"
                          onClick={() => setDrawerOpen(false)}
                        >
                          <ListItemText primary="Sign up" />
                        </ListItemButton>
                      </>
                    )}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {navLinks.map((link) =>
                link.badge !== undefined ? (
                  <Badge key={link.to} badgeContent={link.badge ?? 0} color="warning">
                    <Button component={RouterLink} to={link.to} color="inherit">
                      {link.label}
                    </Button>
                  </Badge>
                ) : (
                  <Button key={link.to} component={RouterLink} to={link.to} color="inherit">
                    {link.label}
                  </Button>
                )
              )}

              <IconButton aria-label="Toggle dark mode" onClick={toggleColorMode}>
                {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>

              {isAuthenticated && <NotificationBell />}

              {isAuthenticated ? (
                <>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${user?.name} · ${user?.role}`}
                    onClick={(e) => setProfileAnchor(e.currentTarget)}
                    sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500, cursor: 'pointer' }}
                  />
                  <Menu
                    anchorEl={profileAnchor}
                    open={!!profileAnchor}
                    onClose={() => setProfileAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem onClick={handleProfile}>
                      <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                      Log out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" color="inherit">
                    Log in
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained">
                    Sign up
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
