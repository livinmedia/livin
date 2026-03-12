# LIVIN Platform — Infrastructure Log

## P0-001 — Supabase Environments Created
- Date: March 3, 2026
- Dev Project: livin-dev
- Ref: bmemtekrchzoxpwtaufd
- Region: us-east-1
- Supabase CLI: Installed via Scoop ✅
- Docker Desktop: Installed and running ✅
- Project linked: ✅
- Migration pulled: ✅
- Status: COMPLETE ✅

## P0-002 — Complete Database Schema Deployed
- Date: March 3, 2026
- Tables created: 15
- Indexes created: 18
- RLS: Enabled on all tables
- Seed data: US + 50 states + Houston TX + 8 brand rules + 16 agent configs
- Status: COMPLETE ✅
- Date: March 10, 2026
- Migration p0_rework_content_pipeline_tables applied to dev and production
- Added 9 new columns to content_records: body_json (jsonb), h1 (text), og_title (text), og_image_url (text), schema_json (jsonb), link_hooks (jsonb), brand_tag (text), - author_mm_id (uuid → market_mayors), research_id (uuid → content_research)
- Created content_research table (10 cols): DeepSeek research payloads; cache_expires_at drives freshness agent; FK → content_records
- Created content_versions table (8 cols): immutable content snapshots; UNIQUE(content_item_id, version_number)
- Created mm_review_queue table (11 cols): MM approval queue; reminder_sent_at tracks 72hr Plivo SMS; CHECK pending|approved|rejected|escalated
- Circular FK added post-create: content_records.research_id → content_research
- Table comment added to content_records documenting ADR-003 (Contentful removal)
- contentful_entry_id: confirmed never existed in schema — no cleanup needed

## P0-003 — RLS Policies Configured and Verified
- Date: March 3, 2026
- RLS enabled: 15/15 tables ✅
- Policies verified: All tables ✅
- Foreign keys tested: Enforced correctly ✅
- updated_at triggers tested: Working ✅
- Seed data verified:
  - countries: 1 row ✅
  - states_regions: 50 rows ✅
  - cities: 1 row (Houston TX) ✅
  - agent_configs: 16 rows ✅
  - brand_rules: 8 rows ✅
- Status: COMPLETE ✅
- Date: March 10, 2026
- Migration p0_rework_content_pipeline_rls applied to dev and production
- RLS enabled on all 3 new tables
- content_research: 2 policies — admin full access + MM city-scoped SELECT
- content_versions: 2 policies — admin full access + MM city-scoped SELECT via content_records join
- mm_review_queue: 3 policies — admin full access + MM SELECT scoped to mm_id only + MM UPDATE scoped to mm_id only (critical isolation — verified in P0-009)

## P0-004 — Database Indexes and Foreign Keys Verified
- Date: March 3, 2026
- Indexes verified: 22 indexes present ✅
- Foreign keys verified: 18 relationships enforced ✅
- City slug index: Using Index Scan ✅
- Brand separation index: Using Index Scan ✅
- Ad category exclusivity partial index: Present ✅
- Status: COMPLETE ✅
- Date: March 10, 2026
- Migration p0_rework_content_pipeline_indexes applied to dev and production
- 13 new indexes added across content_records, content_research, content_versions, mm_review_queue
- content_records: idx_content_records_brand_tag, idx_content_records_city_id_status (composite), idx_content_records_author_mm_id (partial), - - idx_content_records_research_id (partial)
- content_research: idx_content_research_content_item_id, idx_content_research_cache_expires (partial), idx_content_research_city_id
- content_versions: idx_content_versions_content_item_id, idx_content_versions_item_version (DESC)
- mm_review_queue: idx_mm_review_queue_mm_id_status, idx_mm_review_queue_city_id, idx_mm_review_queue_content_item_id, idx_mm_review_queue_reminder_sent (partial WHERE NULL)

## P0-006 — Supabase Auth and User Profiles Trigger Configured
- Date: March 3, 2026
- Email auth provider: Enabled ✅
- handle_new_user trigger: Created ✅
- handle_user_login trigger: Created ✅
- Trigger test: user_profiles row auto-created on register ✅
- CASCADE test: user_profiles row auto-deleted on user delete ✅
- Status: COMPLETE ✅

## P0-007 — Storage Buckets Configured
- Date: March 3, 2026
- Buckets created:
  - media (public, 50MB limit) ✅
  - private (private, 100MB limit) ✅
  - exports (private, 500MB limit) ✅
- RLS policies: 9 policies applied ✅
- Media folders created: cities, market-mayors, mvps, content, ads ✅
- Status: COMPLETE ✅

