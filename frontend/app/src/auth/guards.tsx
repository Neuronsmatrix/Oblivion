import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { FullPageSpinner } from '../components/ui';
import type { Role } from '../lib/api/types';

/** Requires an authenticated session; otherwise redirects to /login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

/** Requires the session's role to match; otherwise shows a 403. */
export function RoleRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, status } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;
  if (user && user.role !== role) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/** Sends an already-authenticated user away from public auth pages. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;
  return <>{children}</>;
}
