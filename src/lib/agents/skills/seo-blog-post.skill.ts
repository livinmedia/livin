/**
 * P0-034: SEO Blog Post Agent Skill
 * LIVIN + Homes & Livin Ecosystem
 *
 * This skill is consumed by the City Content Builder Agent (Agent 01).
 * OpenClaw passes a ContentBrief into generateSEOBlogPost(). The function
 * calls Claude Sonnet with the system prompt and returns a SkillOutput that
 * maps 1:1 to the content_records columns in Supabase.
 *
 * Pipeline position: Research (OpenRouter/deepseek-chat) → THIS SKILL → Supabase content_records
 * Status written: 'confirming' (agent never writes 'published')
 *
 * Dependencies:
 *   ANTHROPIC_API_KEY  — Claude Sonnet (primary generation model)
 *   OPENROUTER_API_KEY — deepseek-chat research (called before this skill by OpenClaw)
 */

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// INPUT CONTRACT
// Everything OpenClaw must supply before calling this skill.
// ---------------------------------------------------------------------------

export interface ResearchPayload {
  /** Raw research text returned by OpenRouter/deepseek-chat */
  raw: string;
  /** City name e.g. "Houston" */
  city_name: string;
  /** State name e.g. "Texas" */
  state_name: string;
  /** ISO timestamp when research was fetched */
  fetched_at: string;
}

export interface MarketMayorContext {
  /** UUID from market_mayors.id */
  mm_id: string;
  /** Full display name e.g. "Sarah Johnson" */
  mm_name: string;
  /**
   * Stored in market_mayors.personalization_prompt.
   * Describes the MM's voice, tone, local expertise, and perspective.
   * Example: "I'm a Houston native with 15 years in real estate.
   * I write like a local insider — direct, warm, knowledgeable.
   * I reference real Houston neighborhoods by name."
   */
  personalization_prompt: string;
}

export interface ContentBrief {
  /** UUID from cities.id */
  city_id: string;
  city_slug: string; // e.g. "houston-texas"
  city_name: string; // e.g. "Houston"
  state_name: string; // e.g. "Texas"

  /**
   * One of the 7 valid content_type values:
   * article | guide | market_insight | event_roundup |
   * neighborhood_profile | vendor_feature | relocation_guide
   */
  content_type:
    | "article"
    | "guide"
    | "market_insight"
    | "event_roundup"
    | "neighborhood_profile"
    | "vendor_feature"
    | "relocation_guide";

  /**
   * Brand determines voice and content rules.
   * livin = lifestyle/city content, NO real estate listings
   * homes_and_livin = real estate content, NO LPT references
   */
  brand: "livin" | "homes_and_livin";

  /** Primary target keyword. Must appear in H1, title, meta_description, first 100 words. */
  primary_keyword: string;

  /** 3–5 secondary keywords to weave naturally into the body */
  secondary_keywords: string[];

  /** Minimum word count. Default 800 for articles, 1200 for guides. */
  min_word_count: number;

  /** Research payload from OpenRouter/deepseek-chat */
  research: ResearchPayload;

  /** Market Mayor context for voice personalization */
  market_mayor: MarketMayorContext;
}

// ---------------------------------------------------------------------------
// OUTPUT CONTRACT
// Maps directly to content_records columns. OpenClaw writes this to Supabase.
// ---------------------------------------------------------------------------

export interface BodyJsonSection {
  type: "h2" | "paragraph" | "conclusion";
  /** H2 heading text (only for type: h2) */
  heading?: string;
  /** Paragraph text — may contain internal link placeholders (see link_hooks) */
  content: string;
}

export interface BodyJson {
  /**
   * Ordered array of content sections.
   * Pattern: h2 → paragraph(s) → h2 → paragraph(s) → conclusion
   * Minimum: 3 h2 sections + 1 conclusion
   */
  sections: BodyJsonSection[];
}

export interface LinkHook {
  /**
   * Placeholder token used inside body_json section content.
   * Format: {{LINK_HOOK_1}}, {{LINK_HOOK_2}}, etc.
   * The Internal Linking Agent (Agent 04) replaces these with real URLs.
   */
  token: string;
  /** Suggested anchor text */
  anchor_text: string;
  /** Topic hint to help the Internal Linking Agent find the right target page */
  topic_hint: string;
}

