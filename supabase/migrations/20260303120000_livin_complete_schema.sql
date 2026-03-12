-- ============================================================
-- LIVIN + Homes & Livin Ecosystem
-- P0-002: Complete Database Schema Migration
-- Document 1 of 18: Supabase Database Schema & ERD v1.0
-- Migration: 20260303120000_livin_complete_schema
-- ============================================================
-- Run order matters. Tables are created in dependency order:
-- 1. Geography (countries → states_regions → cities)
-- 2. Entities (user_profiles → market_mayors → mvps → mmps)
-- 3. Content (content_records → content_audit_log)
-- 4. AI Agents (agent_configs → agent_run_log)
-- 5. Brand (brand_rules)
-- 6. Monetization (ad_placements)
-- 7. Leads (leads)
-- 8. Indexes
-- 9. RLS Policies
-- ============================================================


-- ============================================================
-- SECTION 1: GEOGRAPHY TABLES
-- ============================================================

-- 1.1 countries
CREATE TABLE IF NOT EXISTS countries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL UNIQUE,
  slug            TEXT        NOT NULL UNIQUE,
  iso_code        TEXT        NOT NULL UNIQUE CHECK (char_length(iso_code) = 2),
  currency_code   TEXT        NOT NULL CHECK (char_length(currency_code) = 3),
  is_active       BOOLEAN     NOT NULL DEFAULT false,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);

-- 1.2 states_regions
CREATE TABLE IF NOT EXISTS states_regions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id      UUID        NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL,
  abbreviation    TEXT        NOT NULL CHECK (char_length(abbreviation) BETWEEN 2 AND 4),
  region_type     TEXT        NOT NULL DEFAULT 'state'
                              CHECK (region_type IN ('state','province','region','territory')),
  is_active       BOOLEAN     NOT NULL DEFAULT false,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL,
  UNIQUE (country_id, slug)
);

-- 1.3 cities
CREATE TABLE IF NOT EXISTS cities (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  state_region_id     UUID        NOT NULL REFERENCES states_regions(id) ON DELETE RESTRICT,
  name                TEXT        NOT NULL,
  slug                TEXT        NOT NULL UNIQUE,
  population          INTEGER     NULL,
  latitude            DECIMAL(10,7) NULL,
  longitude           DECIMAL(10,7) NULL,
  timezone            TEXT        NULL,
  is_active           BOOLEAN     NOT NULL DEFAULT false,
  is_pilot            BOOLEAN     NOT NULL DEFAULT false,
  has_market_mayor    BOOLEAN     NOT NULL DEFAULT false,
  ghl_subaccount_id   TEXT        NULL UNIQUE,
  ghl_subaccount_name TEXT        NULL,
  content_status      TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (content_status IN ('pending','seeding','active','mature')),
  launch_priority     INTEGER     NULL,
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ NULL,
  UNIQUE (state_region_id, slug)
);

-- 1.4 towns (Phase 3 — created now, used later)
CREATE TABLE IF NOT EXISTS towns (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id         UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL,
  population      INTEGER     NULL,
  latitude        DECIMAL(10,7) NULL,
  longitude       DECIMAL(10,7) NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT false,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);


-- ============================================================
-- SECTION 2: ENTITY TABLES
-- ============================================================

-- 2.1 user_profiles
-- NOTE: id matches auth.users.id — not auto-generated
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL UNIQUE,
  full_name       TEXT        NOT NULL,
  phone           TEXT        NULL,
  avatar_url      TEXT        NULL,
  role            TEXT        NOT NULL DEFAULT 'user'
                              CHECK (role IN ('super_admin','admin','market_mayor','mvp','mmp','user')),
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ NULL,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);

