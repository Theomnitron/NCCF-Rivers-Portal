import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { RequestsProvider } from './context/RequestsContext';
import { AnnouncementsProvider } from './context/AnnouncementsContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Shell } from './components/layout/Shell';
import { ViewRouter } from './components/router/ViewRouter';

function MainPortalApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      <ViewRouter currentTab={activeTab} onNavigateTab={setActiveTab} />
    </Shell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RequestsProvider>
            <AnnouncementsProvider>
              <ProtectedRoute>
                <MainPortalApp />
              </ProtectedRoute>
            </AnnouncementsProvider>
          </RequestsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
