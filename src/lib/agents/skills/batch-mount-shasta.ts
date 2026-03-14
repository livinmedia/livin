/**
 * Batch generate 10 Mount Shasta CA articles with hero images.
 * Auto-approve and publish all that pass validation.
 *
 * Usage: npx tsx src/lib/agents/skills/batch-mount-shasta.ts
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
  { keyword: "things to do in Mount Shasta California", secondary: ["Mount Shasta activities", "Mount Shasta attractions", "Mount Shasta sightseeing"], type: "guide" },
  { keyword: "hiking Mount Shasta trails guide", secondary: ["Mount Shasta hiking", "Mount Shasta summit trail", "Bunny Flat trailhead", "Mount Shasta day hikes"], type: "guide" },
  { keyword: "Mount Shasta natural springs and swimming holes", secondary: ["Mount Shasta swimming", "Big Springs", "McCloud River falls", "Mount Shasta cold springs"], type: "guide" },
  { keyword: "spiritual and wellness retreats in Mount Shasta", secondary: ["Mount Shasta retreats", "Mount Shasta meditation", "Mount Shasta energy vortex", "Mount Shasta yoga"], type: "guide" },
  { keyword: "best restaurants in Mount Shasta California", secondary: ["Mount Shasta dining", "Mount Shasta food", "Mount Shasta cafes", "Mount Shasta local eats"], type: "article" },
  { keyword: "Mount Shasta winter activities and skiing", secondary: ["Mount Shasta ski park", "Mount Shasta snowboarding", "Mount Shasta winter sports", "Mount Shasta snow"], type: "guide" },
  { keyword: "camping near Mount Shasta California", secondary: ["Mount Shasta campgrounds", "Mount Shasta camping", "Castle Lake camping", "McCloud camping"], type: "guide" },
  { keyword: "Mount Shasta local arts and culture", secondary: ["Mount Shasta art galleries", "Mount Shasta festivals", "Mount Shasta community", "Mount Shasta creative scene"], type: "article" },
  { keyword: "Mount Shasta outdoor adventure guide", secondary: ["Mount Shasta kayaking", "Mount Shasta fishing", "Mount Shasta mountain biking", "Mount Shasta rock climbing"], type: "guide" },
  { keyword: "moving to Mount Shasta California guide", secondary: ["relocating to Mount Shasta", "Mount Shasta cost of living", "Mount Shasta lifestyle", "Mount Shasta community"], type: "guide" },
];

const MM_NAME = "LIVIN Editorial";
const MM_PROMPT = "As LIVIN Editorial, we cover Mount Shasta with reverence and wonder — a sacred mountain town where outdoor adventure meets spiritual energy. Crystal-clear springs, alpine trails, and a tight-knit community of artists, healers, and mountain lovers. We write with awe for the landscape and deep respect for the local way of life.";

async function research(keyword: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: `Research notes for a blog about "${keyword}" in Mount Shasta, California. Include 5-8 specific places, trails, or businesses with details, current facts, local tips, and insider knowledge. Structured notes, 400-600 words.` }],
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

async function ensureCity(): Promise<string> {
  const { data: existing } = await supabase.from("cities").select("id").eq("slug", "mount-shasta-california").limit(1);
  if (existing && existing.length > 0) {
    console.log(`  City "Mount Shasta" already exists: ${existing[0].id}`);
    return existing[0].id;
  }

  const { data: stateData } = await supabase.from("states_regions").select("id").eq("abbreviation", "CA").limit(1);
  if (!stateData || stateData.length === 0) throw new Error("State CA not found");

  const { data: city, error } = await supabase.from("cities").insert({
    name: "Mount Shasta",
    slug: "mount-shasta-california",
    state_region_id: stateData[0].id,
    population: 3300,
    is_active: true,
    is_top_100: false,
    content_status: "seeding",
  }).select("id").single();

  if (error) throw new Error("Failed to create city: " + error.message);
  console.log(`  Created city "Mount Shasta": ${city.id}`);
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
      city_id: cityId,
      city_slug: "mount-shasta-california",
      city_name: "Mount Shasta",
      state_name: "California",
      content_type: topic.type,
      brand: "livin",
      primary_keyword: topic.keyword,
      secondary_keywords: topic.secondary,
      min_word_count: 1200,
      research: { raw: researchText, city_name: "Mount Shasta", state_name: "California", fetched_at: new Date().toISOString() },
      market_mayor: { mm_id: "system", mm_name: MM_NAME, personalization_prompt: MM_PROMPT },
    };
    const article = await generateSEOBlogPost(brief);
    console.log("    Title: " + article.title);
    console.log("    Words: " + article.word_count + " | Sections: " + article.body_json.sections.length);

    console.log("  [3] Generating hero image...");
    const image = await generateHeroImage(article.title, "Mount Shasta", topic.type);
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
    const { data: inserted, error: insertErr } = await supabase
      .from("content_records")
      .insert({
        ...record,
        city_id: cityId,
        status: "queued",
        author_entity_type: "system",
        og_image_url: imageUrl,
        hero_image_url: imageUrl,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.log("    INSERT failed: " + insertErr.message);
      return false;
    }
    console.log("    Inserted: " + inserted.id);

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

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  MOUNT SHASTA CA — 10 Articles + Hero Images");
  console.log("  Auto-approve & publish all that pass");
  console.log("=".repeat(60));

  const cityId = await ensureCity();
  let success = 0, fail = 0;

  for (let i = 0; i < TOPICS.length; i++) {
    const ok = await processArticle(cityId, TOPICS[i], i);
    if (ok) success++; else fail++;
    if (i < TOPICS.length - 1) {
      console.log("  Pausing 3s...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("  MOUNT SHASTA BATCH COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Published: ${success}/${TOPICS.length}`);
  console.log(`  Failed:    ${fail}/${TOPICS.length}`);

  const { data: all } = await supabase
    .from("content_records")
    .select("title, status, hero_image_url")
    .eq("city_id", cityId)
    .order("created_at", { ascending: false });

  if (all) {
    console.log(`\n  Mount Shasta articles (${all.length}):`);
    for (const c of all) {
      const img = c.hero_image_url ? " [IMG]" : "";
      console.log("    " + c.status.padEnd(20) + " " + c.title + img);
    }
  }
  console.log("");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
