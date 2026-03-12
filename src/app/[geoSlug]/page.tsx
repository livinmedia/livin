// ============================================================
// LIVIN — City Page  src/app/[geoSlug]/page.tsx
// All sections corrected to match livin_mock_up.png exactly
// ============================================================

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Brand } from '@/lib/routing/brand-context'
import { resolveGeoSlug } from '@/lib/routing/geo-resolver'
import { normalizeIncomingSlug } from '@/lib/routing/slug-normalizer'
import { getCrossplatformLink } from '@/lib/routing/cross-platform-links'

// Top 100 cities: SSG via generateStaticParams below
// All other geo pages: 1hr revalidation — Doc 2, Section 4.4
export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('slug')
      .eq('is_active', true)
      .eq('is_top_100', true)
      .order('population', { ascending: false })
      .limit(100)

    if (error || !cities) return []
    return cities.map(city => ({ geoSlug: city.slug }))
  } catch (err) {
    return []
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATE_ABBR: Record<string,string> = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',
  colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',
  hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',
  kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',
  michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',
  nebraska:'NE',nevada:'NV','new-hampshire':'NH','new-jersey':'NJ',
  'new-mexico':'NM','new-york':'NY','north-carolina':'NC','north-dakota':'ND',
  ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode-island':'RI',
  'south-carolina':'SC','south-dakota':'SD',tennessee:'TN',texas:'TX',
  utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west-virginia':'WV',
  wisconsin:'WI',wyoming:'WY','district-of-columbia':'DC',
}
function getAbbr(slug:string):string {
  const p=slug.split('-')
  if(p.length>=2){const t=STATE_ABBR[p.slice(-2).join('-')];if(t)return t}
  return STATE_ABBR[p[p.length-1]]||''
}

const HERO:Record<string,string>={
  TX:'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1400&q=85&auto=format&fit=crop',
  CA:'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1400&q=85&auto=format&fit=crop',
  NY:'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1400&q=85&auto=format&fit=crop',
  FL:'https://images.unsplash.com/photo-1559599746-8823b38544c6?w=1400&q=85&auto=format&fit=crop',
  IL:'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1400&q=85&auto=format&fit=crop',
  WA:'https://images.unsplash.com/photo-1438401171849-74ac270044ee?w=1400&q=85&auto=format&fit=crop',
  CO:'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=1400&q=85&auto=format&fit=crop',
  GA:'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=1400&q=85&auto=format&fit=crop',
  TN:'https://images.unsplash.com/photo-1545419913-775e3f043e5e?w=1400&q=85&auto=format&fit=crop',
  AZ:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85&auto=format&fit=crop',
  NV:'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1400&q=85&auto=format&fit=crop',
  NC:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1400&q=85&auto=format&fit=crop',
  OR:'https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?w=1400&q=85&auto=format&fit=crop',
  PA:'https://images.unsplash.com/photo-1575367439058-6096bb9cf5e2?w=1400&q=85&auto=format&fit=crop',
  MO:'https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=1400&q=85&auto=format&fit=crop',
  DEFAULT:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=85&auto=format&fit=crop',
}

type Props={params:Promise<{geoSlug:string}>}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {geoSlug}=await params
  const {normalizedSlug}=normalizeIncomingSlug(geoSlug??'')
  if(!normalizedSlug)return{title:'Not Found'}
  const geo=await resolveGeoSlug(normalizedSlug)
  if(!geo)return{title:'Not Found'}
  return{
    title:`Experience the Best of ${geo.name} | LIVIN`,
    description:`Discover neighborhoods, events, businesses and lifestyle in ${geo.name}.`,
    alternates:{canonical:`https://livin.in/${geo.slug}`},
  }
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',system-ui,sans-serif;color:#1a1a1a;background:#f4f5f4;-webkit-font-smoothing:antialiased;}
a{text-decoration:none;color:inherit;}
button{font-family:'DM Sans',sans-serif;cursor:pointer;}
img{display:block;}

/* ONE ALIGNMENT SYSTEM — everything uses .W */
.W{max-width:1100px;margin:0 auto;padding:0 32px;}