## P1-001 — Next.js App Created
- Date: March 4, 2026
- Framework: Next.js 15, App Router, TypeScript, Tailwind
- Location: D:\livin-platform
- Status: COMPLETE ✅

## P1-002 — Supabase Client Connected
- Date: March 4, 2026
- Client: @supabase/supabase-js
- Test: Houston TX returned from cities table ✅
- RLS Fix: admin_see_all_profiles infinite recursion resolved ✅
- Status: COMPLETE ✅

## P0-010 — Anthropic API Key Acquired
- Date: March 4, 2026
- Key Name: livin-dev
- Stored in: .env.local as ANTHROPIC_API_KEY
- Status: COMPLETE ✅
Completed: March 11, 2026
ANTHROPIC_API_KEY stored in .env.local
api_integrations record updated: status=active, acquired_at=2026-03-11, api_key_preview=sk-ant-api03...GAAA
Updated on both dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy)
Primary model: Claude Sonnet — used by all 14 agents for content generation, confirmation, routing, and compliance

## P0-021 — Next.js App Router Project Initialized
- Date: March 5, 2026
- Framework: Next.js 15, App Router
- TypeScript: Enabled ✅
- Tailwind: Enabled ✅
- ESLint: Enabled ✅
- src/ directory structure: Enabled ✅
- Import alias @/*: Configured ✅
- Supabase connection: Verified (Houston TX returned) ✅
- RLS infinite recursion bug: Fixed ✅
- Status: COMPLETE ✅

## P0-022 — Domain-Aware Middleware Implemented
- Date: March 4, 2026
- File: src/middleware.ts
- Detects livin.in vs homesandlivin.in on every request ✅
- Subdomain routing: create.*, api.*, app.*, [state].* ✅
- Trailing slash removal: 301 redirect enforced ✅
- Uppercase URL normalization: 301 redirect enforced ✅
- State abbreviation expansion: /houston-tx → /houston-texas ✅
- Brand context headers set on every request: x-brand, x-hostname ✅
- Unknown subdomain/domain → 404 enforced ✅
- Status: COMPLETE ✅

## P0-023 — Slug Generation Utility Built
- Date: March 4, 2026
- File: src/lib/routing/slug-normalizer.ts
- generateCitySlug(city, state) → canonical slug ✅
- normalizeIncomingSlug() → handles user input variations ✅
- Accent stripping, apostrophe removal, hyphen collapsing ✅
- Max 100 char truncation enforced ✅
- Status: COMPLETE ✅

## P0-024 — State Abbreviation Lookup Table Built
- Date: March 4, 2026
- File: src/lib/routing/slug-normalizer.ts
- All 50 states + DC mapped ✅
- Triggers 301 redirect on abbreviated slugs ✅
- Status: COMPLETE ✅

## P0-008 — Initial Geographic Data Seeded
- Date: March 5, 2026
- countries: 1 row (US) ✅
- states_regions: 50 rows (all US states + DC) ✅
- cities: 100 rows (top 100 U.S. cities by population) ✅
- Houston TX: pre-existing, preserved via ON CONFLICT ✅
- Slug format: [city]-[state-full-name] ✅
- Status: COMPLETE ✅

## P0-025 — App Router File Structure Complete
- Date: March 5, 2026
- Routes registered:
  - / (homepage) ✅
  - /[geoSlug] (city/state/country pages) ✅
  - /[geoSlug]/[contentSlug] (article pages) ✅
  - /api/cities ✅
  - /api/content ✅
  - /api/revalidate ✅
  - /_not-found (branded 404) ✅
- Proxy middleware: active on all routes ✅
- TypeScript: no errors ✅
- Build: clean ✅
- Conflicting (livin) route group: removed ✅
- Type files created: geo.ts, content.ts, brand.ts ✅
- Status: COMPLETE ✅

## P0-026 — Geographic Path Resolution Complete
- Date: March 5, 2026
- City slug resolution: queries cities table first ✅
- State slug resolution: fallback to states_regions ✅
- Country slug resolution: fallback to countries ✅
- Unknown slug: returns branded 404 ✅
- Brand-aware pages: LIVIN vs H+L via x-brand header ✅
- Cross-platform link: LIVIN → H+L one-directional ✅
- ISR: 3600s city pages, 900s content pages ✅
- Status: COMPLETE ✅

## P0-030 — Branded 404 Pages Complete
- Date: March 5, 2026
- LIVIN 404: lifestyle-branded, suggests featured cities ✅
- H+L 404: real-estate-branded ✅
- Status: COMPLETE ✅

## P0-020 — API Integrations Tracking Table Created

- Date: March 5, 2026
- Table: public.api_integrations deployed to both livin-ecosystem-app (dev) and livin-ecosystem-production
- Seeded: 11 APIs (trimmed from original Doc 10's 13 — Contentful and Lovable removed per ADR-003 and ADR-004)
- Final API count by status:

   - active (3): Anthropic, OpenClaw, Supabase MCP
   - open (5): AllEvents.in, Census Bureau, Yelp Fusion, Google Places, Google Business Profile
   - pending (1): Ubersuggest (Anthony follow-up required)
   - research (1): GHL (resolved by P0-017)
   - integration (1): HomeStack (Anthony + HomeStack team)

- Key design rules:

   - api_key_env_var stores env var name only — never raw keys in DB
   - last_ping_at + last_ping_status for live health monitoring
   - consuming_agents[] array maps to Doc 3 agent names
   - RLS: super_admin/admin read; super_admin write only
- ADR entries logged: ADR-003 (Contentful removal), ADR-004 (Lovable removal) in LIVIN_Architecture_Decision_Record_v2.docx
- Status: COMPLETE ✅
- Date: March 10, 2026
- Migration p0_rework_api_integrations_update applied to dev and production
- DeepSeek added: status=active, role=content-research, base_url=https://api.deepseek.com
- OpenAI GPT-4.1 added: status=active, role=keyword-analysis ONLY, base_url=https://api.openai.com/v1
- Ubersuggest: marked deprecated — replaced by GPT-4.1 + DeepSeek per ADR-006
- Yelp Fusion: marked deprecated — replaced by Google Places per architecture review
- deprecated value added to api_integrations status CHECK constraint

P0-020 ✅ — API Integrations Table — ADR-006 Update (March 12, 2026)

Migration p0_020_adr006_openrouter_replaces_deepseek_openai applied to dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy)
INSERT: openrouter — status=open, api_key_env_var=OPENROUTER_API_KEY, base_url=https://openrouter.ai/api/v1, doc10_ref=8, consuming_agents=[city_content_builder, content_freshness_agent, seo_agent, content_rewriter, international_agent]
UPDATE: deepseek — status active → deprecated; note: do NOT use api.deepseek.com or DEEPSEEK_API_KEY
UPDATE: openai_gpt41 — status active → deprecated; note: do NOT use api.openai.com or OPENAI_API_KEY
Verified on both environments: deepseek=deprecated, openai_gpt41=deprecated, openrouter=open ✅
Next action (PM): register at openrouter.ai/keys → store OPENROUTER_API_KEY in .env.local → update openrouter record to status=active

## P0-017 — GHL API Research Complete

- Date: March 5, 2026
- Research question: Does GHL support programmatic sub-account creation via API, and which plan is required?
- Finding: POST /locations/ endpoint confirmed exists in GHL API v2
- Plan requirement: Agency Pro $497/month — endpoint is locked to this tier only
- Auth method: Private Integration Tokens (static OAuth2) — legacy API key system being deprecated
- Base URL confirmed: https://services.leadconnectorhq.com/
- Rate limits: Burst limit 100 requests per 10 seconds per app per resource
- V1 API status: End-of-support — all new integrations must use V2
- Impact: $497/month plan is confirmed and required. Already budgeted correctly in api_integrations table.
- Supabase updated: api_integrations record for ghl updated in both dev + production with confirmed base URL, rate limits, and research notes
- Docs reference: https://marketplace.gohighlevel.com/docs/ghl/locations/create-location/index.html
- Status: COMPLETE ✅

## Additional Work Completed (No Dedicated ClickUp Task — Scope of P0-025 / P0-026)
- City Page UI Build — src/app/[geoSlug]/page.tsx

- Date: March 5, 2026
- Scope: Front-end build work delivered as part of P0-025 (App Router) and P0-026 (Geographic Path Resolution)
- Full city page built as single-file src/app/[geoSlug]/page.tsx
- 8 sections: Nav, Hero, City Overview, Neighborhood Highlights, Events, Properties, Market Mayor, Articles, Footer
- Single .W alignment class (max-width: 1100px; margin: 0 auto; padding: 0 32px) — all sections share same left/right edge
- Real Unsplash photos: hero aerials (14 states), neighborhoods, events, properties, mayor
- Semicircle gauge SVG (flat arch ends, score below arc)
- Mobile responsive: breakpoints at 900px, 700px, 480px
- Market Mayor section: 150px photo, 5px gap, 300px inner card (Google box + CTA flush), 200–250px section height
- Note: No standalone ClickUp task — this is pre-Phase 1 UI scaffolding done during Phase 0 infrastructure sprint

## P0-029 — Redirect Rules Implemented

- Date: March 6, 2026
- File: src/proxy.ts (project uses proxy.ts not middleware.ts)
- .com → .in: livin.com/* → livin.in/*, homesandlivin.com/* → homesandlivin.in/* ✅
- Trailing slash: /houston-texas/ → /houston-texas ✅
- Uppercase: /Houston-Texas → /houston-texas ✅
- State abbreviation: /houston-tx → /houston-texas ✅
- Underscores: /houston_texas → /houston-texas ✅
- All redirects confirmed 301 permanent — correct for SEO ✅
- .com subdomain redirect handled: create.livin.com → create.livin.in ✅
- 4 rules tested locally on localhost:3000 ✅
- .com → .in rule to be verified post-deploy via Vercel domain config
- Status: COMPLETE ✅

## P0-031 — Cross-Platform Link Utility Built

- Date: March 6, 2026
- File: src/lib/routing/cross-platform-links.ts
- getCrossplatformLink() async: validates city in Supabase before generating link ✅
- getCrossplatformLinkSync(): sync version for SSG/server-side contexts ✅
- rel="noopener noreferrer" confirmed in Inspect Element on all link elements ✅
- target="_blank" confirmed in Inspect Element on all link elements ✅
- Click logging: logCrossPlatformClick() logs to agent_run_log (verified post-deploy with live Supabase)
- One-directional rule enforced: H+L → LIVIN always returns null ✅
- LPT links prohibited — not generated by this utility ✅
- Hardcoded cross-domain links prohibited — all links go through this utility ✅
- Wired into page.tsx: powers "View All Listings" buttons in Featured Properties section ✅
- href confirmed pointing to https://homesandlivin.in/houston-texas ✅
- ERR_CONNECTION_CLOSED on click is expected — homesandlivin.in not yet deployed ✅
- Status: COMPLETE ✅

## P0-027 — ISR Strategy Configured

- Date: March 6, 2026
- Top 100 cities: SSG via generateStaticParams in [geoSlug]/page.tsx ✅
- is_top_100 column added to cities table in dev DB ✅
- 100 cities flagged is_top_100 = true — verified via SQL count ✅
- Index added: idx_cities_is_top_100 for fast SSG lookup ✅
- Other geo pages: revalidate = 3600 (1hr) ✅
- Content pages: revalidate = 900 (15min) ✅
- Homepage: revalidate = 3600 (1hr) ✅
- API routes: dynamic = 'force-dynamic' on all 3 routes ✅
- ISR config reference: src/lib/isr-config.ts ✅
- API routes created: api/cities, api/content, api/revalidate ✅
- api/cities tested: returns 100 cities JSON ✅
- Note: generateStaticParams SSG pre-build activates on npm run build not dev mode
- Status: COMPLETE ✅

## P0-028 — On-Demand Revalidation Webhook Implemented

- Date: March 6, 2026
- File: src/app/api/revalidate/route.ts
- Test script: scripts/test-revalidate-webhook.js
- Health check GET /api/revalidate returns status: ok ✅
- Auth: x-revalidate-secret header required — missing secret returns 401 ✅
- REVALIDATE_SECRET added to .env.local ✅
- City page revalidation: POST with type: city revalidates /[citySlug] ✅
- Content page revalidation: POST with type: content revalidates /[citySlug]/[contentSlug] + parent city page ✅
- Missing citySlug returns 400 ✅
- Revalidation events logged to agent_run_log in Supabase ✅
- 207 partial success response if any path fails ✅
- All 5 webhook tests passed ✅
- Note: originally spec'd for Contentful webhooks — now called by OpenClaw pipeline per ADR-003
- Status: COMPLETE ✅

## P0-048 — GHL Naming Convention & Sub-Account Checklist Documented

- Date: March 6, 2026
- Document: LIVIN_P0-048_GHL_Naming_Convention.docx
- Official format enforced: H+L [State Abbrev] [City Name] (e.g., H+L TX Houston) ✅
- Format rules table: prefix, state abbreviation, title case, spacing, no special chars ✅
- Correct vs. incorrect examples table: 8 examples each ✅
- All 50 states + DC abbreviation reference table ✅
- 5-step sub-account creation checklist with checkbox items ✅
- Quality control verification table with sign-off fields ✅
- Common errors & corrections table ✅
- Automation roadmap: manual (Phase 0-1) → API automated (Phase 2) ✅
- Note: GHL Agency Pro $497/month required for Phase 2 API automation (confirmed P0-017)
- Status: COMPLETE ✅

## P0-050 — Email Warmup Protocol Documented

- Date: March 6, 2026
- Document: LIVIN_P0-050_Email_Warmup_Protocol.docx
- Hard rule documented: email subdomain MUST be set up before MM onboarding begins ✅
- Pre-warmup requirements: SPF, DKIM, DMARC, GHL setup, seed list prep ✅
- 4-week ramp schedule documented: 10-20 → 20-50 → 50-100 → full automation ✅
- Daily sending guidelines: timing, consistency, content quality, list hygiene ✅
- Bounce rate thresholds: hard bounce < 2%, spam complaints < 0.1%, open rate > 30% ✅
- Health metrics: blacklist checks (MXToolbox), Gmail Postmaster, inbox placement ✅
- Escalation triggers: stop conditions with clear actions per scenario ✅
- Post-warmup activation checklist: requires Anthony approval before GHL automation goes live ✅
- Per-city warmup tracker table included for ops team use ✅
- Status: COMPLETE ✅

## P0-005 — Supabase MCP Connector Activated

- Date: March 3, 2026
- MCP connector linked to Claude Project — verified active ✅
- Dev project livin-ecosystem-app (bmemtekrchzoxpwtaufd) status: ACTIVE_HEALTHY ✅
- Live SQL queries confirmed working — 16 tables returned on verification check ✅
- MCP used throughout all Phase 0 sessions for schema deployment, seeding, and validation ✅
- Supabase CLI installed via Scoop on Windows as companion tool ✅
- SUPABASE_ACCESS_TOKEN set as permanent Windows User environment variable ✅
- Note: logged retroactively — MCP was activated March 3 but not formally recorded until March 6
- Status: COMPLETE ✅

Production Catch-Up ✅

Migration p0_prod_catchup_full_schema_baseline applied to production only
Production was missing 18 of 19 tables (only api_integrations existed from prior migration)
Applied full 19-table schema: all RLS, all triggers, all indexes, all seed data in one migration
Seed confirmed: 50 states, 98 top-100 cities (2 slug conflicts skipped — non-critical, no pilot cities affected), Houston TX pilot (is_pilot=true, is_active=true, launch_priority=1), 16 agent configs, 8 brand rules, 13 api_integrations
Auth triggers confirmed on production: on_auth_user_created, on_auth_user_login

content_records Lifecycle State Alignment ✅

Migration p0_align_content_records_lifecycle_states applied to dev and production
Prerequisite for P0-036 (Content Lifecycle State Machine)
Dropped old Contentful-era status CHECK constraint: draft, confirming, confirmed, seo_optimizing, ready_for_review, approved, published, rejected, rewriting, archived
Replaced with AI-native pipeline 10-state constraint: queued, generating, confirming, confirmed, seo_optimized, linked, awaiting_approval, mm_approved, published, archived
Column comment added documenting state machine and rule: only Supabase Edge Function (P0-037) may set status=published after MM approval — agents may never write published directly
Smoke tested: old state draft correctly rejected; new states queued, awaiting_approval, published all accepted; zero test rows remain

## P0-009 ✅ — Phase 0 Database Validation

- Date: March 10, 2026
- Full gate suite run against dev (bmemtekrchzoxpwtaufd) — all 17 checks passed
- Gate 1: 19 tables confirmed, RLS enabled on all 19
- Gate 2: All indexes present across all tables
- Gate 3: All 8 FKs on pipeline tables enforced
- Gate 4: Auth trigger on_auth_user_created fires correctly → auto-creates user_profiles with role=user default
- Gate 5: market_mayors insert via FK chain auth.users → user_profiles → market_mayors → cities verified
- Gate 6: market_vendor_partners insert via FK chain to MM + city verified
- Gate 7: content_records insert with new lifecycle state queued accepted; brand=livin, brand_tag=livin, author_entity_type=mm all verified
- Gate 8A: MVP cannot read market_mayors records (RLS blocks — 0 rows returned)
- Gate 8B: MM sees only their own market_mayors record (1 row returned, correctly scoped)
- Gate 8C: MVP cannot read leads routed to MM (RLS blocks — 0 rows returned)
- Gate 8D: MM sees their own routed lead (1 row returned)
- Gate 9: brand_tag CHECK rejects LIVIN (uppercase invalid), accepts livin (correct)
- Gate 10: houston-texas slug → Texas/TX → United States; is_pilot=true, is_top_100=true, launch_priority=1 all confirmed
- Gate 11: Auth trigger sets default role=user on both test profiles — confirmed
- Gate 12A: MVP cannot read mm_review_queue (RLS blocks — 0 rows returned)
- Gate 12B: MM sees only their own queue item (1 row returned, correctly scoped)
- Cleanup: all 7 test entities removed in reverse FK order; zero rows remain in all tables

## P0-018 ✅ — Research Plivo SMS API Capabilities

- Date: March 10, 2026
- Research output document created: P0-018_Plivo_SMS_Capabilities_Research.docx
- Confirmed Plivo as sole SMS delivery layer — triggered by OpenClaw, not called directly from Next.js routes
- API: REST endpoint POST https://api.plivo.com/v1/Account/{auth_id}/Message/ — HTTP Basic Auth using PLIVO_AUTH_ID + PLIVO_AUTH_TOKEN
- Node.js SDK confirmed (npm install plivo) — recommended over raw fetch; handles auth, retries, response parsing
- Wrapper pattern documented: lib/plivo.ts exports sendSMS(to, text, brand) — brand param selects PLIVO_LIVIN_NUMBER vs PLIVO_HL_NUMBER at send time
- Required env vars confirmed: PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_LIVIN_NUMBER, PLIVO_HL_NUMBER
- Number type decision: 10DLC long codes — correct for conversational lead nurture + MM operational alerts; ISV registration path selected (one Brand + one Campaign - covers all MM cities — no per-MM registration required)
- Per-city number architecture confirmed: 1 Plivo number per active MM city; numbers looked up dynamically by OpenClaw at send time — not stored as env vars
- 6 OpenClaw trigger events mapped to Plivo send actions: lead.created, lead.nurture_24h, lead.nurture_72h, content.awaiting_approval, review_queue.stale_72h, lead.- routed
- 72hr reminder idempotency guard confirmed: OpenClaw queries WHERE reminder_sent_at IS NULL AND queued_at < NOW() - INTERVAL '72 hours'; sets reminder_sent_at = NOW() - after send — aligns with existing mm_review_queue schema column
- TCPA hard rules documented: prospect SMS requires opt_in_sms = TRUE in Supabase leads table before any sequence fires; MM operational alerts exempt (internal - platform-to-agent communications)
- Delivery webhook: configure POST /api/plivo/delivery-status in Plivo Console — syncs delivery status and STOP opt-outs back to Supabase
- P0-019 pre-implementation checklist embedded in document: 10 actions split PM vs Dev — account creation, number purchase, Brand registration, Campaign registration - (ISV path), number assignment, webhook config, test send
- Critical path flag: A2P Campaign registration is 2–4 week external wait — P0-019 must start same day Plivo account is created

## P0-033 ✅ — Configure Supabase Content Pipeline Tables

- Date: March 10, 2026
- No new migration required — all P0-033 deliverables were fully executed during the P0-002 rework session (March 9, 2026)
- Delivering migration: p0_rework_content_pipeline_tables (20260309204259) — applied to dev and production
- content_records expanded: 9 new columns confirmed in both environments — body_json (jsonb), h1 (text), og_title (text), og_image_url (text), schema_json (jsonb), - link_hooks (jsonb), brand_tag (text), author_mm_id (uuid → market_mayors), research_id (uuid → content_research)
- content_research table confirmed: 10 columns, RLS enabled — dev and production
- content_versions table confirmed: 8 cols, RLS enabled — dev and production
- mm_review_queue table confirmed: 11 cols, RLS enabled — dev and production
- All 4 tables verified live against dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy) immediately before marking complete
- Task status updated to Complete in ClickUp

## P0-035 ✅ — Build Next.js Content Rendering Layer

- Completed: March 11, 2026
- 5 files delivered and verified against dev Supabase project (bmemtekrchzoxpwtaufd)
- File locations (src/ layout confirmed):

src/types/content.ts — BodyJson, ContentRecordWithCity, ContentPageParams types
src/lib/content.ts — server-side fetch: getPublishedArticle() two-step city lookup, getAllPublishedSlugs()
src/components/ContentBody.tsx — renders body_json → H1/H2/paragraphs/internal links (RSC)
src/app/[geoSlug]/[contentSlug]/page.tsx — generateStaticParams, generateMetadata, JSON-LD Script, ISR revalidate=3600, notFound()
src/app/api/revalidate/route.ts — Bearer auth via REVALIDATE_SECRET, revalidates city hub + article path


- Route uses existing [geoSlug]/[contentSlug] convention (not citySlug/articleSlug — matched to pre-existing codebase)
- Next.js 15 fix applied: params is a Promise — const { geoSlug, contentSlug } = await params required in both generateMetadata and ArticlePage
- lib/content.ts uses two-step lookup: get city.id by slug first, then filter content_records by city_id — avoids Supabase JS foreign table filter ambiguity
- All 6 verification gates passed:

- Gate 1: npx tsc --noEmit → 0 errors ✅
- Gate 2: /houston-texas/best-neighborhoods-houston-texas-2026 renders H1, 2 sections, conclusion ✅
- Gate 3: application/ld+json script present in page source ✅
- Gate 4: title, og:title, meta description, canonical all correct in head ✅
- Gate 5: POST /api/revalidate returns 200 with Bearer token, 401 without ✅
- Gate 6: Unknown slug returns Next.js 404, not a crash ✅


Test records inserted and cleaned up — zero rows remain in dev
Key learnings:

- Next.js 15: all route params are Promises — always await params before accessing properties
- Supabase JS .eq('cities.slug', value) on joined table filters related rows not parent rows — use city_id directly
- NEXT_PUBLIC_BRAND env var controls brand per app (livin vs homes_and_livin)
- REVALIDATE_SECRET is the auth token for /api/revalidate — target endpoint for P0-037 Edge Function

## P0-036 ✅ — Build Supabase Content Lifecycle State Machine

- Completed: March 11, 2026
- Migration p0_036_content_lifecycle_state_machine applied to dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy)
- CHECK constraint chk_content_records_status added — enforces 10 valid states: queued, generating, confirming, confirmed, seo_optimized, linked, awaiting_approval, - mm_approved, published, archived
- Status default updated from 'draft' → 'queued'
- Function validate_content_status_transition() created — BEFORE UPDATE trigger enforcing valid state progressions with ERRCODE P0001
- Trigger trg_content_status_transition attached — fires BEFORE UPDATE OF status
- Valid transitions map: queued→generating, generating→confirming, confirming→confirmed, confirmed→seo_optimized, seo_optimized→linked, linked→awaiting_approval, - awaiting_approval→mm_approved, mm_approved→published, published→archived only; archived→queued (re-queue)
- Auto-timestamps: approved_at set on transition to mm_approved; published_at set on transition to published
- Function prevent_direct_published_write() created — BEFORE INSERT guard; blocks agents from inserting published directly; service_role bypasses (Edge Function path)
- Trigger trg_prevent_direct_published attached — fires BEFORE INSERT
- Column comment added to content_records.status documenting full state machine and service_role rule
- All gates passed on dev:

- Gate 1: status default = queued ✅
- Gate 2: both triggers confirmed live (tgenabled=O) ✅
- Gate 3: INSERT with no status → defaults to queued ✅
- Gate 4: full valid chain queued→generating→confirming→confirmed→seo_optimized→linked→awaiting_approval→mm_approved — all accepted; approved_at auto-set ✅
- Gate 5: invalid jump linked→published — blocked with correct error message ✅
- Gate 6: valid terminal mm_approved→published — accepted; published_at auto-set ✅
- Gate 7: published→archived — accepted ✅
- Gate 8: archived→published — blocked ✅

- Test records cleaned up — zero rows remain

## P0-037 ✅ — Configure Supabase Edge Function for ISR Revalidation

- Completed: March 11, 2026
- Edge Function content-isr-revalidate built in Deno TypeScript
- File location: supabase/functions/content-isr-revalidate/index.ts
- Trigger: Supabase Database Webhook on content_records UPDATE where status = published OR archived
- Flow: webhook fires → Edge Function resolves city slug from city_id via Supabase client → POST /api/revalidate with Bearer token → logs result to edge_function_logs - table
- Only fires on status transitions to published or archived — all other UPDATE events return 200/skipped
- Non-trigger statuses silently skipped (returns 200 with skipped:true) — no noise
- Logging to edge_function_logs is non-fatal — ISR completes even if log insert fails
- Migration p0_037_edge_function_logs_table applied to dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy)
- edge_function_logs table: 10 columns — id, function_name, content_record_id (FK→content_records), trigger_status, geo_slug, content_slug, revalidate_status_code, - success, payload, error_message, created_at
- RLS enabled on edge_function_logs — admin-only policy; service role bypasses
- 2 indexes: idx_edge_function_logs_content_record, idx_edge_function_logs_function_created
- Required Supabase secrets (set in dashboard, not .env): REVALIDATE_SECRET, NEXT_PUBLIC_SITE_URL
- Required env vars already in .env.local: REVALIDATE_SECRET, NEXT_PUBLIC_SITE_URL
- Deployment: supabase functions deploy content-isr-revalidate
- Webhook config: name=content_published_isr, table=content_records, event=UPDATE, filter status=published OR status=archived
- Deliverables: P0-037_Edge_Function.zip (index.ts + deployment guide)
- End-to-end test (P0-038 gate): published status change → Edge Function fires within 5s → /api/revalidate called → edge_function_logs row success=true
- NOTE: Full end-to-end verification deferred to P0-038 (requires deployed Next.js URL accessible from Supabase Edge Function runtime)

- P0-037 Verification Results (March 11, 2026):

- Webhook fired correctly on status=published transition ✅
- Edge Function invoked and booted successfully ✅
- City slug resolved: houston-texas ✅
- /api/revalidate called with correct geoSlug/contentSlug ✅
- Connection refused error expected — localhost:3000 not reachable from Supabase cloud runtime ✅
- Full end-to-end ISR verification deferred to P0-038 (requires Vercel deployed URL)
- To complete full verification: update NEXT_PUBLIC_SITE_URL secret to https://livin.in after Vercel deploy

## P0-012 ✅ — Register U.S. Census Bureau API Key

- Completed: March 11, 2026
- CENSUS_API_KEY acquired and stored in .env.local
- api_integrations record updated: status=active, acquired_at=2026-03-11, api_key_preview=7792...49e7
- Updated on both dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy)
- Env var: CENSUS_API_KEY
- Base URL: https://api.census.gov/data/
- Free tier: 500 req/day unauthenticated; higher rate limit with key
- Primary datasets: ACS 5-Year 2023 (B01003_001E population, B19013_001E median income, B25077_001E median home value, B25003_002E homeownership), Decennial Census
- FIPS lookup: cities table has fips_state, fips_county, fips_place columns for geo-scoped queries
- Key verification: paste this URL in browser to confirm → https://api.census.gov/data/2023/acs/acs5?get=B01003_001E,B19013_001E&for=place:35000&in=state:48&- key=7792d3eabce148b7126645d64d5655ab973a49e7
- Expected response: [["B01003_001E","B19013_001E","state","place"],["2314157","57791","48","35000"]]

## P0-015 ✅ — Google Places API Key

- Completed: March 11, 2026
- GOOGLE_PLACES_API_KEY acquired and stored in .env.local
- api_integrations record updated: status=active, acquired_at=2026-03-11, api_key_preview=AIzaSyBLTj...7FMA
- Key restricted to Places API in Google Cloud Console
- Replaces both Yelp Fusion (removed) and Google Business Profile (removed) per ADR
- google_business_profile record marked deprecated on both dev and production
- Updated on both dev (bmemtekrchzoxpwtaufd) and production (ucqlfortlrlzrvmxchdy)
- Used for: business listings, hours, ratings, location data for MVP profiles and city content
- Key endpoints in use: nearbysearch, textsearch, details, findplacefromtext
- Data maps to: entities table (google_place_id, business_name, address, google_rating, hours_json, phone, website_url)

## P0-034 ✅ — Implement SEO Blog Post Agent Skill

- Completed: March 13, 2026
- Files delivered:

src/lib/agents/skills/seo-blog-post.skill.ts — skill (system prompt, input/output contracts, validation, Supabase mapper)
src/lib/agents/skills/test-p0-034.ts — 10-gate test script


- All 10 gates passed on dev (bmemtekrchzoxpwtaufd):

- Gate 1: OpenRouter/deepseek-chat research call — 4539 chars returned ✅
- Gate 2: Claude returned valid JSON ✅
- Gate 3: Skill validation passed (SEO rules, brand rules, structure) ✅
- Gate 4: INSERT to content_records succeeded — id: 22cebc7d-806e-435f-9952-7f9b4807f8a4 ✅
- Gate 5: All required columns populated (body_json, h1, og_title, og_image_url, meta_description, schema_json, link_hooks) ✅
- Gate 6: brand_tag=livin, author_entity_type=mm, status=confirming ✅
- Gate 7: body_json valid — 6 h2 sections + conclusion ✅
- Gate 8: link_hooks — 4 hooks ✅
- Gate 9: schema_json valid Article schema ✅
- Gate 10: Cleanup — zero rows remain ✅


- Generated article stats: title="Best Neighborhoods in Houston Texas: A Local's Guide", word_count=1547, meta_desc=157 chars, slug=best-neighborhoods-in-houston-texas
- Key learnings:

- Claude returns body_json as a bare array instead of { sections: [...] } — normalization code added to skill handles both formats
- System prompt updated with explicit correct/incorrect body_json examples
- assistant prefill { required to prevent markdown fences wrapping JSON output
- max_tokens must be 8000+ for full article generation (4096 causes truncation)
- dotenv@17 does not auto-find .env.local — use process.cwd() path resolution or .env.test file at project root
- tsx handles ESM imports but requires __dirname polyfill via fileURLToPath(import.meta.url)

