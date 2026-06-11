import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { Button, Field, Input, Select } from '../../components/ui';
import { ApiError } from '../../lib/api/client';
import type { Role } from '../../lib/api/types';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'doctor' as Role, organization: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) { setError(t('register.passwordTooShort')); return; }
    setBusy(true);
    try {
      await register({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        role: form.role, organization: form.organization.trim() || null,
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('register.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={<>{t('register.footer')} <Link to="/login">{tc('actions.signIn')}</Link></>}
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label={t('fields.fullName')} htmlFor="name">
          <Input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('fields.namePlaceholder')} />
        </Field>
        <Field label={t('fields.email')} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t('fields.emailPlaceholder')} />
        </Field>
        <Field label={t('fields.accountType')} htmlFor="role" hint={t('fields.accountTypeHint')}>
          <Select id="role" value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
            <option value="doctor">{t('fields.roleDoctor')}</option>
            <option value="lab">{t('fields.roleLab')}</option>
          </Select>
        </Field>
        <Field label={t('fields.organization')} htmlFor="org" hint={t('fields.organizationHint')}>
          <Input id="org" value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder={t('fields.orgPlaceholder')} />
        </Field>
        <Field label={t('fields.password')} htmlFor="password" hint={t('fields.passwordHint')}>
          <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => set('password', e.target.value)} />
        </Field>
        {error && <div style={{ fontSize: 'var(--fs-13)', color: 'var(--danger)' }}>{error}</div>}
        <Button type="submit" block loading={busy}>{tc('actions.createAccount')}</Button>
      </form>
    </AuthLayout>
  );
}
