"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

// ── Types ──
type Tab = "overview" | "content" | "leads" | "analytics" | "profile";

interface ContentRecord {
  id: string;
  title: string;
  slug: string;
  status: string;
  content_type: string;
  quality_score: number | null;
  seo_score: number | null;
  word_count: number | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  excerpt: string | null;
  meta_description: string | null;
  created_at: string;
  published_at: string | null;
}

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  lead_type: string;
  lead_score: number | null;
  status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
}

interface MMProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  specialty_areas: string[] | null;
  personalization_prompt: string | null;
  license_number: string | null;
  license_state: string | null;
  onboarding_status: string;
  content_approval_count: number | null;
  social_links: Record<string, string> | null;
  city_name: string;
  city_slug: string;
}

// ── Styles ──
const NAVY = "#0f172a";
const DARK = "#1e293b";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";
const GOLD = "#d4a843";
const GREEN = "#22c55e";
const ORANGE = "#f59e0b";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const TEXT = "rgba(255,255,255,0.85)";
const TEXT_DIM = "rgba(255,255,255,0.45)";

const cardStyle: React.CSSProperties = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 24,
};

const badgeColors: Record<string, { bg: string; text: string }> = {
  published: { bg: "rgba(34,197,94,0.15)", text: GREEN },
  awaiting_approval: { bg: "rgba(245,158,11,0.15)", text: ORANGE },
  mm_approved: { bg: "rgba(59,130,246,0.15)", text: BLUE },
  archived: { bg: "rgba(255,255,255,0.06)", text: TEXT_DIM },
  new: { bg: "rgba(59,130,246,0.15)", text: BLUE },
  contacted: { bg: "rgba(245,158,11,0.15)", text: ORANGE },
  qualified: { bg: "rgba(34,197,94,0.15)", text: GREEN },
  converted: { bg: "rgba(212,168,67,0.15)", text: GOLD },
  lost: { bg: "rgba(239,68,68,0.1)", text: RED },
};

function Badge({ status }: { status: string }) {
  const colors = badgeColors[status] || { bg: "rgba(255,255,255,0.06)", text: TEXT_DIM };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: colors.bg,
        color: colors.text,
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || "#fff" }}>
        {value}
      </div>
    </div>
  );
}

