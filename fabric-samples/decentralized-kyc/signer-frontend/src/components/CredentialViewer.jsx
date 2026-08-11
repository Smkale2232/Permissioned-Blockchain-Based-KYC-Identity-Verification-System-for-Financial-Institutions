import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import GppMaybeRoundedIcon from '@mui/icons-material/GppMaybeRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

// credential: the W3C VC-shaped JSON stored on the document (or null if not
// yet signed). verification: { signatureValid, issuerCertificateStatus,
// trustworthy } from the /api/verify response — re-computed server-side on
// every request, never just trusted from what's stored.
export default function CredentialViewer({ credential, verification }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!credential) return null;

  const trustworthy = verification?.trustworthy;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(credential, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can fail silently — the raw JSON is visible either way once expanded
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.75 }}>
        Verifiable Credential
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {verification && (
          <Chip
            size="small"
            icon={trustworthy ? <VerifiedRoundedIcon /> : <GppMaybeRoundedIcon />}
            label={trustworthy ? 'Signature verified' : 'Not currently trustworthy'}
            color={trustworthy ? 'success' : 'warning'}
            variant={trustworthy ? 'filled' : 'outlined'}
          />
        )}
        {verification && !verification.signatureValid && (
          <Chip size="small" label="Signature invalid" color="error" variant="outlined" />
        )}
        {verification && verification.signatureValid && verification.issuerCertificateStatus === 'revoked' && (
          <Chip size="small" label="Issuer certificate revoked" color="error" variant="outlined" />
        )}
        <Button
          size="small"
          onClick={() => setExpanded((e) => !e)}
          endIcon={expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
        >
          {expanded ? 'Hide raw credential' : 'View raw credential'}
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
            position: 'relative',
            maxHeight: 320,
            overflow: 'auto',
          }}
        >
          <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ position: 'absolute', top: 6, right: 6 }}
              aria-label="Copy credential JSON"
            >
              {copied ? <CheckRoundedIcon fontSize="small" color="success" /> : <ContentCopyRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Typography
            component="pre"
            sx={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', m: 0, pr: 4 }}
          >
            {JSON.stringify(credential, null, 2)}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
