import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { Button, Card, ErrorState, SectionCard, Spinner } from '../../components/ui';
import { useSyndrome } from './queries';

export function SyndromeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: s, isLoading, isError, refetch } = useSyndrome(id);

  if (isLoading) return <Page><div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label="Loading…" /></div></Page>;
  if (isError || !s) return <Page><ErrorState message="This syndrome could not be loaded." action={<Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>} /></Page>;

  const meta = [
    ['OMIM', s.omim_id],
    ['Inheritance', s.inheritance],
    ['Prevalence', s.prevalence],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Page max={900}>
      <button onClick={() => navigate('/app/syndromes')} style={{ background: 'transparent', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-13)', padding: '4px 0', marginBottom: 16 }}>
        <ChevronLeft size={14} /> All syndromes
      </button>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Reference</div>
      <h1 style={{ fontSize: 'var(--fs-36)', marginBottom: 16 }}>{s.name}</h1>

      {meta.length > 0 && (
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 24 }}>
          {meta.map(([k, v]) => (
            <div key={k}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink)', fontFamily: k === 'OMIM' ? 'var(--font-mono)' : undefined }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {s.description && (
          <Card>
            <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 10px' }}>Overview</h3>
            <p style={{ fontSize: 'var(--fs-15, 0.95rem)', color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>{s.description}</p>
          </Card>
        )}

        <SectionCard title="Associated phenotype (HPO)" aside={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>{s.hpo_terms.length} terms</span>}>
          {s.hpo_terms.length === 0 ? (
            <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-3)' }}>No linked HPO terms.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.hpo_terms.map((t) => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-13)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{t.hpo_id}</div>
                  <div>
                    <div style={{ color: 'var(--ink)' }}>{t.name}</div>
                    {t.definition && <div style={{ color: 'var(--ink-3)', marginTop: 2 }}>{t.definition}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
