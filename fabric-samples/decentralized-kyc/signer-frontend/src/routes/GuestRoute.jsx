import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wrap /login and /register with this so a logged-in user can't land back on them.
export default function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'signer' ? '/signer' : '/dashboard'} replace />;
  }

  return children;
}
