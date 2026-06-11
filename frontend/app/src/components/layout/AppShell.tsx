import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { useUnreadCount } from '../../features/notifications/queries';
import { Button } from '../ui';
import { Sidebar } from './Sidebar';
import './layout.css';

export function AppShell() {
  const { t } = useTranslation('common');
  const { t: tn } = useTranslation('nav');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);

  const primary = user?.role === 'lab'
    ? { label: tn('newBatch'), to: '/app/batches/new' }
    : { label: t('appbar.newCase'), to: '/app/cases/new' };

  return (
    <div className="app-shell" data-open={open}>
      <div className="app-shell__backdrop" onClick={() => setOpen(false)} />
      <div className="app-shell__sidebar">
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      <div className="app-shell__main">
        <div className="app-shell__topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="app-shell__menu-btn"
              aria-label={t('appbar.openNav')}
              onClick={() => setOpen((o) => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', padding: 0 }}
            >
              <Menu size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              aria-label={tn('notifications')}
              onClick={() => navigate('/app/notifications')}
              style={{ position: 'relative', background: 'none', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 8, cursor: 'pointer', color: 'var(--ink-2)', display: 'flex' }}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: 'var(--teal-bright)', color: '#fff', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unread}
                </span>
              )}
            </button>
            <Button size="sm" onClick={() => navigate(primary.to)}>
              <Plus size={14} /> {primary.label}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => logout()} title={t('actions.signOut')}>
              <LogOut size={14} />
            </Button>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
