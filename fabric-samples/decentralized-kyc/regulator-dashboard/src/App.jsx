import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import GuestRoute from './routes/GuestRoute.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Profile from './pages/Profile.jsx';
import VerifyDocument from './pages/VerifyDocument.jsx';
import Overview from './pages/Overview.jsx';
import AllDocuments from './pages/AllDocuments.jsx';
import AuditTrail from './pages/AuditTrail.jsx';
import CertificateManagement from './pages/CertificateManagement.jsx';
import NotFound from './pages/NotFound.jsx';
import SessionExpiryWatcher from './components/SessionExpiryWatcher.jsx';

export default function App() {
  return (
    <>
      <SessionExpiryWatcher />
      <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<Layout />}>
        {/* Public — no login required, this is what a shared link/QR code opens. */}
        <Route path="/verify/:docId" element={<VerifyDocument />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/documents" element={<AllDocuments />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
          <Route path="/certificates" element={<CertificateManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
