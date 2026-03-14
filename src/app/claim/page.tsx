"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Styles ──
const NAVY = "#0f172a";
const DARK = "#1e293b";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";
const GOLD = "#d4a843";
const TEXT = "rgba(255,255,255,0.85)";
const TEXT_DIM = "rgba(255,255,255,0.45)";

interface City {
  id: string;
  name: string;
  slug: string;
  population: number | null;
  mm_tier: string | null;
  mm_price_monthly: number | null;
  mm_claimed: boolean;
  mm_waitlist_count: number | null;
  states_regions: { name: string; abbreviation: string } | null;
}

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  premium: { label: "Premium", color: "#d4a843", bg: "rgba(212,168,67,0.12)", icon: "👑" },
  standard: { label: "Standard", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", icon: "⭐" },
  small_market: { label: "Small Market", color: "#cd7f32", bg: "rgba(205,127,50,0.10)", icon: "🏅" },
};

function formatPop(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatPrice(n: number | null) {
  if (!n) return "—";
  return `$${n.toLocaleString()}/mo`;
}

export default function ClaimPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, [tierFilter, showAvailableOnly]);

  async function fetchCities() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tierFilter) params.set("tier", tierFilter);
    if (showAvailableOnly) params.set("available", "true");

    const res = await fetch(`/api/claim?${params}`);
    const data = await res.json();
    setCities(data.cities || []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCities();
  }

  const available = cities.filter((c) => !c.mm_claimed);
  const claimed = cities.filter((c) => c.mm_claimed);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${NAVY} 0%, #0c1220 100%)`,
        color: TEXT,
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* ── Nav ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px clamp(16px, 4vw, 48px)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Link href="/" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.08em", color: "#fff" }}>
          LIVIN
        </Link>
        <Link
          href="/login"
          style={{
            padding: "10px 20px",
            minHeight: 44,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            color: TEXT_DIM,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          MM Login
        </Link>
      </header>

      {/* ── Hero ── */}
      <section
        style={{
          padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 48px) clamp(32px, 4vw, 64px)",
          textAlign: "center",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            background: "rgba(212,168,67,0.12)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 600,
            color: GOLD,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 24,
          }}
        >
          By Invitation &amp; Application Only
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 300,
            lineHeight: 1.15,
            fontFamily: "'Libre Caslon Display', Georgia, serif",
            color: "#fff",
            marginBottom: 16,
          }}
        >
          Claim Your City
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: TEXT_DIM,
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto 40px",
          }}
        >
          Become the exclusive Market Mayor for your city. Own the real estate content,
          build your brand, and connect with the community you know best.
        </p>
      </section>

      {/* ── Anthony Dazet Section ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 48px",
          padding: "0 clamp(16px, 4vw, 48px)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.02) 100%)",
            border: "1px solid rgba(212,168,67,0.15)",
            borderRadius: 16,
            padding: "clamp(24px, 4vw, 40px)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD}, #b8922e)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: NAVY,
                flexShrink: 0,
              }}
            >
              AD
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Anthony Dazet</div>
              <div style={{ fontSize: 13, color: GOLD }}>Founder, LIVIN</div>
            </div>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
            &ldquo;Market Mayor isn&apos;t a title — it&apos;s a calling. We&apos;re looking for real estate professionals who
            don&apos;t just sell homes, but who truly <em>live</em> their city. People who know the best taco truck,
            the hidden park, the neighborhood that&apos;s about to bloom. Every application is reviewed personally
            by me. This isn&apos;t a franchise — it&apos;s a partnership. One mayor per city, forever.&rdquo;
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: TEXT_DIM }}>
            <span>✦ One exclusive mayor per city</span>
            <span>✦ Personal review of every application</span>
            <span>✦ AI-powered content engine included</span>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 48px",
          padding: "0 clamp(16px, 4vw, 48px)",
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: TEXT_DIM,
            marginBottom: 24,
          }}
        >
          How It Works
        </h2>
        <div className="lv-grid-3" style={{ gap: 16 }}>
          {[
            { step: "01", title: "Browse & Apply", desc: "Find your city below. Submit your application with your credentials and vision." },
            { step: "02", title: "Personal Review", desc: "Anthony reviews every application. We look for local expertise, content vision, and community commitment." },
            { step: "03", title: "Launch & Lead", desc: "Once approved, your AI content engine activates. You approve content, build your brand, and own your market." },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "clamp(20px, 3vw, 28px)",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 800, color: "rgba(212,168,67,0.2)", marginBottom: 8 }}>
                {s.step}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: TEXT_DIM, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tier Legend ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 32px",
          padding: "0 clamp(16px, 4vw, 48px)",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(tierConfig).map(([key, t]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: t.bg,
                border: `1px solid ${t.color}22`,
                borderRadius: 8,
                fontSize: 13,
                color: t.color,
                fontWeight: 600,
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Search & Filters ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto 32px",
          padding: "0 clamp(16px, 4vw, 48px)",
        }}
      >
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities..."
            style={{
              flex: "1 1 200px",
              padding: "12px 16px",
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              color: "#fff",
              fontSize: 16,
              outline: "none",
              minHeight: 48,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              minHeight: 48,
              background: `linear-gradient(135deg, ${GOLD}, #b8922e)`,
              border: "none",
              borderRadius: 8,
              color: NAVY,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { value: "", label: "All Tiers" },
            { value: "premium", label: "👑 Premium" },
            { value: "standard", label: "⭐ Standard" },
            { value: "small_market", label: "🏅 Small Market" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setTierFilter(f.value)}
              style={{
                padding: "8px 16px",
                minHeight: 44,
                background: tierFilter === f.value ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${tierFilter === f.value ? "rgba(212,168,67,0.3)" : BORDER}`,
                borderRadius: 8,
                color: tierFilter === f.value ? GOLD : TEXT_DIM,
                fontSize: 13,
                fontWeight: tierFilter === f.value ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            style={{
              padding: "8px 16px",
              minHeight: 44,
              background: showAvailableOnly ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showAvailableOnly ? "rgba(34,197,94,0.3)" : BORDER}`,
              borderRadius: 8,
              color: showAvailableOnly ? "#22c55e" : TEXT_DIM,
              fontSize: 13,
              fontWeight: showAvailableOnly ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Available Only
          </button>
        </div>
      </section>

      {/* ── City Grid ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 48px) 96px",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: TEXT_DIM }}>Loading cities...</div>
        ) : cities.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: TEXT_DIM }}>
            No cities found. Try a different search or filter.
          </div>
        ) : (
          <>
            {/* Available cities */}
            {available.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#22c55e",
                    marginBottom: 16,
                  }}
                >
                  Available — {available.length} {available.length === 1 ? "City" : "Cities"}
                </div>
                <div className="lv-grid-2" style={{ gap: 16, marginBottom: 40 }}>
                  {available.map((city) => (
                    <CityCard key={city.id} city={city} />
                  ))}
                </div>
              </>
            )}

            {/* Claimed cities */}
            {claimed.length > 0 && !showAvailableOnly && (
              <>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: TEXT_DIM,
                    marginBottom: 16,
                  }}
                >
                  Claimed — {claimed.length} {claimed.length === 1 ? "City" : "Cities"}
                </div>
                <div className="lv-grid-2" style={{ gap: 16 }}>
                  {claimed.map((city) => (
                    <CityCard key={city.id} city={city} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CityCard({ city }: { city: City }) {
  const tier = tierConfig[city.mm_tier || "standard"] || tierConfig.standard;
  const isClaimed = city.mm_claimed;
  const state = city.states_regions?.abbreviation || "";

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${isClaimed ? BORDER : "rgba(212,168,67,0.12)"}`,
        borderRadius: 12,
        padding: "clamp(16px, 3vw, 24px)",
        opacity: isClaimed ? 0.65 : 1,
        transition: "all 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 700, color: "#fff" }}>
            {city.name}
          </div>
          <div style={{ fontSize: 13, color: TEXT_DIM }}>
            {state} · Pop. {formatPop(city.population)}
          </div>
        </div>
        <span
          style={{
            padding: "4px 10px",
            background: tier.bg,
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: tier.color,
            whiteSpace: "nowrap",
          }}
        >
          {tier.icon} {tier.label}
        </span>
      </div>

      {/* Price */}
      <div style={{ fontSize: 24, fontWeight: 700, color: isClaimed ? TEXT_DIM : GOLD, marginBottom: 16 }}>
        {formatPrice(city.mm_price_monthly)}
      </div>

      {/* Status & CTA */}
      {isClaimed ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "6px 12px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#ef4444",
            }}
          >
            Claimed
          </span>
          <Link
            href={`/claim/waitlist/${city.slug}`}
            style={{
              padding: "10px 20px",
              minHeight: 44,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_DIM,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Join Waitlist{city.mm_waitlist_count ? ` (${city.mm_waitlist_count})` : ""}
          </Link>
        </div>
      ) : (
        <Link
          href={`/claim/apply/${city.slug}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 24px",
            minHeight: 48,
            background: `linear-gradient(135deg, ${GOLD}, #b8922e)`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            color: NAVY,
            width: "100%",
            transition: "all 0.2s",
          }}
        >
          Apply Now →
        </Link>
      )}
    </div>
  );
}
