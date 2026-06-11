import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Dropzone({
  onFiles, multiple = false, accept = 'image/*', hint,
}: {
  onFiles: (files: File[]) => void; multiple?: boolean; accept?: string; hint?: string;
}) {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${dragging ? 'var(--teal-bright)' : 'var(--line)'}`,
        borderRadius: 'var(--radius-md)', padding: '36px 24px', textAlign: 'center',
        background: dragging ? 'var(--info-bg)' : 'var(--paper-2)', cursor: 'pointer',
        transition: 'border-color var(--dur-fast), background var(--dur-fast)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => handle(e.target.files)}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <Upload size={24} strokeWidth={1.5} color="var(--ink-3)" />
      </div>
      <div style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-2)', fontWeight: 500 }}>
        {multiple ? t('dropzone.promptMany') : t('dropzone.promptOne')}
      </div>
      {hint && <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-3)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
