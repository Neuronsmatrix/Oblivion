import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card } from '../../components/ui';

export function ProfilePage() {
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleLabel = t(`roles.${user.role}`, { defaultValue: user.role });
  const rows: [string, string][] = [
    [t('name'), user.name],
    [t('email'), user.email],
    [t('accountType'), roleLabel],
    [t('organization'), user.organization || tc('value.none')],
  ];

  return (
    <Page max={620}>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} />

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, padding: '14px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{label}</div>
              <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink)' }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', marginTop: 14 }}>
        {t('managedNote')}
      </p>

      <div style={{ marginTop: 20 }}>
        <Button variant="secondary" onClick={() => logout()}><LogOut size={14} /> {tc('actions.signOut')}</Button>
      </div>
    </Page>
  );
}
