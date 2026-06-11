import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';
import { useUsage } from './queries';

export function UsagePage() {
  const { t } = useTranslation('labs');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const { data: usage, isLoading, isError, refetch } = useUsage();

  return (
    <Page max={900}>
      <PageHeader eyebrow={tc('eyebrow.laboratory')} title={t('usage.title')} />

      {isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={t('usage.loading')} /></div>
      ) : isError ? (
        <ErrorState message={t('usage.loadError')} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{tc('actions.retry')}</Button>} />
      ) : !usage ? (
        <Card>
          <EmptyState
            title={t('usage.noSubTitle')}
            message={t('usage.noSubMessage')}
            action={<Button size="sm" onClick={() => navigate('/app/billing')}>{t('usage.viewPlans')}</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>{t('usage.currentPlan')}</div>
                <div style={{ fontSize: 'var(--fs-24)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>{usage.plan_name}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{usage.month}</span>
            </div>

            <div style={{ height: 8, background: 'var(--paper-2)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${Math.min(100, (usage.current_usage / usage.monthly_limit) * 100)}%`, height: '100%', background: usage.remaining > 0 ? 'var(--teal-bright)' : 'var(--danger)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-13)', color: 'var(--ink-2)' }}>
              <span>{t('usage.used', { count: usage.current_usage })}</span>
              <span>{t('usage.remainingOf', { remaining: usage.remaining, limit: usage.monthly_limit })}</span>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Metric label={t('usage.monthlyLimit')} value={usage.monthly_limit} />
            <Metric label={t('usage.usedThisMonth')} value={usage.current_usage} />
            <Metric label={t('usage.remaining')} value={usage.remaining} />
          </div>

          <div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/billing')}>{t('usage.changePlan')}</Button>
          </div>
        </div>
      )}
    </Page>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-36)', fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', marginTop: 4 }}>{label}</div>
    </Card>
  );
}
