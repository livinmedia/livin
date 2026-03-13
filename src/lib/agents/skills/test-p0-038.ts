/**
 * P0-038 — Full Pipeline Test: Houston TX
 *
 * Tests the complete content pipeline end-to-end:
 *   Research → Generate → Supabase → State Machine → MM Approval → Edge Function → ISR → Page Live
 *
 * Gates:
 *   1.  OpenRouter/deepseek-chat research call
 *   2.  Claude SEO Blog Post skill generation + validation
 *   3.  INSERT to content_records (status: confirming)
 *   4.  State machine: confirming → queued
 *   5.  State machine: queued → ready_for_review
 *   6.  State machine: ready_for_review → approved (simulated MM approval)
 *   7.  State machine: approved → published (Content Director step)
 *   8.  edge_function_logs row created (Edge Function fired)
 *   9.  edge_function_logs success=true (ISR revalidation call succeeded)
 *   10. /api/revalidate endpoint returns 200 (direct smoke test)
 *   11. Cleanup — test record deleted, zero rows remain
 *
 * Run:
 *   npx tsx src/lib/agents/skills/test-p0-038.ts
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env — .env.test first, fallback to .env.local
const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
} else {
  dotenv.config({ path: envLocalPath });
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { generateSEOBlogPost, toSupabaseRecord } from "./seo-blog-post.skill.js";

// ── Config ────────────────────────────────────────────────────────────────────

const REQUIRED_VARS = [
  "OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "REVALIDATE_SECRET",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const HOUSTON_CITY_SLUG = "houston-texas";
const TEST_KEYWORD = "best things to do in Houston Texas";
const TEST_BRAND = "livin" as const;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://livin-chi.vercel.app";

// State machine: valid transitions per Doc05
const STATE_TRANSITIONS: Record<string, string> = {
  confirming: "queued",
  queued: "ready_for_review",
  ready_for_review: "approved",
  approved: "published",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function divider(label: string) {
  console.log("\n" + "─".repeat(60));
  console.log(label);
  console.log("─".repeat(60));
}

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.log(`  ❌ ${msg}`); }
function info(msg: string) { console.log(`  ${msg}`); }

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n====================================================");
  console.log("  P0-038 — Full Pipeline Test");
  console.log("  City: Houston TX (Pilot)");
  console.log("  Brand: LIVIN");
  console.log("====================================================\n");

  // ── Env check ──────────────────────────────────────────────────────────────
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`  ❌ Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  pass("Env vars: all present ✓");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let testRecordId: string | null = null;
  let allPassed = true;

  try {
    // ── Gate 1: Research ─────────────────────────────────────────────────────
    divider("Gate 1 — OpenRouter/deepseek-chat Research Call");
    info("Calling OpenRouter/deepseek-chat... (may take 15–30s)");

    const researchRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "LIVIN Platform P0-038",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "user",
            content: `You are a local Houston TX research assistant. Provide research notes for a blog article about: "${TEST_KEYWORD}". Include: top 5–8 specific attractions/activities, current facts with approximate numbers, neighborhood context, and what makes Houston unique. Write as structured notes, not an article. 400–600 words.`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.4,
      }),
    });

    if (!researchRes.ok) {
      const err = await researchRes.text();
      throw new Error(`OpenRouter error ${researchRes.status}: ${err}`);
    }

    const researchData = await researchRes.json();
    const researchText: string = researchData.choices?.[0]?.message?.content ?? "";
    if (!researchText || researchText.length < 200) {
      throw new Error(`Research too short: ${researchText.length} chars`);
    }
    pass(`Research returned: ${researchText.length} chars`);
    pass(`Model: ${researchData.model ?? "deepseek/deepseek-chat"} via OpenRouter`);
    info(`Preview: ${researchText.substring(0, 200)}...`);

    // ── Gates 2–3: Generate + Validate + Insert ───────────────────────────────
    divider("Gates 2–3 — Claude Generation + Validation");
    info(`Brief: article | ${TEST_BRAND} | "${TEST_KEYWORD}"`);

    // Look up Houston city_id (needed for brief + insert)
    const { data: cityRow, error: cityErr } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", HOUSTON_CITY_SLUG)
      .single();
    if (cityErr || !cityRow) throw new Error(`Houston city not found: ${cityErr?.message}`);

    info("Calling Claude Sonnet... (may take 20–40s)");

    const skillResult = await generateSEOBlogPost({
      city_id: cityRow.id,
      city_slug: HOUSTON_CITY_SLUG,
      city_name: "Houston",
      state_name: "Texas",
      content_type: "article",
      brand: TEST_BRAND,
      primary_keyword: TEST_KEYWORD,
      secondary_keywords: [
        "Houston attractions",
        "things to do in Houston TX",
        "Houston activities",
        "Houston travel guide",
      ],
      min_word_count: 800,
      research: {
        raw: researchText,
        city_name: "Houston",
        state_name: "Texas",
        fetched_at: new Date().toISOString(),
      },
      market_mayor: {
        mm_id: "00000000-0000-0000-0000-000000000001",
        mm_name: "Marcus Williams",
        personalization_prompt:
          "Marcus Williams is a Houston native and licensed real estate agent with 15 years of experience. He writes with warmth, local pride, and practical insight. He uses conversational language, avoids jargon, and always ties content back to real neighborhood life in Houston.",
      },
    });

    pass("Claude returned valid JSON");
    pass("Skill validation passed");
    info(`title: ${skillResult.title}`);
    info(`slug: ${skillResult.slug}`);
    info(`word_count: ${skillResult.word_count}`);

    const supabaseRecord = {
      ...toSupabaseRecord(skillResult),
      city_id: cityRow.id,
      author_entity_type: "mm",
      author_mm_id: null,  // No real MM assigned to Houston yet — FK requires null or valid UUID
      status: "confirming",
      brand_tag: TEST_BRAND,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("content_records")
      .insert(supabaseRecord)
      .select("id")
      .single();

    if (insertErr || !inserted) {
      throw new Error(`INSERT failed: ${insertErr?.message}`);
    }

    testRecordId = inserted.id;
    pass(`INSERT succeeded — id: ${testRecordId}`);

    // ── Gates 4–7: State Machine Transitions ─────────────────────────────────
    divider("Gates 4–9 — State Machine Transitions");

    // Real state machine (from validate_content_status_transition trigger):
    // confirming → confirmed → seo_optimized → linked → awaiting_approval → mm_approved → published
    const transitions = [
      { from: "confirming",       to: "confirmed",         gate: 4 },
      { from: "confirmed",        to: "seo_optimized",     gate: 5 },
      { from: "seo_optimized",    to: "linked",            gate: 6 },
      { from: "linked",           to: "awaiting_approval", gate: 7 },
      { from: "awaiting_approval",to: "mm_approved",       gate: 8, label: "(simulated MM approval)" },
      { from: "mm_approved",      to: "published",         gate: 9, label: "(Content Director publish)" },
    ];

    for (const t of transitions) {
      info(`Gate ${t.gate}: ${t.from} → ${t.to} ${t.label ?? ""}`);

      // Verify current status
      const { data: current, error: fetchErr } = await supabase
        .from("content_records")
        .select("status")
        .eq("id", testRecordId)
        .single();

      if (fetchErr || !current) throw new Error(`Fetch status failed: ${fetchErr?.message}`);
      if (current.status !== t.from) {
        throw new Error(`Expected status=${t.from} but got status=${current.status}`);
      }

      // Apply transition
      // Note: approved_at set automatically by DB trigger on mm_approved
      // Note: published_at set automatically by DB trigger on published
      const updatePayload: Record<string, unknown> = { status: t.to };

      const { error: updateErr } = await supabase
        .from("content_records")
        .update(updatePayload)
        .eq("id", testRecordId);

      if (updateErr) throw new Error(`Transition to ${t.to} failed: ${updateErr.message}`);
      pass(`Gate ${t.gate}: ${t.from} → ${t.to} ✓`);

      // Brief pause between transitions
      await sleep(500);
    }

    // ── Gates 8–9: Edge Function Fired + ISR Success ──────────────────────────
    divider("Gates 10–11 — Edge Function + ISR Revalidation");
    info("Waiting 8s for Edge Function + ISR call to complete...");
    await sleep(8000);

    const { data: logRows, error: logErr } = await supabase
      .from("edge_function_logs")
      .select("id, function_name, trigger_status, geo_slug, content_slug, revalidate_status_code, success, error_message, created_at")
      .eq("content_record_id", testRecordId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (logErr) throw new Error(`edge_function_logs query failed: ${logErr.message}`);

    if (!logRows || logRows.length === 0) {
      fail("Gate 10: No edge_function_logs row found — Edge Function did not fire");
      allPassed = false;
      info("Check: Is the database webhook configured? (name=content_published_isr, table=content_records, event=UPDATE)");
      info("Check: Is NEXT_PUBLIC_SITE_URL set in Supabase Edge Function secrets?");
    } else {
      pass(`Gate 10: edge_function_logs row found — Edge Function fired ✓`);
      const log = logRows[0];
      info(`  function: ${log.function_name}`);
      info(`  trigger_status: ${log.trigger_status}`);
      info(`  geo_slug: ${log.geo_slug}`);
      info(`  content_slug: ${log.content_slug}`);
      info(`  revalidate_status_code: ${log.revalidate_status_code}`);
      info(`  success: ${log.success}`);
      if (log.error_message) info(`  error: ${log.error_message}`);

      if (log.success === true) {
        pass("Gate 11: ISR revalidation call succeeded (success=true) ✓");
      } else {
        fail(`Gate 11: ISR revalidation did not succeed — success=${log.success}, status=${log.revalidate_status_code}`);
        if (log.error_message) info(`  Error: ${log.error_message}`);
        allPassed = false;
        info("Check: Is NEXT_PUBLIC_SITE_URL pointing to https://livin-chi.vercel.app?");
        info("Check: Does REVALIDATE_SECRET in Supabase secrets match REVALIDATE_SECRET in Vercel env vars?");
      }
    }

    // ── Gate 10: /api/revalidate Direct Smoke Test ────────────────────────────
    divider("Gate 12 — /api/revalidate Smoke Test");
    info(`POST ${SITE_URL}/api/revalidate`);

    const revalidateRes = await fetch(`${SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REVALIDATE_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        geoSlug: HOUSTON_CITY_SLUG,
        contentSlug: skillResult.slug,
      }),
    });

    info(`Response status: ${revalidateRes.status}`);

    if (revalidateRes.status === 200) {
      pass("Gate 12: /api/revalidate returned 200 ✓");
      const body = await revalidateRes.json().catch(() => ({}));
      info(`  Response: ${JSON.stringify(body)}`);
    } else {
      const body = await revalidateRes.text();
      fail(`Gate 12: /api/revalidate returned ${revalidateRes.status}`);
      info(`  Body: ${body.substring(0, 300)}`);
      allPassed = false;
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    fail(`Pipeline error: ${message}`);
    allPassed = false;
  } finally {
    // ── Gate 11: Cleanup ──────────────────────────────────────────────────────
    divider("Gate 13 — Cleanup");

    if (testRecordId) {
      // Delete edge_function_logs rows for this record first (FK constraint)
      await supabase
        .from("edge_function_logs")
        .delete()
        .eq("content_record_id", testRecordId);

      const { error: delErr } = await supabase
        .from("content_records")
        .delete()
        .eq("id", testRecordId);

      if (delErr) {
        fail(`Cleanup failed: ${delErr.message}`);
      } else {
        // Verify
        const { count } = await supabase
          .from("content_records")
          .select("id", { count: "exact", head: true })
          .eq("id", testRecordId);

        if (count === 0) {
          pass("Gate 13: Test record deleted, zero rows remain ✓");
        } else {
          fail("Gate 13: Record may not have been deleted — verify manually");
        }
      }
    } else {
      info("Gate 13: No record to clean up");
    }
  }

  // ── Result ────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("P0-038 RESULT");
  console.log("─".repeat(60));

  if (allPassed) {
    console.log("  ALL 13 GATES PASSED ✅\n");
    console.log("  P0-038 — Full Pipeline Test Houston TX: COMPLETE");
    console.log("  Content pipeline is production-ready.\n");
  } else {
    console.log("  ⚠️  SOME GATES FAILED — see output above for details\n");
    console.log("  Common fixes:");
    console.log("  • Gates 10–11: Update NEXT_PUBLIC_SITE_URL in Supabase Edge Function secrets");
    console.log("  • Gates 10–11: Confirm database webhook is active in Supabase dashboard");
    console.log("  • Gate 12:   Confirm REVALIDATE_SECRET matches in both Supabase + Vercel\n");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});