import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Keeps <html lang> in sync with the active language. Renders nothing. */
export function HtmlLangSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'ru';
  }, [i18n.resolvedLanguage]);
  return null;
}