-- 2.2 market_mayors
CREATE TABLE IF NOT EXISTS market_mayors (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE RESTRICT,
  city_id               UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  license_number        TEXT        NULL,
  license_state         TEXT        NULL,
  bio                   TEXT        NULL,
  specialty_areas       TEXT[]      NOT NULL DEFAULT '{}',
  personalization_prompt TEXT       NULL,
  voice_profile         JSONB       NOT NULL DEFAULT '{}',
  ghl_contact_id        TEXT        NULL,
  revenue_share_pct     DECIMAL(5,2) NULL,
  onboarding_status     TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (onboarding_status IN ('pending','in_progress','complete','suspended')),
  is_featured           BOOLEAN     NOT NULL DEFAULT true,
  social_links          JSONB       NOT NULL DEFAULT '{}',
  content_approval_count INTEGER    NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ NULL
);

-- 2.3 market_vendor_partners (MVPs)
CREATE TABLE IF NOT EXISTS market_vendor_partners (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  market_mayor_id       UUID        NOT NULL REFERENCES market_mayors(id) ON DELETE RESTRICT,
  city_id               UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  business_name         TEXT        NOT NULL,
  business_category     TEXT        NOT NULL
                                    CHECK (business_category IN ('restaurant','salon','auto_dealer',
                                    'healthcare','fitness','retail','services','other')),
  business_subcategory  TEXT        NULL,
  description           TEXT        NULL,
  address               TEXT        NULL,
  latitude              DECIMAL(10,7) NULL,
  longitude             DECIMAL(10,7) NULL,
  phone                 TEXT        NULL,
  website_url           TEXT        NULL,
  yelp_id               TEXT        NULL,
  google_place_id       TEXT        NULL,
  homestack_id          TEXT        NULL,
  ghl_contact_id        TEXT        NULL,
  ad_tier               TEXT        NOT NULL DEFAULT 'basic'
                                    CHECK (ad_tier IN ('basic','featured','premium','category_exclusive')),
  is_searchable         BOOLEAN     NOT NULL DEFAULT true,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  social_links          JSONB       NOT NULL DEFAULT '{}',
  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ NULL
);

-- 2.4 market_mayor_partners (MMPs)
CREATE TABLE IF NOT EXISTS market_mayor_partners (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  market_mayor_id   UUID        NOT NULL REFERENCES market_mayors(id) ON DELETE RESTRICT,
  city_id           UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  partner_type      TEXT        NOT NULL DEFAULT 'associate'
                                CHECK (partner_type IN ('associate','team_member','referral_agent','custom')),
  permissions       JSONB       NOT NULL DEFAULT '{}',
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ NULL
);


-- ============================================================
-- SECTION 3: CONTENT TABLES
-- ============================================================

-- 3.1 content_records
CREATE TABLE IF NOT EXISTS content_records (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id                 UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  brand                   TEXT        NOT NULL
                                      CHECK (brand IN ('livin','homes_and_livin')),
  content_type            TEXT        NOT NULL
                                      CHECK (content_type IN ('article','guide','market_insight',
                                      'event_roundup','neighborhood_profile','vendor_feature','relocation_guide')),
  title                   TEXT        NOT NULL,
  slug                    TEXT        NOT NULL,
  contentful_entry_id     TEXT        NULL UNIQUE,
  status                  TEXT        NOT NULL DEFAULT 'draft'
                                      CHECK (status IN ('draft','confirming','confirmed','seo_optimizing',
                                      'ready_for_review','approved','published','rejected','rewriting','archived')),
  source                  TEXT        NOT NULL DEFAULT 'ai_generated'
                                      CHECK (source IN ('ai_generated','mm_submitted','mvp_submitted','admin_created')),
  author_entity_type      TEXT        NULL
                                      CHECK (author_entity_type IN ('mm','mvp','mmp','system')),
  author_entity_id        UUID        NULL,
  quality_score           DECIMAL(3,1) NULL CHECK (quality_score BETWEEN 0.0 AND 10.0),
  seo_score               DECIMAL(3,1) NULL CHECK (seo_score BETWEEN 0.0 AND 10.0),
  confirmed_at            TIMESTAMPTZ NULL,
  approved_at             TIMESTAMPTZ NULL,
  approved_by             UUID        NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  published_at            TIMESTAMPTZ NULL,
  last_performance_check  TIMESTAMPTZ NULL,
  performance_data        JSONB       NOT NULL DEFAULT '{}',
  rewrite_count           INTEGER     NOT NULL DEFAULT 0,
  target_keywords         TEXT[]      NOT NULL DEFAULT '{}',
  meta_title              TEXT        NULL,
  meta_description        TEXT        NULL,
  metadata                JSONB       NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ NULL,
  UNIQUE (city_id, slug)
);

