I'll take a look at the current workspace state to understand what's already in place before building the migration plan.Let me check the project configuration and existing migration tooling.Let me read the project config and importer tooling using read-only tools.I have enough context on the project setup (it's a Universal Editor / crosswalk AEM project, target site `lsa-eds-ue`). Before I finalize the migration plan, I need two decisions from you.# Full Site Migration Plan — lsa-eds-ue

## Overview
Migrate a user-provided list of URLs into the AEM Edge Delivery Services project **lsa-eds-ue** (a Universal Editor / crosswalk project targeting `/content/lsa-eds-ue`). This is a **full-site migration**: content structure **plus** visual design (CSS/design tokens) **plus** site header/navigation and footer, all matched to the source site.

The URL list will be **pasted by you**. Once execution begins, the first step is to capture those URLs into the migration workspace so every downstream step can reference them.

> **Note:** This plan is built in Plan mode. Executing it requires switching to **Execute mode** — the steps below perform writes (scraping, generating import scripts, running imports, editing CSS, pushing content).

## Project Context (confirmed)
- **Target site:** `lsa-eds-ue` → AEM path `/content/lsa-eds-ue`, assets `/content/dam/lsa-eds-ue`
- **Project type:** Universal Editor / crosswalk (xwalk) — has `component-definition.json`, `component-models.json`, `component-filters.json`
- **Preview org/site:** `oharris69` / `lsa-eds-ue`
- **Available blocks:** accordion, cards, carousel, columns, content-fragment, hero, teaser, tabs, quote, title-block, video, header, footer, find-a-doctor, and more (30 blocks present)
- **Content dir** (`/content`) and **importer tooling** are currently empty — will be generated during migration
- **Preview server:** available for rendering/verification during design + validation steps

## Migration Strategy
Since this is a **multi-URL, full-site** migration, the workflow is:
1. **Site catalog** — discover page templates by grouping the pasted URLs into page types (reduces per-page work; one parser/transformer set per template).
2. **Per-template analysis** — analyze a representative page per template for structure, sections, and block variants.
3. **Import infrastructure** — generate block parsers + page transformers per template, assemble the import script.
4. **Bulk content import** — run the import across all URLs via the bundled import script.
5. **Design migration** — extract source design tokens/CSS and style the blocks to match the original.
6. **Navigation + footer** — instrument the site header/nav and build the footer from the source.
7. **Validation** — score imported pages for completeness and visually critique against the source; fix divergences.

## Checklist

### Phase 0 — Setup
- [ ] Capture the pasted URL list into the migration workspace (e.g. `migration-work/urls.txt`)
- [ ] Confirm the source site base URL and any auth/access requirements for scraping
- [ ] Verify project profile/config (`.migration/project.json`, `migration-work/profile.json`) matches the target site

### Phase 1 — Site Catalog & Template Discovery
- [ ] Group the URLs into page templates (page types) via site cataloging
- [ ] Produce `page-templates.json` with template name, member URLs, and description per template
- [ ] Review the template groupings for correctness before proceeding

### Phase 2 — Page Analysis (per template)
- [ ] Scrape a representative page per template (metadata, cleaned HTML, images, screenshots)
- [ ] Identify section boundaries and content sequences
- [ ] Determine authoring approach (default content vs. blocks) and select block variants
- [ ] Create/reuse block variants (80% similarity reuse), recording them in metadata
- [ ] Add DOM selector mappings for each block variant into `page-templates.json`

### Phase 3 — Import Infrastructure
- [ ] Generate block parsers (`tools/importer/parsers/{variant}.js`) per variant
- [ ] Generate page transformers (cleanup, sections, Dynamic Media/Scene7) per template
- [ ] Assemble the bundled import script combining templates + parsers + transformers
- [ ] Validate parsers/transformers against sample DOM

### Phase 4 — Bulk Content Import
- [ ] Run the bundled import script across all URLs (via `run-bulk-import.js`)
- [ ] Confirm HTML content is generated under `/content` for every URL
- [ ] Spot-check a few imported pages in the preview

### Phase 5 — Design Migration
- [ ] Extract source design tokens (colors, typography, spacing) into the project styles
- [ ] Apply site-level design (global CSS) to match the source
- [ ] Style each block variant to match the original (per-block visual verification, up to 3 iterations)

### Phase 6 — Navigation & Footer
- [ ] Instrument the site header/navigation from the source (desktop, mobile, megamenu as applicable)
- [ ] Build and validate the footer from the source (desktop, mobile)
- [ ] Verify nav/footer render correctly in the preview

### Phase 7 — Validation & Fixes
- [ ] Score every imported page for content completeness (source vs. output)
- [ ] Visually critique flagged pages against the original and fix divergences
- [ ] Run lint (`npm run lint`) and resolve issues
- [ ] Final full-site visual review in the preview

### Phase 8 — Publish (on your go-ahead)
- [ ] Upload/publish migrated pages to Document Authoring (admin.da.live) if requested
- [ ] Commit and push code/content changes to git if requested

## Open Items / Inputs Needed
- **The URL list itself** — please paste the URLs when ready (I'll capture them in Phase 0).
- **Source base URL / sitemap** — confirm the origin domain for scraping and design extraction.
- Confirmation to proceed with **Execute mode** to run the migration.

---

**To proceed:** switch to Execute mode and paste the list of URLs. I'll start with Phase 0 (capturing the URLs) and Phase 1 (template discovery), then work through each phase, checking in at the review points.
