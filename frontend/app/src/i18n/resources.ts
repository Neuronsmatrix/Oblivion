import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import ruCommon from './locales/ru/common.json';
import ruNav from './locales/ru/nav.json';

export const NAMESPACES = ['common', 'nav'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const defaultNS = 'common';

export const resources = {
  en: { common: enCommon, nav: enNav },
  ru: { common: ruCommon, nav: ruNav },
} as const;

export type AppResources = (typeof resources)['ru'];