-- 3.2 content_audit_log (append-only — no updates or deletes)
CREATE TABLE IF NOT EXISTS content_audit_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_record_id   UUID        NOT NULL REFERENCES content_records(id) ON DELETE CASCADE,
  action              TEXT        NOT NULL
                                  CHECK (action IN ('created','confirmed','rejected','seo_optimized',
                                  'approved','published','rewritten','archived','edited')),
  actor_type          TEXT        NOT NULL
                                  CHECK (actor_type IN ('ai_agent','market_mayor','mvp','mmp','admin','system')),
  actor_id            TEXT        NULL,
  agent_name          TEXT        NULL,
  previous_status     TEXT        NULL,
  new_status          TEXT        NULL,
  notes               TEXT        NULL,
  details             JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at or deleted_at — this table is append-only
);


-- ============================================================
-- SECTION 4: AI AGENT TABLES
-- ============================================================

-- 4.1 agent_configs
CREATE TABLE IF NOT EXISTS agent_configs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name            TEXT        NOT NULL UNIQUE
                                    CHECK (agent_name IN (
                                      'city_content_builder','content_confirmer','seo_agent',
                                      'internal_linking','content_freshness','analytics_reporting',
                                      'mm_onboarding','ad_inventory','pricing','compliance_trust',
                                      'lead_routing','content_rewriter','content_director',
                                      'international','form_creation','data_transfer'
                                    )),
  display_name          TEXT        NOT NULL,
  brand_scope           TEXT        NOT NULL
                                    CHECK (brand_scope IN ('livin','homes_and_livin','both','bridge')),
  permission_level      TEXT        NOT NULL
                                    CHECK (permission_level IN ('read_only','read_draft','read_write_auto',
                                    'read_write_route','monitor_veto','orchestrate')),
  phase                 TEXT        NOT NULL
                                    CHECK (phase IN ('phase_1','phase_2','phase_3')),
  build_order           INTEGER     NOT NULL,
  system_prompt         TEXT        NULL,
  allowed_read_tables   TEXT[]      NOT NULL DEFAULT '{}',
  allowed_write_tables  TEXT[]      NOT NULL DEFAULT '{}',
  allowed_apis          TEXT[]      NOT NULL DEFAULT '{}',
  trigger_type          TEXT        NOT NULL
                                    CHECK (trigger_type IN ('cron','event','manual','pipeline')),
  trigger_config        JSONB       NOT NULL DEFAULT '{}',
  rate_limits           JSONB       NOT NULL DEFAULT '{}',
  is_active             BOOLEAN     NOT NULL DEFAULT false,
  configuration         JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.2 agent_run_log (append-only)
CREATE TABLE IF NOT EXISTS agent_run_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name      TEXT        NOT NULL,
  city_id         UUID        NULL REFERENCES cities(id) ON DELETE SET NULL,
  trigger_type    TEXT        NOT NULL
                              CHECK (trigger_type IN ('cron','event','manual','pipeline')),
  status          TEXT        NOT NULL
                              CHECK (status IN ('running','success','failed','timeout')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ NULL,
  duration_ms     INTEGER     NULL,
  tokens_used     INTEGER     NULL,
  input_summary   JSONB       NOT NULL DEFAULT '{}',
  output_summary  JSONB       NOT NULL DEFAULT '{}',
  error_details   JSONB       NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Append-only: no updated_at or deleted_at
);


