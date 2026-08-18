# Content Fragment models for LSA EDS

Analysis of the migrated pages and two ready-to-build Content Fragment (CF)
models that capture the most-reused structured content.

## Why these two

Surveying block usage across all 11 migrated pages:

| Block | Instances | Where | CF candidate? |
| --- | --- | --- | --- |
| **card** (news / story) | 20+ | home, rc, english, urop, psych, prospective-students | ✅ **chosen** — identical shape everywhere; author once, reuse across pages |
| hero (page banner) | 10 | home, rc, prospective-students | considered, deferred — page-specific banner, less reuse value |
| table-row | 219 | majors-minors | ❌ tabular data, not a reusable unit |
| section / columns | many | all | ❌ layout containers, not content |

The **News Story** card is the highest-value: the same image + heading +
summary + link structure repeats 20+ times. Modeling it as a CF lets an editor
author a story once and surface it on the homepage, its department page, and any
listing — a single source of truth, no copy/paste.

### Repurpose existing content — no invented copy

The migrated pages already contain real, well-formed News Story content. The
homepage "Featured News" and "More from LSA Magazine" cards are genuine LSA
Magazine stories (title + summary + image + link) that map 1:1 onto this model.
`news-story-seed-data.json` extracts six of them ready to author as fragments —
so the model is seeded with real content pulled straight from the migration.

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
- `news-story-seed-data.json` — six real stories from the migrated pages,
  ready to author as fragments once the model exists.

The model JSON describes the fields to create in the CF Model editor; AEM CF
models are authored in the UI (or via the Model API), not committed as repo
source, so treat it as the build spec. The seed data is the content to populate
it with.
