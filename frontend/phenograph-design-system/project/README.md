# Phenograph Design System

> Software for finding genetic diseases by face images.

Phenograph is a clinical-genomics product that analyzes facial phenotype — subtle morphological features of the face — to help clinicians narrow the diagnostic search space for rare genetic syndromes. Many rare diseases have recognizable "gestalts" that an experienced dysmorphologist can spot; Phenograph extends that capability with computer-vision phenotyping and a curated knowledge graph linking features to syndromes and genes.

The product is aimed at **clinical geneticists, dysmorphologists, and pediatric/rare-disease specialists**, with a secondary audience of researchers. It is _not_ a consumer diagnostic — the tone is clinical, careful, and evidence-forward.

## Source materials

_No existing brand, codebase, or Figma was provided._ This system was invented from the brief below and should be treated as a starting proposal, not ground truth. Every decision is open to revision.

**Brief provided:**
- Product area: finding genetic diseases by face images
- Color palette seeded with natural tones: `#a2b568  #697431  #475d2e  #15282f  #114643  #068176`

The palette skews toward **botanical greens and deep teal** — evoking natural sciences, clinical calm, and life-sciences editorial design (think _Nature_, _Wellcome Collection_, modern biotech). We leaned into that rather than fighting it.

## What's in here

| File / folder | What it is |
|---|---|
| `README.md` | This file — brand context, content fundamentals, visual foundations, iconography |
| `SKILL.md` | Portable skill definition so this system works as an Agent Skill |
| `colors_and_type.css` | All CSS tokens — color, type scale, spacing, radii, shadows, semantic element styles |
| `fonts/` | Self-hosted web fonts (see note on substitutions below) |
| `assets/` | Logos, marks, iconography, illustration |
| `preview/` | Cards rendered in the Design System tab |
| `ui_kits/marketing/` | Marketing-site UI kit — hero, features, evidence, footer |
| `ui_kits/clinician/` | Clinician web-app UI kit — case list, case detail with analysis, results panel |
| `slides/` | Sample slide templates for internal/external decks |

---

## Content fundamentals

**Voice: clinical, quiet, confident.** Phenograph sounds like a careful colleague, not a marketer. We assume the reader is a clinician or scientist. We do not hype; evidence does the work.

**Person:** Third person or imperative for product UI ("Upload an image", "Review candidate syndromes"). First person plural ("we") only in About / mission copy. Avoid "you" in clinical contexts where it could be misread as addressing the patient.

**Casing:** Sentence case everywhere — headings, buttons, nav. Title Case is reserved for proper nouns (syndrome names, gene symbols, person names).

**Numbers & units:** Always specific. `27 matched features`, not "lots of features". Percentages to one decimal when below 10%, whole numbers above (`0.8%`, `94%`). Gene symbols in italic monospace (`FBN1`), syndrome names in roman (Marfan syndrome).

**What we don't do:**
- No exclamation marks. Ever.
- No emoji in product surfaces. Occasionally in internal comms only.
- No "magic", "revolutionary", "AI-powered" marketing tics. We say "computer vision" or "model", never "AI" alone.
- No scare-language around rare disease ("finally get answers!"). We respect the weight of the subject.
- No diagnostic claims. Phenograph _suggests candidates for clinical review_; it does not diagnose.

**Example copy**

> **Do:**
> "Upload a frontal facial image. Phenograph will identify morphological features and rank candidate syndromes against the HPO ontology."
>
> "27 features matched. Top candidate: Noonan syndrome (posterior probability 0.41)."

> **Don't:**
> "Upload a photo and let our AI work its magic! 🧬✨"
>
> "We found your diagnosis!"

**Microcopy patterns**
- Empty states describe _what this view will contain_, never apologize. "Cases you create will appear here."
- Errors name the cause and the recovery, in that order. "Image resolution below 400px. Upload an image of at least 800×800 for best results."
- Loading states use present participle + specific work: "Locating landmarks…" not "Loading…"

---

## Visual foundations

### Color

The palette is built from the provided naturals, extended with neutrals and a minimal set of semantic colors:

- **Moss** `#a2b568` — the accent / living-color highlight. Sparingly used.
- **Olive** `#697431` — secondary accent, data viz series 2.
- **Forest** `#475d2e` — primary brand hue for UI chrome.
- **Midnight** `#15282f` — near-black. Primary text on light. Background in dark mode.
- **Deep teal** `#114643` — secondary surface / confident UI tint.
- **Bright teal** `#068176` — the one high-chroma color. Used for focus, links, selected state.

Extended with warm off-whites (`#faf8f2`, `#f1ede3`) and a slate neutral ramp. See `colors_and_type.css`.

**Rules**
- Pages default to warm off-white (`#faf8f2`), not pure white. Pure white feels sterile and flat against our greens.
- A single primary accent per view. Do not mix moss + bright teal as peers; pick one.
- Text is `#15282f` (midnight) on light, `#f1ede3` on dark. Mid-grays for secondary.
- No gradient backgrounds except a single hero technique: a very subtle vertical wash from `#faf8f2` → `#f1ede3`. No purple/blue gradients anywhere, ever.

### Type

- **Display / headings:** **Fraunces** — a contemporary serif with subtle optical sizing. Lends editorial, scientific-journal weight. Used for H1–H3 and large data figures.
- **Body:** **Inter** — workhorse sans. Used for UI, paragraphs, forms.
- **Mono:** **JetBrains Mono** — gene symbols, HPO terms, numeric IDs, code.

