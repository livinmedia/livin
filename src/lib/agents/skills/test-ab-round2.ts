/**
 * A/B Test Round 2: Claude vs DeepSeek (Tuned)
 * 
 * Changes from Round 1:
 * - No assistant prefill for DeepSeek (was causing JSON failures)
 * - Tests both DeepSeek V3 and V3.2
 * - Stronger JSON enforcement in prompt
 * - Temperature 0.6
 *
 * Run: npx tsx src/lib/agents/skills/test-ab-round2.ts
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

import Anthropic from "@anthropic-ai/sdk";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

const TOPICS = [
  { keyword: "best restaurants in Houston Texas", secondary: ["Houston food scene", "Houston dining", "where to eat Houston", "Houston cuisine"] },
  { keyword: "things to do in Houston this weekend", secondary: ["Houston events", "Houston weekend guide", "Houston entertainment", "Houston nightlife"] },
  { keyword: "best neighborhoods to live in Houston Texas", secondary: ["Houston neighborhoods", "Houston lifestyle", "living in Houston", "Houston community"] },
  { keyword: "Houston Texas hidden gems locals love", secondary: ["Houston secrets", "Houston local spots", "off the beaten path Houston", "Houston insider tips"] },
  { keyword: "moving to Houston Texas guide", secondary: ["relocating to Houston", "Houston cost of living", "Houston culture", "Houston newcomer guide"] },
];

const MM = { name: "Marcus Williams", prompt: "I am Marcus Williams, a Houston native and licensed real estate agent with 12 years of experience. I grew up in the Third Ward and know every corner of this city. I write like a local insider, direct, warm, and full of neighborhood-specific knowledge." };

// Separate system prompts - Claude uses prefill, DeepSeek gets explicit JSON wrapping instructions
function systemPromptClaude(kw: string, sec: string[]): string {
  return `You are the City Content Builder Agent for LIVIN (livin.in).
Generate SEO-optimized, city-specific lifestyle content in the voice of Market Mayor ${MM.name}.
Voice: ${MM.prompt}

BRAND: LIVIN - lifestyle, city culture, local discovery. Warm, curious, insider perspective.

SEO: Primary keyword "${kw}" MUST appear in title, h1, meta_description, and first 100 words of body.
Secondary keywords: ${sec.join(", ")} - weave naturally.

OUTPUT: Valid JSON object only. No markdown fences. No preamble.
{
  "title": "max 60 chars with primary keyword",
  "h1": "max 70 chars with primary keyword",
  "og_title": "max 60 chars",
  "meta_description": "140-170 chars with primary keyword",
  "slug": "url-safe-lowercase-hyphens",
  "body_json": { "sections": [{ "type": "h2", "heading": "string", "body": "2-4 paragraphs, rich detail" }, { "type": "conclusion", "heading": "string", "body": "string" }] },
  "link_hooks": [{ "anchor_text": "string", "target_slug_hint": "string", "context": "string" }],
  "target_keywords": ["array of strings"],
  "word_count": number
}
Requirements: 800+ words body, 4+ h2 sections, 1 conclusion, 2-4 link_hooks. Write for humans first.`;
}

function systemPromptDeepSeek(kw: string, sec: string[]): string {
  return `You are the City Content Builder Agent for LIVIN (livin.in).
Generate SEO-optimized, city-specific lifestyle content in the voice of Market Mayor ${MM.name}.
Voice: ${MM.prompt}

BRAND: LIVIN - lifestyle, city culture, local discovery. Warm, curious, insider perspective.

SEO RULES:
- Primary keyword: "${kw}"
- This keyword MUST appear in: title, h1, meta_description, AND within the first 100 words of the article body
- Secondary keywords to weave in: ${sec.join(", ")}

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
        "heading": "Section heading",
        "body": "2 to 4 paragraphs of rich, detailed content about this subtopic. Each paragraph should be 3-5 sentences. Include specific Houston locations, names, and details."
      },
      {
        "type": "conclusion",
        "heading": "Conclusion heading",
        "body": "Wrap-up paragraph"
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
- Minimum 800 words total across all section bodies
- At least 4 sections with type "h2" plus 1 section with type "conclusion"
- 2 to 4 link_hooks for internal linking opportunities
- Write as a local insider, not a content farm
- word_count should reflect the actual word count of all body text combined`;
}

function userMessage(kw: string, research: string): string {
  return `Write an SEO blog article for LIVIN about: "${kw}"

RESEARCH NOTES:
${research}

Remember: respond with ONLY the JSON object, starting with { and ending with }. No other text.`;
}

// API callers

async function callClaude(sys: string, user: string): Promise<{ output: string; inputTokens: number; outputTokens: number; timeMs: number }> {
  const client = new Anthropic();
  const start = Date.now();
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: sys,
    messages: [{ role: "user", content: user }, { role: "assistant", content: "{" }],
  });
  return {
    output: "{" + (res.content[0] as { text: string }).text,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    timeMs: Date.now() - start,
  };
}

async function callOpenRouter(model: string, sys: string, user: string): Promise<{ output: string; inputTokens: number; outputTokens: number; timeMs: number }> {
  const start = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json", "X-Title": "LIVIN A/B R2" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      max_tokens: 10000,
      temperature: 0.6,
    }),
  });
  const data = await res.json();
  let text = data.choices?.[0]?.message?.content ?? "";
  // Clean common wrapper issues
  text = text.trim();
  if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
  if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  return {
    output: text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    timeMs: Date.now() - start,
  };
}

async function research(kw: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json", "X-Title": "LIVIN Research" },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: `You are a local Houston TX research assistant. Provide research notes for: "${kw}". Include 5-8 specific places/items with details, current facts, neighborhood context, what makes it uniquely Houston. Structured notes, not an article. 400-600 words.` }],
      max_tokens: 1200, temperature: 0.4,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Scoring (same as round 1)

interface Score {
  jsonValid: boolean; wordCount: number; keywordInTitle: boolean; keywordInH1: boolean;
  keywordInMeta: boolean; keywordInFirst100: boolean; sectionCount: number; hasConclusion: boolean;
  linkHookCount: number; metaDescLen: number; titleLen: number; brandViolation: boolean; total: number;
}

function score(raw: string, kw: string): Score {
  const kwl = kw.toLowerCase();
  let p: any = null;
  let jsonValid = false;
  try { p = JSON.parse(raw); jsonValid = true; } catch { jsonValid = false; }

  if (!jsonValid || !p) return { jsonValid: false, wordCount: 0, keywordInTitle: false, keywordInH1: false, keywordInMeta: false, keywordInFirst100: false, sectionCount: 0, hasConclusion: false, linkHookCount: 0, metaDescLen: 0, titleLen: 0, brandViolation: false, total: 0 };

  const kit = !!p.title && p.title.toLowerCase().includes(kwl);
  const kih = !!p.h1 && p.h1.toLowerCase().includes(kwl);
  const kim = !!p.meta_description && p.meta_description.toLowerCase().includes(kwl);
  const secs = p.body_json?.sections ?? [];
  const body = secs.map((s: any) => s.body || "").join(" ");
  const words = body.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const ki100 = words.slice(0, 100).join(" ").toLowerCase().includes(kwl);
  const sc = secs.filter((s: any) => s.type === "h2").length;
  const hc = secs.some((s: any) => s.type === "conclusion");
  const lh = p.link_hooks?.length ?? 0;
  const mdl = p.meta_description?.length ?? 0;
  const tl = p.title?.length ?? 0;
  const full = JSON.stringify(p).toLowerCase();
  const bv = full.includes("homes for sale") || full.includes("mls") || full.includes("property listing") || full.includes("listing power teams") || full.includes("lpt recruiting");

  let t = 0;
  if (jsonValid) t += 15;
  if (wc >= 800) t += 10; else if (wc >= 500) t += 5;
  if (kit) t += 10; if (kih) t += 10; if (kim) t += 10; if (ki100) t += 10;
  if (sc >= 4) t += 10; else if (sc >= 3) t += 5;
  if (hc) t += 5; if (lh >= 2 && lh <= 4) t += 5;
  if (mdl >= 140 && mdl <= 170) t += 5;
  if (tl <= 60 && tl > 0) t += 5;
  if (!bv) t += 5;

  return { jsonValid, wordCount: wc, keywordInTitle: kit, keywordInH1: kih, keywordInMeta: kim, keywordInFirst100: ki100, sectionCount: sc, hasConclusion: hc, linkHookCount: lh, metaDescLen: mdl, titleLen: tl, brandViolation: bv, total: t };
}

// Pricing per 1M tokens
const PRICING: Record<string, { input: number; output: number }> = {
  "Claude Sonnet": { input: 3.0, output: 15.0 },
  "DeepSeek V3": { input: 0.32, output: 0.89 },
  "DeepSeek V3.2": { input: 0.26, output: 0.38 },
};

interface Result {
  topic: string; model: string; score: Score; inputTokens: number; outputTokens: number;
  costUSD: number; timeMs: number; title: string; error?: string;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  A/B TEST ROUND 2: Claude vs DeepSeek (Tuned Prompts)");
  console.log("  No prefill for DeepSeek | Explicit JSON instructions");
  console.log("  Testing: Claude Sonnet 4.5 | DeepSeek V3 | DeepSeek V3.2");
  console.log("  5 Topics x 3 Models = 15 Articles");
  console.log("=".repeat(70) + "\n");

  const results: Result[] = [];
  const models = [
    { name: "Claude Sonnet", call: (sys: string, usr: string) => callClaude(sys, usr), sysBuilder: systemPromptClaude, price: PRICING["Claude Sonnet"] },
    { name: "DeepSeek V3", call: (sys: string, usr: string) => callOpenRouter("deepseek/deepseek-chat", sys, usr), sysBuilder: systemPromptDeepSeek, price: PRICING["DeepSeek V3"] },
    { name: "DeepSeek V3.2", call: (sys: string, usr: string) => callOpenRouter("deepseek/deepseek-v3.2", sys, usr), sysBuilder: systemPromptDeepSeek, price: PRICING["DeepSeek V3.2"] },
  ];

  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i];
    console.log(`\n${"~".repeat(70)}`);
    console.log(`Topic ${i + 1}/5: "${t.keyword}"`);
    console.log("~".repeat(70));

    console.log("  Researching...");
    const res = await research(t.keyword);
    console.log(`  Research: ${res.length} chars`);

    for (const m of models) {
      console.log(`  [${m.name}] generating...`);
      try {
        const sys = m.sysBuilder(t.keyword, t.secondary);
        const usr = userMessage(t.keyword, res);
        const r = await m.call(sys, usr);
        const s = score(r.output, t.keyword);
        const cost = (r.inputTokens * m.price.input + r.outputTokens * m.price.output) / 1_000_000;
        let title = "INVALID JSON";
        if (s.jsonValid) { try { title = JSON.parse(r.output).title ?? "no title"; } catch { title = "parse err"; } }
        results.push({ topic: t.keyword, model: m.name, score: s, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUSD: cost, timeMs: r.timeMs, title });
        console.log(`  [${m.name}] score=${s.total}/100 | words=${s.wordCount} | json=${s.jsonValid} | $${cost.toFixed(4)} | ${(r.timeMs / 1000).toFixed(1)}s`);
        if (s.jsonValid) console.log(`    title: "${title}"`);
      } catch (err) {
        console.log(`  [${m.name}] ERROR: ${err instanceof Error ? err.message : String(err)}`);
        results.push({ topic: t.keyword, model: m.name, score: { jsonValid: false, wordCount: 0, keywordInTitle: false, keywordInH1: false, keywordInMeta: false, keywordInFirst100: false, sectionCount: 0, hasConclusion: false, linkHookCount: 0, metaDescLen: 0, titleLen: 0, brandViolation: false, total: 0 }, inputTokens: 0, outputTokens: 0, costUSD: 0, timeMs: 0, title: "ERROR", error: String(err) });
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Report
  console.log("\n\n" + "=".repeat(70));
  console.log("  A/B ROUND 2 RESULTS");
  console.log("=".repeat(70));

  const byModel = (name: string) => results.filter((r) => r.model === name);
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  console.log("\n  PER-TOPIC BREAKDOWN:");
  console.log("  " + "-".repeat(76));
  console.log("  Topic                              | Claude | DS V3  | DS V3.2 | Best");
  console.log("  " + "-".repeat(76));
  for (let i = 0; i < TOPICS.length; i++) {
    const c = byModel("Claude Sonnet")[i];
    const d3 = byModel("DeepSeek V3")[i];
    const d32 = byModel("DeepSeek V3.2")[i];
    const topicShort = TOPICS[i].keyword.substring(0, 35).padEnd(35);
    const scores = [
      { name: "Claude", s: c?.score.total ?? 0 },
      { name: "DS V3", s: d3?.score.total ?? 0 },
      { name: "DS V3.2", s: d32?.score.total ?? 0 },
    ];
    const best = scores.sort((a, b) => b.s - a.s)[0].name;
    console.log(`  ${topicShort} | ${String(c?.score.total ?? 0).padStart(4)}/100 | ${String(d3?.score.total ?? 0).padStart(4)}/100 | ${String(d32?.score.total ?? 0).padStart(5)}/100 | ${best}`);
  }

  for (const name of ["Claude Sonnet", "DeepSeek V3", "DeepSeek V3.2"]) {
    const m = byModel(name);
    const tc = sum(m.map((r) => r.costUSD));
    console.log(`\n  ${name.toUpperCase()}:`);
    console.log(`    Avg Score:       ${avg(m.map((r) => r.score.total)).toFixed(1)}/100`);
    console.log(`    JSON Valid:      ${m.filter((r) => r.score.jsonValid).length}/5`);
    console.log(`    Avg Words:       ${avg(m.map((r) => r.score.wordCount)).toFixed(0)}`);
    console.log(`    KW in Title:     ${m.filter((r) => r.score.keywordInTitle).length}/5`);
    console.log(`    KW in H1:        ${m.filter((r) => r.score.keywordInH1).length}/5`);
    console.log(`    KW in Meta:      ${m.filter((r) => r.score.keywordInMeta).length}/5`);
    console.log(`    KW in First 100: ${m.filter((r) => r.score.keywordInFirst100).length}/5`);
    console.log(`    Brand Violations:${m.filter((r) => r.score.brandViolation).length}/5`);
    console.log(`    Avg Speed:       ${(avg(m.map((r) => r.timeMs)) / 1000).toFixed(1)}s`);
    console.log(`    Total Cost (5):  $${tc.toFixed(4)}`);
    console.log(`    Cost/Article:    $${(tc / 5).toFixed(4)}`);
    console.log(`    2K articles/mo:  $${((tc / 5) * 2000).toFixed(2)}`);
  }

  // Final verdict
  const claudeAvg = avg(byModel("Claude Sonnet").map((r) => r.score.total));
  const d3Avg = avg(byModel("DeepSeek V3").map((r) => r.score.total));
  const d32Avg = avg(byModel("DeepSeek V3.2").map((r) => r.score.total));

  console.log("\n  " + "=".repeat(50));
  console.log("  FINAL VERDICT:");
  const all = [
    { name: "Claude Sonnet", avg: claudeAvg },
    { name: "DeepSeek V3", avg: d3Avg },
    { name: "DeepSeek V3.2", avg: d32Avg },
  ].sort((a, b) => b.avg - a.avg);

  console.log(`  1st: ${all[0].name} — ${all[0].avg.toFixed(1)}/100`);
  console.log(`  2nd: ${all[1].name} — ${all[1].avg.toFixed(1)}/100`);
  console.log(`  3rd: ${all[2].name} — ${all[2].avg.toFixed(1)}/100`);

  if (all[0].avg - all[1].avg <= 5) {
    console.log(`\n  Top 2 within 5 pts — cost becomes the deciding factor.`);
  } else {
    console.log(`\n  ${all[0].name} wins by ${(all[0].avg - all[1].avg).toFixed(1)} points.`);
  }
  console.log("  " + "=".repeat(50) + "\n");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
