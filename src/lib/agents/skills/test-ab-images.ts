import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) { dotenv.config({ path: envTestPath }); }
else { dotenv.config({ path: envLocalPath }); }
const KEY = process.env.OPENROUTER_API_KEY!;
if (!KEY) { console.error("Missing OPENROUTER_API_KEY"); process.exit(1); }
const DIR = path.join(process.cwd(), "test-images");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const TOPICS = [
  { article: "Best Restaurants in Houston", prompt: "Editorial food photography, vibrant Houston restaurant scene, warm golden lighting, diverse cuisine on rustic table, magazine quality, lifestyle, warm colors, shallow depth of field" },
  { article: "Things to Do in Houston", prompt: "Houston skyline at golden hour, Discovery Green park, warm sunset, editorial lifestyle photography, cinematic wide shot, vibrant city energy, magazine cover" },
  { article: "Best Neighborhoods in Houston", prompt: "Tree-lined Houston Heights street, Victorian homes, warm afternoon sunlight, people walking dogs, lush lawns, editorial photography, inviting community, magazine quality" },
  { article: "Houston Hidden Gems", prompt: "Colorful Houston street art mural in East End, local coffee shop, eclectic decor, warm natural light, authentic atmosphere, editorial lifestyle, vibrant colors, insider vibe" },
  { article: "Moving to Houston Guide", prompt: "Young couple exploring Houston downtown, Buffalo Bayou Park, warm welcoming atmosphere, diverse cityscape, editorial lifestyle, hopeful mood, magazine quality" },
];
const MODELS = [
  { name: "Gemini Nano Banana", model: "google/gemini-2.5-flash-image", cost: 0.01 },
  { name: "Seedream 4.5", model: "bytedance-seed/seedream-4.5", cost: 0.04 },
  { name: "Sourceful Riverflow", model: "sourceful/riverflow-v2-fast", cost: 0.02 },
];
function extractImage(msg: any): Buffer | null {
  if (!msg) return null;
  // OpenRouter returns images as: images: [{ type: "image_url", image_url: { url: "data:image/png;base64,..." } }]
  if (msg.images && Array.isArray(msg.images)) {
    for (const img of msg.images) {
      // Nested image_url object format
      if (img.type === "image_url" && img.image_url?.url) {
        if (img.image_url.url.startsWith("data:image")) {
          return Buffer.from(img.image_url.url.split(",")[1], "base64");
        }
        if (img.image_url.url.startsWith("http")) {
          return null; // would need async fetch, handle below
        }
      }
      // Direct base64 string
      if (typeof img === "string" && img.startsWith("data:image")) {
        return Buffer.from(img.split(",")[1], "base64");
      }
      // Object with base64/b64_json/url keys
      if (img.base64) return Buffer.from(img.base64, "base64");
      if (img.b64_json) return Buffer.from(img.b64_json, "base64");
    }
  }
  // Content blocks
  if (Array.isArray(msg.content)) {
    for (const b of msg.content) {
      if (b.type === "image_url" && b.image_url?.url?.startsWith("data:image")) {
        return Buffer.from(b.image_url.url.split(",")[1], "base64");
      }
    }
  }
  return null;
}
async function extractImageAsync(msg: any): Promise<Buffer | null> {
  // Try sync first
  const sync = extractImage(msg);
  if (sync) return sync;
  // Try fetching URLs
  if (msg?.images && Array.isArray(msg.images)) {
    for (const img of msg.images) {
      if (img.type === "image_url" && img.image_url?.url?.startsWith("http")) {
        const r = await fetch(img.image_url.url);
        return Buffer.from(await r.arrayBuffer());
      }
      if (typeof img === "string" && img.startsWith("http")) {
        const r = await fetch(img);
        return Buffer.from(await r.arrayBuffer());
      }
      if (img.url) {
        const r = await fetch(img.url);
        return Buffer.from(await r.arrayBuffer());
      }
    }
  }
  return null;
}
async function gen(model: string, prompt: string, filename: string): Promise<{ok: boolean; ms: number; size: number; err?: string}> {
  const t = Date.now();
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json", "X-Title": "LIVIN Image Test" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "Generate an image: " + prompt }], modalities: ["image"], image_config: { aspect_ratio: "16:9" } }),
    });
    const ms = Date.now() - t;
    if (!r.ok) { const e = await r.text(); return { ok: false, ms, size: 0, err: "HTTP " + r.status + ": " + e.substring(0, 200) }; }
    const d = await r.json();
    const msg = d.choices?.[0]?.message;
    const buf = await extractImageAsync(msg);
    if (buf && buf.length > 500) {
      const ext = buf[0]===0x89?".png":buf[0]===0xFF?".jpg":".webp";
      const fn = filename.replace(".png", ext);
      fs.writeFileSync(path.join(DIR, fn), buf);
      return { ok: true, ms, size: buf.length };
    }
    // Debug output
    const imgPreview = JSON.stringify(msg?.images?.[0])?.substring(0, 80) || "null";
    return { ok: false, ms, size: 0, err: "Extract failed. images[0]: " + imgPreview };
  } catch (e) { return { ok: false, ms: Date.now()-t, size: 0, err: e instanceof Error ? e.message : String(e) }; }
}
async function main() {
  console.log("\n" + "=".repeat(65));
  console.log("  IMAGE A/B TEST via OpenRouter (v2 - fixed extraction)");
  console.log("  Gemini Nano Banana vs Seedream 4.5 vs Sourceful Riverflow");
  console.log("  5 Topics x 3 Models = 15 Images");
  console.log("  Output: " + DIR);
  console.log("=".repeat(65) + "\n");
  const results: {topic:string;model:string;ok:boolean;ms:number;size:number;cost:number;err?:string}[] = [];
  for (let i = 0; i < TOPICS.length; i++) {
    console.log("\n" + "~".repeat(65));
    console.log("Topic " + (i+1) + "/5: " + TOPICS[i].article);
    console.log("~".repeat(65));
    for (const m of MODELS) {
      const slug = TOPICS[i].article.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const mslug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const fn = slug + "--" + mslug + ".png";
      console.log("  [" + m.name + "] generating...");
      const r = await gen(m.model, TOPICS[i].prompt, fn);
      results.push({ topic: TOPICS[i].article, model: m.name, ok: r.ok, ms: r.ms, size: r.size, cost: m.cost, err: r.err });
      if (r.ok) console.log("  [" + m.name + "] OK | " + (r.ms/1000).toFixed(1) + "s | ~$" + m.cost + " | " + (r.size/1024).toFixed(0) + "KB");
      else console.log("  [" + m.name + "] FAIL | " + (r.ms/1000).toFixed(1) + "s | " + (r.err||"").substring(0,150));
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  console.log("\n\n" + "=".repeat(65));
  console.log("  RESULTS");
  console.log("=".repeat(65));
  for (const m of MODELS) {
    const mr = results.filter(r => r.model === m.name);
    const ok = mr.filter(r => r.ok);
    const avg = ok.length ? ok.reduce((a,b)=>a+b.ms,0)/ok.length/1000 : 0;
    const avgSize = ok.length ? ok.reduce((a,b)=>a+b.size,0)/ok.length/1024 : 0;
    console.log("\n  " + m.name.toUpperCase() + ":");
    console.log("    Success:    " + ok.length + "/5");
    console.log("    Avg Speed:  " + avg.toFixed(1) + "s");
    console.log("    Avg Size:   " + avgSize.toFixed(0) + "KB");
    console.log("    Cost/img:   $" + m.cost);
    console.log("    2K imgs/mo: $" + (m.cost*2000).toFixed(0));
  }
  console.log("\n  FULL PIPELINE (text + images, 2K/mo):");
  for (const m of MODELS) console.log("  DeepSeek V3.2 + " + m.name + ": $" + (5 + m.cost*2000).toFixed(0) + "/mo");
  console.log("\n  One API key. One bill. Images in: " + DIR + "\n");
}
main().catch(e => { console.error("Fatal:", e); process.exit(1); });
