# LIVIN — Overnight Auto-Generation System
# Run in Claude Code from ~/Projects/livin-platform

## OVERVIEW

Build an overnight content generation system that:
1. Runs automatically (GitHub Actions cron OR Vercel cron)
2. Auto-publishes articles that score >= 7/10 quality
3. Holds articles < 7/10 at awaiting_approval for manual review
4. Has a kill switch in Supabase (content_autopilot.enabled = false stops everything)
5. Generates hero images for every article

## KILL SWITCH

A `platform_settings` table exists in Supabase with these rows:

```sql
-- Check autopilot status
SELECT value FROM platform_settings WHERE key = 'content_autopilot';
-- Returns: {"enabled": true, "min_quality_score": 7, "max_articles_per_night": 20, "cities": ["c55e4fd5-..."]}

-- EMERGENCY STOP (run this to stop all auto-generation):
UPDATE platform_settings SET value = jsonb_set(value, '{enabled}', 'false') WHERE key = 'content_autopilot';

-- RESUME:
UPDATE platform_settings SET value = jsonb_set(value, '{enabled}', 'true') WHERE key = 'content_autopilot';
```

Anthony can also stop it from the MM dashboard (add a toggle in the Profile or Overview tab).

## ARCHITECTURE

### Option A: Vercel Cron (Recommended — simplest)

Create an API route that Vercel calls on a schedule:

**File: src/app/api/cron/generate-content/route.ts**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint is called by Vercel Cron
// Secured by CRON_SECRET env var

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step 1: Check kill switch
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "content_autopilot")
    .single();

  if (!settings?.value?.enabled) {
    return NextResponse.json({ status: "autopilot_disabled", generated: 0 });
  }

  const config = settings.value;
  const maxArticles = config.max_articles_per_night || 20;
  const minQuality = config.min_quality_score || 7;
  const cityIds = config.cities || [];

  // Step 2: For each city, generate articles
  // ... (implementation below)

  return NextResponse.json({ status: "complete", generated: count });
}
```

**File: vercel.json** (add or update)
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-content",
      "schedule": "0 8 * * *"
    }
  ]
}
```
Note: Vercel cron uses UTC. "0 8 * * *" = 8 AM UTC = 2 AM Central (Houston).

Add to Vercel environment variables:
- CRON_SECRET: generate a random string (e.g., `openssl rand -hex 32`)

### Generation Flow (inside the cron route)

For each city in config.cities:

1. **Pick topics** — query content_records for existing slugs to avoid duplicates.
   Use a topic bank (see below) and filter out already-generated topics.

2. **Research** — call OpenRouter deepseek/deepseek-chat for city-specific data

3. **Generate** — call OpenRouter deepseek/deepseek-chat (V3.2 tuned prompts, NO prefill)
   for the full article

4. **Score** — extract quality_score from the generation response (or do a quick
   evaluation pass). If score >= min_quality_score, mark for auto-publish.

5. **Generate hero image** — call OpenRouter google/gemini-2.5-flash-preview-image-generation
   ALWAYS include "no text, no words, no letters, no watermarks" in prompt

6. **Upload image** — Supabase Storage content-images/articles/{slug}.png

7. **Insert to content_records** — with all fields populated

8. **Walk state machine:**
   - If quality >= min_quality_score:
     queued → generating → confirming → confirmed → seo_optimized → linked →
     awaiting_approval → mm_approved → published
   - If quality < min_quality_score:
     queued → generating → confirming → confirmed → seo_optimized → linked →
     awaiting_approval (STOP — needs manual review)

9. **Log** — write to agent_run_log table with results

### Topic Bank

The cron should pull from a rotating topic bank. Create this table or use a JSON file:

**Houston Topics (not yet generated):**

FOOD & DRINK:
- Best Barbecue in Houston Texas: Smokehouses & Pitmasters
- Top Rooftop Bars in Houston Texas: Views & Cocktails
- Best Seafood Restaurants in Houston Texas
- Houston Texas Happy Hour Guide: Where to Go After Work
- Best Vegan and Vegetarian Restaurants in Houston Texas
- Best Pizza in Houston Texas: Wood-Fired to Deep Dish
- Houston Texas Craft Breweries and Taprooms Guide
- Best Sushi in Houston Texas: Fresh Rolls and Omakase
- Houston Texas Ice Cream and Dessert Shops
- Best Tex-Mex Restaurants in Houston Texas

