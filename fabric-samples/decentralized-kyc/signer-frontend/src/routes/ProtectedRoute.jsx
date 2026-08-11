import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Usage: <ProtectedRoute role="signer"><SignerDashboard /></ProtectedRoute>
// Omit `role` to allow any logged-in user.
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'signer' ? '/signer' : '/dashboard'} replace />;
  }

  return children;
}
