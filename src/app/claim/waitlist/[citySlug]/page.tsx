"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const NAVY = "#0f172a";
const BORDER = "rgba(255,255,255,0.08)";
const GOLD = "#d4a843";
const TEXT = "rgba(255,255,255,0.85)";
const TEXT_DIM = "rgba(255,255,255,0.45)";

interface City {
  id: string;
  name: string;
  slug: string;
  mm_tier: string | null;
  mm_claimed: boolean;
  mm_waitlist_count: number | null;
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

export default function WaitlistPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = use(params);
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "waitlist",
        city_id: city.id,
        full_name: fullName,
        email,
        phone: phone || null,
        notes: notes || null,
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
        <div style={{ fontSize: 64, marginBottom: 24 }}>📋</div>
        <h1 style={{ fontSize: 28, fontWeight: 300, fontFamily: "'Libre Caslon Display', Georgia, serif", color: "#fff", marginBottom: 12 }}>
          You&apos;re on the Waitlist
        </h1>
        <p style={{ fontSize: 16, color: TEXT_DIM, maxWidth: 480, lineHeight: 1.6, marginBottom: 32 }}>
          We&apos;ll notify you at <strong style={{ color: "#fff" }}>{email}</strong> if the Market Mayor
          position for <strong style={{ color: "#fff" }}>{city.name}</strong> becomes available.
        </p>
        <Link href="/claim" style={{ color: GOLD, fontSize: 14 }}>← Back to cities</Link>
      </div>
    );
  }

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
          maxWidth: 520,
          margin: "0 auto",
          padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 48px) 96px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 36px)",
              fontWeight: 300,
              fontFamily: "'Libre Caslon Display', Georgia, serif",
              color: "#fff",
              marginBottom: 8,
            }}
          >
            {city.name} Waitlist
          </h1>
          <p style={{ fontSize: 15, color: TEXT_DIM, lineHeight: 1.6 }}>
            This city has been claimed. Join the waitlist and we&apos;ll notify you if the position opens up.
            {city.mm_waitlist_count ? (
              <span style={{ display: "block", marginTop: 8, fontSize: 13 }}>
                {city.mm_waitlist_count} {city.mm_waitlist_count === 1 ? "person" : "people"} on the waitlist
              </span>
            ) : null}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_DIM, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_DIM, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_DIM, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_DIM, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Anything you&apos;d like us to know? (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your background, interest, etc."
                style={{
                  ...inputStyle,
                  minHeight: 100,
                  resize: "vertical" as const,
                  fontFamily: "'Outfit', system-ui, sans-serif",
                }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                color: "#fca5a5",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "14px 0",
              minHeight: 52,
              background: submitting ? "rgba(212,168,67,0.3)" : `linear-gradient(135deg, ${GOLD}, #b8922e)`,
              border: "none",
              borderRadius: 10,
              color: NAVY,
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? "wait" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {submitting ? "Joining..." : "Join Waitlist"}
          </button>
        </form>
      </div>
    </div>
  );
}
