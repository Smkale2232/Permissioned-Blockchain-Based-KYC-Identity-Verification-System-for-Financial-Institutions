import { Component } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

// React error boundaries must be class components — there's no hook
// equivalent (getDerivedStateFromError/componentDidCatch have no hook form).
// Without this, an unexpected render error anywhere in the tree would blank
// the entire page with no explanation.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper variant="outlined" sx={{ maxWidth: 440, p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48, mx: 'auto', mb: 2 }}>
            <ErrorOutlineRoundedIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Something went wrong</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            This page hit an unexpected error. Your data is safe — try heading back to the
            start.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>Back to home</Button>
        </Paper>
      </Box>
    );
  }
}
