import { useState } from 'react';
import { Search } from 'lucide-react';
import { Page, PageHeader } from '../../components/layout/Page';
import { Card, EmptyState, Input, Spinner } from '../../components/ui';
import { useHpoSearch } from './queries';

export function HpoAtlasPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useHpoSearch(q);
  const ready = q.trim().length >= 2;

  return (
    <Page>
      <PageHeader eyebrow="Reference" title="Feature atlas" />
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-2)', maxWidth: 560, marginTop: -12, marginBottom: 20 }}>
        Search the Human Phenotype Ontology for morphological features and their definitions.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '8px 12px', background: 'var(--bg-inset)', marginBottom: 20, maxWidth: 520 }}>
        <Search size={16} color="var(--ink-3)" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. hypertelorism, HP:0000316…"
          style={{ border: 'none', padding: 0, background: 'transparent' }}
          aria-label="Search HPO terms"
        />
      </div>

      <Card padding={0}>
        {!ready ? (
          <EmptyState title="Start typing to search" message="Enter at least two characters." />
        ) : isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label="Searching…" /></div>
        ) : !data || data.length === 0 ? (
          <EmptyState title="No terms found" message="Try a different feature name." />
        ) : (
          data.map((t, i) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16, padding: '14px 18px', borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none', fontSize: 'var(--fs-14)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink-2)' }}>{t.hpo_id}</div>
              <div>
                <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{t.name}</div>
                {t.definition && <div style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-13)', marginTop: 3 }}>{t.definition}</div>}
              </div>
            </div>
          ))
        )}
      </Card>
    </Page>
  );
}
