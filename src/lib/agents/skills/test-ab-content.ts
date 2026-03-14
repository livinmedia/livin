/**
 * A/B Test: Claude Sonnet 4.6 vs DeepSeek V3.2
 * Content Generation Quality Comparison
 *
 * Generates 5 Houston articles with each model using identical research + briefs.
 * Outputs a comparison report scoring: JSON validity, word count, keyword placement,
 * structure, brand compliance, and estimated cost.
 *
 * Run: npx tsx src/lib/agents/skills/test-ab-content.ts
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envTestPath = path.join(process.cwd(), ".env.test");
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
} else {
  dotenv.config({ path: envLocalPath });
}

import Anthropic from "@anthropic-ai/sdk";

// ── Config ─────────────────────────────────────────────────────────────────

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

const TOPICS = [
  {
    keyword: "best restaurants in Houston Texas",
    secondary: ["Houston food scene", "Houston dining", "where to eat Houston", "Houston cuisine"],
  },
  {
    keyword: "things to do in Houston this weekend",
    secondary: ["Houston events", "Houston weekend guide", "Houston entertainment", "Houston nightlife"],
  },
  {
    keyword: "best neighborhoods to live in Houston Texas",
    secondary: ["Houston neighborhoods", "Houston lifestyle", "living in Houston", "Houston community"],
  },
  {
    keyword: "Houston Texas hidden gems locals love",
    secondary: ["Houston secrets", "Houston local spots", "off the beaten path Houston", "Houston insider tips"],
  },
  {
    keyword: "moving to Houston Texas guide",
    secondary: ["relocating to Houston", "Houston cost of living", "Houston culture", "Houston newcomer guide"],
  },
];

const MM_CONTEXT = {
  mm_name: "Marcus Williams",
  personalization_prompt:
    "I am Marcus Williams, a Houston native and licensed real estate agent with 12 years of experience. I grew up in the Third Ward and know every corner of this city. I write like a local insider, direct, warm, and full of neighborhood-specific knowledge.",
};

// ── System prompt (same for both models) ───────────────────────────────────

function buildSystemPrompt(keyword: string, secondary: string[]): string {
  return `You are the City Content Builder Agent for the LIVIN platform.
You generate SEO-optimized, city-specific content that is locally authentic and
written in the voice of a specific Market Mayor (local real estate expert).

BRAND: LIVIN (livin.in)
VOICE: Lifestyle, city culture, local discovery. Warm, curious, insider perspective.

MARKET MAYOR VOICE:
You are writing AS ${MM_CONTEXT.mm_name}, the Market Mayor for Houston, Texas.
Their voice and persona: ${MM_CONTEXT.personalization_prompt}
Write in first person where natural. Sound like a local expert, not a content farm.

SEO REQUIREMENTS:
- Primary keyword: "${keyword}"
  - MUST appear in: H1, title, meta_description, and within the first 100 words
- Secondary keywords: ${secondary.join(", ")}
  - Weave naturally into headings and body copy

OUTPUT FORMAT: Respond with ONLY a valid JSON object (no markdown, no backticks, no preamble).
{
  "title": "string (max 60 chars, includes primary keyword)",
  "h1": "string (max 70 chars, includes primary keyword)",
  "og_title": "string (max 60 chars)",
  "meta_description": "string (140-170 chars, includes primary keyword)",
  "slug": "string (URL-safe, lowercase, hyphens)",
  "body_json": {
    "sections": [
      { "type": "h2", "heading": "string", "body": "string (2-4 paragraphs)" },
      { "type": "conclusion", "heading": "string", "body": "string" }
    ]
  },
  "link_hooks": [
    { "anchor_text": "string", "target_slug_hint": "string", "context": "string" }
  ],
  "target_keywords": ["string"],
  "word_count": number
}

REQUIREMENTS:
- Minimum 800 words total body content
- At least 4 h2 sections + 1 conclusion
- 2-4 link_hooks for internal linking
- Write for humans first, search engines second`;
}

function buildUserMessage(keyword: string, research: string): string {
  return `Write an SEO blog article for LIVIN about: "${keyword}"

RESEARCH NOTES:
${research}

Respond with ONLY the JSON object. Begin with {`;
}

// ── API callers ────────────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userMessage: string): Promise<{ output: string; inputTokens: number; outputTokens: number; timeMs: number }> {
  const client = new Anthropic();
  const start = Date.now();
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: "{" },
    ],
  });
  const timeMs = Date.now() - start;
  const text = "{" + (response.content[0] as { text: string }).text;
  return {
    output: text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    timeMs,
  };
}

async function callDeepSeek(systemPrompt: string, userMessage: string): Promise<{ output: string; inputTokens: number; outputTokens: number; timeMs: number }> {
  const start = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "LIVIN A/B Test",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
        { role: "assistant", content: "{" },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  });
  const timeMs = Date.now() - start;
  const data = await res.json();
  const text = "{" + (data.choices?.[0]?.message?.content ?? "");
  return {
    output: text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    timeMs,
  };
}

async function callResearch(keyword: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "LIVIN A/B Research",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "user",
          content: `You are a local Houston TX research assistant. Provide research notes for a blog article about: "${keyword}". Include: top 5-8 specific places/items, current facts with approximate numbers, neighborhood context, and what makes this topic uniquely Houston. Write as structured notes, not an article. 400-600 words.`,
        },
      ],
      max_tokens: 1200,
      temperature: 0.4,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Scoring ────────────────────────────────────────────────────────────────

interface ScoreResult {
  jsonValid: boolean;
  wordCount: number;
  hasTitle: boolean;
  hasH1: boolean;
  hasMetaDesc: boolean;
  hasSlug: boolean;
  keywordInTitle: boolean;
  keywordInH1: boolean;
  keywordInMeta: boolean;
  keywordInFirst100: boolean;
  sectionCount: number;
  hasConclusion: boolean;
  linkHookCount: number;
  metaDescLength: number;
  titleLength: number;
  brandViolation: boolean;
  totalScore: number;
}

function scoreOutput(raw: string, keyword: string): ScoreResult {
  const kw = keyword.toLowerCase();
  let parsed: any = null;
  let jsonValid = false;

  try {
    // Clean common issues
    let cleaned = raw.trim();
    if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```\s*$/, "").trim();
    parsed = JSON.parse(cleaned);
    jsonValid = true;
  } catch {
    jsonValid = false;
  }

  if (!jsonValid || !parsed) {
    return {
      jsonValid: false, wordCount: 0, hasTitle: false, hasH1: false, hasMetaDesc: false,
      hasSlug: false, keywordInTitle: false, keywordInH1: false, keywordInMeta: false,
      keywordInFirst100: false, sectionCount: 0, hasConclusion: false, linkHookCount: 0,
      metaDescLength: 0, titleLength: 0, brandViolation: false, totalScore: 0,
    };
  }

  const hasTitle = !!parsed.title;
  const hasH1 = !!parsed.h1;
  const hasMetaDesc = !!parsed.meta_description;
  const hasSlug = !!parsed.slug;

  const keywordInTitle = hasTitle && parsed.title.toLowerCase().includes(kw);
  const keywordInH1 = hasH1 && parsed.h1.toLowerCase().includes(kw);
  const keywordInMeta = hasMetaDesc && parsed.meta_description.toLowerCase().includes(kw);

  const sections = parsed.body_json?.sections ?? [];
  const bodyText = sections.map((s: any) => s.body || "").join(" ");
  const words = bodyText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const first100 = words.slice(0, 100).join(" ").toLowerCase();
  const keywordInFirst100 = first100.includes(kw);

  const sectionCount = sections.filter((s: any) => s.type === "h2").length;
  const hasConclusion = sections.some((s: any) => s.type === "conclusion");
  const linkHookCount = parsed.link_hooks?.length ?? 0;
  const metaDescLength = parsed.meta_description?.length ?? 0;
  const titleLength = parsed.title?.length ?? 0;

  // Brand check
  const fullText = JSON.stringify(parsed).toLowerCase();
  const brandViolation =
    fullText.includes("homes for sale") ||
    fullText.includes("mls") ||
    fullText.includes("property listing") ||
    fullText.includes("listing power teams") ||
    fullText.includes("lpt recruiting");

  // Score: 100 points max
  let totalScore = 0;
  if (jsonValid) totalScore += 15;
  if (wordCount >= 800) totalScore += 10;
  else if (wordCount >= 500) totalScore += 5;
  if (keywordInTitle) totalScore += 10;
  if (keywordInH1) totalScore += 10;
  if (keywordInMeta) totalScore += 10;
  if (keywordInFirst100) totalScore += 10;
  if (sectionCount >= 4) totalScore += 10;
  else if (sectionCount >= 3) totalScore += 5;
  if (hasConclusion) totalScore += 5;
  if (linkHookCount >= 2 && linkHookCount <= 4) totalScore += 5;
  if (metaDescLength >= 140 && metaDescLength <= 170) totalScore += 5;
  if (titleLength <= 60 && titleLength > 0) totalScore += 5;
  if (!brandViolation) totalScore += 5;

  return {
    jsonValid, wordCount, hasTitle, hasH1, hasMetaDesc, hasSlug,
    keywordInTitle, keywordInH1, keywordInMeta, keywordInFirst100,
    sectionCount, hasConclusion, linkHookCount, metaDescLength,
    titleLength, brandViolation, totalScore,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

interface TestResult {
  topic: string;
  model: string;
  score: ScoreResult;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  timeMs: number;
  title: string;
  error?: string;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  A/B TEST: Claude Sonnet 4.6 vs DeepSeek V3.2");
  console.log("  Content Generation Quality Comparison");
  console.log("  5 Houston Topics x 2 Models = 10 Articles");
  console.log("=".repeat(70) + "\n");

  const results: TestResult[] = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    console.log(`\n${"─".repeat(70)}`);
    console.log(`Topic ${i + 1}/5: "${topic.keyword}"`);
    console.log("─".repeat(70));

    // Shared research
    console.log("  Researching via DeepSeek...");
    const research = await callResearch(topic.keyword);
    console.log(`  Research: ${research.length} chars`);

    const systemPrompt = buildSystemPrompt(topic.keyword, topic.secondary);
    const userMessage = buildUserMessage(topic.keyword, research);

    // Claude
    console.log("  [A] Claude Sonnet generating...");
    try {
      const claude = await callClaude(systemPrompt, userMessage);
      const claudeScore = scoreOutput(claude.output, topic.keyword);
      const claudeCost = (claude.inputTokens * 3 + claude.outputTokens * 15) / 1_000_000;
      results.push({
        topic: topic.keyword, model: "Claude Sonnet 4.6", score: claudeScore,
        inputTokens: claude.inputTokens, outputTokens: claude.outputTokens,
        costUSD: claudeCost, timeMs: claude.timeMs,
        title: claudeScore.jsonValid ? (JSON.parse(claude.output.trim().replace(/```\s*$/, "")).title ?? "parse error") : "INVALID JSON",
      });
      console.log(`  [A] Claude: score=${claudeScore.totalScore}/100 | words=${claudeScore.wordCount} | $${claudeCost.toFixed(4)} | ${(claude.timeMs / 1000).toFixed(1)}s`);
    } catch (err) {
      console.log(`  [A] Claude ERROR: ${err instanceof Error ? err.message : String(err)}`);
      results.push({
        topic: topic.keyword, model: "Claude Sonnet 4.6",
        score: { jsonValid: false, wordCount: 0, hasTitle: false, hasH1: false, hasMetaDesc: false, hasSlug: false, keywordInTitle: false, keywordInH1: false, keywordInMeta: false, keywordInFirst100: false, sectionCount: 0, hasConclusion: false, linkHookCount: 0, metaDescLength: 0, titleLength: 0, brandViolation: false, totalScore: 0 },
        inputTokens: 0, outputTokens: 0, costUSD: 0, timeMs: 0, title: "ERROR",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // DeepSeek
    console.log("  [B] DeepSeek V3.2 generating...");
    try {
      const ds = await callDeepSeek(systemPrompt, userMessage);
      const dsScore = scoreOutput(ds.output, topic.keyword);
      const dsCost = (ds.inputTokens * 0.26 + ds.outputTokens * 0.38) / 1_000_000;
      results.push({
        topic: topic.keyword, model: "DeepSeek V3.2", score: dsScore,
        inputTokens: ds.inputTokens, outputTokens: ds.outputTokens,
        costUSD: dsCost, timeMs: ds.timeMs,
        title: dsScore.jsonValid ? (() => { try { return JSON.parse(ds.output.trim().replace(/```\s*$/, "")).title ?? "parse error"; } catch { return "parse error"; } })() : "INVALID JSON",
      });
      console.log(`  [B] DeepSeek: score=${dsScore.totalScore}/100 | words=${dsScore.wordCount} | $${dsCost.toFixed(4)} | ${(ds.timeMs / 1000).toFixed(1)}s`);
    } catch (err) {
      console.log(`  [B] DeepSeek ERROR: ${err instanceof Error ? err.message : String(err)}`);
      results.push({
        topic: topic.keyword, model: "DeepSeek V3.2",
        score: { jsonValid: false, wordCount: 0, hasTitle: false, hasH1: false, hasMetaDesc: false, hasSlug: false, keywordInTitle: false, keywordInH1: false, keywordInMeta: false, keywordInFirst100: false, sectionCount: 0, hasConclusion: false, linkHookCount: 0, metaDescLength: 0, titleLength: 0, brandViolation: false, totalScore: 0 },
        inputTokens: 0, outputTokens: 0, costUSD: 0, timeMs: 0, title: "ERROR",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Brief pause between topics
    if (i < TOPICS.length - 1) {
      console.log("  Pausing 2s...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────

  console.log("\n\n" + "=".repeat(70));
  console.log("  A/B TEST RESULTS — COMPARISON REPORT");
  console.log("=".repeat(70));

  const claudeResults = results.filter((r) => r.model === "Claude Sonnet 4.6");
  const dsResults = results.filter((r) => r.model === "DeepSeek V3.2");

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  console.log("\n  PER-TOPIC BREAKDOWN:");
  console.log("  " + "-".repeat(66));
  console.log("  Topic                              | Claude | DeepSeek | Winner");
  console.log("  " + "-".repeat(66));
  for (let i = 0; i < TOPICS.length; i++) {
    const c = claudeResults[i];
    const d = dsResults[i];
    const topicShort = TOPICS[i].keyword.substring(0, 35).padEnd(35);
    const winner = c.score.totalScore > d.score.totalScore ? "Claude" : c.score.totalScore < d.score.totalScore ? "DeepSeek" : "Tie";
    console.log(`  ${topicShort} | ${String(c.score.totalScore).padStart(4)}/100 | ${String(d.score.totalScore).padStart(5)}/100 | ${winner}`);
  }

  console.log("\n  AGGREGATE SCORES:");
  console.log("  " + "-".repeat(50));
  console.log(`  Avg Quality Score:    Claude ${avg(claudeResults.map((r) => r.score.totalScore)).toFixed(1)}/100  |  DeepSeek ${avg(dsResults.map((r) => r.score.totalScore)).toFixed(1)}/100`);
  console.log(`  JSON Valid:           Claude ${claudeResults.filter((r) => r.score.jsonValid).length}/5      |  DeepSeek ${dsResults.filter((r) => r.score.jsonValid).length}/5`);
  console.log(`  Avg Word Count:       Claude ${avg(claudeResults.map((r) => r.score.wordCount)).toFixed(0)}      |  DeepSeek ${avg(dsResults.map((r) => r.score.wordCount)).toFixed(0)}`);
  console.log(`  Keyword in Title:     Claude ${claudeResults.filter((r) => r.score.keywordInTitle).length}/5      |  DeepSeek ${dsResults.filter((r) => r.score.keywordInTitle).length}/5`);
  console.log(`  Keyword in H1:        Claude ${claudeResults.filter((r) => r.score.keywordInH1).length}/5      |  DeepSeek ${dsResults.filter((r) => r.score.keywordInH1).length}/5`);
  console.log(`  Keyword in Meta:      Claude ${claudeResults.filter((r) => r.score.keywordInMeta).length}/5      |  DeepSeek ${dsResults.filter((r) => r.score.keywordInMeta).length}/5`);
  console.log(`  Keyword in First 100: Claude ${claudeResults.filter((r) => r.score.keywordInFirst100).length}/5      |  DeepSeek ${dsResults.filter((r) => r.score.keywordInFirst100).length}/5`);
  console.log(`  Brand Violations:     Claude ${claudeResults.filter((r) => r.score.brandViolation).length}/5      |  DeepSeek ${dsResults.filter((r) => r.score.brandViolation).length}/5`);

  console.log("\n  COST ANALYSIS (5 articles each):");
  console.log("  " + "-".repeat(50));
  const claudeTotalCost = sum(claudeResults.map((r) => r.costUSD));
  const dsTotalCost = sum(dsResults.map((r) => r.costUSD));
  console.log(`  Total Cost:           Claude $${claudeTotalCost.toFixed(4)}  |  DeepSeek $${dsTotalCost.toFixed(4)}`);
  console.log(`  Avg Cost/Article:     Claude $${(claudeTotalCost / 5).toFixed(4)}  |  DeepSeek $${(dsTotalCost / 5).toFixed(4)}`);
  console.log(`  Cost Ratio:           Claude is ${(claudeTotalCost / (dsTotalCost || 0.0001)).toFixed(0)}x more expensive`);
  console.log(`  Projected 2K articles: Claude $${(claudeTotalCost / 5 * 2000).toFixed(2)}  |  DeepSeek $${(dsTotalCost / 5 * 2000).toFixed(2)}`);

  console.log("\n  SPEED (avg per article):");
  console.log("  " + "-".repeat(50));
  console.log(`  Avg Generation Time:  Claude ${(avg(claudeResults.map((r) => r.timeMs)) / 1000).toFixed(1)}s  |  DeepSeek ${(avg(dsResults.map((r) => r.timeMs)) / 1000).toFixed(1)}s`);

  // Winner
  const claudeAvg = avg(claudeResults.map((r) => r.score.totalScore));
  const dsAvg = avg(dsResults.map((r) => r.score.totalScore));
  console.log("\n  " + "=".repeat(50));
  if (claudeAvg > dsAvg + 5) {
    console.log(`  WINNER: Claude Sonnet 4.6 (${claudeAvg.toFixed(1)} vs ${dsAvg.toFixed(1)})`);
    console.log(`  Quality gap: +${(claudeAvg - dsAvg).toFixed(1)} points`);
    console.log(`  Cost premium: ${(claudeTotalCost / (dsTotalCost || 0.0001)).toFixed(0)}x`);
  } else if (dsAvg > claudeAvg + 5) {
    console.log(`  WINNER: DeepSeek V3.2 (${dsAvg.toFixed(1)} vs ${claudeAvg.toFixed(1)})`);
    console.log(`  Quality gap: +${(dsAvg - claudeAvg).toFixed(1)} points`);
    console.log(`  Cost savings: ${(claudeTotalCost / (dsTotalCost || 0.0001)).toFixed(0)}x cheaper`);
  } else {
    console.log(`  TIE: Within 5 points (Claude ${claudeAvg.toFixed(1)} vs DeepSeek ${dsAvg.toFixed(1)})`);
    console.log(`  At near-equal quality, DeepSeek saves ${(claudeTotalCost / (dsTotalCost || 0.0001)).toFixed(0)}x on cost`);
  }
  console.log("  " + "=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
