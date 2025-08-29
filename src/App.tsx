import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import NotificationCenter from './components/NotificationCenter';
import Auth from './components/Auth';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import RenewalsPage from './components/RenewalsPage';
import ReportsPage from './components/ReportsPage';
import SubscriptionDetailPage from './components/SubscriptionDetailPage';
import LandingPage from './components/LandingPage'; // --- NEW: Import the new page ---

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading SubAudit..." variant="overlay" />;
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <PWAInstallPrompt />
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          
          <Routes>
            {user ? (
              // --- Logged-In User Routes ---
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="renewals/:timeframe" element={<RenewalsPage />} />
                <Route path="reports/:timeframe" element={<ReportsPage />} />
                <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
                <Route path="/auth" element={<Navigate to="/" replace />} />
              </Route>
            ) : (
              // --- Logged-Out User Routes ---
              <>
                {/* --- FIX: The main page is now the LandingPage --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                {/* Redirect any other unknown path to the landing page */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
