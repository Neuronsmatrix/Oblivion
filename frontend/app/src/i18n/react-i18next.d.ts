import 'react-i18next';
import type { AppResources } from './resources';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: AppResources;
  }
}
