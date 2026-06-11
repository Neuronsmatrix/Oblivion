import { describe, expect, it } from 'vitest';
import i18n, { SUPPORTED_LANGUAGES } from './index';
import { NAMESPACES, resources } from './resources';

/**
 * Recursively collect dotted key paths from a nested dictionary, normalizing
 * i18next plural suffixes so language-specific plural forms (en: one/other;
 * ru: one/few/many) don't break parity — we only require the base key to exist
 * in both locales.
 */
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  const paths = Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
  const normalized = paths.map((p) => p.replace(/_(zero|one|two|few|many|other)$/, ''));
  return [...new Set(normalized)];
}

describe('i18n config', () => {
  it('defaults to Russian', () => {
    expect(i18n.language).toBe('ru');
    expect(i18n.options.fallbackLng).toContain('ru');
  });

  it('persists the chosen language to localStorage', async () => {
    await i18n.changeLanguage('en');
    expect(localStorage.getItem('phenograph.lang')).toBe('en');
    await i18n.changeLanguage('ru');
  });
});

describe('locale key parity', () => {
  it.each(NAMESPACES)('ru and en have identical keys in "%s"', (ns) => {
    const ru = keyPaths(resources.ru[ns]).sort();
    const en = keyPaths(resources.en[ns]).sort();
    expect(ru).toEqual(en);
  });

  it('covers every supported language', () => {
    for (const lng of SUPPORTED_LANGUAGES) {
      expect(resources[lng]).toBeDefined();
    }
  });
});