/* ── NAV ── */
.nav{position:absolute;top:0;left:0;right:0;z-index:50;}
.nav .W{display:flex;align-items:center;padding-top:18px;padding-bottom:18px;}
.nav-logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:2.5px;text-transform:uppercase;text-shadow:0 1px 6px rgba(0,0,0,0.4);flex-shrink:0;}
.nav-links{display:flex;gap:24px;list-style:none;margin:0 auto;}
.nav-links a{font-size:13px;font-weight:500;color:rgba(255,255,255,0.93);display:inline-flex;align-items:center;gap:2px;text-shadow:0 1px 4px rgba(0,0,0,0.3);white-space:nowrap;}
.nav-links a span{font-size:8px;opacity:0.7;}
.nav-cta{background:#1e2d50;color:#fff;border:none;padding:9px 18px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.nav-cta:hover{background:#26396a;}
.nav-burger{display:none;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;margin-left:auto;}

/* ── HERO ── */
.hero{position:relative;width:100%;height:420px;overflow:hidden;background:#1a2a1e;}
.hero-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.12) 0%,rgba(0,0,0,0.18) 28%,rgba(0,0,0,0.55) 65%,rgba(0,0,0,0.82) 100%);}
.hero-body{position:absolute;bottom:0;left:0;right:0;z-index:10;}
.hero-body .W{padding-bottom:36px;}
.hero-title{font-size:40px;font-weight:800;color:#fff;line-height:1.1;margin-bottom:8px;text-shadow:0 2px 12px rgba(0,0,0,0.35);max-width:540px;}
.hero-sub{font-size:13.5px;color:rgba(255,255,255,0.85);margin-bottom:20px;font-weight:400;}
.hero-bar{display:inline-flex;align-items:stretch;background:#fff;border-radius:7px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.3);}
.hero-sel{height:44px;padding:0 10px 0 12px;border:none;border-right:1px solid #e5e5e5;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#222;background:#fff;cursor:pointer;outline:none;min-width:100px;}
.hero-btn{height:44px;padding:0 28px;background:#f5a623;color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.15s;white-space:nowrap;}
.hero-btn:hover{background:#e09018;}

/* ── SECTION HEADERS ── */
.sec-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.sec-title{font-size:19px;font-weight:700;color:#1a1a1a;}
/* Small pill link in section header (e.g. "View All Listings") */
.sec-pill{font-size:12px;font-weight:500;color:#555;border:1px solid #e0e0e0;border-radius:999px;padding:4px 12px;background:#fff;white-space:nowrap;transition:border-color 0.15s;}
.sec-pill:hover{border-color:#bbb;color:#222;}
.pt-28{padding-top:28px;}

/* ── CITY OVERVIEW — 4 floating cards ── */
.cov-outer{margin-bottom:32px;}
/* Row of 4 equal-width floating cards */
.cov-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px;}

/* Each floating card */
.cov-card{
  background:#fff;
  border:1px solid #e8e8e8;
  border-radius:10px;
  box-shadow:0 1px 6px rgba(0,0,0,0.06);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:18px 14px;
  text-align:center;
  min-height:110px;
}

/* Card 1 — Gauge */
.cov-gauge-wrap{position:relative;width:110px;height:66px;margin-bottom:10px;}
.cov-gauge-wrap svg{overflow:visible;}
/* Score sits BELOW the arc, centered */
.cov-score-row{display:flex;flex-direction:column;align-items:center;gap:4px;}
.cov-score-num{font-size:26px;font-weight:800;color:#2a7d4f;line-height:1;}
.cov-score-tag{font-size:10px;font-weight:700;color:#2a7d4f;background:#e6f4ec;padding:2px 10px;border-radius:999px;}

/* Card 2 — Population */
.cov-pop-val{font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.15;margin-bottom:2px;}
.cov-pop-chg{font-size:11px;color:#2a7d4f;font-weight:600;margin-left:2px;}
.cov-pop-sub{font-size:10px;color:#ccc;margin-bottom:4px;}
.cov-pop-lbl{font-size:11px;color:#aaa;}

/* Card 3 — New Residents | Local Businesses (side by side) */
.cov-split{display:flex;align-items:center;gap:0;width:100%;}
.cov-split-col{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 8px;}
.cov-split-divider{width:1px;height:44px;background:#efefef;flex-shrink:0;}
.cov-split-val{font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.15;margin-bottom:3px;}
.cov-split-lbl{font-size:10.5px;color:#aaa;}

/* Card 4 — Locals forever + icon */
.cov-last{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;}
.cov-last-val{font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.15;}
.cov-last-lbl{font-size:11px;color:#aaa;margin-bottom:4px;}
.cov-last-icon{font-size:28px;opacity:0.6;}

/* More button centered */
.cov-more-row{display:flex;justify-content:center;}
.cov-more-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 20px;background:#fff;border:1px solid #e0e0e0;border-radius:999px;font-size:12px;font-weight:500;color:#666;cursor:pointer;transition:border-color 0.15s;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.05);}
.cov-more-btn:hover{border-color:#bbb;color:#333;}

/* ── NEIGHBORHOOD GRID ── */
.nbhd-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
.nbhd-card{background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;display:block;transition:box-shadow 0.18s,transform 0.18s;box-shadow:0 1px 4px rgba(0,0,0,0.05);}
.nbhd-card:hover{box-shadow:0 5px 16px rgba(0,0,0,0.10);transform:translateY(-2px);}
.nbhd-photo{width:100%;height:148px;object-fit:cover;}
.nbhd-body{padding:10px 11px 11px;}
.nbhd-name{font-size:13.5px;font-weight:700;color:#1a1a1a;margin-bottom:3px;}
.nbhd-desc{font-size:11.5px;color:#aaa;line-height:1.4;margin-bottom:9px;}
/* Footer: rounded border, light gray bg, BLACK text, clickable */
.nbhd-foot{
  display:flex;align-items:center;gap:5px;
  border:1px solid #e0e0e0;
  background:#f0f0f0;
  border-radius:6px;
  padding:5px 8px;
  cursor:pointer;
  transition:background 0.15s;
}
.nbhd-foot:hover{background:#e8e8e8;}
.nbhd-pin{font-size:10px;color:#e53935;flex-shrink:0;}
.nbhd-foot-lbl{font-size:10.5px;color:#1a1a1a;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.nbhd-arr{width:20px;height:20px;background:#ddd;border:none;border-radius:50%;font-size:10px;color:#444;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;}
.nbhd-arr:hover{background:#ccc;}
/* View All Neighborhoods — small pill with border, centered below grid */
.nbhd-view-all-row{display:flex;justify-content:center;margin-bottom:36px;}
.nbhd-view-all{display:inline-flex;align-items:center;gap:4px;padding:8px 20px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;font-size:12.5px;font-weight:600;color:#555;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.05);transition:border-color 0.15s;text-decoration:none;}
.nbhd-view-all:hover{border-color:#bbb;color:#222;}

/* ── TWO-COL: EVENTS + PROPERTIES ── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-bottom:36px;}
.col-group{display:flex;flex-direction:column;}
.col-cards{display:flex;gap:12px;align-items:stretch;}
.col-card{flex:1;background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow 0.18s,transform 0.18s;text-decoration:none;color:inherit;box-shadow:0 1px 4px rgba(0,0,0,0.05);}
.col-card:hover{box-shadow:0 4px 14px rgba(0,0,0,0.09);transform:translateY(-2px);}
.col-photo{width:100%;height:120px;object-fit:cover;flex-shrink:0;}
.col-body{padding:10px 11px;flex:1;display:flex;flex-direction:column;}
.col-name{font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:6px;line-height:1.3;}
.col-row{display:flex;align-items:flex-start;gap:4px;font-size:10.5px;color:#aaa;margin-bottom:3px;line-height:1.35;}
/* View All button — small centered pill, NOT full width */
.col-view-all-row{display:flex;justify-content:center;margin-top:12px;}
.col-view-all{display:inline-flex;align-items:center;gap:4px;padding:8px 24px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;font-size:12.5px;font-weight:600;color:#555;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.05);transition:border-color 0.15s;text-decoration:none;white-space:nowrap;}
.col-view-all:hover{border-color:#bbb;color:#222;}

/* ── MARKET MAYOR ── */
/* Outer: 2-col equal grid, capped 150–250px tall */
.mm-wrap{
  display:grid;
  grid-template-columns:1fr 1fr;
  background:#f7f8f7;
  border:1px solid #e8e8e8;
  border-radius:8px;
  margin-bottom:36px;
  overflow:hidden;
  min-height:200px;
  max-height:250px;
}

/* LEFT — white bio card */
.mm-left{
  padding:20px 22px;
  border-right:1px solid #e8e8e8;
  display:flex;
  flex-direction:column;
  background:#fff;
}
.mm-identity{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.mm-avatar{width:48px;height:48px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#66bb6a,#2e7d32);flex-shrink:0;}
.mm-avatar img{width:100%;height:100%;object-fit:cover;}
.mm-name{font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:2px;}
.mm-stars{color:#f5a623;font-size:13px;letter-spacing:1px;}
.mm-bio{font-size:12px;color:#777;line-height:1.55;margin-bottom:14px;flex:1;}
.mm-actions{display:flex;align-items:center;gap:8px;}
.mm-learn{background:#fff;border:1px solid #ddd;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;color:#333;cursor:pointer;}
.mm-learn:hover{border-color:#aaa;}
.mm-icon{background:none;border:none;font-size:14px;color:#bbb;padding:3px;cursor:pointer;}
.mm-icon:hover{color:#666;}

/* RIGHT panel — flex row, padded, 5px gap between photo and details */
.mm-right{
  display:flex;
  flex-direction:row;
  align-items:center;   /* vertically center photo+details group */
  justify-content:center;
  padding:12px 14px;
  gap:5px;
  background:#f7f8f7;
}

/* Mayor photo: exactly 150px wide, stretches full height of right panel */
.mm-photo-col{
  width:150px;
  flex-shrink:0;
  align-self:stretch;   /* fill full panel height */
  border-radius:6px;
  overflow:hidden;
  background:#b0bec5;
}
.mm-photo-col img{
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center top;  /* mayor face centered at top */
  display:block;
}

/* Detail column: centers the inner card (google+button) vertically & horizontally */
.mm-detail-col{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;     /* center the inner-card horizontally */
  justify-content:center; /* center the inner-card vertically */
}

/* Inner card: google rating box directly above CTA, both 300px wide */
.mm-inner-card{
  width:100%;
  max-width:300px;
  display:flex;
  flex-direction:column;
  gap:0;
}

/* Google rating box — top of inner card */
.mm-google{
  background:#fff;
  border:1px solid #e5e5e5;
  border-bottom:none;
  border-radius:6px 6px 0 0;
  padding:10px 12px;
}
.mm-g-row{display:flex;align-items:center;gap:4px;margin-bottom:3px;flex-wrap:wrap;}
.mm-g-word{font-size:12px;font-weight:800;letter-spacing:-0.2px;}
.g1{color:#4285f4}.g2{color:#ea4335}.g3{color:#fbbc05}.g4{color:#34a853}.g5{color:#4285f4}.g6{color:#ea4335}
.mm-g-stars{color:#f5a623;font-size:10px;}
.mm-g-score{font-size:10px;font-weight:700;color:#1a1a1a;margin-left:2px;}
.mm-g-text{font-size:9.5px;color:#999;line-height:1.45;margin-top:4px;}

/* CTA: bottom of inner card, flush below google box, same 300px width, ~15px tall */
.mm-cta{
  width:100%;
  background:#f5a623;
  color:#fff;
  border:none;
  border-radius:0 0 6px 6px;  /* rounded bottom only, connects to google box */
  padding:6px 0;               /* ~15px visual height */
  height:28px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  text-align:center;
  flex-shrink:0;
  transition:background 0.15s;
  display:flex;
  align-items:center;
  justify-content:center;
}
.mm-cta:hover{background:#e09018;}

/* ── ARTICLES ── */
.no-content{padding:40px;text-align:center;background:#fff;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:36px;}
.no-content-t{font-size:14px;font-weight:600;color:#666;margin-bottom:5px;}
.no-content-s{font-size:12px;color:#bbb;}
.art-list{margin-bottom:36px;}
.art-row{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #f0f0f0;align-items:flex-start;text-decoration:none;color:inherit;}
.art-row:last-child{border-bottom:none;}
.art-thumb{width:74px;height:74px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;}
.art-cat{font-size:10px;font-weight:700;color:#2a7d4f;text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px;}
.art-title{font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.35;margin-bottom:4px;}
.art-exc{font-size:12.5px;color:#999;line-height:1.5;}

/* ── FOOTER ── */
.footer{background:#1a1a1a;}
.footer .W{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:18px;padding-bottom:18px;}
.footer-left{display:flex;align-items:center;gap:12px;}
.footer-logo{font-size:20px;font-weight:800;color:#fff;letter-spacing:2.5px;text-transform:uppercase;}
.footer-socials{display:flex;gap:7px;}
.footer-soc{width:26px;height:26px;background:rgba(255,255,255,0.10);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);transition:background 0.15s;text-decoration:none;}
.footer-soc:hover{background:rgba(255,255,255,0.2);color:#fff;}
.footer-copy{font-size:11.5px;color:rgba(255,255,255,0.45);line-height:1.6;text-align:right;}

/* ── MOBILE ── */
@media(max-width:900px){
  .nbhd-grid{grid-template-columns:repeat(2,1fr);}
  .cov-cards{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:700px){
  .W{padding:0 18px;}
  .nav-links,.nav-cta{display:none;}
  .nav-burger{display:block;}
  .hero{height:360px;}
  .hero-title{font-size:28px;}
  .hero-bar{display:flex;flex-wrap:wrap;width:100%;}
  .hero-sel{flex:1;min-width:0;border-right:none;border-bottom:1px solid #e5e5e5;}
  .hero-btn{flex:1;}
  .two-col{grid-template-columns:1fr;gap:24px;}
  .mm-wrap{grid-template-columns:1fr;max-height:none;}
  .mm-left{border-right:none;border-bottom:1px solid #e8e8e8;}
  .mm-right{flex-direction:column;align-items:center;padding:14px;}
  .mm-photo-col{width:100%;height:140px;}
  .mm-detail-col{width:100%;}
  .mm-cta{max-width:100%;}
  .footer .W{flex-direction:column;align-items:flex-start;gap:10px;}
  .footer-copy{text-align:left;}
}
@media(max-width:480px){
  .nbhd-grid{grid-template-columns:1fr;}
  .cov-cards{grid-template-columns:1fr;}
  .col-cards{flex-direction:column;}
}
`

export default async function GeoPage({params}:Props) {
  const {geoSlug}=await params
  const headersList=await headers()
  const brand=(headersList.get('x-brand') as Brand)||Brand.LIVIN
  const isHL=brand===Brand.HOMES_AND_LIVIN

  const {normalizedSlug}=normalizeIncomingSlug(geoSlug??'')
  if(!normalizedSlug)notFound()
  const geo=await resolveGeoSlug(normalizedSlug)
  if(!geo)notFound()

  if(geo.level==='city'){
    const {data:articles}=await supabase
      .from('content_records')
      .select('id,title,slug,excerpt,category,published_at,word_count')
      .eq('city_id',geo.id)
      .eq('brand',isHL?'homes_and_livin':'livin')
      .eq('status','published')
      .order('published_at',{ascending:false})
      .limit(8)

    const crossLink = await getCrossplatformLink(brand, geo.slug)
    const stateAbbr=getAbbr(geo.slug)
    const heroPhoto=HERO[stateAbbr]||HERO.DEFAULT
    const mayorName='Mayor Scott'
    const yr=new Date().getFullYear()

    const NBHD=[
      {name:'Alden Bridge',desc:'Family-friendly with woods trails',meta:'Alden Bridge · Near support',photo:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80&auto=format&fit=crop'},
      {name:'East Shore',desc:'Luxury lakeside living',meta:'East Shore · Keng sur',photo:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80&auto=format&fit=crop'},
      {name:'Creekside Park',desc:'Elegant new homes among parks',meta:'Local Businesses',photo:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80&auto=format&fit=crop'},
      {name:'Town Center',desc:'Vibrant urban core',meta:'Town Center · Fourth view',photo:'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80&auto=format&fit=crop'},
    ]
    const EVENTS=[
      {name:'Community Farmers Market',date:'Saturday, May · Town Center Plaza',meta:'35,090 est/we · 1.88%',photo:'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80&auto=format&fit=crop'},
      {name:'Wine & Food Festival',date:'Friday, May · Waterway Square',meta:'5,000 · nepvrs · 1.40%',photo:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80&auto=format&fit=crop'},
    ]
    const PROPS=[
      {price:'$995,000',beds:'5 beds · 4 baths · 3,100 sqft',lot:'1,200 · $550',photo:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80&auto=format&fit=crop'},
      {price:'$1,450,000',beds:'6 beds · 5 baths · 5,100 sqft',lot:'5,000 · 3,338',photo:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80&auto=format&fit=crop'},
    ]
    const THUMBS=[{bg:'#a5d6a7',em:'📰'},{bg:'#90caf9',em:'🏙️'},{bg:'#ffcc80',em:'🍽️'},{bg:'#ce93d8',em:'🎉'}]

    return (
      <>
        <style>{CSS}</style>

        {/* HERO */}
        <div className="hero">
          <img src={heroPhoto} alt={`${geo.name} skyline`} className="hero-photo"/>
          <div className="hero-overlay"/>
          <nav className="nav">
            <div className="W">
              <div className="nav-logo">LIVIN</div>
              <ul className="nav-links">
                {['Explore','Events','Properties','Businesses'].map(l=>(
                  <li key={l}><a href="#">{l} <span>▾</span></a></li>
                ))}
              </ul>
              <button className="nav-cta">Contact {mayorName}</button>
              <button className="nav-burger">☰</button>
            </div>
          </nav>
          <div className="hero-body">
            <div className="W">
              <h1 className="hero-title">Experience the Best of<br/>{geo.name}, {stateAbbr}</h1>
              <p className="hero-sub">Your guide to the finest living, business, and events.</p>
              <div className="hero-bar">
                <select className="hero-sel"><option>Buy</option><option>Rent</option><option>Explore</option></select>
                <select className="hero-sel"><option>Neighborhoods</option><option>All Areas</option></select>
                <select className="hero-sel"><option>Price Range</option><option>Any Price</option></select>
                <button className="hero-btn">Search</button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTIONS */}
        <div className="W">

          {/* CITY OVERVIEW — 4 floating cards */}
          <div className="sec-hdr pt-28">
            <h2 className="sec-title">City Overview</h2>
            <a href="#" className="sec-pill">More Community Insights &rsaquo;</a>
          </div>
          <div className="cov-outer">
            <div className="cov-cards">

              {/* Card 1 — Gauge */}
              <div className="cov-card">
                <div className="cov-gauge-wrap">
                  <svg viewBox="0 0 110 66" width="110" height="66">
                    {/* Track arc — semicircle */}
                    <path d="M 8 62 A 47 47 0 0 1 102 62"
                      fill="none" stroke="#e6f4ec" strokeWidth="9" strokeLinecap="butt"/>
                    {/* Green fill arc ~82% */}
                    <path d="M 8 62 A 47 47 0 0 1 102 62"
                      fill="none" stroke="#4caf50" strokeWidth="9" strokeLinecap="butt"
                      strokeDasharray="147.7" strokeDashoffset="26.6"/>
                  </svg>
                </div>
                <div className="cov-score-row">
                  <span className="cov-score-num">82</span>
                  <span className="cov-score-tag">Healthy</span>
                </div>
              </div>

              {/* Card 2 — Population */}
              <div className="cov-card">
                <div className="cov-pop-val">45,320 <span className="cov-pop-chg">+1.88%</span></div>
                <div className="cov-pop-sub">growth</div>
                <div className="cov-pop-lbl">Population</div>
              </div>

              {/* Card 3 — New Residents | Local Businesses side by side */}
              <div className="cov-card" style={{padding:'18px 10px'}}>
                <div className="cov-split">
                  <div className="cov-split-col">
                    <div className="cov-split-val">+1,832</div>
                    <div className="cov-split-lbl">New Residents</div>
                  </div>
                  <div className="cov-split-divider"/>
                  <div className="cov-split-col">
                    <div className="cov-split-val">342</div>
                    <div className="cov-split-lbl">Local Businesses</div>
                  </div>
                </div>
              </div>

              {/* Card 4 — Locals forever + building icon */}
              <div className="cov-card">
                <div className="cov-last">
                  <div>
                    <div className="cov-last-val">312,29</div>
                    <div className="cov-last-lbl">Locals forever</div>
                  </div>
                  <div className="cov-last-icon">🏢</div>
                </div>
              </div>

            </div>
            <div className="cov-more-row">
              <button className="cov-more-btn">⊕ More Community Insights</button>
            </div>
          </div>

          {/* NEIGHBORHOOD HIGHLIGHTS */}
          <div className="sec-hdr">
            <h2 className="sec-title">Neighborhood Highlights</h2>
            <a href="#" className="sec-pill">View All Neighborhoods &rsaquo;</a>
          </div>
          <div className="nbhd-grid">
            {NBHD.map(n=>(
              <a href="#" key={n.name} className="nbhd-card">
                <img src={n.photo} alt={n.name} className="nbhd-photo"/>
                <div className="nbhd-body">
                  <div className="nbhd-name">{n.name}</div>
                  <div className="nbhd-desc">{n.desc}</div>
                  <div className="nbhd-foot">
                    <span className="nbhd-pin">📍</span>
                    <span className="nbhd-foot-lbl">{n.meta}</span>
                    <button className="nbhd-arr">↗</button>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {/* Small centered View All pill below grid */}
          <div className="nbhd-view-all-row">
            <a href="#" className="nbhd-view-all">View All Neighborhoods &rsaquo;</a>
          </div>

          {/* UPCOMING EVENTS + FEATURED PROPERTIES */}
          <div className="two-col">

            {/* Events */}
            <div className="col-group">
              <div className="sec-hdr">
                <h2 className="sec-title">Upcoming Events</h2>
              </div>
              <div className="col-cards">
                {EVENTS.map(e=>(
                  <a href="#" key={e.name} className="col-card">
                    <img src={e.photo} alt={e.name} className="col-photo"/>
                    <div className="col-body">
                      <div className="col-name">{e.name}</div>
                      <div className="col-row"><span>📅</span><span>{e.date}</span></div>
                      <div className="col-row"><span>👥</span><span>{e.meta}</span></div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="col-view-all-row">
                <a href="#" className="col-view-all">View All Neighborhoods &rsaquo;</a>
              </div>
            </div>

            {/* Properties */}
            <div className="col-group">
              <div className="sec-hdr">
                <h2 className="sec-title">Featured Properties</h2>
                <a href={crossLink?.url||'#'} rel={crossLink?.rel} target={crossLink?.target} className="sec-pill">
  View All Listings &rsaquo;
</a>
              </div>
              <div className="col-cards">
                {PROPS.map(p=>(
                  <a href={crossLink?.url||'#'} key={p.price} rel={crossLink?.rel} target={crossLink?.target} className="col-card">
                    <img src={p.photo} alt={p.price} className="col-photo"/>
                    <div className="col-body">
                      <div className="col-name">{p.price}</div>
                      <div className="col-row"><span>🛏</span><span>{p.beds}</span></div>
                      <div className="col-row"><span>📐</span><span>{p.lot}</span></div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="col-view-all-row">
                <a href={crossLink?.url||'#'} rel={crossLink?.rel} target={crossLink?.target} className="col-view-all">View All Listings &rsaquo;</a>
              </div>
            </div>

          </div>

          {/* TRUSTED LOCAL EXPERTS */}
          <div className="sec-hdr">
            <h2 className="sec-title">Trusted Local Experts</h2>
          </div>
          {/* mm-wrap IS the 2-col grid itself */}
          <div className="mm-wrap">

            {/* LEFT */}
            <div className="mm-left">
                <div className="mm-identity">
                  <div className="mm-avatar">
                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop&crop=face" alt={mayorName}/>
                  </div>
                  <div>
                    <div className="mm-name">{mayorName}</div>
                    <div className="mm-stars">★★★★☆</div>
                  </div>
                </div>
                <p className="mm-bio">
                  Meet {mayorName}, your dedicated community leader and LIVIN Market Mayor
                  for {geo.name}. Here to connect you with a local or local living.
                </p>
                <div className="mm-actions">
                  <button className="mm-learn">Learn More</button>
                  <button className="mm-icon">♡</button>
                  <button className="mm-icon">✉</button>
                </div>
              </div>


            {/* RIGHT — photo flush-left, detail col flush-right, zero gaps */}
            <div className="mm-right">
              {/* Mayor photo fills height, no border-radius, flush edges */}
              <div className="mm-photo-col">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop&crop=top" alt="Mayor Scott photo"/>
              </div>
              {/* Detail col: centers the inner-card (google + CTA) */}
              <div className="mm-detail-col">
                {/* Inner card: 300px wide, google box directly above CTA, zero gap */}
                <div className="mm-inner-card">
                  <div className="mm-google">
                    <div className="mm-g-row">
                      <span className="mm-g-word">
                        <span className="g1">G</span><span className="g2">o</span><span className="g3">o</span><span className="g4">g</span><span className="g5">l</span><span className="g6">e</span>
                      </span>
                      <span className="mm-g-stars">★★★★★</span>
                      <span className="mm-g-score">4.8 out of 5</span>
                    </div>
                    <div className="mm-g-text">Our Highest Listing site · #1 Multibuy Leads<br/>Connecting locals with the best of this city.</div>
                  </div>
                  <button className="mm-cta">Contact Mayor Scott</button>
                </div>
              </div>
            </div>

          </div>

          {/* ARTICLES */}
          {articles&&articles.length>0?(
            <>
              <div className="sec-hdr">
                <h2 className="sec-title">Latest from {geo.name}</h2>
                <a href="#" className="sec-pill">View All &rsaquo;</a>
              </div>
              <div className="art-list">
                {articles.map((a,i)=>{
                  const t=THUMBS[i%THUMBS.length]
                  return(
                    <a href={`/${geo.slug}/${a.slug}`} key={a.id} className="art-row">
                      <div className="art-thumb" style={{background:t.bg}}>{t.em}</div>
                      <div style={{flex:1}}>
                        {a.category&&<div className="art-cat">{a.category.replace(/-/g,' ')}</div>}
                        <div className="art-title">{a.title}</div>
                        {a.excerpt&&<div className="art-exc">{a.excerpt}</div>}
                      </div>
                    </a>
                  )
                })}
              </div>
            </>
          ):(
            <div className="no-content">
              <div className="no-content-t">Content coming soon for {geo.name}</div>
              <div className="no-content-s">Our AI content pipeline is warming up for this city.</div>
            </div>
          )}

        </div>{/* end .W */}

        {/* FOOTER */}
        <footer className="footer">
          <div className="W">
            <div className="footer-left">
              <span className="footer-logo">LIVIN</span>
              <div className="footer-socials">
                {[['f','Facebook'],['in','LinkedIn'],['▶','YouTube'],['ig','Instagram']].map(([l,t])=>(
                  <a key={String(l)} href="#" className="footer-soc" title={String(t)}>{l}</a>
                ))}
              </div>
            </div>
            <div className="footer-copy">
              © {yr} LIVIN. All Rights Reserved. · {geo.name}, {stateAbbr}
            </div>
          </div>
        </footer>
      </>
    )
  }

  // STATE PAGE
  if(geo.level==='state'){
    const {data:cities}=await supabase
      .from('cities').select('name,slug,is_pilot,has_market_mayor')
      .eq('state_region_id',geo.id).eq('is_active',true)
      .order('launch_priority',{ascending:true}).limit(50)
    return(
      <>
        <style>{CSS}</style>
        <nav style={{background:'#1e2d50'}}>
          <div className="W" style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:16,paddingBottom:16}}>
            <a href="/" style={{fontWeight:800,fontSize:20,color:'#fff',letterSpacing:2,textTransform:'uppercase'}}>LIVIN</a>
            <a href="/" style={{fontSize:13,color:'rgba(255,255,255,0.65)'}}>← All Cities</a>
          </div>
        </nav>
        <div className="W" style={{paddingTop:36,paddingBottom:60}}>
          <h1 style={{fontSize:34,fontWeight:800,marginBottom:8}}>Living in {geo.name}</h1>
          <p style={{color:'#aaa',marginBottom:28,fontSize:14}}>Explore the best cities across {geo.name}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
            {cities?.map(city=>(
              <a key={city.slug} href={`/${city.slug}`} style={{padding:16,background:'#fff',border:'1px solid #e5e5e5',borderLeft:'4px solid #1e2d50',borderRadius:8}}>
                <div style={{fontWeight:700,color:'#1e2d50',marginBottom:4,fontSize:14}}>{city.name}</div>
                {city.has_market_mayor&&<div style={{fontSize:11,color:'#2a7d4f'}}>✓ Market Mayor Active</div>}
                {city.is_pilot&&<div style={{fontSize:11,color:'#f5a623'}}>★ Pilot City</div>}
              </a>
            ))}
          </div>
        </div>
      </>
    )
  }

  // COUNTRY PAGE
  return(
    <>
      <style>{CSS}</style>
      <nav style={{background:'#1e2d50'}}>
        <div className="W" style={{paddingTop:16,paddingBottom:16}}>
          <a href="/" style={{fontWeight:800,fontSize:20,color:'#fff',letterSpacing:2,textTransform:'uppercase'}}>LIVIN</a>
        </div>
      </nav>
      <div className="W" style={{paddingTop:36,paddingBottom:60}}>
        <h1 style={{fontSize:34,fontWeight:800,marginBottom:8}}>Cities of {geo.name}</h1>
        <p style={{color:'#aaa',fontSize:14}}>Explore lifestyle destinations across {geo.name}</p>
      </div>
    </>
  )
}
