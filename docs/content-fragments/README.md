# Content Fragment models for LSA EDS

Analysis of the migrated pages and two ready-to-build Content Fragment (CF)
models that capture the most-reused structured content.

## Why these two

Surveying block usage across all 11 migrated pages:

| Block | Instances | Where | CF candidate? |
| --- | --- | --- | --- |
| **card** (news / story) | 20+ | home, rc, english, urop, psych, prospective-students | ✅ **best** — identical shape everywhere; author once, reuse across pages |
| **hero** (page banner) | 10 | home, rc, prospective-students | ✅ strong — structured banner reused at the top of key pages |
| table-row | 219 | majors-minors | ❌ tabular data, not a reusable unit |
| section / columns | many | all | ❌ layout containers, not content |

The **News Story** card is the highest-value: the same image + heading +
summary + link structure repeats 20+ times. Modeling it as a CF lets an editor
author a story once and surface it on the homepage, its department page, and any
listing — a single source of truth, no copy/paste.

The **Page Banner** (hero) is the second: a reusable, structured hero
(image + eyebrow + headline + body + CTA) for the top of landing pages.

## How to create them in AEM

1. AEM author → **Tools → General → Content Fragment Models**.
2. Pick the config folder for this site (`/conf/lsa-umich-eds` — the one the
   Create Site wizard made).
3. **Create** a model, name it (e.g. `News Story`), and add the fields listed in
   the JSON files here (field name → data type → notes).
4. **Enable** the model.
5. Author fragments under `/content/dam/lsa-umich-eds/` using the model.
6. On a page in the Universal Editor, add the existing **Content Fragment** block
   and pick the fragment (the block already exists at `blocks/content-fragment`).

The repo already ships the rendering side (`blocks/content-fragment`,
`blocks/fragment-list`), so once the models exist and fragments are authored,
they render with no further code.

## Files

- `news-story-model.json` — the News Story / Card CF model (field definitions).
- `page-banner-model.json` — the Page Banner / Hero CF model (field definitions).

These JSON files describe the fields to create in the CF Model editor; AEM CF
models are authored in the UI (or via the Model API), not committed as repo
source, so treat these as the build spec.
