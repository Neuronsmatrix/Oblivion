import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Page, formatDate } from '../../components/layout/Page';
import { Button, Card, ConfidenceBar, ErrorState, Spinner, StatusPill } from '../../components/ui';
import type { CaseWithDiagnoses } from '../../lib/api/types';
import { useBatch, useBatchItemResults } from './queries';

export function BatchDetailPage() {
  const { t } = useTranslation('labs');
  const { t: tc } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useBatch(id);
  const results = useBatchItemResults(data?.items ?? []);
  const [open, setOpen] = useState<string | null>(null);

  if (isLoading) return <Page><div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={t('batchDetail.loading')} /></div></Page>;
  if (isError || !data) return <Page><ErrorState message={t('batchDetail.loadError')} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{tc('actions.retry')}</Button>} /></Page>;

  const { batch, items } = data;
  const pct = batch.total_items ? Math.round((batch.processed_items / batch.total_items) * 100) : 0;

  return (
    <Page max={1000}>
      <button onClick={() => navigate('/app/batches')} style={{ background: 'transparent', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-13)', padding: '4px 0', marginBottom: 16 }}>
        <ChevronLeft size={14} /> {t('batchDetail.allBatches')}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{t('batchDetail.batchNo', { id: batch.id.slice(0, 8) })}</span>
            <StatusPill status={batch.status} />
          </div>
          <h1 style={{ fontSize: 'var(--fs-30)', margin: 0 }}>{t('batchDetail.processed', { processed: batch.processed_items, total: batch.total_items })}</h1>
          <div style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', marginTop: 6 }}>{t('batchDetail.createdOn', { date: formatDate(batch.created_at) })}</div>
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--teal-bright)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>

      <Card padding={0}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 200px 130px 32px', gap: 16, padding: '10px 16px', background: 'var(--paper)', fontSize: 'var(--fs-12)', color: 'var(--ink-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>
          <div>{t('batchDetail.colNum')}</div><div>{t('batchDetail.colImageKey')}</div><div>{t('batchDetail.colTopCandidate')}</div><div>{t('batchDetail.colStatus')}</div><div />
        </div>
        {items.map((it, i) => {
          const result = it.case_id ? results[it.case_id] : undefined;
          const top = result?.diagnoses?.slice().sort((a, b) => a.rank - b.rank)[0];
          const expandable = !!result?.diagnoses?.length;
          const isOpen = open === it.id;
          return (
            <div key={it.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div
                onClick={() => expandable && setOpen(isOpen ? null : it.id)}
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr 200px 130px 32px', gap: 16, padding: '12px 16px', alignItems: 'center', fontSize: 'var(--fs-14)', cursor: expandable ? 'pointer' : 'default' }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-4)' }}>{i + 1}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.image_key}</div>
                <div>
                  {top ? (
                    <>
                      <span style={{ color: 'var(--ink)' }}>{top.syndrome_name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--teal-bright)', marginLeft: 8 }}>{top.confidence.toFixed(2)}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--ink-4)' }}>—</span>
                  )}
                </div>
                <div><StatusPill status={it.status} /></div>
                <div style={{ color: 'var(--ink-3)', display: 'flex', justifyContent: 'flex-end' }}>
                  {expandable && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </div>
              </div>
              {isOpen && result && <ItemResults result={result} />}
            </div>
          );
        })}
      </Card>
    </Page>
  );
}

function ItemResults({ result }: { result: CaseWithDiagnoses }) {
  const { t } = useTranslation('labs');
  const diagnoses = [...(result.diagnoses ?? [])].sort((a, b) => a.rank - b.rank);
  const top = diagnoses[0]?.confidence ?? 1;
  return (
    <div style={{ padding: '4px 16px 18px 56px', background: 'var(--paper)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-11)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 12px' }}>
        {t('batchDetail.candidatesPosterior')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
        {diagnoses.map((d, i) => (
          <div key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--fs-14)', color: 'var(--ink)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginRight: 8 }}>{d.rank}</span>
                {d.syndrome_name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: i === 0 ? 'var(--teal-bright)' : 'var(--ink-2)' }}>{d.confidence.toFixed(2)}</span>
            </div>
            <ConfidenceBar value={d.confidence / (top || 1)} top={i === 0} height={3} />
          </div>
        ))}
      </div>
    </div>
  );
}
