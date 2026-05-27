import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, EmptyState, ErrorState, Input, Spinner } from '../../components/ui';
import { useSyndromes } from './queries';

export function SyndromesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useSyndromes(search);

  return (
    <Page>
      <PageHeader eyebrow="Reference" title="Syndromes" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '8px 12px', background: 'var(--bg-inset)', marginBottom: 20, maxWidth: 520 }}>
        <Search size={16} color="var(--ink-3)" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or description…"
          style={{ border: 'none', padding: 0, background: 'transparent' }}
          aria-label="Search syndromes"
        />
      </div>

      <Card padding={0}>
        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label="Searching…" /></div>
        ) : isError ? (
          <ErrorState message="Could not load syndromes." action={<Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No syndromes found" message={search ? 'Try a different search term.' : undefined} />
        ) : (
          data.map((s, i) => (
            <div
              key={s.id}
              onClick={() => navigate(`/app/syndromes/${s.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', cursor: 'pointer', borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--fs-16)', color: 'var(--ink)', fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.omim_id && <span style={{ fontFamily: 'var(--font-mono)', marginRight: 10 }}>OMIM {s.omim_id}</span>}
                  {s.inheritance ?? s.description}
                </div>
              </div>
              <ChevronRight size={16} color="var(--ink-3)" />
            </div>
          ))
        )}
      </Card>
    </Page>
  );
}
