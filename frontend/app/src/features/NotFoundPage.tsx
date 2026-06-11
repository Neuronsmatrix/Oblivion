import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div className="mono" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>404</div>
        <h1 style={{ fontSize: 'var(--fs-36)', marginBottom: 12 }}>{t('notFound.title')}</h1>
        <p style={{ color: 'var(--ink-2)', marginBottom: 24 }}>{t('notFound.message')}</p>
        <Link to="/"><Button>{t('actions.backToHome')}</Button></Link>
      </div>
    </div>
  );
}
