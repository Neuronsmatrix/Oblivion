import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card } from '../../components/ui';

const roleLabel: Record<string, string> = { doctor: 'Clinician', lab: 'Laboratory', admin: 'Administrator' };

export function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const rows = [
    ['Name', user.name],
    ['Email', user.email],
    ['Account type', roleLabel[user.role] ?? user.role],
    ['Organization', user.organization || '—'],
  ];

  return (
    <Page max={620}>
      <PageHeader eyebrow="Account" title="Profile" />

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
        Profile details are managed by your organization administrator.
      </p>

      <div style={{ marginTop: 20 }}>
        <Button variant="secondary" onClick={() => logout()}><LogOut size={14} /> Sign out</Button>
      </div>
    </Page>
  );
}
