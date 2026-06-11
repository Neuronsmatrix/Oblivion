import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Page, PageHeader } from '../../components/layout/Page';
import { Card, EmptyState, Input, Spinner } from '../../components/ui';
import { useHpoSearch } from './queries';

export function HpoAtlasPage() {
  const { t: tr } = useTranslation('reference');
  const { t: tc } = useTranslation('common');
  const [q, setQ] = useState('');
  const { data, isLoading } = useHpoSearch(q);
  const ready = q.trim().length >= 2;

  return (
    <Page>
      <PageHeader eyebrow={tc('eyebrow.reference')} title={tr('atlas.title')} />
      <p style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-2)', maxWidth: 560, marginTop: -12, marginBottom: 20 }}>
        {tr('atlas.intro')}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '8px 12px', background: 'var(--bg-inset)', marginBottom: 20, maxWidth: 520 }}>
        <Search size={16} color="var(--ink-3)" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr('atlas.searchPlaceholder')}
          style={{ border: 'none', padding: 0, background: 'transparent' }}
          aria-label={tr('atlas.searchAria')}
        />
      </div>

      <Card padding={0}>
        {!ready ? (
          <EmptyState title={tr('atlas.startTyping')} message={tr('atlas.startTypingHint')} />
        ) : isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={tr('atlas.searching')} /></div>
        ) : !data || data.length === 0 ? (
          <EmptyState title={tr('atlas.noTerms')} message={tr('atlas.noTermsHint')} />
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
