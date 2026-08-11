import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import GuestRoute from './routes/GuestRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Profile from './pages/Profile.jsx';
import VerifyDocument from './pages/VerifyDocument.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import SignerDashboard from './pages/SignerDashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import SessionExpiryWatcher from './components/SessionExpiryWatcher.jsx';

export default function App() {
  return (
    <>
      <SessionExpiryWatcher />
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        {/* Public — no login required, this is what a shared link/QR code opens. */}
        <Route path="/verify/:docId" element={<VerifyDocument />} />

        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/signer"
          element={
            <ProtectedRoute role="signer">
              <SignerDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
      </Routes>
    </>
  );
}
