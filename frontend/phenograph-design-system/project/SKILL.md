---
name: phenograph-design
description: Use this skill to generate well-branded interfaces and assets for Phenograph, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Phenograph is a clinical-genetics tool that analyzes facial phenotype to suggest candidate genetic syndromes.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key constraints for Phenograph:
- Clinical-genetics product; tone is quiet, careful, evidence-forward. Never hype. Never use "AI" alone — say "computer vision" or "model".
- Never show identifiable patient faces. Use abstract landmark graphs (see `assets/landmarks.svg`) for any phenotype imagery.
- Sentence case everywhere. No emoji. No exclamation marks.
- Pages default to warm off-white (`#faf8f2`), not pure white.
- One primary accent per view; don't mix moss + bright teal as peers.
- Icons: Lucide, 1.5px stroke. No emoji, no unicode arrows.
- Type: Fraunces (display), Inter (body), JetBrains Mono (technical). Tokens in `colors_and_type.css`.
