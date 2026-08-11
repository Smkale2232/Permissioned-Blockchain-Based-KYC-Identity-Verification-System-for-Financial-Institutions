import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend base URL comes from the Express API (default local dev port 5000).
// Override with a .env file: VITE_API_BASE_URL=http://localhost:5000/api
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
