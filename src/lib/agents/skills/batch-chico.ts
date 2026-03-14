/**
 * Batch generate 10 Chico CA articles with hero images.
 * Auto-approve and publish all that pass validation.
 *
 * Usage: npx tsx src/lib/agents/skills/batch-chico.ts
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) { dotenv.config({ path: envTestPath }); } else { dotenv.config({ path: envLocalPath }); }
import { generateSEOBlogPost, generateHeroImage, toSupabaseRecord, ContentBrief } from "./seo-blog-post.skill.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface Topic {
  keyword: string;
  secondary: string[];
  type: "article" | "guide";
}

const TOPICS: Topic[] = [
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

const CITY_SLUG = "chico-california";
const CITY_NAME = "Chico";
const STATE_NAME = "California";
const MM_NAME = "LIVIN Editorial";
const MM_PROMPT = "As LIVIN Editorial, we cover Chico — a vibrant Northern California college town known for its craft beer scene, Bidwell Park, CSU Chico, and a laid-back lifestyle that blends outdoor adventure with small-city charm. We write with genuine enthusiasm for local culture, hidden gems, and the community spirit that makes Chico special.";

async function research(keyword: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: `Research notes for a blog about "${keyword}" in Chico, California. Include 5-8 specific places, businesses, or locations with details, current facts, local tips, and insider knowledge. Structured notes, 400-600 words.` }],
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

async function getCityId(): Promise<string> {
  const { data: existing } = await supabase.from("cities").select("id").eq("slug", CITY_SLUG).limit(1);
  if (existing && existing.length > 0) {
    console.log(`  City "${CITY_NAME}" exists: ${existing[0].id}`);
    return existing[0].id;
  }

  const { data: stateData } = await supabase.from("states_regions").select("id").eq("abbreviation", "CA").limit(1);
  if (!stateData || stateData.length === 0) throw new Error("State CA not found");

  const { data: city, error } = await supabase.from("cities").insert({
    name: CITY_NAME, slug: CITY_SLUG, state_region_id: stateData[0].id,
    population: 101000, is_active: true, is_top_100: true, content_status: "seeding",
  }).select("id").single();

  if (error) throw new Error("Failed to create city: " + error.message);
  console.log(`  Created city "${CITY_NAME}": ${city.id}`);
  return city.id;
}

async function processArticle(cityId: string, topic: Topic, index: number): Promise<boolean> {
  console.log(`\n${"~".repeat(60)}`);
  console.log(`Article ${index + 1}/${TOPICS.length}: ${topic.keyword}`);
  console.log("~".repeat(60));

  try {
    const expectedSlug = topic.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
    const { data: existing } = await supabase.from("content_records").select("id").eq("slug", expectedSlug).eq("city_id", cityId).limit(1);
    if (existing && existing.length > 0) {
      console.log("  SKIP — article already exists");
      return false;
    }

    console.log("  [1] Researching...");
    const researchText = await research(topic.keyword);
    console.log("    " + researchText.length + " chars");

    console.log("  [2] Generating article...");
    const brief: ContentBrief = {
      city_id: cityId, city_slug: CITY_SLUG, city_name: CITY_NAME, state_name: STATE_NAME,
      content_type: topic.type, brand: "livin",
      primary_keyword: topic.keyword, secondary_keywords: topic.secondary, min_word_count: 1200,
      research: { raw: researchText, city_name: CITY_NAME, state_name: STATE_NAME, fetched_at: new Date().toISOString() },
      market_mayor: { mm_id: "system", mm_name: MM_NAME, personalization_prompt: MM_PROMPT },
    };
    const article = await generateSEOBlogPost(brief);
    console.log("    Title: " + article.title);
    console.log("    Words: " + article.word_count + " | Sections: " + article.body_json.sections.length);

    console.log("  [3] Generating hero image...");
    const image = await generateHeroImage(article.title, CITY_NAME, topic.type);
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

    console.log("  [4] Writing to Supabase...");
    const record = toSupabaseRecord(article);
    delete (record as Record<string, unknown>).author_mm_id;
    const { data: inserted, error: insertErr } = await supabase.from("content_records")
      .insert({ ...record, city_id: cityId, status: "queued", author_entity_type: "system", og_image_url: imageUrl, hero_image_url: imageUrl })
      .select("id").single();

    if (insertErr) { console.log("    INSERT failed: " + insertErr.message); return false; }
    console.log("    Inserted: " + inserted.id);

    console.log("  [5] Auto-publishing...");
    const published = await walkToPublished(inserted.id);
    if (published) { console.log("    ✓ PUBLISHED"); return true; }
    return false;
  } catch (err) {
    console.log("  ERROR: " + (err instanceof Error ? err.message : String(err)));
    return false;
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  CHICO CA — 10 Articles + Hero Images");
  console.log("  Auto-approve & publish all that pass");
  console.log("=".repeat(60));

  const cityId = await getCityId();
  let success = 0, fail = 0;

  for (let i = 0; i < TOPICS.length; i++) {
    const ok = await processArticle(cityId, TOPICS[i], i);
    if (ok) success++; else fail++;
    if (i < TOPICS.length - 1) { console.log("  Pausing 3s..."); await new Promise(r => setTimeout(r, 3000)); }
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("  CHICO BATCH COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Published: ${success}/${TOPICS.length}`);
  console.log(`  Failed:    ${fail}/${TOPICS.length}`);

  const { data: all } = await supabase.from("content_records").select("title, status, hero_image_url")
    .eq("city_id", cityId).order("created_at", { ascending: false });
  if (all) {
    console.log(`\n  Chico articles (${all.length}):`);
    for (const c of all) { console.log("    " + c.status.padEnd(20) + " " + c.title + (c.hero_image_url ? " [IMG]" : "")); }
  }
  console.log("");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
