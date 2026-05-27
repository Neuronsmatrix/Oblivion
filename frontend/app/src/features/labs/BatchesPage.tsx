import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Page, PageHeader, formatDate } from '../../components/layout/Page';
import { Button, Card, EmptyState } from '../../components/ui';
import { batchStore } from './queries';

export function BatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const batches = user ? batchStore.list(user.id) : [];

  return (
    <Page>
      <PageHeader
        eyebrow="Laboratory"
        title="Batches"
        actions={<Button size="sm" onClick={() => navigate('/app/batches/new')}><Plus size={14} /> New batch</Button>}
      />

      <Card padding={0}>
        {batches.length === 0 ? (
          <EmptyState
            title="No batches yet"
            message="Submitted batches are tracked here on this device."
            action={<Button size="sm" onClick={() => navigate('/app/batches/new')}>New batch</Button>}
          />
        ) : (
          batches.map((b, i) => (
            <div
              key={b.id}
              onClick={() => navigate(`/app/batches/${b.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer', borderBottom: i < batches.length - 1 ? '1px solid var(--line)' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink)' }}>{b.id.slice(0, 8)}</div>
                <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>{b.total} image{b.total === 1 ? '' : 's'} · {formatDate(b.created_at)}</div>
              </div>
              <ChevronRight size={16} color="var(--ink-3)" />
            </div>
          ))
        )}
      </Card>
    </Page>
  );
}