-- ============================================================
-- SECTION 5: BRAND RULES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS brand_rules (
  id                        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  brand                     TEXT    NOT NULL
                                    CHECK (brand IN ('livin','homes_and_livin','both')),
  rule_category             TEXT    NOT NULL
                                    CHECK (rule_category IN ('voice_tone','forbidden_language',
                                    'required_elements','seo_rules','compliance','formatting')),
  rule_name                 TEXT    NOT NULL,
  rule_description          TEXT    NOT NULL,
  severity                  TEXT    NOT NULL DEFAULT 'must'
                                    CHECK (severity IN ('must','should','nice_to_have')),
  applies_to_content_types  TEXT[]  NOT NULL DEFAULT '{}',
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- SECTION 6: MONETIZATION TABLES (Phase 2 — created now)
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_placements (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id               UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  mvp_id                UUID        NOT NULL REFERENCES market_vendor_partners(id) ON DELETE RESTRICT,
  placement_type        TEXT        NOT NULL
                                    CHECK (placement_type IN ('sidebar','inline','featured_listing',
                                    'category_banner','directory_highlight')),
  category              TEXT        NOT NULL,
  is_category_exclusive BOOLEAN     NOT NULL DEFAULT false,
  price_monthly         DECIMAL(10,2) NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending','active','paused','expired','compliance_hold')),
  compliance_status     TEXT        NOT NULL DEFAULT 'approved'
                                    CHECK (compliance_status IN ('approved','flagged','blocked')),
  start_date            DATE        NOT NULL,
  end_date              DATE        NULL,
  creative_data         JSONB       NOT NULL DEFAULT '{}',
  performance_data      JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ NULL
);


-- ============================================================
-- SECTION 7: LEADS TABLE (Phase 2 — created now)
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id               UUID        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  source_brand          TEXT        NOT NULL
                                    CHECK (source_brand IN ('livin','homes_and_livin')),
  destination_brand     TEXT        NOT NULL
                                    CHECK (destination_brand IN ('homes_and_livin','lpt')),
  lead_type             TEXT        NOT NULL
                                    CHECK (lead_type IN ('buyer','seller','renter',
                                    'vendor_inquiry','relocation','general')),
  quality_score         DECIMAL(3,1) NULL CHECK (quality_score BETWEEN 0.0 AND 10.0),
  contact_name          TEXT        NULL,
  contact_email         TEXT        NULL,
  contact_phone         TEXT        NULL,
  intent_signals        JSONB       NOT NULL DEFAULT '{}',
  routed_to_entity_type TEXT        NULL
                                    CHECK (routed_to_entity_type IN ('mm','mvp','lpt_agent')),
  routed_to_entity_id   UUID        NULL,
  ghl_contact_id        TEXT        NULL,
  status                TEXT        NOT NULL DEFAULT 'new'
                                    CHECK (status IN ('new','qualified','routed','contacted','converted','lost')),
  metadata              JSONB       NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- SECTION 8: INDEXES
-- Per Document 1 Section 11 — Indexing Strategy
-- ============================================================

-- Geography indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_slug
  ON countries(slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_states_regions_country_slug
  ON states_regions(country_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_slug
  ON cities(slug);

CREATE INDEX IF NOT EXISTS idx_cities_state_region
  ON cities(state_region_id);

CREATE INDEX IF NOT EXISTS idx_cities_is_active
  ON cities(is_active);

CREATE INDEX IF NOT EXISTS idx_cities_launch_priority
  ON cities(launch_priority);

-- Market Mayor indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_mayors_city
  ON market_mayors(city_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_mayors_user
  ON market_mayors(user_id);

-- MVP indexes
CREATE INDEX IF NOT EXISTS idx_mvp_market_mayor
  ON market_vendor_partners(market_mayor_id);

CREATE INDEX IF NOT EXISTS idx_mvp_city
  ON market_vendor_partners(city_id);

CREATE INDEX IF NOT EXISTS idx_mvp_category
  ON market_vendor_partners(business_category);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_city
  ON content_records(city_id);

CREATE INDEX IF NOT EXISTS idx_content_status
  ON content_records(status);

CREATE INDEX IF NOT EXISTS idx_content_brand
  ON content_records(brand);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_city_slug
  ON content_records(city_id, slug);

-- Content audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_content_record
  ON content_audit_log(content_record_id);

CREATE INDEX IF NOT EXISTS idx_audit_created_at
  ON content_audit_log(created_at);

-- Agent run log indexes
CREATE INDEX IF NOT EXISTS idx_agent_run_name
  ON agent_run_log(agent_name);

CREATE INDEX IF NOT EXISTS idx_agent_run_created_at
  ON agent_run_log(created_at);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_city
  ON leads(city_id);

CREATE INDEX IF NOT EXISTS idx_leads_source_brand
  ON leads(source_brand);

-- Ad placements partial unique index (category exclusivity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_category_exclusive
  ON ad_placements(city_id, category)
  WHERE is_category_exclusive = true AND status = 'active';


-- ============================================================
-- SECTION 9: UPDATED_AT TRIGGERS
-- Auto-update updated_at on every row change
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'countries','states_regions','cities','towns',
    'user_profiles','market_mayors','market_vendor_partners','market_mayor_partners',
    'content_records','agent_configs','brand_rules','ad_placements','leads'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at_%s
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;


-- ============================================================
-- SECTION 10: ROW-LEVEL SECURITY (RLS)
-- Per Document 1 Section 12 — RLS Policies
-- ============================================================

-- Enable RLS on ALL tables
ALTER TABLE countries               ENABLE ROW LEVEL SECURITY;
ALTER TABLE states_regions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE towns                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_mayors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_vendor_partners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_mayor_partners   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_run_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_rules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                   ENABLE ROW LEVEL SECURITY;

-- ---- user_profiles ----
CREATE POLICY "users_see_own_profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "admin_see_all_profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- market_mayors ----
CREATE POLICY "mm_sees_own_record"
  ON market_mayors FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "mm_updates_own_record"
  ON market_mayors FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "admin_sees_all_mms"
  ON market_mayors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- market_vendor_partners ----
CREATE POLICY "mm_sees_own_mvps"
  ON market_vendor_partners FOR SELECT
  USING (
    market_mayor_id IN (
      SELECT id FROM market_mayors WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "admin_sees_all_mvps"
  ON market_vendor_partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- content_records ----
CREATE POLICY "mm_sees_own_city_content"
  ON content_records FOR SELECT
  USING (
    city_id IN (
      SELECT city_id FROM market_mayors WHERE user_id = auth.uid()
    )
    OR status = 'published'
  );

CREATE POLICY "admin_manages_all_content"
  ON content_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- leads ----
CREATE POLICY "mm_sees_own_city_leads"
  ON leads FOR SELECT
  USING (
    city_id IN (
      SELECT city_id FROM market_mayors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_sees_all_leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- ad_placements ----
CREATE POLICY "mvp_sees_own_ads"
  ON ad_placements FOR SELECT
  USING (
    mvp_id IN (
      SELECT id FROM market_vendor_partners WHERE user_id = auth.uid()
    )
    OR city_id IN (
      SELECT city_id FROM market_mayors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admin_manages_all_ads"
  ON ad_placements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- agent_configs (admin only) ----
CREATE POLICY "admin_only_agent_configs"
  ON agent_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- agent_run_log (admin only read, service role insert) ----
CREATE POLICY "admin_reads_agent_logs"
  ON agent_run_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- brand_rules (all content agents read, admin writes) ----
CREATE POLICY "authenticated_reads_brand_rules"
  ON brand_rules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manages_brand_rules"
  ON brand_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ---- geography tables (public read, admin write) ----
CREATE POLICY "public_reads_countries"
  ON countries FOR SELECT USING (true);

CREATE POLICY "admin_manages_countries"
  ON countries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

CREATE POLICY "public_reads_states"
  ON states_regions FOR SELECT USING (true);

CREATE POLICY "admin_manages_states"
  ON states_regions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

CREATE POLICY "public_reads_cities"
  ON cities FOR SELECT USING (true);

CREATE POLICY "admin_manages_cities"
  ON cities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );


-- ============================================================
-- SECTION 11: SEED DATA
-- Per Document 1 Section 13.2 — Required seed data
-- ============================================================

-- Seed: United States
INSERT INTO countries (name, slug, iso_code, currency_code, is_active)
VALUES ('United States', 'united-states', 'US', 'USD', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed: All 50 U.S. States
INSERT INTO states_regions (country_id, name, slug, abbreviation, region_type, is_active)
SELECT c.id, s.name, s.slug, s.abbr, 'state', true
FROM countries c,
(VALUES
  ('Alabama','alabama','AL'),('Alaska','alaska','AK'),('Arizona','arizona','AZ'),
  ('Arkansas','arkansas','AR'),('California','california','CA'),('Colorado','colorado','CO'),
  ('Connecticut','connecticut','CT'),('Delaware','delaware','DE'),('Florida','florida','FL'),
  ('Georgia','georgia','GA'),('Hawaii','hawaii','HI'),('Idaho','idaho','ID'),
  ('Illinois','illinois','IL'),('Indiana','indiana','IN'),('Iowa','iowa','IA'),
  ('Kansas','kansas','KS'),('Kentucky','kentucky','KY'),('Louisiana','louisiana','LA'),
  ('Maine','maine','ME'),('Maryland','maryland','MD'),('Massachusetts','massachusetts','MA'),
  ('Michigan','michigan','MI'),('Minnesota','minnesota','MN'),('Mississippi','mississippi','MS'),
  ('Missouri','missouri','MO'),('Montana','montana','MT'),('Nebraska','nebraska','NE'),
  ('Nevada','nevada','NV'),('New Hampshire','new-hampshire','NH'),('New Jersey','new-jersey','NJ'),
  ('New Mexico','new-mexico','NM'),('New York','new-york','NY'),('North Carolina','north-carolina','NC'),
  ('North Dakota','north-dakota','ND'),('Ohio','ohio','OH'),('Oklahoma','oklahoma','OK'),
  ('Oregon','oregon','OR'),('Pennsylvania','pennsylvania','PA'),('Rhode Island','rhode-island','RI'),
  ('South Carolina','south-carolina','SC'),('South Dakota','south-dakota','SD'),
  ('Tennessee','tennessee','TN'),('Texas','texas','TX'),('Utah','utah','UT'),
  ('Vermont','vermont','VT'),('Virginia','virginia','VA'),('Washington','washington','WA'),
  ('West Virginia','west-virginia','WV'),('Wisconsin','wisconsin','WI'),('Wyoming','wyoming','WY')
) AS s(name, slug, abbr)
WHERE c.iso_code = 'US'
ON CONFLICT (country_id, slug) DO NOTHING;

-- Seed: Pilot City — Houston, Texas
INSERT INTO cities (state_region_id, name, slug, population, timezone, is_active, is_pilot, launch_priority, content_status)
SELECT sr.id, 'Houston', 'houston-texas', 2304580, 'America/Chicago', true, true, 1, 'seeding'
FROM states_regions sr
JOIN countries c ON sr.country_id = c.id
WHERE sr.abbreviation = 'TX' AND c.iso_code = 'US'
ON CONFLICT (slug) DO NOTHING;

-- Seed: Core Brand Rules (minimum required before agents start)
INSERT INTO brand_rules (brand, rule_category, rule_name, rule_description, severity)
VALUES
  ('livin', 'voice_tone', 'lifestyle_first_not_sales',
   'LIVIN content must be lifestyle-first. Never use real estate sales language, listing language, or agent recruiting language on LIVIN. People come to LIVIN for city life, not to buy homes.',
   'must'),
  ('both', 'forbidden_language', 'no_lpt_mentions',
   'Never mention LPT, LPT Realty, or any LPT brand on LIVIN or Homes & Livin content. LPT is a separate brand and must never appear in content on either platform.',
   'must'),
  ('homes_and_livin', 'seo_rules', 'no_reverse_links',
   'Homes & Livin content must NEVER link back to livin.in or any LIVIN page. The linking relationship is one-directional: LIVIN can link to H+L, but H+L cannot link to LIVIN.',
   'must'),
  ('both', 'required_elements', 'correct_brand_name',
   'The correct brand name is Homes & Livin (not Homes & Living, not Homes and Livin). Always use the ampersand. Always use .in TLD (never .com).',
   'must'),
  ('both', 'compliance', 'fair_housing_language',
   'Never use language that could violate the Fair Housing Act. Avoid describing neighborhoods using protected class characteristics (race, religion, national origin, sex, disability, familial status).',
   'must'),
  ('livin', 'voice_tone', 'no_recruiting_language',
   'LIVIN content must never include agent recruiting language or calls to action to join LPT or any brokerage. LIVIN is a lifestyle media brand, not a recruiting platform.',
   'must'),
  ('both', 'formatting', 'city_name_required',
   'Every article must mention the city name at least once in the first paragraph. City context is essential for SEO and user relevance.',
   'must'),
  ('homes_and_livin', 'compliance', 'agent_license_disclosure',
   'All real estate content on Homes & Livin that includes property or market information must include appropriate agent licensing disclosures per state requirements.',
   'should')
ON CONFLICT DO NOTHING;

-- Seed: All 16 Agent Configurations
INSERT INTO agent_configs (agent_name, display_name, brand_scope, permission_level, phase, build_order, trigger_type, is_active)
VALUES
  ('city_content_builder',  'City Content Builder Agent',        'livin',            'read_write_auto',   'phase_1', 1,  'pipeline', false),
  ('seo_agent',             'SEO Optimizer Agent',               'both',             'read_write_auto',   'phase_1', 2,  'pipeline', false),
  ('internal_linking',      'Internal Linking Agent',            'both',             'read_write_auto',   'phase_1', 3,  'pipeline', false),
  ('content_freshness',     'Content Freshness Agent',           'both',             'read_only',         'phase_1', 4,  'cron',     false),
  ('analytics_reporting',   'Analytics & Reporting Agent',       'both',             'read_only',         'phase_1', 5,  'cron',     false),
  ('mm_onboarding',         'Market Mayor Onboarding Agent',     'homes_and_livin',  'read_write_route',  'phase_1', 6,  'event',    false),
  ('ad_inventory',          'Ad Inventory Manager Agent',        'both',             'read_write_auto',   'phase_2', 7,  'event',    false),
  ('pricing',               'Revenue & Pricing Agent',           'both',             'read_write_auto',   'phase_2', 8,  'event',    false),
  ('compliance_trust',      'Compliance & Trust Agent',          'both',             'monitor_veto',      'phase_2', 9,  'pipeline', false),
  ('lead_routing',          'Lead Routing Agent',                'bridge',           'read_write_route',  'phase_2', 10, 'event',    false),
  ('content_confirmer',     'Content Confirmer Agent',           'both',             'read_draft',        'phase_1', 11, 'pipeline', false),
  ('content_rewriter',      'Content Rewriter Agent',            'both',             'read_write_auto',   'phase_1', 12, 'event',    false),
  ('content_director',      'Content Director (Orchestrator)',   'both',             'orchestrate',       'phase_1', 13, 'cron',     false),
  ('international',         'International Country Agent',       'both',             'read_write_auto',   'phase_3', 14, 'manual',   false),
  ('form_creation',         'Form Creation Agent',               'homes_and_livin',  'read_write_auto',   'phase_1', 15, 'event',    false),
  ('data_transfer',         'Data Transfer Agent',               'bridge',           'read_write_route',  'phase_1', 16, 'event',    false)
ON CONFLICT (agent_name) DO NOTHING;


-- ============================================================
-- MIGRATION COMPLETE
-- Tables created: 15
-- Indexes created: 18
-- RLS policies: enabled on all tables
-- Seed data: US country, 50 states, Houston TX pilot city,
--            8 brand rules, 16 agent configs
-- ============================================================
