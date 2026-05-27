import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button, Field, Input, Select } from '../../components/ui';
import { ApiError } from '../../lib/api/client';
import type { Role } from '../../lib/api/types';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'doctor' as Role, organization: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true);
    try {
      await register({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        role: form.role, organization: form.organization.trim() || null,
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create the account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Request access"
      subtitle="Create an account for clinical decision support."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Full name" htmlFor="name">
          <Input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Dr. Jane Doe" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@hospital.org" />
        </Field>
        <Field label="Account type" htmlFor="role" hint="Doctors review individual cases; labs submit batches.">
          <Select id="role" value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
            <option value="doctor">Clinician (doctor)</option>
            <option value="lab">Laboratory</option>
          </Select>
        </Field>
        <Field label="Organization" htmlFor="org" hint="Optional.">
          <Input id="org" value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder="Boston Children's Hospital" />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => set('password', e.target.value)} />
        </Field>
        {error && <div style={{ fontSize: 'var(--fs-13)', color: 'var(--danger)' }}>{error}</div>}
        <Button type="submit" block loading={busy}>Create account</Button>
      </form>
    </AuthLayout>
  );
}
