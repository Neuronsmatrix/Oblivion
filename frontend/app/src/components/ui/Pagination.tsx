import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export function Pagination({
  offset, limit, count, onChange,
}: {
  offset: number; limit: number; count: number; onChange: (offset: number) => void;
}) {
  const { t } = useTranslation('common');
  const page = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  const hasNext = count === limit; // full page implies there may be more
  if (!hasPrev && !hasNext) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
      <span style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{t('pagination.page', { page })}</span>
      <Button variant="secondary" size="sm" disabled={!hasPrev} onClick={() => onChange(Math.max(0, offset - limit))}>
        <ChevronLeft size={14} /> {t('pagination.prev')}
      </Button>
      <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => onChange(offset + limit)}>
        {t('pagination.next')} <ChevronRight size={14} />
      </Button>
    </div>
  );
}
