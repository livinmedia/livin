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

const TOPICS = [
  { keyword: "best coffee shops in Houston Texas", secondary: ["Houston coffee culture", "Houston cafes", "local coffee Houston", "specialty coffee Houston"], type: "article" as const },
  { keyword: "best parks in Houston Texas", secondary: ["Houston outdoors", "Houston green spaces", "Houston nature", "Houston trails"], type: "article" as const },
  { keyword: "Houston Texas nightlife guide", secondary: ["Houston bars", "Houston clubs", "Houston live music", "Houston entertainment"], type: "guide" as const },
  { keyword: "best food trucks in Houston Texas", secondary: ["Houston street food", "Houston food scene", "Houston cheap eats", "Houston food culture"], type: "article" as const },
  { keyword: "family activities in Houston Texas", secondary: ["Houston kids", "Houston family fun", "Houston museums for kids", "Houston zoo"], type: "guide" as const },
];

async function research(keyword: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek/deepseek-chat", messages: [{ role: "user", content: "Research notes for a blog about " + keyword + ". Include 5-8 specific places with details, neighborhoods, current facts. Structured notes, 400-600 words." }], max_tokens: 1200, temperature: 0.4 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Walk state machine: queued -> ... -> awaiting_approval
async function walkToAwaitingApproval(id: string): Promise<boolean> {
  const states = ["generating", "confirming", "confirmed", "seo_optimized", "linked", "awaiting_approval"];
  for (const status of states) {
    const { error } = await supabase.from("content_records").update({ status }).eq("id", id);
    if (error) { console.log("    State machine error at " + status + ": " + error.message); return false; }
    await new Promise(r => setTimeout(r, 200));
  }
  return true;
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  HOUSTON CONTENT BATCH — 5 Articles + Images");
  console.log("  All via OpenRouter (DeepSeek V3.2 + Gemini)");
  console.log("  Target: Supabase -> awaiting_approval -> MM Dashboard");
  console.log("=".repeat(60) + "\n");

  let successCount = 0;

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    console.log("\n" + "~".repeat(60));
    console.log("Article " + (i + 1) + "/5: " + topic.keyword);
    console.log("~".repeat(60));

    try {
      // Check if slug already exists
      const expectedSlug = topic.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
      const { data: existing } = await supabase.from("content_records").select("id").eq("slug", expectedSlug).eq("city_id", HOUSTON_CITY_ID).limit(1);
      if (existing && existing.length > 0) {
        console.log("  SKIP — article with similar slug already exists");
        continue;
      }

      // Research
      console.log("  [1] Researching...");
      const researchText = await research(topic.keyword);
      console.log("    " + researchText.length + " chars");

      // Generate article
      console.log("  [2] Generating article (DeepSeek V3.2)...");
      const brief: ContentBrief = {
        city_id: HOUSTON_CITY_ID, city_slug: "houston-texas", city_name: "Houston", state_name: "Texas",
        content_type: topic.type, brand: "livin", primary_keyword: topic.keyword,
        secondary_keywords: topic.secondary, min_word_count: 800,
        research: { raw: researchText, city_name: "Houston", state_name: "Texas", fetched_at: new Date().toISOString() },
        market_mayor: { mm_id: MM_ID, mm_name: MM_NAME, personalization_prompt: MM_PROMPT },
      };
      const article = await generateSEOBlogPost(brief);
      console.log("    Title: " + article.title);
      console.log("    Words: " + article.word_count + " | Sections: " + article.body_json.sections.length);

      // Generate hero image
      console.log("  [3] Generating hero image (Gemini)...");
      const image = await generateHeroImage(article.title, "Houston", topic.type);
      let imageUrl: string | null = null;
      if (image) {
        // Upload to Supabase Storage
        const imgFilename = article.slug + ".png";
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("content-images")
          .upload("houston/" + imgFilename, image.imageData, { contentType: image.mimeType, upsert: true });
        if (uploadErr) {
          console.log("    Image upload failed: " + uploadErr.message + " (continuing without image)");
        } else {
          const { data: urlData } = supabase.storage.from("content-images").getPublicUrl("houston/" + imgFilename);
          imageUrl = urlData.publicUrl;
          console.log("    Image uploaded: " + (image.imageData.length / 1024).toFixed(0) + "KB");
        }
      } else {
        console.log("    Image generation failed (continuing without image)");
      }

      // Write to Supabase
      console.log("  [4] Writing to Supabase...");
      const record = toSupabaseRecord(article);
      delete (record as Record<string, unknown>).author_mm_id;
      const insertPayload = {
        ...record,
        city_id: HOUSTON_CITY_ID,
        status: "queued",
        author_entity_type: "mm",
        og_image_url: imageUrl,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("content_records")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertErr) {
        console.log("    INSERT failed: " + insertErr.message);
        continue;
      }

      console.log("    Inserted: " + inserted.id);

      // Walk state machine to awaiting_approval
      console.log("  [5] Walking state machine to awaiting_approval...");
      const walked = await walkToAwaitingApproval(inserted.id);
      if (walked) {
        console.log("    Status: awaiting_approval — ready for MM review");
        successCount++;
      }

    } catch (err) {
      console.log("  ERROR: " + (err instanceof Error ? err.message : String(err)));
    }

    // Pause between articles
    if (i < TOPICS.length - 1) {
      console.log("  Pausing 3s...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("  BATCH COMPLETE");
  console.log("=".repeat(60));
  console.log("  Articles generated: " + successCount + "/5");
  console.log("  Status: awaiting_approval (ready for MM dashboard)");
  console.log("  MM login: marcus@livin.in / LivinHouston2026!");
  console.log("  Dashboard: localhost:3000/dashboard");

  // Show what's in the DB now
  const { data: allContent } = await supabase
    .from("content_records")
    .select("title, slug, status, og_image_url")
    .eq("city_id", HOUSTON_CITY_ID)
    .order("created_at", { ascending: false })
    .limit(10);

  if (allContent) {
    console.log("\n  Houston content_records:");
    for (const c of allContent) {
      const img = c.og_image_url ? " [IMG]" : "";
      console.log("    " + c.status.padEnd(20) + " " + c.title + img);
    }
  }
  console.log("");
}
main().catch(e => { console.error("Fatal:", e); process.exit(1); });
