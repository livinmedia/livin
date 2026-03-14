/**
 * Generate a hero image for a city page and store URL in metadata.
 * Usage: npx tsx src/lib/agents/skills/generate-city-hero.ts
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) { dotenv.config({ path: envTestPath }); } else { dotenv.config({ path: envLocalPath }); }

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function generateCityHero(citySlug: string, cityName: string, stateName: string): Promise<void> {
  console.log(`\nGenerating hero image for ${cityName}, ${stateName}...`);

  const prompt = `Stunning aerial cityscape photograph of ${cityName}, ${stateName}. ` +
    `Golden hour lighting, dramatic skyline, warm tones, cinematic wide-angle composition. ` +
    `Editorial magazine quality, vibrant city atmosphere, iconic landmarks visible. ` +
    `Professional photography, 16:9 aspect ratio, hyperrealistic. ` +
    `No text, no words, no watermarks, no captions, no titles, no overlays.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "LIVIN City Hero",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image"],
      image_config: { aspect_ratio: "16:9" },
    }),
  });

  if (!response.ok) {
    console.log("  API error: " + response.status);
    return;
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;

  let imageData: Buffer | null = null;
  let mimeType = "image/png";

  if (message?.images && Array.isArray(message.images)) {
    for (const img of message.images) {
      if (img.type === "image_url" && img.image_url?.url?.startsWith("data:image")) {
        const parts = img.image_url.url.split(",");
        const mimeMatch = parts[0].match(/data:(image\/[^;]+);/);
        mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        imageData = Buffer.from(parts[1], "base64");
        break;
      }
    }
  }

  if (!imageData) {
    console.log("  No image data in response");
    return;
  }

  console.log(`  Image generated: ${(imageData.length / 1024).toFixed(0)}KB`);

  // Upload
  const filename = `cities/${citySlug}.png`;
  const { error: uploadErr } = await supabase.storage
    .from("content-images")
    .upload(filename, imageData, { contentType: mimeType, upsert: true });

  if (uploadErr) {
    console.log("  Upload error: " + uploadErr.message);
    return;
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content-images/${filename}`;
  console.log("  Uploaded: " + imageUrl);

  // Update city metadata
  const { data: city } = await supabase
    .from("cities")
    .select("metadata")
    .eq("slug", citySlug)
    .single();

  const metadata = { ...(city?.metadata || {}), hero_image_url: imageUrl };
  const { error: updateErr } = await supabase
    .from("cities")
    .update({ metadata })
    .eq("slug", citySlug);

  if (updateErr) {
    console.log("  Metadata update error: " + updateErr.message);
  } else {
    console.log("  City metadata updated with hero_image_url");
  }
}

generateCityHero("houston-texas", "Houston", "Texas").catch(console.error);
