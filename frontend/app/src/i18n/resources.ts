import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enMarketing from './locales/en/marketing.json';
import enAuth from './locales/en/auth.json';
import ruCommon from './locales/ru/common.json';
import ruNav from './locales/ru/nav.json';
import ruMarketing from './locales/ru/marketing.json';
import ruAuth from './locales/ru/auth.json';

export const NAMESPACES = ['common', 'nav', 'marketing', 'auth'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const defaultNS = 'common';

export const resources = {
  en: { common: enCommon, nav: enNav, marketing: enMarketing, auth: enAuth },
  ru: { common: ruCommon, nav: ruNav, marketing: ruMarketing, auth: ruAuth },
} as const;

export type AppResources = (typeof resources)['ru'];
