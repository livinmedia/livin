/**
 * Batch generate 20 new Houston articles with hero images.
 * Uses existing seo-blog-post.skill.ts pipeline.
 *
 * Usage: npx tsx src/lib/agents/skills/batch-houston-20.ts
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
const HOUSTON_CITY_ID = "c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e";
const MM_ID = "5f865cad-ff52-4f9f-92b2-1e4373a9e95f";
const MM_NAME = "Marcus Williams";
const MM_PROMPT = "I am Marcus Williams, a Houston native and licensed real estate agent with 12 years of experience. I grew up in the Third Ward and know every corner of this city. I write like a local insider, direct, warm, and full of neighborhood-specific knowledge.";

interface Topic {
  keyword: string;
  secondary: string[];
  type: "article" | "guide" | "neighborhood_profile" | "relocation_guide";
}

const TOPICS: Topic[] = [
  // FOOD & DRINK (5)
  { keyword: "best barbecue in Houston Texas", secondary: ["Houston BBQ", "Houston smokehouses", "Houston pitmasters", "Texas barbecue Houston"], type: "article" },
  { keyword: "top rooftop bars in Houston Texas", secondary: ["Houston rooftop cocktails", "Houston skyline bars", "Houston views drinks", "Houston rooftop lounges"], type: "article" },
  { keyword: "best seafood restaurants in Houston Texas", secondary: ["Houston seafood", "Houston Gulf Coast dining", "Houston oyster bars", "Houston fish restaurants"], type: "article" },
  { keyword: "Houston Texas happy hour guide", secondary: ["Houston after work drinks", "Houston happy hour deals", "Houston bars specials", "Houston cocktail hour"], type: "guide" },
  { keyword: "best vegan and vegetarian restaurants in Houston Texas", secondary: ["Houston plant-based dining", "Houston vegan food", "Houston vegetarian restaurants", "Houston healthy eating"], type: "article" },
  // NEIGHBORHOODS (4)
  { keyword: "Montrose Houston Texas neighborhood guide", secondary: ["Montrose restaurants", "Montrose nightlife", "Montrose culture", "Montrose Houston things to do"], type: "neighborhood_profile" },
  { keyword: "The Heights Houston Texas neighborhood guide", secondary: ["Heights restaurants", "Heights shopping", "Heights Houston history", "Heights walkable streets"], type: "neighborhood_profile" },
  { keyword: "Midtown Houston Texas living dining nightlife", secondary: ["Midtown Houston bars", "Midtown Houston apartments", "Midtown Houston restaurants", "Midtown Houston walkable"], type: "neighborhood_profile" },
  { keyword: "EaDo Houston Texas East Downtown guide", secondary: ["EaDo Houston restaurants", "EaDo Houston breweries", "East Downtown Houston", "EaDo Houston art scene"], type: "neighborhood_profile" },
  // OUTDOORS & ACTIVITIES (4)
  { keyword: "Buffalo Bayou Park Houston trails kayaking events", secondary: ["Buffalo Bayou Houston", "Houston kayaking", "Houston urban trails", "Buffalo Bayou events"], type: "guide" },
  { keyword: "best hiking and nature trails near Houston Texas", secondary: ["Houston hiking", "Houston nature", "Houston outdoor trails", "day hikes near Houston"], type: "guide" },
  { keyword: "Houston Texas farmers markets fresh local weekly", secondary: ["Houston farmers market", "Houston local produce", "Houston weekend markets", "Houston organic food"], type: "guide" },
  { keyword: "best dog parks in Houston Texas", secondary: ["Houston dog parks", "Houston off-leash parks", "Houston pet-friendly", "Houston dogs outdoors"], type: "article" },
  // CULTURE & ENTERTAINMENT (4)
  { keyword: "Houston Museum District guide art science history", secondary: ["Houston museums", "Houston Museum of Fine Arts", "Houston Natural Science Museum", "Houston cultural attractions"], type: "guide" },
  { keyword: "best live music venues in Houston Texas", secondary: ["Houston live music", "Houston concert halls", "Houston music scene", "Houston bands venues"], type: "article" },
  { keyword: "Houston Texas street art and murals self-guided tour", secondary: ["Houston murals", "Houston street art", "Houston graffiti art", "Houston art walks"], type: "guide" },
  { keyword: "Houston Space Center and NASA visitors guide", secondary: ["NASA Houston", "Space Center Houston", "Houston space tourism", "Johnson Space Center tours"], type: "guide" },
  // LIFESTYLE & RELOCATION (3)
  { keyword: "moving to Houston Texas relocation guide", secondary: ["relocating to Houston", "Houston neighborhoods for newcomers", "Houston cost of living", "Houston new residents guide"], type: "relocation_guide" },
  { keyword: "best gyms and fitness studios in Houston Texas", secondary: ["Houston gyms", "Houston fitness classes", "Houston CrossFit yoga", "Houston workout spots"], type: "article" },
  { keyword: "Houston Texas date night ideas romantic spots", secondary: ["Houston date night", "Houston romantic restaurants", "Houston couples activities", "Houston date ideas"], type: "article" },
];

async function research(keyword: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: "Research notes for a blog about " + keyword + " in Houston, Texas. Include 5-8 specific places with addresses or neighborhoods, current facts, local tips, and insider details. Structured notes, 400-600 words." }],
      max_tokens: 1200,
      temperature: 0.4,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function walkToAwaitingApproval(id: string): Promise<boolean> {
  const states = ["generating", "confirming", "confirmed", "seo_optimized", "linked", "awaiting_approval"];
  for (const status of states) {
    const { error } = await supabase.from("content_records").update({ status }).eq("id", id);
    if (error) { console.log("    State machine error at " + status + ": " + error.message); return false; }
    await new Promise(r => setTimeout(r, 200));
  }
  return true;
}

async function processArticle(topic: Topic, index: number, total: number): Promise<boolean> {
  console.log(`\n${"~".repeat(60)}`);
  console.log(`Article ${index + 1}/${total}: ${topic.keyword}`);
  console.log("~".repeat(60));

  try {
    // Check for duplicate
    const expectedSlug = topic.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
    const { data: existing } = await supabase.from("content_records").select("id").eq("slug", expectedSlug).eq("city_id", HOUSTON_CITY_ID).limit(1);
    if (existing && existing.length > 0) {
      console.log("  SKIP — article with similar slug already exists");
      return false;
    }

    // 1. Research
    console.log("  [1] Researching (DeepSeek V3)...");
    const researchText = await research(topic.keyword);
    console.log("    " + researchText.length + " chars");

    // 2. Generate article
    console.log("  [2] Generating article (DeepSeek V3.2)...");
    const brief: ContentBrief = {
      city_id: HOUSTON_CITY_ID, city_slug: "houston-texas", city_name: "Houston", state_name: "Texas",
      content_type: topic.type === "neighborhood_profile" ? "guide" : topic.type === "relocation_guide" ? "guide" : topic.type,
      brand: "livin", primary_keyword: topic.keyword,
      secondary_keywords: topic.secondary, min_word_count: 1200,
      research: { raw: researchText, city_name: "Houston", state_name: "Texas", fetched_at: new Date().toISOString() },
      market_mayor: { mm_id: MM_ID, mm_name: MM_NAME, personalization_prompt: MM_PROMPT },
    };
    const article = await generateSEOBlogPost(brief);
    console.log("    Title: " + article.title);
    console.log("    Words: " + article.word_count + " | Sections: " + article.body_json.sections.length);

    // 3. Generate hero image
    console.log("  [3] Generating hero image (Gemini)...");
    const image = await generateHeroImage(article.title, "Houston", topic.type);
    let imageUrl: string | null = null;
    if (image) {
      const imgFilename = article.slug + ".png";
      const { error: uploadErr } = await supabase.storage
        .from("content-images")
        .upload("articles/" + imgFilename, image.imageData, { contentType: image.mimeType, upsert: true });
      if (uploadErr) {
        console.log("    Image upload failed: " + uploadErr.message + " (continuing without image)");
      } else {
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content-images/articles/${imgFilename}`;
        console.log("    Image uploaded: " + (image.imageData.length / 1024).toFixed(0) + "KB");
      }
    } else {
      console.log("    Image generation failed (continuing without image)");
    }

    // 4. Insert to Supabase
    console.log("  [4] Writing to Supabase...");
    const record = toSupabaseRecord(article);
    delete (record as Record<string, unknown>).author_mm_id;
    const insertPayload = {
      ...record,
      city_id: HOUSTON_CITY_ID,
      status: "queued",
      author_entity_type: "mm",
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

    // 5. Walk state machine
    console.log("  [5] Walking state machine to awaiting_approval...");
    const walked = await walkToAwaitingApproval(inserted.id);
    if (walked) {
      console.log("    Status: awaiting_approval — ready for MM review");
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
  console.log("  HOUSTON BATCH 20 — New Articles + Hero Images");
  console.log("  DeepSeek V3 research → DeepSeek V3.2 content → Gemini images");
  console.log("  Target: awaiting_approval for MM Dashboard review");
  console.log("=".repeat(60) + "\n");

  const BATCH_SIZE = 5;
  let successCount = 0;
  let failCount = 0;

  for (let batch = 0; batch < Math.ceil(TOPICS.length / BATCH_SIZE); batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, TOPICS.length);
    const batchTopics = TOPICS.slice(start, end);

    console.log(`\n${"#".repeat(60)}`);
    console.log(`  BATCH ${batch + 1}/4 — Articles ${start + 1}-${end}`);
    console.log("#".repeat(60));

    for (let i = 0; i < batchTopics.length; i++) {
      const success = await processArticle(batchTopics[i], start + i, TOPICS.length);
      if (success) successCount++;
      else failCount++;

      // 3s pause between articles
      if (i < batchTopics.length - 1) {
        console.log("  Pausing 3s...");
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`\n  Generated ${successCount}/${TOPICS.length} so far...`);

    // 10s pause between batches
    if (batch < Math.ceil(TOPICS.length / BATCH_SIZE) - 1) {
      console.log("  Batch pause: 10s...\n");
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("  BATCH 20 COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Success: ${successCount}/${TOPICS.length}`);
  console.log(`  Failed:  ${failCount}/${TOPICS.length}`);

  // Final DB check
  const { data: allContent } = await supabase
    .from("content_records")
    .select("title, status, hero_image_url")
    .eq("city_id", HOUSTON_CITY_ID)
    .order("created_at", { ascending: false });

  if (allContent) {
    const published = allContent.filter(c => c.status === "published").length;
    const awaiting = allContent.filter(c => c.status === "awaiting_approval").length;
    const withImages = allContent.filter(c => c.hero_image_url).length;

    console.log(`\n  Total Houston articles: ${allContent.length}`);
    console.log(`  Published: ${published}`);
    console.log(`  Awaiting approval: ${awaiting}`);
    console.log(`  With hero images: ${withImages}`);
    console.log("\n  All articles:");
    for (const c of allContent) {
      const img = c.hero_image_url ? " [IMG]" : "";
      console.log("    " + c.status.padEnd(20) + " " + c.title + img);
    }
  }
  console.log("");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
