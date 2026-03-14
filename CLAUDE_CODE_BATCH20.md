# LIVIN — Batch Content Generation: 20 Houston Articles
# Run in Claude Code from ~/Projects/livin-platform

## TASK: Generate 20 New Houston Articles

Use the existing batch generator pattern (src/lib/agents/skills/batch-houston.ts)
to generate 20 new articles. Each article needs: DeepSeek V3 research → DeepSeek V3.2
content generation → Gemini hero image → Supabase insert → state machine walk to
awaiting_approval.

### Existing Articles (DO NOT DUPLICATE)
- 5 Best Tacos in Houston, Texas
- Best Brunch Spots in Houston Texas
- Best Coffee Shops in Houston Texas
- Best Food Trucks in Houston Texas
- Best Parks in Houston Texas
- Best Things to Do in Houston Texas
- Family Activities in Houston Texas
- Houston Texas Nightlife Guide

### 20 New Topics to Generate

**FOOD & DRINK (5)**
1. Best Barbecue in Houston Texas: Smokehouses & Pitmasters
2. Top Rooftop Bars in Houston Texas: Views & Cocktails
3. Best Seafood Restaurants in Houston Texas
4. Houston Texas Happy Hour Guide: Where to Go After Work
5. Best Vegan and Vegetarian Restaurants in Houston Texas

**NEIGHBORHOODS (4)**
6. Montrose Houston Texas: The Complete Neighborhood Guide
7. The Heights Houston Texas: Where History Meets Hip
8. Midtown Houston Texas: Living, Dining & Nightlife
9. EaDo Houston Texas: East Downtown's Creative Revival

**OUTDOORS & ACTIVITIES (4)**
10. Buffalo Bayou Park Houston: Trails, Kayaking & Events
11. Best Hiking and Nature Trails Near Houston Texas
12. Houston Texas Farmers Markets: Fresh, Local & Weekly
13. Best Dog Parks in Houston Texas: Where Pups Run Free

**CULTURE & ENTERTAINMENT (4)**
14. Houston Museum District Guide: Art, Science & History
15. Best Live Music Venues in Houston Texas
16. Houston Texas Street Art and Murals: A Self-Guided Tour
17. Houston Space Center and NASA: Visitor's Complete Guide

**LIFESTYLE & RELOCATION (3)**
18. Moving to Houston Texas: The Ultimate Relocation Guide
19. Best Gyms and Fitness Studios in Houston Texas
20. Houston Texas Date Night Ideas: Romantic Spots for Couples

### Generation Config

**AI Models (all via OpenRouter, OPENROUTER_API_KEY):**
- Research: deepseek/deepseek-chat (DeepSeek V3)
- Content: deepseek/deepseek-chat (DeepSeek V3.2 — tuned prompts, NO assistant prefill)
- Images: google/gemini-2.5-flash-preview-image-generation (add "no text, no words, no letters, no watermarks")
- Upload images to: Supabase Storage content-images/articles/{slug}.png
- Use SUPABASE_SERVICE_ROLE_KEY for storage uploads

**Content Requirements:**
- Minimum 1,200 words per article
- SEO-optimized: primary keyword in title, H1, first 100 words, 1-2% density
- body_json structure: { h1, sections: [{ h2, paragraphs: [string], internal_links }], conclusion }
- Also populate: body_content (plain text), excerpt (first 150 chars), word_count
- meta_description: 140-155 characters with primary keyword
- brand_tag: 'livin' (all articles are LIVIN brand)
- brand: 'livin'
- content_type: 'article' (neighborhoods = 'guide')
- source: 'ai_generated'
- city_id: 'c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e' (Houston)

**State Machine:**
Walk each article through: queued → generating → confirming → confirmed →
seo_optimized → linked → awaiting_approval

Do NOT publish — leave at awaiting_approval for MM dashboard review.

**Image Prompts (examples — adapt per topic):**
- Barbecue: "Houston Texas smokehouse, brisket on cutting board, wood smoke, warm lighting, no text no words no letters no watermarks"
- Rooftop bars: "Houston rooftop bar at sunset, skyline view, cocktails, string lights, no text no words no letters no watermarks"
- Montrose: "colorful Montrose neighborhood Houston, eclectic shops, tree-lined streets, no text no words no letters no watermarks"
- Buffalo Bayou: "Buffalo Bayou Park Houston, kayakers on water, downtown skyline, golden hour, no text no words no letters no watermarks"
- Museum District: "Houston Museum of Fine Arts exterior, cultural district, beautiful architecture, no text no words no letters no watermarks"
- Relocation: "Houston Texas skyline aerial view, sprawling city, green spaces, highways, no text no words no letters no watermarks"

**Execution:**
- Run in batches of 5 (to avoid rate limits)
- 3-second pause between articles
- 10-second pause between batches
- Log progress: "Generated 5/20... 10/20... 15/20... 20/20"
- If any article fails, log the error and continue to the next
- At the end, print summary: success count, failure count, list of awaiting_approval articles

### After Generation

Once all 20 are generated, verify in the terminal:
```bash
# Quick check via the existing test patterns
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data } = await sb.from('content_records').select('title, status, hero_image_url').eq('city_id', 'c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e').order('created_at', { ascending: false });
console.log('Total Houston articles:', data?.length);
console.log('Published:', data?.filter(d => d.status === 'published').length);
console.log('Awaiting:', data?.filter(d => d.status === 'awaiting_approval').length);
console.log('With images:', data?.filter(d => d.hero_image_url).length);
data?.forEach(d => console.log(' ', d.status.padEnd(20), d.title));
"
```

Expected result: 28 total (8 published + 20 awaiting_approval), all with hero images.

Then commit and push:
```bash
git add -A
git commit -m "feat: batch generate 20 Houston articles with hero images"
git push origin master
```

### Reference: Supabase Details
- Project: bmemtekrchzoxpwtaufd
- URL: https://bmemtekrchzoxpwtaufd.supabase.co
- Storage bucket: content-images (public)
- Houston city_id: c55e4fd5-53c6-4c58-b972-e2e22a9ddf3e