_Substitution note_: Fraunces, Inter, and JetBrains Mono are all loaded from Google Fonts. If the real brand has custom type, swap in `fonts/` and update `@font-face` in `colors_and_type.css`. **Flagged for user confirmation.**

Type scale is a modular 1.200 ratio, tuned for dense clinical UI. See `preview/type-scale.html` and `colors_and_type.css`.

### Spacing & layout

- 4-px base grid. Tokens: `--space-1` (4px) through `--space-16` (64px) plus `--space-24`, `--space-32`.
- Content column caps at 72ch for prose, 1280px for dashboards, 1200px for marketing.
- Dense clinical tables use 32px row height; marketing breathes with 64–96px section padding.

### Corner radii

Restrained. `--radius-sm` 4px (inputs, chips), `--radius-md` 8px (cards, buttons), `--radius-lg` 16px (modals, large surfaces). **No pill buttons** except tags/filters. No `border-radius: 9999` sledgehammers.

### Borders & dividers

1px hairlines in `--line` (`#e6e1d4`). We lean on borders more than shadows — the system feels like a scientific document, not a neumorphic app. Cards are `1px solid var(--line)` with no shadow by default.

### Shadows

Minimal and cool-toned. Two elevations only:
- `--shadow-1`: resting cards if shadow is appropriate (rare) — `0 1px 2px rgba(21,40,47,0.04), 0 1px 1px rgba(21,40,47,0.03)`
- `--shadow-2`: popovers, menus, modals — `0 8px 24px rgba(21,40,47,0.08), 0 2px 6px rgba(21,40,47,0.06)`

No glows. No colored shadows.

### Imagery

- **Anonymized.** We never show identifiable patient faces. Abstract representations: landmark dot-networks, contour maps, mesh overlays, tessellations derived from facial geometry.
- **Botanical + specimen photography** for marketing warmth — pressed leaves, cross-sections, microscopy. Warm-toned, grainy. Evokes the Wellcome Collection or Kew Gardens aesthetic.
- **No stock photos of doctors in scrubs, no smiling-family hero shots, no blue DNA helix clip-art.**
- When imagery is unavailable, use a tinted placeholder block with a small label — not an emoji or icon "pretending" to be an image.

### Motion

- Purposeful and brief. 150–220ms for hovers and tooltips; 260ms for panel transitions.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` for entries, `cubic-bezier(0.4, 0, 0.2, 1)` for repositions. No bouncy springs.
- Fades preferred over slides for content swaps. Slides reserved for drawer/sheet UI.

### States

- **Hover:** brightness shift via `color-mix(… with white/black 6%)`. Never an opacity drop — it looks cheap.
- **Pressed:** 2–3% darker than hover, no scale transform. (Scale-down presses feel consumer-y.)
- **Focus:** 2px `--teal-bright` outline offset by 2px. Always visible. Keyboard-first product.
- **Selected:** filled `--teal-bright` tint at 10% opacity + left-edge 2px bar in same color.
- **Disabled:** 40% opacity, no pointer events.

### Transparency, blur, grain

- Blur used sparingly for sticky headers over long content (`backdrop-filter: blur(8px) saturate(140%)` over `rgba(250,248,242,0.7)`).
- Subtle paper-grain texture available as `assets/grain.svg` — used on hero/section backgrounds at ~3% opacity.
- No frosted-glass mega-cards.

### Data viz

- Series colors in order: `--teal-bright`, `--moss`, `--olive`, `--forest`, `--deep-teal`, `--midnight`.
- Confidence/probability bars: `--teal-bright` filled, `--line` track.
- Always label axes. Never use a rainbow ramp.

---

## Iconography

Phenograph uses **Lucide** (open-source, MIT) as the primary icon system — 1.5px stroke, rounded joins, 20px or 24px at standard UI sizes. Lucide matches the quiet, editorial feel we want. Heroicons and Tabler don't — Heroicons is too round, Tabler too geometric.

- Icons are **stroke-based outlined** by default. A few filled variants (check, info, warning) for badges/status.
- Icons are **purely functional** — never decorative filler. If an icon doesn't clarify meaning or save space, remove it.
- Icon color inherits from its text via `currentColor`.
- **No emoji** in product UI. Occasional in marketing long-form only (rarely).
- **No unicode icons** (✓, →) — use Lucide equivalents.

Lucide is loaded from CDN; see `ui_kits/*/index.html`. If the real brand has custom icons, drop SVGs into `assets/icons/` and swap the usage.

**Brand marks:** see `assets/logo.svg` (primary), `assets/logo-mark.svg` (square mark), `assets/logo-wordmark.svg` (wordmark only). Also a dot-network pattern used as abstract facial-landmark imagery (`assets/landmarks.svg`).

---

## Index

**Foundations**
- [`colors_and_type.css`](./colors_and_type.css) — all tokens
- [`fonts/`](./fonts/) — self-hosted webfonts (currently references Google Fonts; see substitution note)
- [`assets/`](./assets/) — logos, icon references, illustration

**Previews** (rendered in the Design System tab)
- [`preview/`](./preview/) — individual cards per concept

**UI kits**
- [`ui_kits/marketing/`](./ui_kits/marketing/) — Phenograph.com marketing site
- [`ui_kits/clinician/`](./ui_kits/clinician/) — clinician web app (case list, case detail, analysis results)

**Slides**
- [`slides/`](./slides/) — title, section, content, data, quote, closing

**Skill**
- [`SKILL.md`](./SKILL.md) — Agent Skill definition
