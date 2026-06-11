import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enMarketing from './locales/en/marketing.json';
import enAuth from './locales/en/auth.json';
import enCases from './locales/en/cases.json';
import enLabs from './locales/en/labs.json';
import enReference from './locales/en/reference.json';
import enNotifications from './locales/en/notifications.json';
import enProfile from './locales/en/profile.json';
import ruCommon from './locales/ru/common.json';
import ruNav from './locales/ru/nav.json';
import ruMarketing from './locales/ru/marketing.json';
import ruAuth from './locales/ru/auth.json';
import ruCases from './locales/ru/cases.json';
import ruLabs from './locales/ru/labs.json';
import ruReference from './locales/ru/reference.json';
import ruNotifications from './locales/ru/notifications.json';
import ruProfile from './locales/ru/profile.json';

export const NAMESPACES = ['common', 'nav', 'marketing', 'auth', 'cases', 'labs', 'reference', 'notifications', 'profile'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const defaultNS = 'common';

export const resources = {
  en: { common: enCommon, nav: enNav, marketing: enMarketing, auth: enAuth, cases: enCases, labs: enLabs, reference: enReference, notifications: enNotifications, profile: enProfile },
  ru: { common: ruCommon, nav: ruNav, marketing: ruMarketing, auth: ruAuth, cases: ruCases, labs: ruLabs, reference: ruReference, notifications: ruNotifications, profile: ruProfile },
} as const;

export type AppResources = (typeof resources)['ru'];
