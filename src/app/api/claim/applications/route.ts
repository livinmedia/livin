import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — list all applications (admin)
export async function GET() {
  const { data, error } = await supabase
    .from("mm_applications")
    .select("*, cities(name, slug, mm_tier, mm_price_monthly)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data || [] });
}

// PATCH — update application status / score
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, admin_score, admin_notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing application id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (admin_score !== undefined) updates.admin_score = admin_score;
  if (admin_notes !== undefined) updates.admin_notes = admin_notes;
  if (status === "approved") updates.reviewed_at = new Date().toISOString();
  if (status === "rejected") updates.reviewed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("mm_applications")
    .update(updates)
    .eq("id", id)
    .select("*, cities(name, slug, mm_tier)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If approved, mark city as claimed
  if (status === "approved" && data?.city_id) {
    await supabase
      .from("cities")
      .update({ mm_claimed: true })
      .eq("id", data.city_id);
  }

  return NextResponse.json({ application: data });
}
