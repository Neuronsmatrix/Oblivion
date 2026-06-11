// Calmer marketing-kit sections, ported from phenograph-design-system.
import { Link } from 'react-router-dom';
import { Dna, FileSearch, ScanFace } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/ui';

export function MarketingNav() {
  const { t } = useTranslation('marketing');
  const { t: tc } = useTranslation('common');
  const links: [string, string][] = [
    ['product', 'nav.product'],
    ['evidence', 'nav.evidence'],
    ['forClinicians', 'nav.forClinicians'],
    ['research', 'nav.research'],
  ];
  return (
    <nav
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(250,248,242,0.82)', backdropFilter: 'blur(10px) saturate(140%)',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/assets/logo.svg" style={{ height: 30 }} alt="Phenograph" />
      </Link>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {links.map(([k, key]) => (
          <a key={k} href="#" style={{ color: 'var(--ink-2)', textDecoration: 'none', fontSize: 'var(--fs-14)', fontWeight: 500 }}>{t(key)}</a>
        ))}
        <LanguageSwitcher />
        <Link to="/login" style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 'var(--fs-14)', fontWeight: 500, padding: '8px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>{tc('actions.signIn')}</Link>
        <Link to="/register" style={{ color: '#fff', textDecoration: 'none', fontSize: 'var(--fs-14)', fontWeight: 500, padding: '8px 14px', background: 'var(--teal-bright)', borderRadius: 'var(--radius-md)' }}>{tc('actions.requestAccess')}</Link>
      </div>
    </nav>
  );
}

export function FeatureGrid() {
  const { t } = useTranslation('marketing');
  const features = [
    { icon: ScanFace, k: 'landmark' },
    { icon: Dna, k: 'ranking' },
    { icon: FileSearch, k: 'workflow' },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 48px', borderTop: '1px solid var(--line)' }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>{t('features.eyebrow')}</div>
      <h2 style={{ fontSize: 'var(--fs-36)', letterSpacing: '-0.015em', marginBottom: 48, maxWidth: 640 }}>
        {t('features.heading')}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.k}>
              <Icon size={28} strokeWidth={1.5} color="var(--teal-bright)" />
              <h3 style={{ fontSize: 'var(--fs-20)', fontWeight: 500, marginTop: 18, marginBottom: 10 }}>{t(`features.${f.k}.title`)}</h3>
              <p style={{ fontSize: 'var(--fs-15, 0.95rem)', lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{t(`features.${f.k}.body`)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function EvidenceBand() {
  const { t } = useTranslation('marketing');
  const stats: [string, string][] = [
    ['92%', 'evidence.accuracy'],
    ['4,317', 'evidence.syndromes'],
    ['17', 'evidence.publications'],
  ];
  return (
    <section style={{ background: 'var(--midnight)', color: '#f1ede3', padding: '80px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 'var(--fs-12)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--moss)', fontWeight: 500, marginBottom: 12 }}>{t('evidence.eyebrow')}</div>
        <h2 style={{ fontSize: 'var(--fs-36)', letterSpacing: '-0.015em', color: '#f1ede3', maxWidth: 720, marginBottom: 48 }}>
          {t('evidence.heading')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48, borderTop: '1px solid #2a3d44', paddingTop: 36 }}>
          {stats.map(([n, key]) => (
            <div key={n}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--moss)' }}>{n}</div>
              <div style={{ fontSize: 'var(--fs-14)', color: '#c7c0b0', marginTop: 10, maxWidth: 260 }}>{t(key)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  const { t } = useTranslation('marketing');
  const cols = [
    { k: 'product', links: ['overview', 'clinicalWorkflow', 'integrations', 'security', 'changelog'] },
    { k: 'evidence', links: ['publications', 'validation', 'hpoAlignment', 'limitations'] },
    { k: 'company', links: ['about', 'researchEthics', 'careers', 'contact'] },
    { k: 'legal', links: ['privacy', 'terms', 'dpa', 'responsibleUse'] },
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '64px 48px 32px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(auto-fit, minmax(120px, 1fr))', gap: 48 }}>
          <div>
            <img src="/assets/logo.svg" style={{ height: 30 }} alt="Phenograph" />
            <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', maxWidth: 260, marginTop: 14, lineHeight: 1.5 }}>
              {t('footer.tagline')}
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.k}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>{t(`footer.cols.${col.k}`)}</div>
              {col.links.map((l) => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-2)', textDecoration: 'none' }}>{t(`footer.links.${l}`)}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>
          <div>{t('footer.copyright')}</div>
          <div>SOC 2 · HIPAA · GDPR</div>
        </div>
      </div>
    </footer>
  );
}
