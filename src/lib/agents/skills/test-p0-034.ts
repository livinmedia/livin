/**
 * P0-034 Test Script — SEO Blog Post Skill
 * LIVIN + Homes & Livin Ecosystem
 *
 * WHAT THIS TESTS:
 *   1. Real OpenRouter/deepseek-chat research call for Houston TX
 *   2. Real Claude Sonnet SEO Blog Post skill generation
 *   3. Skill output validation (SEO rules, brand rules, structure)
 *   4. Supabase dev write to content_records (status: confirming)
 *   5. Verification that all required columns are populated
 *   6. Cleanup of test records
 *
 * PASS CRITERIA (P0-034 complete when ALL pass):
 *   ✅ Gate 1: OpenRouter research call returns structured city data
 *   ✅ Gate 2: Claude generates valid JSON matching SkillOutput interface
 *   ✅ Gate 3: Skill validation passes (SEO, brand, structure, field lengths)
 *   ✅ Gate 4: Supabase INSERT succeeds with status = confirming
 *   ✅ Gate 5: All required columns populated (body_json, h1, og_title, etc.)
 *   ✅ Gate 6: brand_tag = 'livin', author_entity_type = 'mm'
 *   ✅ Gate 7: body_json parses correctly (≥3 h2 sections + conclusion)
 *   ✅ Gate 8: link_hooks present with 2–4 entries
 *   ✅ Gate 9: schema_json is valid Article schema
 *   ✅ Gate 10: Cleanup — test record deleted, zero rows remain
 *
 * USAGE:
 *   npx ts-node test-p0-034.ts
 *
 * REQUIRED ENV VARS (in .env.local):
 *   OPENROUTER_API_KEY
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← service role bypasses RLS for test writes
 */

import {
  generateSEOBlogPost,
  toSupabaseRecord,
  ContentBrief,
  SkillOutput,
} from "./seo-blog-post.skill.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM __dirname polyfill — tsx in ESM mode does not provide __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env — tries .env.test first (test credentials), then .env.local fallback
// .env.test should be at project root: D:\livin-platform\.env.test
const envTest = path.resolve(process.cwd(), ".env.test");
const envLocal = path.resolve(process.cwd(), ".env.local");
const r1 = dotenv.config({ path: envTest });
if (r1.error) {
  const r2 = dotenv.config({ path: envLocal });
  if (r2.error) {
    console.warn("  Warning: could not load .env.test or .env.local from", process.cwd());
  }
}

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

// Houston TX — pilot city
const HOUSTON_CITY_ID = "c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e";

// Test MM — placeholder (no real MM exists yet; author_mm_id FK is nullable in test)
// For P0-034 we use a sentinel UUID that won't FK-fail because author_mm_id is nullable
const TEST_MM_ID = "00000000-0000-0000-0000-000000000001";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
}
function fail(msg: string) {
  console.error(`  ❌ ${msg}`);
  process.exit(1);
}
function header(msg: string) {
  console.log(`\n${"─".repeat(60)}\n${msg}\n${"─".repeat(60)}`);
}

// ---------------------------------------------------------------------------
// GATE 1: OpenRouter research call
// ---------------------------------------------------------------------------

