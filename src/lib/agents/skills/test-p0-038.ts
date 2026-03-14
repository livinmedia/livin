import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) { dotenv.config({ path: envTestPath }); } else { dotenv.config({ path: envLocalPath }); }
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { generateSEOBlogPost, toSupabaseRecord, ContentBrief, SkillOutput } from "./seo-blog-post.skill.js";
const REQUIRED_VARS = ["OPENROUTER_API_KEY","ANTHROPIC_API_KEY","NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","REVALIDATE_SECRET"] as const;
const HOUSTON_CITY_ID = "c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e";
const HOUSTON_CITY_SLUG = "houston-texas";
const TEST_KEYWORD = "best things to do in Houston Texas";
const TEST_BRAND = "livin" as const;
const TEST_MM_ID = "00000000-0000-0000-0000-000000000001";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://livin-chi.vercel.app";
const STATE_TRANSITIONS = [
  { from: "confirming", to: "confirmed", gate: 4, label: "(Agent 02 confirms)" },
  { from: "confirmed", to: "seo_optimized", gate: 5, label: "(Agent 03 SEO)" },
  { from: "seo_optimized", to: "linked", gate: 6, label: "(Agent 06 linking)" },
  { from: "linked", to: "awaiting_approval", gate: 7, label: "(queued for MM)" },
  { from: "awaiting_approval", to: "mm_approved", gate: 8, label: "(MM approves)" },
  { from: "mm_approved", to: "published", gate: 9, label: "(publish)" },
];
function divider(label: string) { console.log("\n" + "\u2500".repeat(60)); console.log(label); console.log("\u2500".repeat(60)); }
function pass(msg: string) { console.log("  \u2705 " + msg); }
function fail(msg: string) { console.log("  \u274C " + msg); }
function info(msg: string) { console.log("  " + msg); }
async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
async function main() {
  console.log("\n====================================================");
  console.log("  P0-038 \u2014 Full Pipeline Test");
  console.log("  City: Houston TX | Brand: LIVIN");
  console.log("  Site: " + SITE_URL);
  console.log("====================================================\n");
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) { console.error("  Missing env vars: " + missing.join(", ")); process.exit(1); }
  pass("Env vars: all present");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let testRecordId: string | null = null;
  let allPassed = true;
  let gatesFailed: number[] = [];
  let generatedSlug = "";
  try {
    divider("Gate 1 \u2014 OpenRouter/deepseek-chat Research Call");
    info("Calling OpenRouter/deepseek-chat... (may take 15-30s)");
    const researchRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json", "X-Title": "LIVIN Platform P0-038" },
      body: JSON.stringify({ model: "deepseek/deepseek-chat", messages: [{ role: "user", content: "You are a local Houston TX research assistant. Provide research notes for a blog article about: \"" + TEST_KEYWORD + "\". Include: top 5-8 specific attractions/activities, current facts with approximate numbers, neighborhood context, and what makes Houston unique. Write as structured notes, not an article. 400-600 words." }], max_tokens: 1200, temperature: 0.4 }),
    });
    if (!researchRes.ok) { const err = await researchRes.text(); throw new Error("OpenRouter error " + researchRes.status + ": " + err); }
    const researchData = await researchRes.json();
    const researchText: string = researchData.choices?.[0]?.message?.content ?? "";
    if (!researchText || researchText.length < 200) throw new Error("Research too short: " + researchText.length + " chars");
    pass("Research returned: " + researchText.length + " chars");
    pass("Model: " + (researchData.model ?? "deepseek/deepseek-chat") + " via OpenRouter");

    divider("Gates 2-3 \u2014 Claude Generation + Validation + Supabase INSERT");
    info("Brief: article | " + TEST_BRAND + " | \"" + TEST_KEYWORD + "\"");
    info("Calling Claude Sonnet... (may take 20-40s)");
    const brief: ContentBrief = {
      city_id: HOUSTON_CITY_ID, city_slug: "houston-texas", city_name: "Houston", state_name: "Texas",
      content_type: "article", brand: TEST_BRAND, primary_keyword: TEST_KEYWORD,
      secondary_keywords: ["Houston activities", "Houston attractions", "things to do Houston TX", "Houston entertainment"],
      min_word_count: 800,
      research: { raw: researchText, city_name: "Houston", state_name: "Texas", fetched_at: new Date().toISOString() },
      market_mayor: { mm_id: TEST_MM_ID, mm_name: "Marcus Williams", personalization_prompt: "I am Marcus Williams, a Houston native and licensed real estate agent with 12 years of experience. I grew up in the Third Ward and know every corner of this city. I write like a local insider, direct, warm, and full of neighborhood-specific knowledge." },
    };
    const skillResult = await generateSEOBlogPost(brief);
    pass("Claude returned valid JSON");
    pass("Skill validation passed");
    info("title: " + skillResult.title + " | slug: " + skillResult.slug + " | words: " + skillResult.word_count);
    generatedSlug = skillResult.slug;

    const { data: cityRow, error: cityErr } = await supabase.from("cities").select("id").eq("slug", HOUSTON_CITY_SLUG).single();
    if (cityErr || !cityRow) throw new Error("Houston city not found: " + cityErr?.message);

    // Build Supabase record — remove author_mm_id (no real MM in DB yet, FK would fail)
    const _rec = toSupabaseRecord(skillResult);
    delete (_rec as Record<string, unknown>).author_mm_id;
    const supabaseRecord = { ..._rec, city_id: cityRow.id, author_entity_type: "mm", status: "confirming", brand_tag: TEST_BRAND };

    const { data: inserted, error: insertErr } = await supabase.from("content_records").insert(supabaseRecord).select("id").single();
    if (insertErr || !inserted) throw new Error("INSERT failed: " + insertErr?.message);
    testRecordId = inserted.id;
    pass("Gate 3: INSERT succeeded - id: " + testRecordId);

    divider("Gates 4-9 \u2014 State Machine Transitions (6 steps)");
    for (const t of STATE_TRANSITIONS) {
      const { data: current } = await supabase.from("content_records").select("status").eq("id", testRecordId).single();
      if (current?.status !== t.from) throw new Error("Expected " + t.from + " got " + current?.status);
      const { error: updateErr } = await supabase.from("content_records").update({ status: t.to }).eq("id", testRecordId);
      if (updateErr) throw new Error(t.from + " to " + t.to + " failed: " + updateErr.message);
      pass("Gate " + t.gate + ": " + t.from + " -> " + t.to + " " + t.label);
      await sleep(300);
    }
    const { data: finalRow } = await supabase.from("content_records").select("status, approved_at, published_at").eq("id", testRecordId).single();
    if (finalRow?.status !== "published") throw new Error("Final status=" + finalRow?.status);
    if (finalRow?.approved_at) pass("approved_at auto-set: " + finalRow.approved_at);
    if (finalRow?.published_at) pass("published_at auto-set: " + finalRow.published_at);

    divider("Gates 10-11 \u2014 Edge Function + ISR Revalidation");
    info("Waiting 10s for Edge Function to fire...");
    await sleep(10000);
    const { data: logRows, error: logErr } = await supabase.from("edge_function_logs").select("*").eq("content_record_id", testRecordId).order("created_at", { ascending: false }).limit(5);
    if (logErr) throw new Error("Log query failed: " + logErr.message);
    if (!logRows || logRows.length === 0) {
      fail("Gate 10: Edge Function did not fire");
      gatesFailed.push(10); allPassed = false;
      info("  Check: Dashboard > Database > Webhooks > content_published_isr active?");
      info("  Check: Edge Function secrets set? (NEXT_PUBLIC_SITE_URL, REVALIDATE_SECRET)");
    } else {
      pass("Gate 10: Edge Function fired");
      const log = logRows[0];
      info("  function: " + log.function_name + " | trigger: " + log.trigger_status);
      info("  geo: " + log.geo_slug + " | content: " + log.content_slug);
      info("  status_code: " + log.revalidate_status_code + " | success: " + log.success);
      if (log.error_message) info("  error: " + log.error_message);
      if (log.success === true) { pass("Gate 11: ISR revalidation succeeded"); }
      else { fail("Gate 11: ISR failed - success=" + log.success + ", code=" + log.revalidate_status_code); gatesFailed.push(11); allPassed = false; }
    }

    divider("Gate 12 \u2014 /api/revalidate Smoke Test");
    info("POST " + SITE_URL + "/api/revalidate");
    const rRes = await fetch(SITE_URL + "/api/revalidate", { method: "POST", headers: { Authorization: "Bearer " + process.env.REVALIDATE_SECRET, "Content-Type": "application/json" }, body: JSON.stringify({ citySlug: HOUSTON_CITY_SLUG, contentSlug: generatedSlug }) });
    info("Response status: " + rRes.status);
    if (rRes.status === 200) { pass("Gate 12: /api/revalidate 200"); const body = await rRes.json().catch(() => ({})); info("  Response: " + JSON.stringify(body)); }
    else { const body = await rRes.text(); fail("Gate 12: returned " + rRes.status); info("  Body: " + body.substring(0, 500)); gatesFailed.push(12); allPassed = false; }

  } catch (err: unknown) { fail("Pipeline error: " + (err instanceof Error ? err.message : String(err))); allPassed = false;
  } finally {
    divider("Gate 13 \u2014 Cleanup");
    if (testRecordId) {
      await supabase.from("edge_function_logs").delete().eq("content_record_id", testRecordId);
      const { error: delErr } = await supabase.from("content_records").delete().eq("id", testRecordId);
      if (!delErr) { const { count } = await supabase.from("content_records").select("id", { count: "exact", head: true }).eq("id", testRecordId); pass(count === 0 ? "Gate 13: Cleaned up" : "Gate 13: May still exist"); }
      else fail("Cleanup failed: " + delErr.message);
    } else info("No record to clean up");
  }
  console.log("\n" + "\u2500".repeat(60) + "\nP0-038 RESULT\n" + "\u2500".repeat(60));
  if (allPassed) { console.log("  ALL 13 GATES PASSED\n\n  P0-038 - Full Pipeline Test Houston TX: COMPLETE\n  Content pipeline is production-ready.\n  Phase 0 gate cleared - Phase 1 is unblocked.\n"); }
  else { console.log("  GATES FAILED: " + (gatesFailed.join(", ") || "see above") + "\n"); }
}
main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
