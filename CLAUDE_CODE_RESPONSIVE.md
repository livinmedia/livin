# LIVIN — Mobile Responsive Audit & Fix
# Run in Claude Code from ~/Projects/livin-platform

## TASK: Make All LIVIN.in Pages Fully Mobile Responsive

Every public-facing page must look great on mobile (320px-480px), tablet (768px),
and desktop (1024px+). The MM Dashboard should also be usable on tablet.

## PAGES TO AUDIT & FIX

### 1. Homepage — src/app/page.tsx
Current: Cinematic hero, city ticker, 3x3 grid, lifestyle cards, content section.
Mobile issues to check:
- Hero section: text sizing, CTA button tap targets (min 44px)
- City ticker: horizontal scroll or wrap
- 3x3 grid → stack to single column on mobile, 2-col on tablet
- Lifestyle cards → horizontal scroll or stack
- Content section → single column
- Navigation/header → hamburger menu on mobile
- All text readable without pinch-zoom (min 16px body)
- Images: use `object-fit: cover` and responsive sizing

### 2. City Page — src/app/[citySlug]/page.tsx
Current: Houston page with articles list, homes section, MVP partners, MM anchor.
Mobile issues to check:
- Article grid → single column on mobile
- Homes section → stack cards vertically
- MVP partner cards → single column
- MM profile section → stack photo/bio vertically
- Sidebar (if any) → collapse below main content
- Article cards: title + excerpt readable, image fills width

### 3. Article Page — src/app/[citySlug]/[articleSlug]/page.tsx
Current: Hero image, breadcrumbs, body content, sidebar, related articles.
Mobile issues to check:
- Hero image: full-width, max-height 50vh on mobile
- Breadcrumbs: truncate or wrap gracefully
- Body content: max-width with padding (no edge-to-edge text)
- Sidebar → moves below article on mobile
- Related articles grid → horizontal scroll or 1-column stack
- Share/save buttons: sticky bottom bar on mobile
- Article body typography: 18px body, 1.7 line-height for readability
- Images within body_json: max-width: 100%

### 4. Login Page — src/app/login/page.tsx
Current: Centered card with email/password form.
Mobile issues to check:
- Form card: add horizontal padding, don't exceed screen width
- Input fields: full width, 16px font (prevents iOS zoom)
- Buttons: full width, min 48px height for touch
- Already likely OK but verify max-width and padding

### 5. MM Dashboard — src/app/dashboard/page.tsx
Current: Sidebar nav + main content with 5 tabs.
Mobile/tablet issues to check:
- Sidebar → bottom tab bar on mobile (like iOS tab bar)
- Stat cards 4-grid → 2x2 on tablet, stack on mobile
- Article list: remove truncation, full-width cards
- Approve/reject buttons: larger tap targets on mobile
- Lead cards: stack score + badge below name on mobile
- Profile info: single column
- Analytics grids → stack

### 6. State Pages (if built) — src/app/[stateSlug]/page.tsx
- Similar patterns to city page

### 7. 404 Pages — src/app/not-found.tsx or branded 404s
- Should be responsive already but verify

## RESPONSIVE DESIGN RULES

### Breakpoints (use these consistently)
```css
/* Mobile first — base styles are mobile */
/* Tablet */
@media (min-width: 768px) { }
/* Desktop */
@media (min-width: 1024px) { }
/* Large desktop */
@media (min-width: 1280px) { }
```

### Must-Haves
- **Mobile-first CSS** — base styles target mobile, media queries add desktop layouts
- **No horizontal scroll** on any page at any breakpoint (except intentional carousels)
- **Touch targets minimum 44px × 44px** for all interactive elements
- **Font sizes:** body minimum 16px (prevents iOS auto-zoom on input focus), headings scale down proportionally
- **Images:** `max-width: 100%; height: auto;` everywhere. Hero images: `object-fit: cover`
- **Padding:** 16px horizontal padding on mobile for all content containers
- **Grid layouts:** use CSS Grid with `minmax()` or Flexbox `flex-wrap` — never fixed pixel widths
- **Forms:** inputs must be `font-size: 16px` minimum (iOS zoom prevention)
- **Modals/overlays:** full-screen on mobile with close button in top-right
- **Tables:** horizontal scroll wrapper on mobile, or reformat as stacked cards

### Typography Scale
```
Mobile:
  h1: 28px (hero) / 24px (page titles)
  h2: 20px
  h3: 18px
  body: 16px
  caption: 14px
  
Desktop:
  h1: 48px (hero) / 32px (page titles)
  h2: 24px
  h3: 20px
  body: 16px-18px
  caption: 14px
```

### Navigation Pattern
- **Desktop:** horizontal nav bar with links
- **Mobile:** hamburger menu (slide-out or dropdown) OR sticky bottom nav
- Dashboard specifically: sidebar on desktop → bottom tab bar on mobile

### Image Strategy
- Hero images: `aspect-ratio: 16/9` on desktop, `aspect-ratio: 4/3` on mobile
- Article cards: thumbnail on left (desktop), full-width image on top (mobile)
- Use `<Image>` from next/image with `sizes` prop for responsive loading:
```tsx
<Image
  src={heroUrl}
  alt={title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

## TESTING

After making changes, test at these widths:
- 375px (iPhone SE / small phones)
- 390px (iPhone 14 / standard phones)
- 430px (iPhone 14 Pro Max / large phones)
- 768px (iPad Mini / tablets)
- 1024px (iPad Pro / small laptops)
- 1440px (desktop)

Use Chrome DevTools device toolbar to quickly toggle between sizes.

Check for:
- No horizontal overflow (scroll indicator in DevTools)
- All text readable without zoom
- All buttons/links tappable
- Images not overflowing containers
- No overlapping elements
- Forms usable (inputs don't cause zoom on iOS)

## EXECUTION ORDER

1. Start with the **Article Page** — this is the most visited page, highest SEO impact
2. Then **City Page** — second most visited
3. Then **Homepage** — landing page, first impression
4. Then **Dashboard** — MM usability on tablet
5. Then **Login** — quick check, probably mostly fine
6. Then **404** — quick check

After each page, run `npm run dev` and check in Chrome DevTools responsive mode.
Commit after each page is done:
```bash
git add -A && git commit -m "responsive: article page mobile layout"
git add -A && git commit -m "responsive: city page mobile layout"
# etc.
```

Push all at the end:
```bash
git push origin master
```

## BRAND DESIGN REFERENCE

- Dark theme: navy #0f172a background
- Gold accent: #d4a843
- Card backgrounds: rgba(255,255,255,0.04)
- Borders: rgba(255,255,255,0.08)
- Text primary: rgba(255,255,255,0.85)
- Text secondary: rgba(255,255,255,0.45)
- Font: Inter or system sans-serif
- The dark aesthetic should feel premium on mobile — no stark whites
