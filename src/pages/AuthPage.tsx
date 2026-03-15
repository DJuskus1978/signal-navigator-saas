import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { RadarLogo } from "@/components/RadarLogo";
import { toast } from "@/hooks/use-toast";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const RED        = "#FF4757";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

export default function AuthPage() {
  const { user, loading }       = useAuth();
  const [searchParams]          = useSearchParams();
  const redirectTo              = searchParams.get("redirect") || "/dashboard";
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [focusedField, setFocusedField]   = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to={redirectTo} replace />;

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}${redirectTo}`,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !termsAccepted) { setShowTermsError(true); return; }
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We've sent you a confirmation link to verify your account." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: NAVY,
    border: `1px solid ${focusedField === field ? CYAN : BORDER_CLR}`,
    color: WHITE,
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.9rem",
    padding: "0.7rem 0.875rem",
    outline: "none",
    borderRadius: 0,
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  });

  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", textDecoration: "none", marginBottom: "2.5rem" }}>
          <RadarLogo />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "0.04em", color: WHITE }}>
            Stocks<span style={{ color: CYAN }}>Radars</span>
          </span>
        </Link>

        {/* Card */}
        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>

          {/* Header */}
          <div style={{ padding: "2rem 2rem 1.5rem", borderBottom: `1px solid ${BORDER_CLR}` }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.4rem" }}>
              {isLogin ? "Member Access" : "Free Trial"}
            </p>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.8rem", textTransform: "uppercase", letterSpacing: "0.04em", color: WHITE, margin: 0 }}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", color: MUTED, marginTop: "0.4rem" }}>
              {isLogin ? "Sign in to access your dashboard" : "Start your 7-day free trial — no card required"}
            </p>
          </div>

          <div style={{ padding: "1.75rem 2rem 2rem" }}>

            {/* OAuth buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
              <button onClick={() => handleOAuth("google")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", background: "transparent", border: `1px solid ${BORDER_CLR}`, color: WHITE, fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", fontWeight: 500, padding: "0.7rem", cursor: "pointer", borderRadius: 0, width: "100%", transition: "border-color 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = CYAN)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER_CLR)}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <button onClick={() => handleOAuth("apple")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", background: "transparent", border: `1px solid ${BORDER_CLR}`, color: WHITE, fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", fontWeight: 500, padding: "0.7rem", cursor: "pointer", borderRadius: 0, width: "100%", transition: "border-color 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = CYAN)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER_CLR)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ flex: 1, height: "1px", background: BORDER_CLR }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>or</span>
              <div style={{ flex: 1, height: "1px", background: BORDER_CLR }} />
            </div>

            {/* Email / password form */}
            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="email" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  style={inputStyle("email")}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="password" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={6}
                  style={inputStyle("password")}
                />
              </div>

              {!isLogin && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setShowTermsError(false); }}
                      style={{ marginTop: "2px", accentColor: CYAN, flexShrink: 0 }}
                    />
                    <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: MUTED, lineHeight: 1.5 }}>
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" style={{ color: CYAN, textDecoration: "none" }}>Terms of Use</Link>
                      {" "}and{" "}
                      <Link to="/privacy" target="_blank" style={{ color: CYAN, textDecoration: "none" }}>Privacy Policy</Link>
                    </span>
                  </label>
                  {showTermsError && (
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: RED }}>
                      You must accept the Terms &amp; Privacy Policy to sign up.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ background: submitting ? BORDER_CLR : CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.9rem", border: "none", borderRadius: 0, cursor: submitting ? "not-allowed" : "pointer", width: "100%", marginTop: "0.25rem", transition: "background 0.15s ease" }}>
                {submitting ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Toggle */}
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", color: MUTED, textAlign: "center", marginTop: "1.25rem" }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setShowTermsError(false); }}
                style={{ background: "none", border: "none", color: CYAN, fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                {isLogin ? "Sign up free" : "Sign in"}
              </button>
            </p>

          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, textAlign: "center", marginTop: "1.5rem", lineHeight: 1.5 }}>
          Not financial advice. Always conduct your own research.
        </p>

      </div>
    </div>
  );
}
