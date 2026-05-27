import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button, Field, Input } from '../../components/ui';
import { ApiError } from '../../lib/api/client';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname ?? '/app', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your clinical workspace."
      footer={<>Need an account? <Link to="/register">Request access</Link></>}
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.org" />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <div style={{ fontSize: 'var(--fs-13)', color: 'var(--danger)' }}>{error}</div>}
        <Button type="submit" block loading={busy}>Sign in</Button>
      </form>
    </AuthLayout>
  );
}
