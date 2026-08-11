import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { timeAgo } from '../utils/timeAgo.js';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [anchor, setAnchor] = useState(null);

  const handleOpen = (e) => {
    setAnchor(e.currentTarget);
    if (unreadCount > 0) markAllRead();
  };

  return (
    <>
      <IconButton aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`} onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="warning">
          {unreadCount > 0 ? <NotificationsRoundedIcon fontSize="small" /> : <NotificationsNoneRoundedIcon fontSize="small" />}
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 340, maxHeight: 420 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 && (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nothing yet — you'll see updates here as things happen.
            </Typography>
          </Box>
        )}
        {notifications.map((n) => (
          <Box key={n.id} sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2">{n.message}</Typography>
            <Typography variant="caption" color="text.secondary">{timeAgo(n.timestamp)}</Typography>
          </Box>
        ))}
      </Menu>
    </>
  );
}