export interface SchemaJson {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  author: {
    "@type": "Person";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  datePublished: string; // ISO date placeholder — real value set on publish
  image?: string;
  keywords: string;
}

export interface SkillOutput {
  // --- Core identity (written by OpenClaw, validated here) ---
  city_id: string; // passed through from ContentBrief
  brand: "livin" | "homes_and_livin"; // passed through
  brand_tag: "livin" | "homes_and_livin"; // same as brand
  content_type: ContentBrief["content_type"]; // passed through
  source: "ai_generated"; // always for this skill
  author_entity_type: "mm"; // always for this skill
  author_mm_id: string; // from market_mayor.mm_id

  // --- Content fields (generated by Claude) ---
  /** Page <title> and og:title base. Max 60 chars. Must include primary keyword. */
  title: string;
  /** URL slug. Max 80 chars. SEO-optimized. No city name duplication with geoSlug. */
  slug: string;
  /** H1 tag. Must include primary keyword. Different from title. Max 70 chars. */
  h1: string;
  /** og:title. Optimised for social sharing. May differ slightly from title. Max 60 chars. */
  og_title: string;
  /**
   * og:image_url suggestion. Format: descriptive alt-text-style string.
   * Actual image sourced by ops team. Placeholder format:
   * "hero-[city-slug]-[topic-slug].jpg"
   */
  og_image_url: string;
  /** Meta description. 150–160 chars. Must include primary keyword. */
  meta_description: string;
  /** Full article body as structured JSON. Rendered by ContentBody.tsx. */
  body_json: BodyJson;
  /**
   * Internal link placeholder tokens + metadata.
   * 2–4 hooks per article. Resolved by Internal Linking Agent (Agent 04).
   */
  link_hooks: LinkHook[];
  /** JSON-LD Article schema for SEO. */
  schema_json: SchemaJson;
  /** Primary keyword for SEO Agent (Agent 02) to validate and optimize. */
  target_keywords: string[];
  /** Approximate word count of generated body content. */
  word_count: number;
  /** Status to write to content_records. Always 'confirming' from this skill. */
  status: "confirming";
}

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------------------------

function buildSystemPrompt(brief: ContentBrief): string {
  const brandVoiceRules =
    brief.brand === "livin"
      ? `BRAND: LIVIN (livin.in)
VOICE: Lifestyle, city culture, local discovery. Warm, curious, insider perspective.
HARD RULES:
- NEVER mention real estate listings, home prices, or property for sale
- NEVER mention LPT or Listing Power Teams
- NEVER link to homesandlivin.in (linking is one-directional: LIVIN → H&L only, handled by Internal Linking Agent)
- Content celebrates city life: food, neighborhoods, culture, events, community`
      : `BRAND: Homes & Livin (homesandlivin.in)
VOICE: Real estate expertise, local market knowledge, trustworthy agent perspective.
HARD RULES:
- NEVER mention LPT or Listing Power Teams by name
- Content focuses on real estate, neighborhoods, market trends, home buying/selling
- The Market Mayor is positioned as the local real estate expert`;

  return `You are the City Content Builder Agent for the LIVIN + Homes & Livin platform.
You generate SEO-optimized, city-specific content that is locally authentic and 
written in the voice of a specific Market Mayor (local real estate expert).

${brandVoiceRules}

MARKET MAYOR VOICE:
You are writing AS ${brief.market_mayor.mm_name}, the Market Mayor for ${brief.city_name}, ${brief.state_name}.
Their voice and persona: ${brief.market_mayor.personalization_prompt}
Write in first person where natural. Sound like a local expert, not a content farm.

SEO REQUIREMENTS:
- Primary keyword: "${brief.primary_keyword}"
  - MUST appear in: H1, title, meta_description, and within the first 100 words of the body
  - Use naturally throughout — target 1–2% keyword density, never keyword-stuffed
- Secondary keywords: ${brief.secondary_keywords.join(", ")}
  - Weave naturally into headings and body copy
- Minimum word count: ${brief.min_word_count} words in the body sections combined
- Meta description: 150–160 characters, includes primary keyword, compelling click-through copy
- Title tag: max 60 characters, primary keyword near the front
- H1: max 70 characters, primary keyword included, distinct from title tag

CONTENT TYPE: ${brief.content_type}
CITY: ${brief.city_name}, ${brief.state_name}

INTERNAL LINK HOOKS:
Include 2–4 internal link placeholders in the body_json sections using this exact format: {{LINK_HOOK_1}}, {{LINK_HOOK_2}}, etc.
Place them naturally in paragraph content where a contextual link would add value.
The Internal Linking Agent will replace these tokens with real URLs.
For each hook, provide anchor_text and topic_hint in the link_hooks array.

FACTUAL ACCURACY RULES:
- Use ONLY facts from the provided research payload
- NEVER fabricate statistics, business names, addresses, or events
- If a specific stat is not in the research, write around it with general knowledge
- Do NOT invent quotes

BODY JSON STRUCTURE:
body_json MUST be an object with a "sections" key containing an array. NEVER return a bare array.
Correct:   "body_json": { "sections": [ ... ] }
Incorrect: "body_json": [ ... ]

Section pattern:
1. h2 section (heading + paragraph content after it)
2. paragraph section (for multi-paragraph development under a heading)
3. Repeat for 3–5 major sections
4. End with a conclusion section (type: "conclusion")

OUTPUT FORMAT:
Respond with ONLY a valid JSON object matching the SkillOutput interface. 
No markdown fences, no preamble, no explanation. Pure JSON only.

Required fields: title, slug, h1, og_title, og_image_url, meta_description, 
body_json, link_hooks, schema_json, target_keywords, word_count`;
}

// ---------------------------------------------------------------------------
// USER MESSAGE
// ---------------------------------------------------------------------------

function buildUserMessage(brief: ContentBrief): string {
  return `Generate a ${brief.content_type} for ${brief.city_name}, ${brief.state_name}.

PRIMARY KEYWORD: ${brief.primary_keyword}
SECONDARY KEYWORDS: ${brief.secondary_keywords.join(", ")}
MINIMUM WORD COUNT: ${brief.min_word_count}
BRAND: ${brief.brand}
CONTENT TYPE: ${brief.content_type}

RESEARCH PAYLOAD (from OpenRouter/deepseek-chat — use as your factual source):
---
${brief.research.raw}
---

Generate the complete article now. Return only the JSON object.`;
}

// ---------------------------------------------------------------------------
// MAIN SKILL FUNCTION
// ---------------------------------------------------------------------------

export async function generateSEOBlogPost(
  brief: ContentBrief
): Promise<SkillOutput> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: buildSystemPrompt(brief),
    messages: [
      {
        role: "user",
        content: buildUserMessage(brief),
      },
      {
        // Prefill forces Claude to begin with { — eliminates any preamble or markdown fences
        role: "assistant",
        content: "{",
      },
    ],
  });

  // Extract text content
  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  // Prepend { consumed by assistant prefill, strip any accidental markdown fences
  const clean = ("{" + rawText)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: Partial<SkillOutput>;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new Error(
      `SEO Blog Post skill: Claude returned invalid JSON.\nRaw output:\n${rawText}\nError: ${err}`
    );
  }

  // Normalize body_json — Claude sometimes returns the sections array directly
  // instead of wrapping it: { sections: [...] }. Detect and fix both cases.
  if (parsed.body_json !== undefined) {
    const bj = parsed.body_json as unknown;
    if (Array.isArray(bj)) {
      // Claude returned the array directly — wrap it
      parsed.body_json = { sections: bj };
    } else if (
      typeof bj === "object" &&
      bj !== null &&
      !Array.isArray((bj as Record<string, unknown>).sections) &&
      Object.keys(bj).every((k) => !isNaN(Number(k)))
    ) {
      // Claude returned a numeric-keyed object (array-like) — convert to array then wrap
      const arr = Object.values(bj as Record<string, unknown>);
      parsed.body_json = { sections: arr } as unknown as typeof parsed.body_json;
    }
  }

  // Normalize target_keywords — Claude sometimes omits or uses a different key name
  if (!parsed.target_keywords?.length) {
    // Derive from keywords in the brief as a safe fallback
    parsed.target_keywords = [brief.primary_keyword, ...brief.secondary_keywords];
  }

  // Enforce fixed fields — these are never generated by Claude
  const output: SkillOutput = {
    ...(parsed as SkillOutput),
    city_id: brief.city_id,
    brand: brief.brand,
    brand_tag: brief.brand,
    content_type: brief.content_type,
    source: "ai_generated",
    author_entity_type: "mm",
    author_mm_id: brief.market_mayor.mm_id,
    status: "confirming",
  };

  // Basic output validation
  validateOutput(output, brief);

  return output;
}

