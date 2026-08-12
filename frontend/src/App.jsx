/**
 * App.jsx
 *
 * Root application routing & layout configuration.
 * Phase 5: Incorporates PublicLayout, AppLayout, AccountLayout, and ArchivePage route.
 */

import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/layouts/PublicLayout';
import AppLayout from './components/layouts/AppLayout';
import AccountLayout from './components/layouts/AccountLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PricingPage from './pages/PricingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

import ArchivePage from './pages/archive/ArchivePage';
import LibraryPage from './pages/library/LibraryPage';
import LibraryItemPage from './pages/library/LibraryItemPage';

import AccountPage from './pages/AccountPage';
import AccountProfilePage from './pages/AccountProfilePage';
import AccountSecurityPage from './pages/AccountSecurityPage';

function App() {
  return (
    <Routes>
      {/* Public Pages with Header/Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>

      {/* Main Authenticated Application Routes (Archive & Library) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/projection" element={<ArchivePage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/:year" element={<ArchivePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<LibraryItemPage />} />
      </Route>

      {/* Account Settings Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/profile" element={<AccountProfilePage />} />
        <Route path="/account/security" element={<AccountSecurityPage />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;
