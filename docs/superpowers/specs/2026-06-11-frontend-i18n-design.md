# Frontend i18n — Russian default, English secondary

**Date:** 2026-06-11
**Scope:** `frontend/app` (Vite + React 19 + TypeScript SPA)
**Status:** Approved (design)

## Goal

Add multi-language support to the production frontend. Ship Russian and English,
with **Russian as the default**. Provide a language switcher on the marketing
landing page and in the authenticated app sidebar. The whole app is translated
(marketing + auth + cases + labs + reference + notifications + profile + shared UI).

## Decisions (locked)

- **Library:** `react-i18next` (+ `i18next`, `i18next-browser-languagedetector`).
- **Scope:** whole app.
- **Persistence:** first visit defaults to Russian; manual switch is remembered in
  `localStorage` and reused on return visits.
- **Switcher placement:** marketing nav **and** app sidebar footer.
- **Untranslated proper nouns:** brand name "Phenograph"; model/version IDs
  (`pg-face-3.2`, `HPO v2024.4`); publication venues (Nature Genetics, AJHG,
  JAMA Pediatrics); standards acronyms (HIPAA, SOC 2 Type II, GDPR).
  Everything else, including the hero tagline, is translated.

## Architecture

### Initialization
- New `src/i18n/index.ts` configures i18next:
  - `supportedLngs: ['ru', 'en']`, `fallbackLng: 'ru'`.
  - `LanguageDetector` with `order: ['localStorage']`, `caches: ['localStorage']`,
    `lookupLocalStorage: 'phenograph.lang'`. No detector hit → `fallbackLng` (ru).
  - Resources are **bundled** (statically imported), not network-lazy-loaded, so
    there is no flash of untranslated content and init is synchronous.
  - `interpolation.escapeValue: false` (React already escapes).
- `main.tsx` imports `./i18n` before `createRoot`.
- A small `<HtmlLangSync />` (or effect in `App`) keeps
  `document.documentElement.lang` in sync with the active language.

### Resource organization — namespaced per feature
`src/i18n/locales/{ru,en}/<namespace>.json`, one namespace per feature area:

| Namespace       | Covers |
|-----------------|--------|
| `common`        | Buttons, form labels, pagination, toasts, modals, generic feedback |
| `nav`           | Sidebar nav labels |
| `marketing`     | Landing: nav, scroll-story acts, feature grid, evidence band, footer |
| `auth`          | Login, register, auth layout |
| `cases`         | Cases list/detail/new |
| `labs`          | Batches, billing, usage, new batch |
| `reference`     | Syndromes, syndrome detail, HPO atlas |
| `notifications` | Notifications page |
| `profile`       | Profile page |

The existing English copy becomes the `en` resource verbatim. Russian is authored
fresh with correct clinical/genetics terminology.

### Language switcher
- `src/components/ui/LanguageSwitcher.tsx`: compact dropdown (lucide `Languages`
  icon) listing RU / EN, extensible to more locales. Calls `i18n.changeLanguage`.
- Rendered in `sections.tsx` `MarketingNav` and in `Sidebar.tsx` footer.

### String migration
- Each component uses `useTranslation('<namespace>')` + `t('key')`.
- **Dynamic values** (scroll-story animated counts, "As of Apr 2026", landmark/
  edge stats, notification unread badge, list counts): i18next interpolation,
  e.g. `t('stats.accuracyLabel', { n })`. Use Russian plural keys
  (`_one/_few/_many`) wherever a count is rendered inline with a noun.
- **`nav.ts`**: each `NavItem` gets a stable `key` (e.g. `'cases'`, `'notifications'`)
  used both for the i18n lookup (`nav:<key>`) and for the badge condition (replacing
  the brittle `item.label === 'Notifications'` check). `Sidebar` resolves the label
  via `t`.
- **Scroll-story** mono/abstract labels (`PG · 01`, `FIG. 01 — IDLE STATE`, stage
  names, "Scroll to continue") move into the `marketing` namespace.
- Inline styles are untouched; only text content changes.

### Type safety
- `src/i18n/react-i18next.d.ts` augments `react-i18next` with the RU resource shape
  (`defaultNS` + `resources`), giving autocomplete and compile-time errors for
  missing/typo'd keys.

## Testing

No test runner exists yet, so add **Vitest + @testing-library/react** with a `test`
npm script and `jsdom` environment.

- **Key parity** — for every namespace, `ru` and `en` have identical key sets
  (recursively). Guards against missing translations.
- **i18n config** — default language resolves to `ru`; `changeLanguage('en')`
  updates the active language and writes `phenograph.lang` to localStorage; a
  pre-seeded localStorage value is honored on init.
- **LanguageSwitcher** — renders both options; selecting EN calls
  `changeLanguage` and the visible label updates.
- **Smoke renders** — `LandingPage` and one authenticated page render in both
  languages without throwing and show translated copy.

## Verification

- `npm run build` (`tsc -b && vite build`) passes with the new types.
- `npm run lint` clean.
- `npm test` green.
- Manual: dev server, eyeball landing page + one app page in RU and EN, confirm
  switch persists across reload.

## Out of scope

- Languages beyond RU/EN (infrastructure is extensible, but no others authored).
- Locale-aware number/date formatting libraries beyond what i18next interpolation
  and `toLocaleString` already provide.
- Backend / API response localization.
- RTL support (neither language needs it).
