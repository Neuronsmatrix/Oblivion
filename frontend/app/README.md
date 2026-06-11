# Phenograph frontend

Production SPA for the Oblivion / **Phenograph** face / genetic-syndrome
recognition platform. Built with **Vite + React + TypeScript**, wired to the API
documented in `../../docs/openapi.yaml`. Design tokens and components are ported
from the `phenograph-design-system` and `phenograph-main` prototypes (kept as
read-only reference in sibling folders).

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production bundle into dist/
```

### Environment (`.env`)

| Var | Meaning |
|-----|---------|
| `VITE_API_BASE_URL` | API gateway base URL (default `http://localhost:8080`; nginx routes by path prefix). Replace with the real domain in production. |
| `VITE_USE_MOCKS` | `true` → run against in-browser **MSW** mocks (no backend needed); `false` → hit the real gateway. |

**Demo (mock) accounts** — when `VITE_USE_MOCKS=true`:
- Doctor: `doctor@phenograph.test` / `password`
- Lab: `lab@phenograph.test` / `password`

(Or register a new account; mock data is in-memory and resets on full page reload.)

## What's here

- **Marketing landing** (`/`) — cinematic three-act scroll (DNA ribbon → face mesh
  → evidence stats) followed by feature grid, evidence band, footer.
- **Auth** — register / login / refresh / logout (JWT in `localStorage`; access
  token auto-refreshed on 401). Role-aware routing (`doctor` / `lab`).
- **Doctor flow** — cases list, new analysis (create → presigned upload → confirm →
  poll), case detail with ranked diagnoses and editable metadata.
- **Lab flow** — batch submit, batch results (polled), monthly usage, plans & subscribe.
- **Shared** — syndrome reference + detail, HPO feature atlas, notifications, profile.

## Localization (i18n)

The app ships **Russian (default)** and **English**, built on **react-i18next**.

- Default language is Russian. Switch via the language selector in the marketing
  nav or the app sidebar footer. The choice is remembered in `localStorage`
  (`phenograph.lang`) and reused on return visits; with no stored value the app
  falls back to Russian.
- Translations live in `src/i18n/locales/<lng>/<namespace>.json`, one namespace
  per feature area (`common`, `nav`, `marketing`, `auth`, `cases`, `labs`,
  `reference`, `notifications`, `profile`). Register a new namespace in
  `src/i18n/resources.ts` (and it is automatically covered by the parity test).
- Components read strings with `useTranslation('<namespace>')` + `t('key')`.
  Russian plural forms use i18next's `_one/_few/_many` suffixes.
- `src/i18n/react-i18next.d.ts` makes translation keys type-checked at compile time.
- `npm test` runs a **key-parity test** that fails if `ru` and `en` drift out of
  sync (missing/typo'd keys), plus a bilingual landing-page smoke test.
- Proper nouns kept verbatim in both languages: the brand "Phenograph",
  model/version ids (`pg-face-3.2`, `HPO v2024.4`), publication venues, and
  standards acronyms (HIPAA, SOC 2, GDPR). Dates use the browser locale.

## Structure

- `src/lib/api/` — `apiFetch` (envelope unwrap + refresh), typed endpoints, domain types.
- `src/auth/` — `AuthContext`, route guards.
- `src/components/ui/` — design-system primitives. `src/components/layout/` — app shell.
- `src/features/<area>/` — screens + React Query hooks per domain.
- `src/mocks/` — MSW handlers + in-memory DB (mock mode only).

## Known backend gaps (surfaced honestly in the UI, not faked)

- **No profile-update endpoint** → profile is read-only.
- **No "list batches" endpoint** → created batch ids are tracked in `localStorage`.
- **`POST /labs/batch` takes `image_keys`, not files**, and there is no lab presign
  endpoint → the batch uploader derives keys from selected files; in production these
  must reference objects already staged in storage (confirm approach with backend).
- **`POST /billing/subscribe`** has no `security` block in the spec and needs `lab_id`;
  the UI sends the current user's id as `lab_id` (verify with backend).
- **Presigned `PUT` is cross-origin** → the storage bucket (MinIO/S3) must allow CORS
  from the app origin for the upload step to work against the real backend.

Prototype-only affordances with no API (FHIR export, finalize review, global search,
"all/flagged" case tabs) were intentionally omitted rather than stubbed.
