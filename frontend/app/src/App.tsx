import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth/AuthContext';
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from './auth/guards';
import { AppShell } from './components/layout/AppShell';
import { homeForRole } from './components/layout/nav';
import { FullPageSpinner } from './components/ui';

import { LandingPage } from './features/marketing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { NotFoundPage } from './features/NotFoundPage';

import { CasesListPage } from './features/cases/CasesListPage';
import { NewCasePage } from './features/cases/NewCasePage';
import { CaseDetailPage } from './features/cases/CaseDetailPage';

import { BatchesPage } from './features/labs/BatchesPage';
import { NewBatchPage } from './features/labs/NewBatchPage';
import { BatchDetailPage } from './features/labs/BatchDetailPage';
import { UsagePage } from './features/labs/UsagePage';
import { BillingPage } from './features/labs/BillingPage';

import { SyndromesPage } from './features/reference/SyndromesPage';
import { SyndromeDetailPage } from './features/reference/SyndromeDetailPage';
import { HpoAtlasPage } from './features/reference/HpoAtlasPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { ProfilePage } from './features/profile/ProfilePage';

function AppHome() {
  const { user } = useAuth();
  return <Navigate to={user ? homeForRole(user.role) : '/login'} replace />;
}

const doctor = (el: ReactNode) => <RoleRoute role="doctor">{el}</RoleRoute>;
const lab = (el: ReactNode) => <RoleRoute role="lab">{el}</RoleRoute>;

export function App() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<AppHome />} />

        {/* Doctor */}
        <Route path="cases" element={doctor(<CasesListPage />)} />
        <Route path="cases/new" element={doctor(<NewCasePage />)} />
        <Route path="cases/:id" element={doctor(<CaseDetailPage />)} />

        {/* Lab */}
        <Route path="batches" element={lab(<BatchesPage />)} />
        <Route path="batches/new" element={lab(<NewBatchPage />)} />
        <Route path="batches/:id" element={lab(<BatchDetailPage />)} />
        <Route path="usage" element={lab(<UsagePage />)} />
        <Route path="billing" element={lab(<BillingPage />)} />

        {/* Shared */}
        <Route path="syndromes" element={<SyndromesPage />} />
        <Route path="syndromes/:id" element={<SyndromeDetailPage />} />
        <Route path="atlas" element={<HpoAtlasPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