NEIGHBORHOODS:
- Montrose Houston Texas: The Complete Neighborhood Guide
- The Heights Houston Texas: Where History Meets Hip
- Midtown Houston Texas: Living, Dining & Nightlife
- EaDo Houston Texas: East Downtown's Creative Revival
- Rice Village Houston Texas: Shopping, Dining & Campus Life
- Sugar Land Texas: Houston's Sweetest Suburb Guide
- The Woodlands Texas: Family Living North of Houston
- Katy Texas: Suburban Life West of Houston

OUTDOORS:
- Buffalo Bayou Park Houston: Trails, Kayaking & Events
- Best Hiking and Nature Trails Near Houston Texas
- Houston Texas Farmers Markets: Fresh, Local & Weekly
- Best Dog Parks in Houston Texas: Where Pups Run Free
- Houston Texas Fishing Spots: Bay, Lake & Gulf Guide
- Best Running Routes in Houston Texas
- Houston Texas Beach Day Trips: Galveston and Beyond

CULTURE:
- Houston Museum District Guide: Art, Science & History
- Best Live Music Venues in Houston Texas
- Houston Texas Street Art and Murals: A Self-Guided Tour
- Houston Space Center and NASA: Visitor's Complete Guide
- Houston Texas Theater and Performing Arts Guide
- Houston Rodeo Guide: Everything You Need to Know
- Houston Texas Free Events and Activities This Month

LIFESTYLE:
- Moving to Houston Texas: The Ultimate Relocation Guide
- Best Gyms and Fitness Studios in Houston Texas
- Houston Texas Date Night Ideas: Romantic Spots for Couples
- Houston Texas Coworking Spaces: Where Remote Workers Thrive
- Best Yoga Studios in Houston Texas
- Houston Texas Shopping Guide: Malls, Boutiques & Vintage
- Houston Texas Pet-Friendly Restaurants and Patios
- Cost of Living in Houston Texas: What to Expect in 2026
- Best Schools and Education in Houston Texas
- Houston Texas Weekend Road Trips: 5 Easy Getaways

That's 40+ topics. At 5-10 per night, that's 4-8 nights of content before needing new topics.
The system should track which topics have been generated and skip them.

## DASHBOARD KILL SWITCH UI

Add to the MM Dashboard Overview tab (or a new Settings tab):

```tsx
// Autopilot toggle in dashboard
const [autopilot, setAutopilot] = useState(true);

async function toggleAutopilot() {
  const newValue = !autopilot;
  await getSupabase()
    .from("platform_settings")
    .update({ value: { ...currentSettings, enabled: newValue } })
    .eq("key", "content_autopilot");
  setAutopilot(newValue);
}

// Render:
// [🟢 Autopilot ON] or [🔴 Autopilot OFF] toggle button
// Show: "Next run: 2 AM Central" / "Autopilot paused"
// Show: "Generated last night: 10 articles, 9 auto-published, 1 held for review"
```

## EMERGENCY STOP OPTIONS

1. **Dashboard toggle** — flip autopilot off from the MM dashboard
2. **Supabase SQL** — UPDATE platform_settings SET value = jsonb_set(value, '{enabled}', 'false')
3. **Vercel dashboard** — disable the cron job in Vercel project settings
4. **Archive bad articles** — from dashboard, reject/archive removes from site instantly
5. **Delete from Supabase** — nuclear option, delete content_records rows directly

## MONITORING

After each nightly run, the system should:
- Log total generated, auto-published, held for review, failed
- Write to agent_run_log table
- Optionally send a summary to anthony@livin.in via Resend (when email is set up)

## REFERENCE

- Supabase: bmemtekrchzoxpwtaufd
- Houston city_id: c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e
- OpenRouter key: OPENROUTER_API_KEY in .env.local
- Models: deepseek/deepseek-chat (research+content), google/gemini-2.5-flash-preview-image-generation (images)
- Storage bucket: content-images (public)
- Platform settings table: platform_settings (kill switch)
- Content lifecycle: 10 states, trigger-enforced
- MM login: marcus@livin.in / LivinHouston2026!
