import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation('common');
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
      <Languages size={compact ? 14 : 16} strokeWidth={1.75} aria-hidden />
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {t('lang.label')}
      </span>
      <select
        aria-label={t('lang.label')}
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        style={{
          appearance: 'none', background: 'transparent', border: 'none',
          color: 'inherit', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-14)',
          fontWeight: 500, cursor: 'pointer', padding: '2px 4px',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>{t(`lang.${lng}`)}</option>
        ))}
      </select>
    </label>
  );
}
