import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Pencil } from 'lucide-react';
import { Page, formatDate, formatAge } from '../../components/layout/Page';
import {
  Button, Card, ErrorState, Field, Input, Modal, SectionCard,
  Spinner, StatusPill, ConfidenceBar, useToast,
} from '../../components/ui';
import type { CaseWithDiagnoses } from '../../lib/api/types';
import { useCase, useUpdateCase } from './queries';

export function CaseDetailPage() {
  const { t } = useTranslation('cases');
  const { t: tc } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: c, isLoading, isError, refetch } = useCase(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <Page><div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner label={t('detail.loading')} /></div></Page>;
  if (isError || !c) return <Page><ErrorState message={t('detail.loadError')} action={<Button size="sm" variant="secondary" onClick={() => refetch()}>{tc('actions.retry')}</Button>} /></Page>;

  const topCandidate = c.diagnoses?.[0]?.syndrome_name;
  const inFlight = c.status === 'pending' || c.status === 'processing';

  return (
    <Page max={1440}>
      <button onClick={() => navigate('/app/cases')} style={{ background: 'transparent', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-13)', padding: '4px 0', marginBottom: 16 }}>
        <ChevronLeft size={14} /> {t('detail.allCases')}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{t('detail.caseNo', { id: c.id.slice(0, 8) })}</span>
            <StatusPill status={c.status} />
          </div>
          <h1 style={{ fontSize: 'var(--fs-30)', margin: 0, letterSpacing: '-0.015em' }}>
            {topCandidate ?? c.patient_name ?? t('detail.pendingAnalysis')}
          </h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 'var(--fs-13)', color: 'var(--ink-2)', flexWrap: 'wrap' }}>
            <span>{c.patient_name || t('unnamedPatient')}</span>
            <span>·</span>
            <span>{formatAge(c.patient_age)}</span>
            {c.patient_ethnicity && <><span>·</span><span>{c.patient_ethnicity}</span></>}
            <span>·</span>
            <span>{t('detail.uploadedOn', { date: formatDate(c.created_at) })}</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil size={14} /> {t('detail.editMetadata')}</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard
            title={t('detail.landmarkAnalysis')}
            aside={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>{t('detail.landmarksAside', { count: 127 })}</span>}
          >
            <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius-md)', padding: 24, display: 'flex', justifyContent: 'center' }}>
              <img src="/assets/landmarks.svg" alt="Abstract facial landmark graph" style={{ maxHeight: 380, objectFit: 'contain' }} />
            </div>
            <div style={{ marginTop: 12, fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>
              {t('detail.privacyNote')}
            </div>
          </SectionCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <CandidatePanel data={c} inFlight={inFlight} />
        </div>
      </div>

      {editing && id && <EditMetadataModal c={c} id={id} onClose={() => setEditing(false)} />}
    </Page>
  );
}

function CandidatePanel({ data, inFlight }: { data: CaseWithDiagnoses; inFlight: boolean }) {
  const { t } = useTranslation('cases');
  if (inFlight) {
    return (
      <Card>
        <div style={{ padding: '24px 8px', textAlign: 'center' }}>
          <Spinner size={24} />
          <div style={{ marginTop: 14, fontSize: 'var(--fs-14)', color: 'var(--ink-2)', fontWeight: 500 }}>{t('detail.analysisInProgress')}</div>
          <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', margin: '6px 0 0' }}>
            {t('detail.analysisInProgressBody')}
          </p>
        </div>
      </Card>
    );
  }

  if (data.status === 'failed') {
    return <Card><div style={{ padding: 12, color: 'var(--danger)', fontSize: 'var(--fs-14)' }}>{t('detail.analysisFailed')}</div></Card>;
  }

  const diagnoses = [...(data.diagnoses ?? [])].sort((a, b) => a.rank - b.rank);
  const top = diagnoses[0]?.confidence ?? 1;

  return (
    <SectionCard title={t('detail.candidateSyndromes')} aside={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-11)', color: 'var(--ink-3)' }}>{t('detail.posterior')}</span>}>
      {diagnoses.length === 0 ? (
        <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-3)', padding: '8px 0' }}>{t('detail.noCandidates')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {diagnoses.map((d, i) => {
            const row = (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-14)', fontWeight: 500, color: 'var(--ink)' }}>{d.syndrome_name}</div>
                    <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{t('detail.rank', { rank: d.rank })}</div>
                  </div>
                  <div style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-14)', fontWeight: 500, color: i === 0 ? 'var(--teal-bright)' : 'var(--ink-2)' }}>
                    {d.confidence.toFixed(2)}
                  </div>
                </div>
                <ConfidenceBar value={d.confidence / (top || 1)} top={i === 0} height={3} />
              </>
            );
            return (
              <div key={d.id} style={{ padding: '12px 0', borderBottom: i < diagnoses.length - 1 ? '1px solid var(--line)' : 'none' }}>
                {d.syndrome_id ? (
                  <Link to={`/app/syndromes/${d.syndrome_id}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>{row}</Link>
                ) : row}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function EditMetadataModal({ c, id, onClose }: { c: CaseWithDiagnoses; id: string; onClose: () => void }) {
  const { t } = useTranslation('cases');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const update = useUpdateCase(id);
  const [form, setForm] = useState({
    patient_name: c.patient_name ?? '',
    patient_age: c.patient_age?.toString() ?? '',
    patient_ethnicity: c.patient_ethnicity ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      await update.mutateAsync({
        patient_name: form.patient_name.trim() || null,
        patient_age: form.patient_age ? Number(form.patient_age) : null,
        patient_ethnicity: form.patient_ethnicity.trim() || null,
      });
      toast.success(t('detail.toastUpdated'));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('detail.toastUpdateError'));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('detail.editModalTitle')}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={update.isPending}>{tc('actions.cancel')}</Button>
        <Button onClick={save} loading={update.isPending}>{tc('actions.save')}</Button>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label={t('new.nameLabel')} htmlFor="en">
          <Input id="en" value={form.patient_name} onChange={(e) => set('patient_name', e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label={t('new.ageLabel')} htmlFor="ea">
            <Input id="ea" type="number" min={0} max={120} value={form.patient_age} onChange={(e) => set('patient_age', e.target.value)} />
          </Field>
          <Field label={t('new.ethnicityLabel')} htmlFor="ee">
            <Input id="ee" value={form.patient_ethnicity} onChange={(e) => set('patient_ethnicity', e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
