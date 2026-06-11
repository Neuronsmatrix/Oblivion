import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, ImageIcon, X } from 'lucide-react';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, Dropzone, Field, Input, useToast } from '../../components/ui';
import { casesApi, uploadToPresignedUrl } from '../../lib/api/endpoints';

type Step = 'idle' | 'creating' | 'uploading' | 'confirming';

export function NewCasePage() {
  const { t } = useTranslation('cases');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ patient_name: '', patient_age: '', patient_ethnicity: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('idle');

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickFile = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const busy = step !== 'idle';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error(t('new.toastNoImage')); return; }
    try {
      setStep('creating');
      const created = await casesApi.create({
        patient_name: form.patient_name.trim() || null,
        patient_age: form.patient_age ? Number(form.patient_age) : null,
        patient_ethnicity: form.patient_ethnicity.trim() || null,
      });

      setStep('uploading');
      await uploadToPresignedUrl(created.upload_url, file);

      setStep('confirming');
      await casesApi.confirmUpload(created.case_id);

      qc.invalidateQueries({ queryKey: ['cases'] });
      toast.success(t('new.toastStarted'));
      navigate(`/app/cases/${created.case_id}`);
    } catch (err) {
      setStep('idle');
      toast.error(err instanceof Error ? err.message : t('new.toastError'));
    }
  };

  const stepLabel: Record<Step, string> = {
    idle: t('new.stepIdle'),
    creating: t('new.stepCreating'),
    uploading: t('new.stepUploading'),
    confirming: t('new.stepConfirming'),
  };

  return (
    <Page max={760}>
      <PageHeader eyebrow={tc('eyebrow.workspace')} title={t('new.title')} />

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>{t('new.imageTitle')}</h3>
          <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', margin: '0 0 14px' }}>
            {t('new.imageDesc')}
          </p>
          {preview ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--paper-2)' }}>
              <img src={preview} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-14)', color: 'var(--ink)' }}>
                  <ImageIcon size={14} /> {file?.name}
                </div>
                <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>{file ? `${(file.size / 1024).toFixed(0)} KB` : ''}</div>
              </div>
              {!busy && (
                <button type="button" aria-label={t('new.removeImage')} onClick={() => { setFile(null); setPreview(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
                  <X size={16} />
                </button>
              )}
            </div>
          ) : (
            <Dropzone onFiles={pickFile} hint={t('new.dropzoneHint')} />
          )}
        </Card>

        <Card>
          <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 14px' }}>{t('new.metadataTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label={t('new.nameLabel')} htmlFor="pn" hint={t('new.nameHint')}>
              <Input id="pn" value={form.patient_name} onChange={(e) => set('patient_name', e.target.value)} placeholder={t('new.namePlaceholder')} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label={t('new.ageLabel')} htmlFor="pa">
                <Input id="pa" type="number" min={0} max={120} value={form.patient_age} onChange={(e) => set('patient_age', e.target.value)} placeholder={t('new.agePlaceholder')} />
              </Field>
              <Field label={t('new.ethnicityLabel')} htmlFor="pe" hint={t('new.ethnicityHint')}>
                <Input id="pe" value={form.patient_ethnicity} onChange={(e) => set('patient_ethnicity', e.target.value)} placeholder={t('new.ethnicityPlaceholder')} />
              </Field>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => navigate('/app/cases')}>{tc('actions.cancel')}</Button>
          <Button type="submit" loading={busy}>{busy ? stepLabel[step] : <><Check size={14} /> {stepLabel.idle}</>}</Button>
        </div>
      </form>
    </Page>
  );
}
