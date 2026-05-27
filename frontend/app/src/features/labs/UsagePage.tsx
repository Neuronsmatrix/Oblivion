import { useNavigate } from 'react-router-dom';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, EmptyState, ErrorState, Spinner } from '../../components/ui';
import { useUsage } from './queries';

export function UsagePage() {
  const navigate = useNavigate();
  const { data: usage, isLoading, isError, refetch } = useUsage();

  return (
    <Page max={900}>
      <PageHeader eyebrow="Laboratory" title="Usage" />

      {isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label="Loading usage…" /></div>
      ) : isError ? (
        <ErrorState message="Could not load usage." action={<Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>} />
      ) : !usage ? (
        <Card>
          <EmptyState
            title="No active subscription"
            message="Choose a plan to start submitting batches and tracking monthly usage."
            action={<Button size="sm" onClick={() => navigate('/app/billing')}>View plans</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Current plan</div>
                <div style={{ fontSize: 'var(--fs-24)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>{usage.plan_name}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{usage.month}</span>
            </div>

            <div style={{ height: 8, background: 'var(--paper-2)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${Math.min(100, (usage.current_usage / usage.monthly_limit) * 100)}%`, height: '100%', background: usage.remaining > 0 ? 'var(--teal-bright)' : 'var(--danger)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-13)', color: 'var(--ink-2)' }}>
              <span>{usage.current_usage} used</span>
              <span>{usage.remaining} of {usage.monthly_limit} remaining</span>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Metric label="Monthly limit" value={usage.monthly_limit} />
            <Metric label="Used this month" value={usage.current_usage} />
            <Metric label="Remaining" value={usage.remaining} />
          </div>

          <div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/billing')}>Change plan</Button>
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
