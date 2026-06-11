import { Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Page, PageHeader, formatDate } from '../../components/layout/Page';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';
import { useMarkRead, useNotifications } from './queries';

export function NotificationsPage() {
  const { t } = useTranslation('notifications');
  const { t: tc } = useTranslation('common');
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkRead();

  return (
    <Page max={760}>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} />

      <Card padding={0}>
        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={tc('state.loading')} /></div>
        ) : isError ? (
          <ErrorState message={t('loadError')} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{tc('actions.retry')}</Button>} />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t('emptyTitle')} message={t('emptyMessage')} />
        ) : (
          data.map((n, i) => (
            <div
              key={n.id}
              style={{ display: 'flex', gap: 14, padding: '16px 18px', borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none', background: n.read ? 'transparent' : 'var(--info-bg)' }}
            >
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--ink-2)' }}>
                <Bell size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--ink)' }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-2)', marginTop: 3 }}>{n.body}</div>}
                <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-4)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>{formatDate(n.created_at)}</div>
              </div>
              {!n.read && (
                <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)} title={tc('actions.markAsRead')}>
                  <Check size={14} />
                </Button>
              )}
            </div>
          ))
        )}
      </Card>
    </Page>
  );
}
