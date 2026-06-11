import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { useUnreadCount } from '../../features/notifications/queries';
import { LanguageSwitcher } from '../ui';
import { navForRole } from './nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation('nav');
  const { user } = useAuth();
  const unread = useUnreadCount();
  if (!user) return null;
  const items = navForRole(user.role);

  return (
    <aside
      style={{
        borderRight: '1px solid var(--line)', padding: '20px 14px',
        display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--paper)',
        height: '100%',
      }}
    >
      <div style={{ padding: '6px 10px 18px' }}>
        <NavLink to="/"><img src="/assets/logo.svg" alt="Phenograph" style={{ height: 26 }} /></NavLink>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const showBadge = item.key === 'notifications' && unread > 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 'var(--radius-sm)', textDecoration: 'none',
              fontSize: 'var(--fs-14)', fontWeight: 500, position: 'relative',
              background: isActive ? 'rgba(6,129,118,0.10)' : 'transparent',
              color: isActive ? 'var(--teal-bright)' : 'var(--ink-2)',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && <div style={{ position: 'absolute', left: -14, top: 6, bottom: 6, width: 2, background: 'var(--teal-bright)', borderRadius: 1 }} />}
                <Icon size={16} strokeWidth={1.75} />
                <span>{t(item.key)}</span>
                {showBadge && (
                  <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--teal-bright)', color: '#fff', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '12px 10px', fontSize: 'var(--fs-12)', color: 'var(--ink-3)', borderTop: '1px solid var(--line)' }}>
        <div style={{ marginBottom: 12 }}><LanguageSwitcher compact /></div>
        <div style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{user.name}</div>
        {user.organization && <div style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>{user.organization}</div>}
      </div>
    </aside>
  );
}