// ---------------------------------------------------------------------------
// OUTPUT VALIDATION
// ---------------------------------------------------------------------------

function validateOutput(output: SkillOutput, brief: ContentBrief): void {
  const errors: string[] = [];

  if (!output.title) errors.push("Missing: title");
  if (!output.slug) errors.push("Missing: slug");
  if (!output.h1) errors.push("Missing: h1");
  if (!output.og_title) errors.push("Missing: og_title");
  if (!output.og_image_url) errors.push("Missing: og_image_url");
  if (!output.meta_description) errors.push("Missing: meta_description");
  if (!output.body_json?.sections?.length)
    errors.push("Missing: body_json.sections");
  if (!output.link_hooks) errors.push("Missing: link_hooks");
  if (!output.schema_json) errors.push("Missing: schema_json");
  if (!output.target_keywords?.length) errors.push("Missing: target_keywords");

  // SEO: primary keyword must appear in key fields
  const kw = brief.primary_keyword.toLowerCase();
  if (output.h1 && !output.h1.toLowerCase().includes(kw))
    errors.push(`SEO: primary keyword "${kw}" not found in h1`);
  if (output.title && !output.title.toLowerCase().includes(kw))
    errors.push(`SEO: primary keyword "${kw}" not found in title`);
  if (
    output.meta_description &&
    !output.meta_description.toLowerCase().includes(kw)
  )
    errors.push(`SEO: primary keyword "${kw}" not found in meta_description`);

  // SEO: field length constraints
  if (output.title && output.title.length > 60)
    errors.push(`SEO: title exceeds 60 chars (${output.title.length})`);
  if (output.h1 && output.h1.length > 70)
    errors.push(`SEO: h1 exceeds 70 chars (${output.h1.length})`);
  if (output.meta_description && output.meta_description.length < 140)
    errors.push(
      `SEO: meta_description under 140 chars (${output.meta_description.length})`
    );
  if (output.meta_description && output.meta_description.length > 165)
    errors.push(
      `SEO: meta_description over 165 chars (${output.meta_description.length})`
    );
  if (output.slug && output.slug.length > 80)
    errors.push(`SEO: slug exceeds 80 chars (${output.slug.length})`);

  // Body: minimum sections
  if (output.body_json?.sections) {
    const h2Count = output.body_json.sections.filter(
      (s) => s.type === "h2"
    ).length;
    const hasConclusion = output.body_json.sections.some(
      (s) => s.type === "conclusion"
    );
    if (h2Count < 3)
      errors.push(`Structure: need ≥3 h2 sections, got ${h2Count}`);
    if (!hasConclusion) errors.push("Structure: missing conclusion section");
  }

  // Link hooks: 2–4 required
  if (output.link_hooks) {
    if (output.link_hooks.length < 2)
      errors.push(
        `Link hooks: need ≥2, got ${output.link_hooks.length}`
      );
    if (output.link_hooks.length > 4)
      errors.push(
        `Link hooks: max 4, got ${output.link_hooks.length}`
      );
  }

  // Brand compliance
  if (output.brand === "livin") {
    const bodyText = JSON.stringify(output.body_json).toLowerCase();
    if (
      bodyText.includes("for sale") ||
      bodyText.includes("listing") ||
      bodyText.includes("lpt")
    ) {
      errors.push(
        "Brand violation: LIVIN content contains real estate listing or LPT reference"
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `SEO Blog Post skill validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }
}

/**
 * Utility: map SkillOutput to the Supabase content_records INSERT payload.
 * Called by OpenClaw after generateSEOBlogPost() succeeds.
 */
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
    og_image_url: output.og_image_url,
    meta_title: output.title, // meta_title mirrors title at generation time
    meta_description: output.meta_description,
    body_json: output.body_json,
    link_hooks: output.link_hooks,
    schema_json: output.schema_json,
    target_keywords: output.target_keywords,
    word_count: output.word_count,
    status: output.status, // always 'confirming'
    research_id: researchId ?? null,
  };
}