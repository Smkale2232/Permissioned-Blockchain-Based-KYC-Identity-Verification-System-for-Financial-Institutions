import { createTheme } from '@mui/material/styles';

// DocChain visual identity — "professional custody desk", not "startup dashboard".
// Palette: white surfaces, a restrained deep-navy/blue for trust and action,
// slate greys for structure and secondary text. Monospace type is reserved
// specifically for anything cryptographic (file hashes, tx ids) so those
// values read as verifiable data rather than decorative labels.
const navy = '#0F2A4A';
const blue = '#1957C2';
const blueDark = '#123E8F';
const slate = '#4B5A6B';
const slateLight = '#8A97A6';
const border = '#DCE2E9';
const surface = '#FFFFFF';
const canvas = '#F3F5F8';

// Dark variant keeps the same restrained, "custody desk" character rather than
// a generic inverted palette — navy deepens into the background itself.
const darkCanvas = '#0B1420';
const darkSurface = '#101B2B';
const darkBorder = '#233246';
const darkTextSecondary = '#93A2B5';

function getTheme(mode = 'light') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#5B94E8' : blue,
        dark: blueDark,
        light: '#4A7FD6',
        contrastText: isDark ? '#0B1420' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#8FB2E0' : navy,
        contrastText: isDark ? '#0B1420' : '#FFFFFF',
      },
      success: { main: isDark ? '#4CAF7D' : '#1F8A5F' },
      warning: { main: isDark ? '#D9A441' : '#B7791F' },
      error: { main: isDark ? '#E0685A' : '#C0392B' },
      background: {
        default: isDark ? darkCanvas : canvas,
        paper: isDark ? darkSurface : surface,
      },
      text: {
        primary: isDark ? '#E8EDF4' : '#1A2233',
        secondary: isDark ? darkTextSecondary : slate,
        disabled: isDark ? '#5A6A7E' : slateLight,
      },
      divider: isDark ? darkBorder : border,
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    // Reserved token for anything cryptographic: file hashes, tx ids, cert ids.
    // Usage: sx={{ fontFamily: 'var(--font-mono)' }}
    vars: undefined,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--font-mono': '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
          },
          body: { backgroundColor: isDark ? darkCanvas : canvas },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: isDark ? darkBorder : border,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? darkSurface : surface,
            color: isDark ? '#E8EDF4' : '#1A2233',
            borderBottom: `1px solid ${isDark ? darkBorder : border}`,
          },
        },
        defaultProps: {
          elevation: 0,
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            paddingTop: 8,
            paddingBottom: 8,
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: isDark ? darkTextSecondary : slate,
            backgroundColor: isDark ? '#0D1826' : '#F8FAFC',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
}

export default getTheme;
