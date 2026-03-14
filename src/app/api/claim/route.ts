import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/claim — browse cities with search, tier filter
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tier = searchParams.get("tier") || "";
  const available = searchParams.get("available"); // "true" = unclaimed only

  let query = supabase
    .from("cities")
    .select(
      "id, name, slug, population, is_active, mm_tier, mm_price_monthly, mm_claimed, mm_waitlist_count, states_regions(name, abbreviation)"
    )
    .eq("is_active", true)
    .order("population", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (tier) {
    query = query.eq("mm_tier", tier);
  }
  if (available === "true") {
    query = query.eq("mm_claimed", false);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cities: data || [] });
}

// POST /api/claim — submit application or waitlist
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type } = body; // "application" or "waitlist"

  if (type === "application") {
    const {
      city_id,
      full_name,
      email,
      phone,
      license_number,
      license_state,
      brokerage_name,
      years_experience,
      why_market_mayor,
      local_expertise,
      content_vision,
      social_instagram,
      social_linkedin,
      social_youtube,
      social_tiktok,
      website_url,
      video_intro_url,
      referral_source,
    } = body;

    if (!city_id || !full_name || !email || !why_market_mayor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if city is already claimed
    const { data: city } = await supabase
      .from("cities")
      .select("mm_claimed, name")
      .eq("id", city_id)
      .single();

    if (city?.mm_claimed) {
      return NextResponse.json(
        { error: "This city has already been claimed" },
        { status: 409 }
      );
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from("mm_applications")
      .select("id")
      .eq("city_id", city_id)
      .eq("email", email)
      .not("status", "eq", "rejected")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending application for this city" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("mm_applications")
      .insert({
        city_id,
        full_name,
        email,
        phone,
        license_number,
        license_state,
        brokerage_name,
        years_experience: years_experience ? parseInt(years_experience) : null,
        why_market_mayor,
        local_expertise,
        content_vision,
        social_instagram,
        social_linkedin,
        social_youtube,
        social_tiktok,
        website_url,
        video_intro_url,
        referral_source,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data });
  }

  if (type === "waitlist") {
    const { city_id, full_name, email, phone, notes } = body;

    if (!city_id || !full_name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate waitlist entry
    const { data: existing } = await supabase
      .from("mm_waitlist")
      .select("id")
      .eq("city_id", city_id)
      .eq("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "You are already on the waitlist for this city" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("mm_waitlist")
      .insert({ city_id, full_name, email, phone, notes })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment waitlist count
    await supabase.rpc("increment_waitlist_count", { cid: city_id });

    return NextResponse.json({ waitlist: data });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
