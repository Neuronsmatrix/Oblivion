import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, Dropzone, useToast } from '../../components/ui';
import { batchStore, useSubmitBatch } from './queries';

interface Staged { key: string; name: string }

export function NewBatchPage() {
  const { t } = useTranslation('labs');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const submit = useSubmitBatch();
  const [staged, setStaged] = useState<Staged[]>([]);

  // Derive an object-storage key per file. In production these must be the keys
  // of images already staged in S3/MinIO (the batch API takes keys, not bytes).
  const add = (files: File[]) => {
    const next = files.map((f) => ({ key: `batch/${crypto.randomUUID().slice(0, 8)}/${f.name}`, name: f.name }));
    setStaged((s) => [...s, ...next]);
  };

  const remove = (key: string) => setStaged((s) => s.filter((x) => x.key !== key));

  const onSubmit = async () => {
    if (staged.length === 0) { toast.error(t('newBatch.toastNoImages')); return; }
    try {
      const res = await submit.mutateAsync(staged.map((s) => s.key));
      if (user) batchStore.add(user.id, { id: res.batch.id, total: res.batch.total_items, created_at: res.batch.created_at });
      toast.success(t('newBatch.toastSubmitted', { count: res.batch.total_items }));
      navigate(`/app/batches/${res.batch.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('newBatch.toastError'));
    }
  };

  return (
    <Page max={760}>
      <PageHeader eyebrow={tc('eyebrow.laboratory')} title={t('newBatch.title')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>{t('newBatch.imagesTitle')}</h3>
          <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', margin: '0 0 14px' }}>
            {t('newBatch.imagesDesc')}
          </p>
          <Dropzone onFiles={add} multiple hint={t('newBatch.dropzoneHint')} />

          {staged.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staged.map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--paper-2)' }}>
                  <ImageIcon size={14} color="var(--ink-3)" />
                  <span style={{ flex: 1, fontSize: 'var(--fs-14)', color: 'var(--ink)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--ink-4)' }}>{s.key}</span>
                  <button aria-label={t('newBatch.removeAria')} onClick={() => remove(s.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{t('newBatch.stagedCount', { count: staged.length })}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate('/app/batches')} disabled={submit.isPending}>{tc('actions.cancel')}</Button>
            <Button onClick={onSubmit} loading={submit.isPending}>{t('newBatch.submit')}</Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
