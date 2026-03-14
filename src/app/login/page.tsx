"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (err) {
      setError(err.message);
    } else {
      setMagicSent(true);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "clamp(24px, 6vw, 40px)",
          margin: "0 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#fff",
            }}
          >
            LIVIN
          </div>
          <div
            style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}
          >
            Market Mayor Dashboard
          </div>
        </div>

        {magicSent ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Check your email
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              We sent a login link to <strong>{email}</strong>
            </div>
            <button
              onClick={() => {
                setMagicSent(false);
                setMode("password");
              }}
              style={{
                marginTop: 24,
                background: "none",
                border: "none",
                color: "#d4a843",
                cursor: "pointer",
                fontSize: 14,
                minHeight: 44,
                padding: "10px 20px",
              }}
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: 24,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {(["password", "magic"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    minHeight: 44,
                    background:
                      mode === m ? "rgba(212,168,67,0.15)" : "transparent",
                    border: "none",
                    color:
                      mode === m ? "#d4a843" : "rgba(255,255,255,0.4)",
                    fontWeight: mode === m ? 600 : 400,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "password" ? "Password" : "Magic Link"}
                </button>
              ))}
            </div>

            <form
              onSubmit={
                mode === "password" ? handlePasswordLogin : handleMagicLink
              }
            >
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@livin.in"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 16,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {mode === "password" && (
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 16,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(220,38,38,0.1)",
                    border: "1px solid rgba(220,38,38,0.3)",
                    borderRadius: 8,
                    color: "#fca5a5",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  minHeight: 48,
                  background: loading
                    ? "rgba(212,168,67,0.3)"
                    : "linear-gradient(135deg, #d4a843, #b8922e)",
                  border: "none",
                  borderRadius: 8,
                  color: "#0f172a",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  letterSpacing: "0.02em",
                  transition: "all 0.2s",
                }}
              >
                {loading
                  ? "Signing in..."
                  : mode === "password"
                  ? "Sign In"
                  : "Send Magic Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
