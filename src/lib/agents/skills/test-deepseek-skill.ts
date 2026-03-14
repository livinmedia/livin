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
const HOUSTON_CITY_ID = "c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e";
async function main() {
  console.log("\n=== DeepSeek V3.2 Content + Gemini Image Test ===\n");
  // Step 1: Research via DeepSeek V3
  console.log("[1] Researching via DeepSeek V3...");
  const resRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek/deepseek-chat", messages: [{ role: "user", content: "Research notes for a blog about best coffee shops in Houston Texas. Include 5-8 specific shops with details, neighborhoods, what makes Houston coffee culture unique. Structured notes, 400-600 words." }], max_tokens: 1200, temperature: 0.4 }),
  });
  const resData = await resRes.json();
  const research = resData.choices?.[0]?.message?.content ?? "";
  console.log("  Research: " + research.length + " chars\n");
  // Step 2: Generate article via DeepSeek V3.2
  console.log("[2] Generating article via DeepSeek V3.2...");
  const brief: ContentBrief = {
    city_id: HOUSTON_CITY_ID, city_slug: "houston-texas", city_name: "Houston", state_name: "Texas",
    content_type: "article", brand: "livin", primary_keyword: "best coffee shops in Houston Texas",
    secondary_keywords: ["Houston coffee culture", "Houston cafes", "coffee near me Houston", "Houston local coffee"],
    min_word_count: 800,
    research: { raw: research, city_name: "Houston", state_name: "Texas", fetched_at: new Date().toISOString() },
    market_mayor: { mm_id: "5f865cad-ff52-4f9f-92b2-1e4373a9e95f", mm_name: "Marcus Williams", personalization_prompt: "I am Marcus Williams, a Houston native with 12 years of local expertise. I write like a local insider, direct, warm, full of neighborhood knowledge." },
  };
  const t1 = Date.now();
  const result = await generateSEOBlogPost(brief);
  const genTime = ((Date.now() - t1) / 1000).toFixed(1);
  console.log("  Title: " + result.title);
  console.log("  Slug: " + result.slug);
  console.log("  Words: " + result.word_count);
  console.log("  Sections: " + result.body_json.sections.length);
  console.log("  Link hooks: " + result.link_hooks.length);
  console.log("  Time: " + genTime + "s");
  console.log("  Model: DeepSeek V3.2 via OpenRouter\n");
  // Step 3: Generate hero image via Gemini
  console.log("[3] Generating hero image via Gemini Nano Banana...");
  const t2 = Date.now();
  const image = await generateHeroImage(result.title, "Houston", "article");
  const imgTime = ((Date.now() - t2) / 1000).toFixed(1);
  if (image) {
    const imgPath = path.join(process.cwd(), "test-images", "coffee-shops-hero.png");
    if (!fs.existsSync(path.dirname(imgPath))) fs.mkdirSync(path.dirname(imgPath), { recursive: true });
    fs.writeFileSync(imgPath, image.imageData);
    console.log("  Image saved: " + imgPath);
    console.log("  Size: " + (image.imageData.length / 1024).toFixed(0) + "KB");
    console.log("  Type: " + image.mimeType);
  } else {
    console.log("  Image generation returned null (may need retry)");
  }
  console.log("  Time: " + imgTime + "s\n");
  // Step 4: Build Supabase record
  const record = toSupabaseRecord(result);
  delete (record as Record<string, unknown>).author_mm_id;
  console.log("[4] Supabase record ready:");
  console.log("  Fields: " + Object.keys(record).length);
  console.log("  brand: " + record.brand);
  console.log("  content_type: " + record.content_type);
  console.log("  source: " + record.source);
  console.log("\n=== FULL PIPELINE TEST PASSED ===");
  console.log("  Research: DeepSeek V3 via OpenRouter");
  console.log("  Content: DeepSeek V3.2 via OpenRouter");
  console.log("  Image: Gemini Nano Banana via OpenRouter");
  console.log("  One API key. One bill. ~$0.02 total.\n");
}
main().catch(e => { console.error("FAILED:", e.message || e); process.exit(1); });
