import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import Navbar from './Navbar.jsx';
import { useIsFetching } from '../../hooks/useIsFetching.js';

export default function Layout() {
  const isFetching = useIsFetching();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      {/* Thin, page-wide loading indicator for any in-flight request — appears
          under the Navbar without shifting layout or blocking the page. */}
      <Fade in={isFetching} unmountOnExit>
        <LinearProgress sx={{ height: 2 }} />
      </Fade>
      <Container maxWidth="lg" sx={{ pt: 5, pb: 8 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
