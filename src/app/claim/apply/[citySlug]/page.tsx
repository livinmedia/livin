"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const NAVY = "#0f172a";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";
const GOLD = "#d4a843";
const TEXT = "rgba(255,255,255,0.85)";
const TEXT_DIM = "rgba(255,255,255,0.45)";

const tierConfig: Record<string, { label: string; color: string; icon: string }> = {
  premium: { label: "Premium", color: "#d4a843", icon: "👑" },
  standard: { label: "Standard", color: "#94a3b8", icon: "⭐" },
  small_market: { label: "Small Market", color: "#cd7f32", icon: "🏅" },
};

interface City {
  id: string;
  name: string;
  slug: string;
  mm_tier: string | null;
  mm_price_monthly: number | null;
  mm_claimed: boolean;
  states_regions: { name: string; abbreviation: string } | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  color: "#fff",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical" as const,
  fontFamily: "'Outfit', system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: TEXT_DIM,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function ApplyPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = use(params);
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    license_number: "",
    license_state: "",
    brokerage_name: "",
    years_experience: "",
    why_market_mayor: "",
    local_expertise: "",
    content_vision: "",
    social_instagram: "",
    social_linkedin: "",
    social_youtube: "",
    social_tiktok: "",
    website_url: "",
    video_intro_url: "",
    referral_source: "",
  });

  useEffect(() => {
    async function loadCity() {
      const res = await fetch(`/api/claim?search=${encodeURIComponent(citySlug)}`);
      const data = await res.json();
      const match = (data.cities || []).find((c: City) => c.slug === citySlug);
      setCity(match || null);
      setLoading(false);
    }
    loadCity();
  }, [citySlug]);

  function updateForm(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "application",
        city_id: city.id,
        ...form,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setSubmitting(false);
    } else {
      setSubmitted(true);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM }}>
        Loading...
      </div>
    );
  }

  if (!city) {
    return (
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: TEXT_DIM, gap: 16 }}>
        <div style={{ fontSize: 48 }}>🏙️</div>
        <div>City not found</div>
        <Link href="/claim" style={{ color: GOLD }}>← Browse cities</Link>
      </div>
    );
  }

  if (city.mm_claimed) {
    return (
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: TEXT_DIM, gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>{city.name} has been claimed</div>
        <div>This city already has a Market Mayor.</div>
        <Link
          href={`/claim/waitlist/${city.slug}`}
          style={{
            padding: "12px 24px",
            minHeight: 48,
            background: `linear-gradient(135deg, ${GOLD}, #b8922e)`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            color: NAVY,
          }}
        >
          Join the Waitlist
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: NAVY,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: TEXT,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 24 }}>✦</div>
        <h1 style={{ fontSize: 32, fontWeight: 300, fontFamily: "'Libre Caslon Display', Georgia, serif", color: "#fff", marginBottom: 12 }}>
          Application Received
        </h1>
        <p style={{ fontSize: 16, color: TEXT_DIM, maxWidth: 480, lineHeight: 1.6, marginBottom: 32 }}>
          Thank you for applying to be the Market Mayor of <strong style={{ color: "#fff" }}>{city.name}</strong>.
          Anthony will personally review your application and respond within 48 hours.
        </p>
        <Link href="/claim" style={{ color: GOLD, fontSize: 14 }}>← Back to cities</Link>
      </div>
    );
  }

  const tier = tierConfig[city.mm_tier || "standard"] || tierConfig.standard;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${NAVY} 0%, #0c1220 100%)`,
        color: TEXT,
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Nav */}
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
        <Link href="/claim" style={{ color: TEXT_DIM, fontSize: 14, minHeight: 44, display: "flex", alignItems: "center" }}>
          ← All Cities
        </Link>
      </header>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(32px, 6vw, 64px) clamp(16px, 4vw, 48px) 96px",
        }}
      >
        {/* City header */}
        <div style={{ marginBottom: 40 }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              background: "rgba(212,168,67,0.12)",
              border: "1px solid rgba(212,168,67,0.25)",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: tier.color,
              marginBottom: 12,
            }}
          >
            {tier.icon} {tier.label} Market
          </span>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 300,
              fontFamily: "'Libre Caslon Display', Georgia, serif",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Apply for {city.name}
          </h1>
          <p style={{ fontSize: 15, color: TEXT_DIM, lineHeight: 1.6 }}>
            {city.states_regions?.name} · {city.mm_price_monthly ? `$${city.mm_price_monthly.toLocaleString()}/mo` : ""}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section: Personal */}
          <SectionHeading title="Personal Information" />
          <div className="lv-grid-2" style={{ gap: 16, marginBottom: 24 }}>
            <Field label="Full Name *" value={form.full_name} onChange={(v) => updateForm("full_name", v)} required />
            <Field label="Email *" type="email" value={form.email} onChange={(v) => updateForm("email", v)} required />
            <Field label="Phone" type="tel" value={form.phone} onChange={(v) => updateForm("phone", v)} />
            <Field label="Website" type="url" value={form.website_url} onChange={(v) => updateForm("website_url", v)} placeholder="https://" />
          </div>

          {/* Section: License */}
          <SectionHeading title="Real Estate Credentials" />
          <div className="lv-grid-2" style={{ gap: 16, marginBottom: 24 }}>
            <Field label="License Number" value={form.license_number} onChange={(v) => updateForm("license_number", v)} />
            <Field label="License State" value={form.license_state} onChange={(v) => updateForm("license_state", v)} placeholder="TX" />
            <Field label="Brokerage / Team" value={form.brokerage_name} onChange={(v) => updateForm("brokerage_name", v)} />
            <Field label="Years of Experience" type="number" value={form.years_experience} onChange={(v) => updateForm("years_experience", v)} />
          </div>

          {/* Section: Essay Questions */}
          <SectionHeading title="Your Vision" />
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Why do you want to be Market Mayor of {city.name}? *</label>
              <textarea
                value={form.why_market_mayor}
                onChange={(e) => updateForm("why_market_mayor", e.target.value)}
                required
                placeholder="Tell us about your connection to this city and why you'd be the right Market Mayor..."
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>What makes you a local expert?</label>
              <textarea
                value={form.local_expertise}
                onChange={(e) => updateForm("local_expertise", e.target.value)}
                placeholder="Neighborhoods you specialize in, community involvement, local knowledge..."
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Content vision — what stories would you tell?</label>
              <textarea
                value={form.content_vision}
                onChange={(e) => updateForm("content_vision", e.target.value)}
                placeholder="Topics you'd want to cover, your content style, what your audience cares about..."
                style={textareaStyle}
              />
            </div>
          </div>

          {/* Section: Social */}
          <SectionHeading title="Social Media & Video" />
          <div className="lv-grid-2" style={{ gap: 16, marginBottom: 24 }}>
            <Field label="Instagram" value={form.social_instagram} onChange={(v) => updateForm("social_instagram", v)} placeholder="@handle" />
            <Field label="LinkedIn" value={form.social_linkedin} onChange={(v) => updateForm("social_linkedin", v)} placeholder="Profile URL" />
            <Field label="YouTube" value={form.social_youtube} onChange={(v) => updateForm("social_youtube", v)} placeholder="Channel URL" />
            <Field label="TikTok" value={form.social_tiktok} onChange={(v) => updateForm("social_tiktok", v)} placeholder="@handle" />
          </div>

          <div style={{ marginBottom: 32 }}>
            <Field
              label="Video Introduction URL (optional but encouraged)"
              value={form.video_intro_url}
              onChange={(v) => updateForm("video_intro_url", v)}
              placeholder="YouTube, Loom, or Vimeo link — a 2-minute intro about you"
            />
          </div>

          {/* Section: Referral */}
          <div style={{ marginBottom: 40 }}>
            <Field
              label="How did you hear about LIVIN?"
              value={form.referral_source}
              onChange={(v) => updateForm("referral_source", v)}
              placeholder="Referral, social media, search..."
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                color: "#fca5a5",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "16px 0",
              minHeight: 56,
              background: submitting
                ? "rgba(212,168,67,0.3)"
                : `linear-gradient(135deg, ${GOLD}, #b8922e)`,
              border: "none",
              borderRadius: 10,
              color: NAVY,
              fontSize: 16,
              fontWeight: 700,
              cursor: submitting ? "wait" : "pointer",
              letterSpacing: "0.02em",
              transition: "all 0.2s",
            }}
          >
            {submitting ? "Submitting Application..." : "Submit Application"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: TEXT_DIM, marginTop: 16, lineHeight: 1.6 }}>
            Applications are reviewed personally by Anthony Dazet within 48 hours.
            <br />
            One Market Mayor per city. Exclusivity guaranteed.
          </p>
        </form>
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: GOLD,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {title}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
}
