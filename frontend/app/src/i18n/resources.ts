import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enMarketing from './locales/en/marketing.json';
import ruCommon from './locales/ru/common.json';
import ruNav from './locales/ru/nav.json';
import ruMarketing from './locales/ru/marketing.json';

export const NAMESPACES = ['common', 'nav', 'marketing'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const defaultNS = 'common';

export const resources = {
  en: { common: enCommon, nav: enNav, marketing: enMarketing },
  ru: { common: ruCommon, nav: ruNav, marketing: ruMarketing },
} as const;

export type AppResources = (typeof resources)['ru'];
