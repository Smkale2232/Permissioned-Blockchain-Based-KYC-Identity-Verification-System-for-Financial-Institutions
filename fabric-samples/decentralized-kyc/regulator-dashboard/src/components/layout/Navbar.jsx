import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
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
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useAuth } from '../../context/AuthContext.jsx';
import { useColorMode } from '../../context/ColorModeContext.jsx';

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview' },
  { to: '/documents', label: 'All Documents' },
  { to: '/audit-trail', label: 'Audit Trail' },
  { to: '/certificates', label: 'Certificates' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);

  // Display name shown here comes from the account's own Profile settings —
  // there is no hardcoded name; a fresh regulator account defaults to
  // "Regulator" (or a custom name set via the seed script's env vars) until
  // its owner sets a custom display name / Employee ID from Profile.
  const identityLabel = user?.employeeId ? `${user?.name} (${user.employeeId})` : user?.name;

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

  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 68, gap: 1 }}>
          <Box
            component={RouterLink}
            to="/overview"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'text.primary' }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34 }}>
              <GavelRoundedIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              DocChain <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>Regulator</Box>
            </Typography>
          </Box>

          {isAuthenticated && !isMobile && (
            <Box sx={{ display: 'flex', ml: 3, gap: 0.5 }}>
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color="inherit"
                  sx={{
                    fontWeight: location.pathname === item.to ? 700 : 500,
                    color: location.pathname === item.to ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {isAuthenticated && (
            isMobile ? (
              <>
                <IconButton aria-label="Toggle dark mode" onClick={toggleColorMode} sx={{ mr: 0.5 }}>
                  {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                </IconButton>
                <IconButton edge="end" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
                  <MenuRoundedIcon />
                </IconButton>
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                  <Box sx={{ width: 260, pt: 2 }} role="presentation">
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${identityLabel} · regulator`}
                        onClick={handleProfile}
                        sx={{ borderColor: 'divider', color: 'text.secondary', fontWeight: 500 }}
                      />
                    </Box>
                    <List>
                      {NAV_ITEMS.map((item) => (
                        <ListItemButton
                          key={item.to}
                          component={RouterLink}
                          to={item.to}
                          selected={location.pathname === item.to}
                          onClick={() => setDrawerOpen(false)}
                        >
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      ))}
                    </List>
                    <Divider />
                    <List>
                      <ListItemButton onClick={handleProfile}>
                        <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Profile" />
                      </ListItemButton>
                      <ListItemButton onClick={handleLogout}>
                        <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Log out" />
                      </ListItemButton>
                    </List>
                  </Box>
                </Drawer>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton aria-label="Toggle dark mode" onClick={toggleColorMode}>
                  {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
                </IconButton>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${identityLabel} · regulator`}
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
              </Box>
            )
          )}

          {!isAuthenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton aria-label="Toggle dark mode" onClick={toggleColorMode}>
                {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
              <Button component={RouterLink} to="/login" variant="outlined" size="small">
                Log in
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