// ── Main Dashboard ──
export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<MMProfile | null>(null);
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Get auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }
    setUser(authUser);

    // Get MM profile with city
    const { data: mmData } = await supabase
      .from("market_mayors")
      .select("*, cities(name, slug)")
      .eq("user_id", authUser.id)
      .single();

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (mmData && profileData) {
      const city = mmData.cities as any;
      setProfile({
        id: mmData.id,
        full_name: profileData.full_name,
        email: profileData.email,
        bio: mmData.bio,
        specialty_areas: mmData.specialty_areas,
        personalization_prompt: mmData.personalization_prompt,
        license_number: mmData.license_number,
        license_state: mmData.license_state,
        onboarding_status: mmData.onboarding_status,
        content_approval_count: mmData.content_approval_count,
        social_links: mmData.social_links,
        city_name: city?.name || "Unknown",
        city_slug: city?.slug || "unknown",
      });

      // Load content for this city
      const { data: contentData } = await supabase
        .from("content_records")
        .select("id, title, slug, status, content_type, quality_score, seo_score, word_count, hero_image_url, og_image_url, excerpt, meta_description, created_at, published_at")
        .eq("city_id", mmData.city_id)
        .order("created_at", { ascending: false });

      setContent(contentData || []);

      // Load leads for this city
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("city_id", mmData.city_id)
        .order("created_at", { ascending: false });

      setLeads(leadsData || []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Actions ──
  async function approveArticle(id: string) {
    setActionLoading(id);
    // Step 1: awaiting_approval → mm_approved
    await supabase
      .from("content_records")
      .update({ status: "mm_approved", approved_at: new Date().toISOString(), approved_by: user.id })
      .eq("id", id);
    // Step 2: mm_approved → published (triggers ISR via Edge Function)
    await supabase
      .from("content_records")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    setActionLoading(null);
    await loadData();
  }

  async function rejectArticle(id: string) {
    setActionLoading(id);
    // Send back to queued for regen
    await supabase
      .from("content_records")
      .update({ status: "archived" })
      .eq("id", id);
    setActionLoading(null);
    await loadData();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // ── Computed stats ──
  const awaiting = content.filter((c) => c.status === "awaiting_approval");
  const published = content.filter((c) => c.status === "published");
  const totalWords = content.reduce((sum, c) => sum + (c.word_count || 0), 0);
  const newLeads = leads.filter((l) => l.status === "new");
  const avgScore =
    content.filter((c) => c.quality_score).length > 0
      ? (
          content
            .filter((c) => c.quality_score)
            .reduce((sum, c) => sum + (c.quality_score || 0), 0) /
          content.filter((c) => c.quality_score).length
        ).toFixed(1)
      : "—";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: NAVY,
          color: TEXT_DIM,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  // ── Render ──
  return (
    <div
      style={{
        minHeight: "100vh",
        background: NAVY,
        color: TEXT,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px clamp(16px, 4vw, 32px)",
          borderBottom: `1px solid ${BORDER}`,
          background: "rgba(15,23,42,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", color: "#fff" }}>
            LIVIN
          </span>
          <span style={{ fontSize: 12, color: TEXT_DIM, borderLeft: `1px solid ${BORDER}`, paddingLeft: 16 }}>
            {profile?.city_name} Market Mayor
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: TEXT_DIM }}>{profile?.full_name}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: "8px 14px",
              minHeight: 44,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              color: TEXT_DIM,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="lv-dash-layout" style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* ── Sidebar / Bottom tabs ── */}
        <nav className="lv-dash-sidebar">
          {(
            [
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "content", label: "Content", icon: "📝", badge: awaiting.length || undefined },
              { key: "leads", label: "Leads", icon: "👤", badge: newLeads.length || undefined },
              { key: "analytics", label: "Analytics", icon: "📈" },
              { key: "profile", label: "Profile", icon: "⚙️" },
            ] as { key: Tab; label: string; icon: string; badge?: number }[]
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="lv-dash-tab-btn"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 4px",
                minWidth: 56,
                minHeight: 44,
                background: tab === item.key ? "rgba(212,168,67,0.1)" : "transparent",
                border: "none",
                borderRadius: 8,
                color: tab === item.key ? GOLD : TEXT_DIM,
                fontSize: 10,
                fontWeight: tab === item.key ? 600 : 400,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span className="lv-dash-tab-label">{item.label}</span>
              {item.badge ? (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: ORANGE,
                    color: "#fff",
                    padding: "1px 5px",
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <main className="lv-dash-main">
          {/* ════════ OVERVIEW ════════ */}
          {tab === "overview" && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Welcome back, {profile?.full_name?.split(" ")[0]}
              </h1>
              <p style={{ color: TEXT_DIM, fontSize: 14, marginBottom: 32 }}>
                {profile?.city_name} dashboard — here&apos;s what&apos;s happening
              </p>

              {/* Stat cards */}
              <div
                className="lv-stat-grid"
                style={{
                  marginBottom: 32,
                }}
              >
                <StatCard label="Awaiting Review" value={awaiting.length} accent={awaiting.length > 0 ? ORANGE : GREEN} />
                <StatCard label="Published" value={published.length} accent={GREEN} />
                <StatCard label="New Leads" value={newLeads.length} accent={BLUE} />
                <StatCard label="Avg Quality" value={avgScore} accent={GOLD} />
              </div>

              {/* Pending articles */}
              {awaiting.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Articles Awaiting Your Approval
                  </h3>
                  {awaiting.map((article) => (
                    <div
                      key={article.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 0",
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{article.title}</div>
                        <div style={{ fontSize: 12, color: TEXT_DIM }}>
                          {article.word_count ? `${article.word_count.toLocaleString()} words` : ""} ·{" "}
                          {new Date(article.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => approveArticle(article.id)}
                          disabled={actionLoading === article.id}
                          style={{
                            padding: "10px 16px",
                            minHeight: 44,
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: 6,
                            color: GREEN,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {actionLoading === article.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => rejectArticle(article.id)}
                          disabled={actionLoading === article.id}
                          style={{
                            padding: "8px 16px",
                            minHeight: 44,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 6,
                            color: RED,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent leads */}
              {leads.length > 0 && (
                <div style={{ ...cardStyle, marginTop: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Recent Leads
                  </h3>
                  {leads.slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{lead.full_name}</div>
                        <div style={{ fontSize: 12, color: TEXT_DIM }}>
                          {lead.email} · {lead.lead_type}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {lead.lead_score && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: lead.lead_score >= 7 ? GREEN : lead.lead_score >= 4 ? ORANGE : TEXT_DIM }}>
                            {lead.lead_score}
                          </span>
                        )}
                        <Badge status={lead.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════════ CONTENT ════════ */}
          {tab === "content" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Content</h1>
                <div style={{ fontSize: 13, color: TEXT_DIM }}>
                  {content.length} articles · {totalWords.toLocaleString()} words
                </div>
              </div>

              {/* Awaiting approval section */}
              {awaiting.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                    Awaiting Your Approval ({awaiting.length})
                  </h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {awaiting.map((article) => (
                      <div key={article.id} style={{ ...cardStyle, border: `1px solid rgba(245,158,11,0.2)` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{article.title}</h4>
                            <p style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 12, lineHeight: 1.5 }}>
                              {article.meta_description || article.excerpt || "No description available."}
                            </p>
                            <div style={{ display: "flex", gap: 16, fontSize: 12, color: TEXT_DIM }}>
                              {article.word_count && <span>{article.word_count.toLocaleString()} words</span>}
                              {article.quality_score && <span>Quality: {article.quality_score}/10</span>}
                              {article.seo_score && <span>SEO: {article.seo_score}/100</span>}
                              <span>{new Date(article.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginLeft: 16, flexShrink: 0 }}>
                            <button
                              onClick={() => approveArticle(article.id)}
                              disabled={actionLoading === article.id}
                              style={{
                                padding: "10px 20px",
                                background: `linear-gradient(135deg, ${GREEN}, #16a34a)`,
                                border: "none",
                                borderRadius: 8,
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {actionLoading === article.id ? "Publishing..." : "Approve & Publish"}
                            </button>
                            <button
                              onClick={() => rejectArticle(article.id)}
                              disabled={actionLoading === article.id}
                              style={{
                                padding: "10px 16px",
                                minHeight: 44,
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.2)",
                                borderRadius: 8,
                                color: RED,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Published */}
              {published.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                    Published ({published.length})
                  </h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {published.map((article) => (
                      <div key={article.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>{article.title}</div>
                          <div style={{ fontSize: 12, color: TEXT_DIM }}>
                            Published {article.published_at ? new Date(article.published_at).toLocaleDateString() : "—"} · /{profile?.city_slug}/{article.slug}
                          </div>
                        </div>
                        <Badge status="published" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All other content */}
              {content.filter((c) => c.status !== "awaiting_approval" && c.status !== "published").length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                    Other
                  </h3>
                  {content
                    .filter((c) => c.status !== "awaiting_approval" && c.status !== "published")
                    .map((article) => (
                      <div key={article.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 500 }}>{article.title}</div>
                        <Badge status={article.status} />
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* ════════ LEADS ════════ */}
          {tab === "leads" && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Leads</h1>

              {leads.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: "center", padding: 48, color: TEXT_DIM }}>
                  No leads yet. They&apos;ll appear here as visitors engage with your city pages.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {leads.map((lead) => (
                    <div key={lead.id} style={cardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 600 }}>{lead.full_name}</span>
                            <Badge status={lead.status} />
                          </div>
                          <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>
                            {lead.email}
                            {lead.phone && ` · ${lead.phone}`}
                          </div>
                          <div style={{ fontSize: 12, color: TEXT_DIM }}>
                            Type: {lead.lead_type} · Source: {lead.source || "direct"} · {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                          {lead.notes && (
                            <div style={{ fontSize: 13, color: TEXT, marginTop: 8, fontStyle: "italic" }}>
                              &quot;{lead.notes}&quot;
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {lead.lead_score !== null && (
                            <div
                              style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: lead.lead_score >= 7 ? GREEN : lead.lead_score >= 4 ? ORANGE : TEXT_DIM,
                              }}
                            >
                              {lead.lead_score}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: TEXT_DIM }}>score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════════ ANALYTICS ════════ */}
          {tab === "analytics" && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Analytics</h1>

              <div className="lv-grid-3" style={{ gap: 16, marginBottom: 32 }}>
                <StatCard label="Total Articles" value={content.length} />
                <StatCard label="Total Words" value={totalWords.toLocaleString()} />
                <StatCard label="Total Leads" value={leads.length} />
              </div>

              <div className="lv-grid-2" style={{ gap: 16 }}>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Content by Status</h3>
                  {Object.entries(
                    content.reduce((acc, c) => {
                      acc[c.status] = (acc[c.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <Badge status={status} />
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Leads by Type</h3>
                  {Object.entries(
                    leads.reduce((acc, l) => {
                      acc[l.lead_type] = (acc[l.lead_type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ color: TEXT, textTransform: "capitalize" }}>{type.replace(/_/g, " ")}</span>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...cardStyle, marginTop: 24, textAlign: "center", padding: 48, color: TEXT_DIM }}>
                Full analytics with page views, engagement, and SEO performance coming in Phase 2 — once Google Search Console and analytics tracking are connected.
              </div>
            </>
          )}

          {/* ════════ PROFILE ════════ */}
          {tab === "profile" && profile && (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Profile</h1>

              <div className="lv-grid-2" style={{ gap: 16 }}>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Personal Info</h3>
                  {[
                    ["Name", profile.full_name],
                    ["Email", profile.email],
                    ["City", profile.city_name],
                    ["License", profile.license_number ? `${profile.license_number} (${profile.license_state})` : "—"],
                    ["Onboarding", profile.onboarding_status],
                    ["Articles Approved", String(profile.content_approval_count || 0)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ color: TEXT_DIM, fontSize: 13 }}>{label}</span>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Specialties</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(profile.specialty_areas || []).map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(212,168,67,0.1)",
                          border: "1px solid rgba(212,168,67,0.2)",
                          borderRadius: 20,
                          fontSize: 12,
                          color: GOLD,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {(!profile.specialty_areas || profile.specialty_areas.length === 0) && (
                      <span style={{ color: TEXT_DIM, fontSize: 13 }}>No specialties set</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Bio</h3>
                  <p style={{ fontSize: 13, color: TEXT_DIM, lineHeight: 1.6 }}>
                    {profile.bio || "No bio set. Your bio will appear on your Market Mayor profile page."}
                  </p>

                  {profile.personalization_prompt && (
                    <>
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>AI Voice Profile</h3>
                      <p style={{ fontSize: 13, color: TEXT_DIM, lineHeight: 1.6, fontStyle: "italic" }}>
                        &quot;{profile.personalization_prompt}&quot;
                      </p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
