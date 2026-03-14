/**
 * Generate hero images for all 8 Houston articles using Gemini via OpenRouter,
 * upload to Supabase Storage, and update content_records.
 *
 * Usage: npx tsx src/lib/agents/skills/generate-hero-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ARTICLES = [
  {
    id: "5595125a-4fc9-4b19-b768-2c0fb9429b18",
    slug: "5-best-tacos-in-houston-texas",
    prompt:
      "vibrant Houston street tacos on a plate, warm lighting, colorful Mexican food photography, no text no words no letters no watermarks",
  },
  {
    id: "bc5cc9c2-8217-4c9a-ad70-2733840902a5",
    slug: "best-brunch-spots-in-houston-texas",
    prompt:
      "beautiful brunch table setting Houston restaurant, eggs benedict mimosas, warm morning light, no text no words no letters no watermarks",
  },
  {
    id: "56be174d-e71c-4251-9f1b-6634e175f7c1",
    slug: "best-coffee-shops-houston-texas-guide",
    prompt:
      "cozy Houston coffee shop interior, latte art, warm wood tones, urban cafe atmosphere, no text no words no letters no watermarks",
  },
  {
    id: "c777c7d4-36d1-4020-8649-b96e77673ec4",
    slug: "best-food-trucks-houston-texas",
    prompt:
      "colorful Houston food truck park, vibrant street food scene, outdoor dining, no text no words no letters no watermarks",
  },
  {
    id: "2440f251-88a2-42c4-aaa7-c76d043a4be5",
    slug: "best-parks-in-houston-texas",
    prompt:
      "lush green Houston park landscape, Buffalo Bayou trails, skyline in background, golden hour, no text no words no letters no watermarks",
  },
  {
    id: "8fe7f443-6bbd-4cdb-8275-034c742e7e8b",
    slug: "best-things-to-do-in-houston-texas-live",
    prompt:
      "Houston skyline cityscape, vibrant downtown, Space Center area, dynamic urban energy, no text no words no letters no watermarks",
  },
  {
    id: "d9b9a709-c777-432a-906a-51b50e2b55df",
    slug: "family-activities-houston-texas-guide",
    prompt:
      "happy family at Houston museum district, children exploring, bright colorful exhibits, no text no words no letters no watermarks",
  },
  {
    id: "3c467372-ab26-44ee-b8f3-683e3c88b1f6",
    slug: "houston-texas-nightlife-guide",
    prompt:
      "Houston downtown nightlife scene, neon lights, vibrant bars and restaurants, evening city energy, no text no words no letters no watermarks",
  },
];

async function generateImage(prompt: string): Promise<Buffer> {
  console.log("  Calling OpenRouter Gemini image generation...");
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: "Generate a photograph: " + prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error("No choices in response");

  // Extract base64 image — OpenRouter returns images in message.images array
  const message = choice.message;
  let base64Data: string | null = null;

  // Primary: message.images[].image_url.url (data:image/...;base64,...)
  if (Array.isArray(message?.images)) {
    for (const img of message.images) {
      if (img.image_url?.url) {
        const match = img.image_url.url.match(
          /^data:image\/[^;]+;base64,(.+)$/
        );
        if (match) {
          base64Data = match[1];
          break;
        }
      }
    }
  }

  // Fallback: check content array (older format)
  if (!base64Data && Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const match = part.image_url.url.match(
          /^data:image\/[^;]+;base64,(.+)$/
        );
        if (match) {
          base64Data = match[1];
          break;
        }
      }
    }
  }

  if (!base64Data) {
    const keys = Object.keys(message || {});
    console.log("  Message keys:", keys);
    throw new Error("Could not extract base64 image data from response");
  }

  return Buffer.from(base64Data, "base64");
}

async function uploadToStorage(
  slug: string,
  imageBuffer: Buffer
): Promise<string> {
  console.log(`  Uploading to content-images/articles/${slug}.png ...`);
  const { data, error } = await supabaseAdmin.storage
    .from("content-images")
    .upload(`articles/${slug}.png`, imageBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/content-images/articles/${slug}.png`;
  return publicUrl;
}

async function updateContentRecord(id: string, imageUrl: string) {
  const { error } = await supabaseAdmin
    .from("content_records")
    .update({
      hero_image_url: imageUrl,
      og_image_url: imageUrl,
    })
    .eq("id", id);

  if (error)
    throw new Error(`DB update error for ${id}: ${error.message}`);
}

async function main() {
  console.log("=== LIVIN Hero Image Generator ===\n");
  console.log(`Processing ${ARTICLES.length} articles...\n`);

  let success = 0;
  let failed = 0;

  for (const article of ARTICLES) {
    console.log(`[${success + failed + 1}/${ARTICLES.length}] ${article.slug}`);
    try {
      const imageBuffer = await generateImage(article.prompt);
      console.log(`  Generated image: ${imageBuffer.length} bytes`);

      const publicUrl = await uploadToStorage(article.slug, imageBuffer);
      console.log(`  Uploaded: ${publicUrl}`);

      await updateContentRecord(article.id, publicUrl);
      console.log(`  Updated content_record ✓\n`);
      success++;
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}\n`);
      failed++;
    }

    // Rate limit pause between generations
    if (success + failed < ARTICLES.length) {
      console.log("  Waiting 3 seconds...\n");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n=== Done: ${success} succeeded, ${failed} failed ===`);

  // Verify
  const { data: verified } = await supabaseAdmin
    .from("content_records")
    .select("title, og_image_url")
    .not("og_image_url", "is", null);

  console.log(`\nVerification: ${verified?.length || 0} articles have images:`);
  verified?.forEach((r) => console.log(`  - ${r.title}: ${r.og_image_url}`));
}

main().catch(console.error);
