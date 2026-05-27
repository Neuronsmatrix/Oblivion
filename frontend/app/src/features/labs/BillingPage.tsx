import { Check } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, ErrorState, Spinner, useToast } from '../../components/ui';
import { useSubscribe, useTiers, useUsage } from './queries';

export function BillingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: tiers, isLoading, isError, refetch } = useTiers();
  const { data: usage } = useUsage();
  const subscribe = useSubscribe();

  const currentPlan = usage?.plan_name;

  const onSubscribe = async (planId: string, planName: string) => {
    if (!user) return;
    try {
      // The API takes lab_id explicitly; for a lab account that is the user's id.
      await subscribe.mutateAsync({ labId: user.id, planId });
      toast.success(`Subscribed to the ${planName} plan.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change the plan.');
    }
  };

  return (
    <Page max={1000}>
      <PageHeader eyebrow="Laboratory" title="Plans & billing" />

      {isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label="Loading plans…" /></div>
      ) : isError || !tiers ? (
        <ErrorState message="Could not load plans." action={<Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {tiers.map((plan) => {
            const active = currentPlan === plan.name;
            return (
              <Card key={plan.id} style={active ? { borderColor: 'var(--teal-bright)', boxShadow: 'var(--shadow-1)' } : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 'var(--fs-20)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>{plan.name}</div>
                  {active && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-12)', color: 'var(--teal-bright)', fontWeight: 500 }}><Check size={14} /> Current</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-36)', fontWeight: 500 }}>{plan.monthly_limit}</div>
                <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', marginBottom: 16 }}>analyses / month</div>
                <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-2)', marginBottom: 20 }}>
                  Overage ${(plan.overage_price_cents / 100).toFixed(2)} per analysis
                </div>
                <Button
                  block
                  variant={active ? 'secondary' : 'primary'}
                  disabled={active || subscribe.isPending}
                  loading={subscribe.isPending && subscribe.variables?.planId === plan.id}
                  onClick={() => onSubscribe(plan.id, plan.name)}
                >
                  {active ? 'Active' : 'Choose plan'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
