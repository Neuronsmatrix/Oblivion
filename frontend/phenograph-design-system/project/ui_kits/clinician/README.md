# Clinician web app UI kit

Interactive recreation of the Phenograph clinician app. Open `index.html` — it boots to the case list, click any case to open the case-detail view with landmark viewer, matched features, and ranked syndromes panel.

Components:
- `AppShell.jsx` — left sidebar nav, top bar with search/user
- `CaseList.jsx` — paginated table of cases with status, date, MRN, top candidate
- `CaseDetail.jsx` — case header, landmark viewer, feature panel, syndrome ranking
- `SyndromePanel.jsx` — right-rail list of ranked candidate syndromes with posteriors
- `FeatureChips.jsx` — matched HPO features with confidence

Designed for 1440px viewport.
