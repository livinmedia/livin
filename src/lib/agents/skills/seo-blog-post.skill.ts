/**
 * SEO Blog Post Agent Skill — DeepSeek V3.2 via OpenRouter
 * 
 * Updated from Claude Sonnet to DeepSeek V3.2 based on A/B test results:
 *   - DeepSeek V3.2 scored 91/100 vs Claude 95/100 (within 5 points)
 *   - 44x cheaper ($0.001/article vs $0.046/article)
 *   - All via OpenRouter — one API key, one bill
 *
 * Also includes Gemini Nano Banana hero image generation via OpenRouter.
 *
 * Pipeline: Research (DeepSeek V3) → Generate (DeepSeek V3.2) → Image (Gemini) → Supabase
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface ResearchPayload {
  raw: string;
  city_name: string;
  state_name: string;
  fetched_at: string;
}

export interface MarketMayorContext {
  mm_id: string;
  mm_name: string;
  personalization_prompt: string;
}

export interface ContentBrief {
  city_id: string;
  city_slug: string;
  city_name: string;
  state_name: string;
  content_type: "article" | "guide" | "market_insight" | "event_roundup" | "neighborhood_profile" | "vendor_feature" | "relocation_guide";
  brand: "livin" | "homes_and_livin";
  primary_keyword: string;
  secondary_keywords: string[];
  min_word_count: number;
  research: ResearchPayload;
  market_mayor: MarketMayorContext;
}

export interface BodyJsonSection {
  type: "h2" | "conclusion";
  heading: string;
  body: string;
}

export interface LinkHook {
  anchor_text: string;
  target_slug_hint: string;
  context: string;
}

export interface SkillOutput {
  title: string;
  h1: string;
  og_title: string;
  meta_description: string;
  slug: string;
  body_json: { sections: BodyJsonSection[] };
  link_hooks: LinkHook[];
  target_keywords: string[];
  word_count: number;
  // Mapped fields for Supabase
  city_id: string;
  brand: string;
  brand_tag: string;
  content_type: string;
  source: string;
  author_entity_type: string;
  author_mm_id: string;
  og_image_url?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const CONTENT_MODEL = "deepseek/deepseek-v3.2";
const IMAGE_MODEL = "google/gemini-2.5-flash-image";

// ── System Prompt Builder ──────────────────────────────────────────────────

function buildSystemPrompt(brief: ContentBrief): string {
  const brandVoiceRules = brief.brand === "livin"
    ? `BRAND: LIVIN (livin.in)
VOICE: Lifestyle, city culture, local discovery. Warm, curious, insider perspective.
HARD RULES:
- NEVER mention property listings with prices, MLS numbers, or "homes for sale" as article focus
- NEVER mention "Listing Power Teams" or "LPT recruiting"
- Content celebrates city life: food, neighborhoods, culture, events, community
- Casual real estate mentions are fine (MMs are real estate professionals)`
    : `BRAND: Homes & Livin (homesandlivin.in)
VOICE: Real estate expertise, local market knowledge, trustworthy agent perspective.
HARD RULES:
- NEVER mention "Listing Power Teams" or "LPT" by name
- Content focuses on real estate, neighborhoods, market trends, home buying/selling
- The Market Mayor is positioned as the local real estate expert`;

  return `You are the City Content Builder Agent for the LIVIN platform.
Generate SEO-optimized, city-specific lifestyle content in the voice of a Market Mayor.

${brandVoiceRules}

MARKET MAYOR VOICE:
You are writing AS ${brief.market_mayor.mm_name}, the Market Mayor for ${brief.city_name}, ${brief.state_name}.
Their voice and persona: ${brief.market_mayor.personalization_prompt}
Write in first person where natural. Sound like a local expert, not a content farm.

SEO RULES:
- Primary keyword: "${brief.primary_keyword}"
- This keyword MUST appear in: title, h1, meta_description, AND within the first 100 words of the article body
- Secondary keywords to weave in: ${brief.secondary_keywords.join(", ")}

CRITICAL OUTPUT RULES:
1. You MUST respond with ONLY a JSON object
2. Do NOT wrap in markdown code fences
3. Do NOT include any text before or after the JSON
4. The response must start with { and end with }
5. All string values must be properly escaped
6. The body_json.sections array must contain objects with "type", "heading", and "body" fields

REQUIRED JSON STRUCTURE:
{
  "title": "SEO title, max 60 characters, must contain primary keyword",
  "h1": "Page heading, max 70 characters, must contain primary keyword",
  "og_title": "Social share title, max 60 characters",
  "meta_description": "Between 140-170 characters, must contain primary keyword",
  "slug": "url-safe-lowercase-with-hyphens",
  "body_json": {
    "sections": [
      {
        "type": "h2",
        "heading": "Section heading with secondary keyword",
        "body": "2 to 4 paragraphs of rich, detailed content. Each paragraph should be 3-5 sentences. Include specific ${brief.city_name} locations, names, and details."
      },
      {
        "type": "conclusion",
        "heading": "Conclusion heading",
        "body": "Wrap-up paragraph with call to action"
      }
    ]
  },
  "link_hooks": [
    {
      "anchor_text": "text to hyperlink",
      "target_slug_hint": "related-article-slug",
      "context": "why this links"
    }
  ],
  "target_keywords": ["keyword1", "keyword2", "keyword3"],
  "word_count": 1200
}

CONTENT REQUIREMENTS:
- Minimum ${brief.min_word_count} words total across all section bodies
- At least 4 sections with type "h2" plus 1 section with type "conclusion"
- 2 to 4 link_hooks for internal linking opportunities
- Write as a local insider, not a content farm
- word_count should reflect the actual word count of all body text combined`;
}

function buildUserMessage(brief: ContentBrief): string {
  return `Write an SEO blog article for LIVIN about: "${brief.primary_keyword}"

CITY: ${brief.city_name}, ${brief.state_name}
CONTENT TYPE: ${brief.content_type}

RESEARCH NOTES:
${brief.research.raw}

Remember: respond with ONLY the JSON object, starting with { and ending with }. No other text.`;
}

// ── Generate Article (DeepSeek V3.2 via OpenRouter) ────────────────────────

export async function generateSEOBlogPost(brief: ContentBrief): Promise<SkillOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const systemPrompt = buildSystemPrompt(brief);
  const userMessage = buildUserMessage(brief);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "LIVIN Content Pipeline",
    },
    body: JSON.stringify({
      model: CONTENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 10000,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = await response.json();
  let text = data.choices?.[0]?.message?.content ?? "";

  // Clean common wrapper issues from DeepSeek
  text = text.trim();
  if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
  if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse DeepSeek V3.2 output as JSON: ${(err as Error).message}\nRaw output (first 500 chars): ${text.substring(0, 500)}`);
  }

  // Validate
  validateOutput(parsed, brief);

  // Map to SkillOutput
  const output: SkillOutput = {
    title: parsed.title,
    h1: parsed.h1,
    og_title: parsed.og_title,
    meta_description: parsed.meta_description,
    slug: parsed.slug,
    body_json: parsed.body_json,
    link_hooks: parsed.link_hooks,
    target_keywords: parsed.target_keywords,
    word_count: parsed.word_count,
    city_id: brief.city_id,
    brand: brief.brand,
    brand_tag: brief.brand,
    content_type: brief.content_type,
    source: "ai_generated",
    author_entity_type: "mm",
    author_mm_id: brief.market_mayor.mm_id,
  };

  return output;
}

// ── Generate Hero Image (Gemini Nano Banana via OpenRouter) ────────────────

export async function generateHeroImage(
  title: string,
  cityName: string,
  contentType: string
): Promise<{ imageData: Buffer; mimeType: string } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const prompt = `Editorial lifestyle photography for a magazine article titled "${title}" in ${cityName}. ` +
    `Warm golden hour lighting, magazine quality, lifestyle editorial, premium brand feel, ` +
    `cinematic composition, authentic local atmosphere. ` +
    `No text, no words, no watermarks, no captions, no titles on the image.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "LIVIN Image Pipeline",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image"],
        image_config: { aspect_ratio: "16:9" },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    // Extract image from OpenRouter response
    if (message?.images && Array.isArray(message.images)) {
      for (const img of message.images) {
        if (img.type === "image_url" && img.image_url?.url?.startsWith("data:image")) {
          const parts = img.image_url.url.split(",");
          const mimeMatch = parts[0].match(/data:(image\/[^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
          return {
            imageData: Buffer.from(parts[1], "base64"),
            mimeType,
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateOutput(output: any, brief: ContentBrief): void {
  const errors: string[] = [];

  // Required fields
  if (!output.title) errors.push("Missing: title");
  if (!output.h1) errors.push("Missing: h1");
  if (!output.meta_description) errors.push("Missing: meta_description");
  if (!output.slug) errors.push("Missing: slug");
  if (!output.body_json?.sections) errors.push("Missing: body_json.sections");
  if (!output.link_hooks) errors.push("Missing: link_hooks");
  if (!output.target_keywords?.length) errors.push("Missing: target_keywords");

  // SEO: primary keyword in key fields
  const kw = brief.primary_keyword.toLowerCase();
  if (output.h1 && !output.h1.toLowerCase().includes(kw))
    errors.push(`SEO: primary keyword "${kw}" not found in h1`);
  if (output.title && !output.title.toLowerCase().includes(kw))
    errors.push(`SEO: primary keyword "${kw}" not found in title`);
  if (output.meta_description && !output.meta_description.toLowerCase().includes(kw))
    errors.push(`SEO: primary keyword "${kw}" not found in meta_description`);

  // SEO: field length constraints
  if (output.title && output.title.length > 65)
    errors.push(`SEO: title exceeds 65 chars (${output.title.length})`);
  if (output.h1 && output.h1.length > 75)
    errors.push(`SEO: h1 exceeds 75 chars (${output.h1.length})`);
  if (output.meta_description && output.meta_description.length < 130)
    errors.push(`SEO: meta_description under 130 chars (${output.meta_description.length})`);
  if (output.meta_description && output.meta_description.length > 175)
    errors.push(`SEO: meta_description over 175 chars (${output.meta_description.length})`);

  // Body: minimum sections
  if (output.body_json?.sections) {
    const h2Count = output.body_json.sections.filter((s: any) => s.type === "h2").length;
    const hasConclusion = output.body_json.sections.some((s: any) => s.type === "conclusion");
    if (h2Count < 3) errors.push(`Structure: need 3+ h2 sections, got ${h2Count}`);
    if (!hasConclusion) errors.push("Structure: missing conclusion section");
  }

  // Link hooks: 2-4 required
  if (output.link_hooks) {
    if (output.link_hooks.length < 2) errors.push(`Link hooks: need 2+, got ${output.link_hooks.length}`);
    if (output.link_hooks.length > 6) errors.push(`Link hooks: max 6, got ${output.link_hooks.length}`);
  }

  // Brand compliance (tightened per Session 18 decision)
  if (output.brand === "livin" || brief.brand === "livin") {
    const bodyText = JSON.stringify(output.body_json).toLowerCase();
    if (
      bodyText.includes("homes for sale") ||
      bodyText.includes("mls") ||
      bodyText.includes("property listing") ||
      bodyText.includes("real estate listing") ||
      bodyText.includes("listing power teams") ||
      bodyText.includes("lpt recruiting")
    ) {
      errors.push("Brand violation: LIVIN content contains listing content or LPT reference");
    }
  }

  if (errors.length > 0) {
    throw new Error(`SEO Blog Post skill validation failed:\n${errors.map(e => `  - ${e}`).join("\n")}`);
  }
}

// ── Supabase Record Mapper ─────────────────────────────────────────────────

export function toSupabaseRecord(
  output: SkillOutput,
  researchId?: string
): Record<string, unknown> {
  return {
    city_id: output.city_id,
    brand: output.brand,
    brand_tag: output.brand_tag,
    content_type: output.content_type,
    source: output.source,
    author_entity_type: output.author_entity_type,
    author_mm_id: output.author_mm_id,
    title: output.title,
    slug: output.slug,
    h1: output.h1,
    og_title: output.og_title,
    og_image_url: output.og_image_url ?? null,
    meta_title: output.title,
    meta_description: output.meta_description,
    body_json: output.body_json,
    link_hooks: output.link_hooks,
    target_keywords: output.target_keywords,
    schema_json: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: output.h1,
      description: output.meta_description,
      author: { "@type": "Person", name: "" },
    },
    research_id: researchId ?? null,
  };
}
