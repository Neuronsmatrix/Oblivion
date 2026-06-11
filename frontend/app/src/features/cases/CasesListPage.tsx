import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Plus } from 'lucide-react';
import { Page, PageHeader, formatDate, formatAge } from '../../components/layout/Page';
import { Button, EmptyState, ErrorState, Pagination, Spinner, StatusPill } from '../../components/ui';
import type { CaseStatus } from '../../lib/api/types';
import { useCases } from './queries';

const FILTER_IDS: ('all' | CaseStatus)[] = ['all', 'processing', 'completed', 'failed'];

const COLS = '1fr 90px 140px 140px 40px';

export function CasesListPage() {
  const { t } = useTranslation('cases');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<'all' | CaseStatus>('all');
  const { data: cases, isLoading, isError, refetch } = useCases(offset);

  const filterLabel = (id: 'all' | CaseStatus) => (id === 'all' ? t('list.filterAll') : tc(`status.${id}`));

  const visible = useMemo(
    () => (cases ?? []).filter((c) => filter === 'all' || c.status === filter),
    [cases, filter],
  );

  return (
    <Page>
      <PageHeader
        eyebrow={tc('eyebrow.workspace')}
        title={t('list.title')}
        actions={<Button size="sm" onClick={() => navigate('/app/cases/new')}><Plus size={14} /> {tc('appbar.newCase')}</Button>}
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {FILTER_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 'var(--fs-14)', fontWeight: 500, marginBottom: -1,
              color: filter === id ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom: filter === id ? '2px solid var(--teal-bright)' : '2px solid transparent',
            }}
          >
            {filterLabel(id)}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 16, padding: '10px 16px', background: 'var(--paper)', fontSize: 'var(--fs-12)', color: 'var(--ink-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>
          <div>{t('list.colPatient')}</div><div>{t('list.colAge')}</div><div>{t('list.colStatus')}</div><div>{t('list.colCreated')}</div><div />
        </div>

        {isLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={t('list.loading')} /></div>
        ) : isError ? (
          <ErrorState message={t('list.loadError')} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{tc('actions.retry')}</Button>} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? t('list.emptyAll') : t('list.emptyFiltered', { status: tc(`status.${filter}`) })}
            message={filter === 'all' ? t('list.emptyAllMessage') : undefined}
            action={filter === 'all' ? <Button size="sm" onClick={() => navigate('/app/cases/new')}>{tc('appbar.newCase')}</Button> : undefined}
          />
        ) : (
          visible.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/app/cases/${c.id}`)}
              style={{ display: 'grid', gridTemplateColumns: COLS, gap: 16, padding: '14px 16px', borderBottom: '1px solid var(--line)', alignItems: 'center', cursor: 'pointer', fontSize: 'var(--fs-14)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ color: 'var(--ink)' }}>{c.patient_name || t('unnamedPatient')}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--ink-4)' }}>{c.id.slice(0, 8)}</div>
              </div>
              <div style={{ color: 'var(--ink-2)' }}>{formatAge(c.patient_age)}</div>
              <div><StatusPill status={c.status} /></div>
              <div style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-13)' }}>{formatDate(c.created_at)}</div>
              <div style={{ color: 'var(--ink-3)', display: 'flex', justifyContent: 'flex-end' }}><ChevronRight size={16} /></div>
            </div>
          ))
        )}
      </div>

      {cases && <Pagination offset={offset} limit={20} count={cases.length} onChange={setOffset} />}
    </Page>
  );
}
