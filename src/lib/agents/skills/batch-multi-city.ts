/**
 * Batch generate articles for multiple cities with hero images.
 * - 14 remaining Houston topics (retry from failed batch)
 * - 10 The Woodlands TX topics
 * - 10 Chico CA topics
 *
 * Auto-approves and publishes all that pass validation.
 *
 * Usage: npx tsx src/lib/agents/skills/batch-multi-city.ts
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) { dotenv.config({ path: envTestPath }); } else { dotenv.config({ path: envLocalPath }); }
import { generateSEOBlogPost, generateHeroImage, toSupabaseRecord, ContentBrief } from "./seo-blog-post.skill.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ── City Configs ──

interface CityConfig {
  city_id: string;
  city_slug: string;
  city_name: string;
  state_name: string;
  mm_id: string;
  mm_name: string;
  mm_prompt: string;
}

interface Topic {
  keyword: string;
  secondary: string[];
  type: "article" | "guide";
}

// Houston — existing city & MM
const HOUSTON: CityConfig = {
  city_id: "c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e",
  city_slug: "houston-texas",
  city_name: "Houston",
  state_name: "Texas",
  mm_id: "5f865cad-ff52-4f9f-92b2-1e4373a9e95f",
  mm_name: "Marcus Williams",
  mm_prompt: "I am Marcus Williams, a Houston native and licensed real estate agent with 12 years of experience. I grew up in the Third Ward and know every corner of this city. I write like a local insider, direct, warm, and full of neighborhood-specific knowledge.",
};

// The Woodlands & Chico — will be created if not exist
let WOODLANDS: CityConfig = {
  city_id: "",
  city_slug: "the-woodlands-texas",
  city_name: "The Woodlands",
  state_name: "Texas",
  mm_id: "",
  mm_name: "LIVIN Editorial",
  mm_prompt: "As LIVIN Editorial, we cover The Woodlands with an insider perspective — a masterplanned community that balances nature trails, top dining, and family living just north of Houston. Warm, informative, and community-focused.",
};

let CHICO: CityConfig = {
  city_id: "",
  city_slug: "chico-california",
  city_name: "Chico",
  state_name: "California",
  mm_id: "",
  mm_name: "LIVIN Editorial",
  mm_prompt: "As LIVIN Editorial, we cover Chico — a vibrant Northern California college town known for its craft beer scene, Bidwell Park, CSU Chico, and a laid-back lifestyle that blends outdoor adventure with small-city charm.",
};

// ── Topics ──

const HOUSTON_REMAINING: Topic[] = [
  { keyword: "best barbecue in Houston Texas", secondary: ["Houston BBQ", "Houston smokehouses", "Texas barbecue Houston"], type: "article" },
  { keyword: "Houston happy hour guide", secondary: ["Houston after work drinks", "Houston happy hour deals", "Houston cocktail hour"], type: "guide" },
  { keyword: "best vegan restaurants in Houston", secondary: ["Houston plant-based dining", "Houston vegan food", "Houston healthy eating"], type: "article" },
  { keyword: "Montrose Houston neighborhood guide", secondary: ["Montrose restaurants", "Montrose nightlife", "Montrose Houston things to do"], type: "guide" },
  { keyword: "The Heights Houston neighborhood guide", secondary: ["Heights restaurants", "Heights shopping", "Heights Houston history"], type: "guide" },
  { keyword: "Midtown Houston living and nightlife", secondary: ["Midtown Houston bars", "Midtown Houston restaurants", "Midtown Houston walkable"], type: "guide" },
  { keyword: "Buffalo Bayou Park Houston guide", secondary: ["Buffalo Bayou Houston", "Houston kayaking", "Houston urban trails"], type: "guide" },
  { keyword: "Houston farmers markets guide", secondary: ["Houston farmers market", "Houston local produce", "Houston weekend markets"], type: "guide" },
  { keyword: "best dog parks in Houston Texas", secondary: ["Houston dog parks", "Houston off-leash parks", "Houston pet-friendly"], type: "article" },
  { keyword: "Houston Museum District guide", secondary: ["Houston museums", "Houston Museum of Fine Arts", "Houston cultural attractions"], type: "guide" },
  { keyword: "best live music venues in Houston", secondary: ["Houston live music", "Houston concert halls", "Houston music scene"], type: "article" },
  { keyword: "Houston street art and murals tour", secondary: ["Houston murals", "Houston street art", "Houston art walks"], type: "guide" },
  { keyword: "moving to Houston relocation guide", secondary: ["relocating to Houston", "Houston neighborhoods for newcomers", "Houston cost of living"], type: "guide" },
  { keyword: "Houston date night ideas", secondary: ["Houston date night", "Houston romantic restaurants", "Houston couples activities"], type: "article" },
];

const WOODLANDS_TOPICS: Topic[] = [
  { keyword: "best restaurants in The Woodlands Texas", secondary: ["The Woodlands dining", "Woodlands fine dining", "Market Street restaurants"], type: "article" },
  { keyword: "things to do in The Woodlands Texas", secondary: ["Woodlands activities", "Woodlands entertainment", "Woodlands weekend plans"], type: "guide" },
  { keyword: "The Woodlands Texas neighborhood guide", secondary: ["Woodlands communities", "Woodlands villages", "best neighborhoods Woodlands"], type: "guide" },
  { keyword: "best trails and parks in The Woodlands", secondary: ["Woodlands hiking", "George Mitchell Nature Preserve", "Woodlands trails"], type: "guide" },
  { keyword: "The Woodlands Waterway and Town Center", secondary: ["Woodlands Waterway", "Town Center shopping", "Woodlands entertainment district"], type: "guide" },
  { keyword: "best coffee shops in The Woodlands Texas", secondary: ["Woodlands coffee", "Woodlands cafes", "Woodlands brunch coffee"], type: "article" },
  { keyword: "family activities in The Woodlands Texas", secondary: ["Woodlands family fun", "Woodlands kids activities", "Woodlands family events"], type: "guide" },
  { keyword: "best brunch spots in The Woodlands", secondary: ["Woodlands brunch", "Woodlands breakfast", "Woodlands Sunday brunch"], type: "article" },
  { keyword: "The Woodlands real estate market overview", secondary: ["Woodlands homes", "Woodlands housing market", "Woodlands property values"], type: "article" },
  { keyword: "nightlife and bars in The Woodlands Texas", secondary: ["Woodlands bars", "Woodlands happy hour", "Woodlands nightlife scene"], type: "article" },
];

const CHICO_TOPICS: Topic[] = [
  { keyword: "best restaurants in Chico California", secondary: ["Chico dining", "Chico food scene", "downtown Chico restaurants"], type: "article" },
  { keyword: "things to do in Chico California", secondary: ["Chico activities", "Chico entertainment", "Chico weekend plans"], type: "guide" },
  { keyword: "Bidwell Park Chico hiking trails guide", secondary: ["Bidwell Park trails", "upper Bidwell Park", "Chico hiking"], type: "guide" },
  { keyword: "best craft breweries in Chico California", secondary: ["Chico breweries", "Sierra Nevada Chico", "Chico craft beer"], type: "article" },
  { keyword: "Chico California neighborhood guide", secondary: ["Chico neighborhoods", "downtown Chico", "Chico communities"], type: "guide" },
  { keyword: "best coffee shops in Chico California", secondary: ["Chico coffee", "Chico cafes", "Chico study spots"], type: "article" },
  { keyword: "outdoor adventures near Chico California", secondary: ["Chico outdoors", "Chico kayaking", "Chico swimming holes"], type: "guide" },
  { keyword: "Chico farmers market and local food", secondary: ["Chico farmers market", "Chico local produce", "Chico Saturday market"], type: "article" },
  { keyword: "moving to Chico California guide", secondary: ["relocating to Chico", "Chico cost of living", "Chico lifestyle"], type: "guide" },
  { keyword: "best brunch spots in Chico California", secondary: ["Chico brunch", "Chico breakfast", "Chico morning dining"], type: "article" },
];

// ── Helpers ──

async function research(keyword: string, cityName: string, stateName: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: `Research notes for a blog about "${keyword}" in ${cityName}, ${stateName}. Include 5-8 specific places with addresses or neighborhoods, current facts, local tips, and insider details. Structured notes, 400-600 words.` }],
      max_tokens: 1200,
      temperature: 0.4,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function walkToPublished(id: string): Promise<boolean> {
  const states = ["generating", "confirming", "confirmed", "seo_optimized", "linked", "awaiting_approval", "mm_approved", "published"];
  for (const status of states) {
    const updates: Record<string, unknown> = { status };
    if (status === "published") updates.published_at = new Date().toISOString();
    if (status === "mm_approved") updates.approved_at = new Date().toISOString();
    const { error } = await supabase.from("content_records").update(updates).eq("id", id);
    if (error) { console.log("    State machine error at " + status + ": " + error.message); return false; }
    await new Promise(r => setTimeout(r, 150));
  }
  return true;
}

async function ensureCity(slug: string, name: string, stateName: string, stateAbbr: string, population: number): Promise<string> {
  // Check if exists
  const { data: existing } = await supabase.from("cities").select("id").eq("slug", slug).limit(1);
  if (existing && existing.length > 0) {
    console.log(`  City "${name}" already exists: ${existing[0].id}`);
    return existing[0].id;
  }

  // Find state
  const { data: stateData } = await supabase.from("states_regions").select("id").eq("abbreviation", stateAbbr).limit(1);
  if (!stateData || stateData.length === 0) throw new Error(`State ${stateAbbr} not found`);

  // Create city
  const { data: city, error } = await supabase.from("cities").insert({
    name,
    slug,
    state_region_id: stateData[0].id,
    population,
    is_active: true,
    is_top_100: population >= 100000,
    content_status: "seeding",
  }).select("id").single();

  if (error) throw new Error(`Failed to create city ${name}: ${error.message}`);
  console.log(`  Created city "${name}": ${city.id}`);
  return city.id;
}

async function processArticle(city: CityConfig, topic: Topic, index: number, total: number): Promise<boolean> {
  console.log(`\n${"~".repeat(60)}`);
  console.log(`[${city.city_name}] Article ${index + 1}/${total}: ${topic.keyword}`);
  console.log("~".repeat(60));

  try {
    // Check for duplicate
    const expectedSlug = topic.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
    const { data: existing } = await supabase.from("content_records").select("id").eq("slug", expectedSlug).eq("city_id", city.city_id).limit(1);
    if (existing && existing.length > 0) {
      console.log("  SKIP — article already exists");
      return false;
    }

    // 1. Research
    console.log("  [1] Researching...");
    const researchText = await research(topic.keyword, city.city_name, city.state_name);
    console.log("    " + researchText.length + " chars");

    // 2. Generate article
    console.log("  [2] Generating article...");
    const brief: ContentBrief = {
      city_id: city.city_id,
      city_slug: city.city_slug,
      city_name: city.city_name,
      state_name: city.state_name,
      content_type: topic.type,
      brand: "livin",
      primary_keyword: topic.keyword,
      secondary_keywords: topic.secondary,
      min_word_count: 1200,
      research: { raw: researchText, city_name: city.city_name, state_name: city.state_name, fetched_at: new Date().toISOString() },
      market_mayor: { mm_id: city.mm_id || "system", mm_name: city.mm_name, personalization_prompt: city.mm_prompt },
    };
    const article = await generateSEOBlogPost(brief);
    console.log("    Title: " + article.title);
    console.log("    Words: " + article.word_count + " | Sections: " + article.body_json.sections.length);

    // 3. Generate hero image
    console.log("  [3] Generating hero image...");
    const image = await generateHeroImage(article.title, city.city_name, topic.type);
    let imageUrl: string | null = null;
    if (image) {
      const imgFilename = article.slug + ".png";
      const { error: uploadErr } = await supabase.storage
        .from("content-images")
        .upload("articles/" + imgFilename, image.imageData, { contentType: image.mimeType, upsert: true });
      if (uploadErr) {
        console.log("    Image upload failed: " + uploadErr.message);
      } else {
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content-images/articles/${imgFilename}`;
        console.log("    Image uploaded: " + (image.imageData.length / 1024).toFixed(0) + "KB");
      }
    } else {
      console.log("    Image generation failed (continuing without)");
    }

    // 4. Insert to Supabase
    console.log("  [4] Writing to Supabase...");
    const record = toSupabaseRecord(article);
    delete (record as Record<string, unknown>).author_mm_id;
    const insertPayload = {
      ...record,
      city_id: city.city_id,
      status: "queued",
      author_entity_type: city.mm_id ? "mm" : "system",
      og_image_url: imageUrl,
      hero_image_url: imageUrl,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("content_records")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr) {
      console.log("    INSERT failed: " + insertErr.message);
      return false;
    }
    console.log("    Inserted: " + inserted.id);

    // 5. Auto-approve and publish
    console.log("  [5] Auto-publishing...");
    const published = await walkToPublished(inserted.id);
    if (published) {
      console.log("    ✓ PUBLISHED");
      return true;
    }
    return false;

  } catch (err) {
    console.log("  ERROR: " + (err instanceof Error ? err.message : String(err)));
    return false;
  }
}

async function runBatch(city: CityConfig, topics: Topic[], label: string): Promise<{ success: number; fail: number }> {
  console.log(`\n${"#".repeat(60)}`);
  console.log(`  ${label} — ${topics.length} articles`);
  console.log(`  City: ${city.city_name}, ${city.state_name}`);
  console.log("#".repeat(60));

  let success = 0, fail = 0;
  for (let i = 0; i < topics.length; i++) {
    const ok = await processArticle(city, topics[i], i, topics.length);
    if (ok) success++; else fail++;
    if (i < topics.length - 1) {
      console.log("  Pausing 3s...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.log(`\n  ${label} complete: ${success}/${topics.length} published`);
  return { success, fail };
}

// ── Main ──

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  MULTI-CITY BATCH GENERATION");
  console.log("  Houston (14 retry) + The Woodlands (10) + Chico (10)");
  console.log("  Auto-approve & publish all that pass validation");
  console.log("=".repeat(60));

  // Ensure cities exist
  console.log("\n  Setting up cities...");
  const woodlandsId = await ensureCity("the-woodlands-texas", "The Woodlands", "Texas", "TX", 118000);
  WOODLANDS.city_id = woodlandsId;

  const chicoId = await ensureCity("chico-california", "Chico", "California", "CA", 101000);
  CHICO.city_id = chicoId;

  // Run batches
  const r1 = await runBatch(HOUSTON, HOUSTON_REMAINING, "HOUSTON RETRY (14)");
  console.log("\n  Batch pause: 10s...\n");
  await new Promise(r => setTimeout(r, 10000));

  const r2 = await runBatch(WOODLANDS, WOODLANDS_TOPICS, "THE WOODLANDS TX (10)");
  console.log("\n  Batch pause: 10s...\n");
  await new Promise(r => setTimeout(r, 10000));

  const r3 = await runBatch(CHICO, CHICO_TOPICS, "CHICO CA (10)");

  // Summary
  const totalSuccess = r1.success + r2.success + r3.success;
  const totalFail = r1.fail + r2.fail + r3.fail;

  console.log("\n\n" + "=".repeat(60));
  console.log("  BATCH COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Houston:      ${r1.success}/${HOUSTON_REMAINING.length} published`);
  console.log(`  The Woodlands: ${r2.success}/${WOODLANDS_TOPICS.length} published`);
  console.log(`  Chico:        ${r3.success}/${CHICO_TOPICS.length} published`);
  console.log(`  Total:        ${totalSuccess}/${totalSuccess + totalFail} published`);

  // DB summary per city
  for (const city of [HOUSTON, WOODLANDS, CHICO]) {
    const { data: all } = await supabase
      .from("content_records")
      .select("title, status, hero_image_url")
      .eq("city_id", city.city_id)
      .order("created_at", { ascending: false });
    if (all) {
      console.log(`\n  ${city.city_name} (${all.length} articles):`);
      for (const c of all) {
        const img = c.hero_image_url ? " [IMG]" : "";
        console.log("    " + c.status.padEnd(20) + " " + c.title + img);
      }
    }
  }
  console.log("");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
