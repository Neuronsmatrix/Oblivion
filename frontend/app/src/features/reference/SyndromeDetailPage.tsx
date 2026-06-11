import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { Button, Card, ErrorState, SectionCard, Spinner } from '../../components/ui';
import { useSyndrome } from './queries';

export function SyndromeDetailPage() {
  const { t: tr } = useTranslation('reference');
  const { t: tc } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: s, isLoading, isError, refetch } = useSyndrome(id);

  if (isLoading) return <Page><div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={tc('state.loading')} /></div></Page>;
  if (isError || !s) return <Page><ErrorState message={tr('syndromeDetail.loadError')} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{tc('actions.retry')}</Button>} /></Page>;

  const meta = [
    { key: 'omim', label: tr('syndromeDetail.metaOmim'), value: s.omim_id, mono: true },
    { key: 'inheritance', label: tr('syndromeDetail.metaInheritance'), value: s.inheritance, mono: false },
    { key: 'prevalence', label: tr('syndromeDetail.metaPrevalence'), value: s.prevalence, mono: false },
  ].filter((m) => m.value);

  return (
    <Page max={900}>
      <button onClick={() => navigate('/app/syndromes')} style={{ background: 'transparent', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-13)', padding: '4px 0', marginBottom: 16 }}>
        <ChevronLeft size={14} /> {tr('syndromeDetail.allSyndromes')}
      </button>

      <div className="eyebrow" style={{ marginBottom: 8 }}>{tc('eyebrow.reference')}</div>
      <h1 style={{ fontSize: 'var(--fs-36)', marginBottom: 16 }}>{s.name}</h1>

      {meta.length > 0 && (
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 24 }}>
          {meta.map((m) => (
            <div key={m.key}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink)', fontFamily: m.mono ? 'var(--font-mono)' : undefined }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {s.description && (
          <Card>
            <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 10px' }}>{tr('syndromeDetail.overview')}</h3>
            <p style={{ fontSize: 'var(--fs-15, 0.95rem)', color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>{s.description}</p>
          </Card>
        )}

        <SectionCard title={tr('syndromeDetail.associatedPhenotype')} aside={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>{tr('syndromeDetail.termsCount', { count: s.hpo_terms.length })}</span>}>
          {s.hpo_terms.length === 0 ? (
            <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-3)' }}>{tr('syndromeDetail.noHpoTerms')}</div>
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