async function fetchResearch(
  city: string,
  state: string,
  keyword: string
): Promise<string> {
  header("Gate 1 — OpenRouter/deepseek-chat Research Call");

  const prompt = `You are a city research assistant. Provide detailed, factual research about ${city}, ${state} 
focused on the topic: "${keyword}".

Include:
- Specific neighborhood names in ${city}
- Local culture, food scene, and lifestyle highlights relevant to the topic
- Real demographic context (population size, diversity, growth trends)
- What makes ${city} unique compared to other major U.S. cities
- Any relevant local events, institutions, or landmarks related to the topic

Be specific and factual. This research will be used to write a city guide article.
Target 400–600 words of structured research notes.`;

  console.log("  Calling OpenRouter/deepseek-chat... (may take 15–30s)");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://livin.in",
        "X-Title": "LIVIN Platform Content Research",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    fail(`OpenRouter fetch failed: ${msg}`);
    throw err;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const err = await response.text();
    fail(`OpenRouter API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const research = data.choices?.[0]?.message?.content;

  if (!research || research.length < 200) {
    fail(`Research payload too short or empty: "${research}"`);
  }

  pass(`Research returned: ${research.length} chars`);
  pass(`Model: deepseek/deepseek-chat via OpenRouter`);
  console.log(`\n  Preview (first 300 chars):\n  ${research.substring(0, 300)}...\n`);

  return research;
}

// ---------------------------------------------------------------------------
// GATE 2–3: Claude skill generation + validation
// ---------------------------------------------------------------------------

async function runSkill(researchRaw: string): Promise<SkillOutput> {
  header("Gates 2–3 — Claude SEO Blog Post Skill Generation + Validation");

  const brief: ContentBrief = {
    city_id: HOUSTON_CITY_ID,
    city_slug: "houston-texas",
    city_name: "Houston",
    state_name: "Texas",
    content_type: "article",
    brand: "livin",
    primary_keyword: "best neighborhoods in Houston Texas",
    secondary_keywords: [
      "Houston lifestyle",
      "Houston culture",
      "living in Houston",
      "Houston community",
    ],
    min_word_count: 800,
    research: {
      raw: researchRaw,
      city_name: "Houston",
      state_name: "Texas",
      fetched_at: new Date().toISOString(),
    },
    market_mayor: {
      mm_id: TEST_MM_ID,
      mm_name: "Marcus Williams",
      personalization_prompt:
        "I'm Marcus Williams, a Houston native and licensed real estate agent " +
        "with 12 years of experience. I grew up in the Third Ward and know " +
        "Houston's neighborhoods intimately — from Montrose to Memorial to " +
        "the Heights. I write with hometown pride, local insight, and a " +
        "straight-talking style that Houstonians recognize as authentic. " +
        "I reference real places, real vibes, and real people. No generic city-guide fluff.",
    },
  };

  console.log(`  Brief: ${brief.content_type} | ${brief.brand} | "${brief.primary_keyword}"`);
  console.log(`  Calling Claude Sonnet... (may take 20–40s)`);

  let output: SkillOutput;
  try {
    output = await generateSEOBlogPost(brief);
    pass("Claude returned valid JSON");
    pass("Skill validation passed");
  } catch (err) {
    // Print first 2000 chars of error to help diagnose Claude output issues
    const msg = String(err);
    console.error("\n  Raw error (first 2000 chars):");
    console.error("  " + msg.substring(0, 2000));
    fail(`Skill failed — see raw error above`);
    throw err;
  }

  // Print key fields
  console.log(`\n  Generated fields:`);
  console.log(`  title:            ${output.title}`);
  console.log(`  h1:               ${output.h1}`);
  console.log(`  og_title:         ${output.og_title}`);
  console.log(`  slug:             ${output.slug}`);
  console.log(`  word_count:       ${output.word_count}`);
  console.log(`  meta_desc length: ${output.meta_description.length} chars`);
  console.log(`  sections:         ${output.body_json.sections.length}`);
  console.log(`  link_hooks:       ${output.link_hooks.length}`);
  console.log(`  target_keywords:  ${output.target_keywords.join(", ")}`);

  return output;
}

// ---------------------------------------------------------------------------
// GATES 4–9: Supabase write + verification
// ---------------------------------------------------------------------------

async function writeAndVerify(output: SkillOutput): Promise<string> {
  header("Gates 4–9 — Supabase Dev Write + Verification");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Build the INSERT record — no research_id for this test (research not pre-stored)
  const record = toSupabaseRecord(output);
  // Remove author_mm_id for test — no real MM exists in auth.users
  // (nullable FK — safe to omit in test mode)
  delete (record as Record<string, unknown>).author_mm_id;

  // Gate 4: INSERT
  const { data: inserted, error: insertErr } = await supabase
    .from("content_records")
    .insert(record)
    .select()
    .single();

  if (insertErr) fail(`INSERT failed: ${insertErr.message}`);
  pass(`Gate 4: INSERT succeeded — id: ${inserted.id}`);

  const id: string = inserted.id;

  // Gate 5: Required columns populated
  const requiredColumns = [
    "body_json",
    "h1",
    "og_title",
    "og_image_url",
    "meta_description",
    "meta_title",
    "title",
    "slug",
    "schema_json",
    "link_hooks",
    "target_keywords",
    "word_count",
  ];
  for (const col of requiredColumns) {
    if (!inserted[col]) fail(`Gate 5: column "${col}" is null/empty`);
  }
  pass(`Gate 5: All required columns populated`);

  // Gate 6: brand_tag + author_entity_type
  if (inserted.brand_tag !== "livin")
    fail(`Gate 6: brand_tag = "${inserted.brand_tag}", expected "livin"`);
  if (inserted.author_entity_type !== "mm")
    fail(`Gate 6: author_entity_type = "${inserted.author_entity_type}", expected "mm"`);
  if (inserted.status !== "confirming")
    fail(`Gate 6: status = "${inserted.status}", expected "confirming"`);
  pass(`Gate 6: brand_tag=livin, author_entity_type=mm, status=confirming ✓`);

  // Gate 7: body_json structure
  const bodyJson = inserted.body_json as { sections: Array<{ type: string }> };
  const h2Count = bodyJson.sections.filter((s) => s.type === "h2").length;
  const hasConclusion = bodyJson.sections.some((s) => s.type === "conclusion");
  if (h2Count < 3) fail(`Gate 7: body_json has ${h2Count} h2 sections, need ≥3`);
  if (!hasConclusion) fail(`Gate 7: body_json missing conclusion section`);
  pass(`Gate 7: body_json valid — ${h2Count} h2 sections + conclusion`);

  // Gate 8: link_hooks
  const hooks = inserted.link_hooks as unknown[];
  if (!Array.isArray(hooks) || hooks.length < 2 || hooks.length > 4) {
    fail(`Gate 8: link_hooks has ${hooks?.length} entries, need 2–4`);
  }
  pass(`Gate 8: link_hooks present — ${hooks.length} hooks`);

  // Gate 9: schema_json
  const schema = inserted.schema_json as Record<string, unknown>;
  if (schema["@type"] !== "Article")
    fail(`Gate 9: schema_json @type = "${schema["@type"]}", expected "Article"`);
  if (!schema.headline) fail("Gate 9: schema_json missing headline");
  pass(`Gate 9: schema_json valid Article schema ✓`);

  return id;
}

// ---------------------------------------------------------------------------
// GATE 10: Cleanup
// ---------------------------------------------------------------------------

async function cleanup(id: string): Promise<void> {
  header("Gate 10 — Cleanup");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error } = await supabase
    .from("content_records")
    .delete()
    .eq("id", id);

  if (error) fail(`Cleanup DELETE failed: ${error.message}`);

  // Verify zero rows remain for this test record
  const { data: remaining } = await supabase
    .from("content_records")
    .select("id")
    .eq("id", id);

  if (remaining && remaining.length > 0)
    fail(`Cleanup: record still exists after DELETE`);

  pass(`Gate 10: Test record deleted, zero rows remain`);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log("\n====================================================");
  console.log("  P0-034 — SEO Blog Post Skill Test");
  console.log("  City: Houston TX (Pilot)");
  console.log("  Brand: LIVIN");
  console.log("====================================================");

  // Validate env vars
  const required = [
    "OPENROUTER_API_KEY",
    "ANTHROPIC_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  for (const key of required) {
    if (!process.env[key]) fail(`Missing env var: ${key}`);
  }
  console.log("\n  Env vars: all present ✓");

  // Run gates
  const research = await fetchResearch(
    "Houston",
    "Texas",
    "best neighborhoods in Houston Texas"
  );

  const output = await runSkill(research);

  const recordId = await writeAndVerify(output);

  await cleanup(recordId);

  // Final summary
  header("P0-034 RESULT");
  console.log("  ALL 10 GATES PASSED ✅");
  console.log("\n  P0-034 — SEO Blog Post Skill: COMPLETE");
  console.log("  Ready for P0-038 — Full Pipeline Test Houston TX\n");
}

main().catch((err) => {
  console.error("\n❌ Test failed with unhandled error:", err);
  process.exit(1);
});
