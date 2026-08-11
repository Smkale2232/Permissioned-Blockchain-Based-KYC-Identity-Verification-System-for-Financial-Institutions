import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('docchain_regulator_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 here means the token is missing/expired — bounce to login rather than
// showing a confusing "not authenticated" error deep in some other page.
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('docchain_regulator_token');
      localStorage.removeItem('docchain_regulator_user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
