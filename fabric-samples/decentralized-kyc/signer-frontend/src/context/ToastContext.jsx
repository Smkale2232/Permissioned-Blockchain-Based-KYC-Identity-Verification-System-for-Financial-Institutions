import { createContext, useContext, useCallback, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const handleClose = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Stack sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1400 }} spacing={1}>
        {toasts.map((t, i) => (
          <Snackbar
            key={t.id}
            open
            autoHideDuration={t.duration}
            onClose={() => handleClose(t.id)}
            sx={{ position: 'static', transform: 'none' }}
            style={{ marginBottom: i > 0 ? 8 : 0 }}
          >
            <Alert
              onClose={() => handleClose(t.id)}
              severity={t.type === 'error' ? 'error' : t.type === 'warning' ? 'warning' : t.type === 'info' ? 'info' : 'success'}
              variant="filled"
              sx={{ minWidth: 260 }}
            >
              {t.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
