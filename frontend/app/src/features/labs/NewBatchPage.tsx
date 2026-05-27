import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button, Card, Dropzone, useToast } from '../../components/ui';
import { batchStore, useSubmitBatch } from './queries';

interface Staged { key: string; name: string }

export function NewBatchPage() {
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
    if (staged.length === 0) { toast.error('Add at least one image.'); return; }
    try {
      const res = await submit.mutateAsync(staged.map((s) => s.key));
      if (user) batchStore.add(user.id, { id: res.batch.id, total: res.batch.total_items, created_at: res.batch.created_at });
      toast.success(`Batch submitted: ${res.batch.total_items} images queued.`);
      navigate(`/app/batches/${res.batch.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit the batch.');
    }
  };

  return (
    <Page max={760}>
      <PageHeader eyebrow="Laboratory" title="New batch" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>Images</h3>
          <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', margin: '0 0 14px' }}>
            Add the frontal images to analyze. The batch service references images by their object-storage key;
            in production these are staged in your bucket beforehand.
          </p>
          <Dropzone onFiles={add} multiple hint="Select multiple JPEG or PNG files." />

          {staged.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staged.map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--paper-2)' }}>
                  <ImageIcon size={14} color="var(--ink-3)" />
                  <span style={{ flex: 1, fontSize: 'var(--fs-14)', color: 'var(--ink)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-12)', color: 'var(--ink-4)' }}>{s.key}</span>
                  <button aria-label="Remove" onClick={() => remove(s.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)' }}>{staged.length} image{staged.length === 1 ? '' : 's'} staged</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate('/app/batches')} disabled={submit.isPending}>Cancel</Button>
            <Button onClick={onSubmit} loading={submit.isPending}>Submit batch</Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
