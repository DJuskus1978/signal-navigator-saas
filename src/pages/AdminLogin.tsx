import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { RadarLogo } from "@/components/RadarLogo";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const RED        = "#FF4757";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: NAVY,
    border: `1px solid ${focused ? CYAN : BORDER_CLR}`,
    borderRadius: 0,
    padding: "0.625rem 0.875rem",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.88rem",
    color: WHITE,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s ease",
  };
}

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  if (user && !isAdminChecked) {
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      setIsAdminChecked(true);
    });
  }

  if (loading) return null;
  if (user && isAdminChecked && isAdmin) return <Navigate to="/admin" replace />;

  if (user && isAdminChecked && !isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${RED}`, padding: "2.5rem", textAlign: "center", maxWidth: "360px", width: "100%" }}>
          <Shield size={36} color={RED} style={{ marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.4rem", textTransform: "uppercase", color: WHITE, marginBottom: "0.5rem" }}>Access Denied</h2>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, marginBottom: "1.25rem" }}>This account does not have admin privileges.</p>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ background: "transparent", border: `1px solid ${BORDER_CLR}`, color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.5rem 1.25rem", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/admin/login`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <RadarLogo />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "0.04em", color: WHITE }}>
            Stocks<span style={{ color: CYAN }}>Radars</span>
          </span>
        </div>

        {/* Card */}
        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}` }}>
          {/* Header */}
          <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: `1px solid ${BORDER_CLR}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "44px", height: "44px", background: "rgba(0,212,255,0.1)", border: `1px solid rgba(0,212,255,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color={CYAN} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
                Admin Access
              </p>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.4rem", textTransform: "uppercase", color: WHITE, margin: 0, marginTop: "0.2rem" }}>
                Admin Login
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, margin: 0, marginTop: "0.25rem" }}>
                Sign in with your admin credentials
              </p>
            </div>
          </div>

          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {/* OAuth buttons */}
            <button
              onClick={() => handleOAuth("google")}
              style={{ width: "100%", background: "transparent", border: `1px solid ${BORDER_CLR}`, padding: "0.625rem 1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", cursor: "pointer", fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, transition: "border-color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = CYAN)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER_CLR)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth("apple")}
              style={{ width: "100%", background: "transparent", border: `1px solid ${BORDER_CLR}`, padding: "0.625rem 1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", cursor: "pointer", fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, transition: "border-color 0.15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = CYAN)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER_CLR)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={WHITE}>
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, height: "1px", background: BORDER_CLR }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED }}>or</span>
              <div style={{ flex: 1, height: "1px", background: BORDER_CLR }} />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "email")}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(focused === "password")}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{ width: "100%", background: submitting ? "rgba(0,212,255,0.5)" : CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.75rem", border: "none", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "background 0.15s ease" }}
              >
                {submitting ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</> : "Sign In"}
              </button>
            </form>

            <style>{`
              #admin-email::placeholder, #admin-password::placeholder { color: rgba(255,255,255,0.3); }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}
