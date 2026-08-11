import Chip from '@mui/material/Chip';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';

const STATUS_MAP = {
  pending: { label: 'Pending', color: 'warning', icon: <HourglassTopRoundedIcon fontSize="small" /> },
  signed: { label: 'Signed', color: 'success', icon: <VerifiedRoundedIcon fontSize="small" /> },
  uploaded: { label: 'Uploaded', color: 'default', icon: undefined },
  rejected: { label: 'Rejected', color: 'error', icon: <CancelRoundedIcon fontSize="small" /> },
  revoked: { label: 'Revoked', color: 'error', icon: <BlockRoundedIcon fontSize="small" /> },
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase();
  const entry = STATUS_MAP[key] || { label: status || 'Unknown', color: 'default' };
  return (
    <Chip
      size="small"
      label={entry.label}
      color={entry.color}
      icon={entry.icon}
      variant={entry.color === 'default' ? 'outlined' : 'filled'}
    />
  );
}
