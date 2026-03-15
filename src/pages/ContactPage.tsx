import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft, Send, Mail, Phone, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const RED        = "#FF4757";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

// ── Validation ────────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name:    z.string().trim().min(1, "Name is required").max(100),
  email:   z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const DRAFT_KEY = "contact_form_draft";

// ── Input style factory ───────────────────────────────────────────────────────
function inputStyle(focused: boolean, hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: NAVY,
    border: `1px solid ${hasError ? RED : focused ? CYAN : BORDER_CLR}`,
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const autoSendAttempted = useRef(false);

  // Restore draft
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Auto-send after login if pending draft
  useEffect(() => {
    if (!user || autoSendAttempted.current) return;
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    autoSendAttempted.current = true;
    try {
      const draft = JSON.parse(saved) as { name: string; email: string; message: string };
      const result = contactSchema.safeParse(draft);
      if (result.success) {
        sendMessage({ name: result.data.name, email: result.data.email, message: result.data.message });
      }
    } catch { /* ignore */ }
  }, [user]);

  const sendMessage = async (data: { name: string; email: string; message: string }) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", { body: data });
      if (error) throw error;
      toast.success("Your message was sent! We will get in contact soon.");
      setForm({ name: "", email: "", message: "" });
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!user) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      navigate("/auth?redirect=/contact");
      return;
    }
    await sendMessage({ name: result.data.name, email: result.data.email, message: result.data.message });
  };

  return (
    <div style={{ minHeight: "100vh", background: NAVY }}>

      {/* ── Sticky nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>

        {/* ── Page title ── */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.3rem" }}>
            Get in Touch
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", textTransform: "uppercase", color: WHITE, margin: 0, lineHeight: 1, letterSpacing: "-0.01em" }}>
            Contact Us
          </h1>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: "#A0ABBE", marginTop: "0.4rem" }}>
            Have a question or feedback? Reach out and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* ── Support channels ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>
            Live Support
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {[
              { href: "tel:+37060039999",            Icon: Phone, label: "WhatsApp / Call", value: "+370 600 39999" },
              { href: "tel:+34671880069",             Icon: Phone, label: "WhatsApp / Call", value: "+34 671 880069" },
              { href: "mailto:donatasjuskus@icloud.com", Icon: Mail,  label: "Email",           value: "donatasjuskus@icloud.com" },
            ].map(({ href, Icon, label, value }) => (
              <a
                key={href}
                href={href}
                style={{ textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.querySelector("div")!.style.borderColor = CYAN)}
                onMouseLeave={(e) => (e.currentTarget.querySelector("div")!.style.borderColor = BORDER_CLR)}
              >
                <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", textAlign: "center", transition: "border-color 0.15s ease" }}>
                  <Icon size={18} color={CYAN} />
                  <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.7rem", color: MUTED }}>{label}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: WHITE, wordBreak: "break-all" }}>{value}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Contact form ── */}
        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}` }}>
          <div style={{ padding: "1.25rem 1.25rem 0.5rem", borderBottom: `1px solid ${BORDER_CLR}` }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
              Send a Message
            </p>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Name */}
            <div>
              <label htmlFor="name" style={{ display: "block", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                style={inputStyle(focused === "name", !!errors.name)}
              />
              {errors.name && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: RED, marginTop: "0.25rem" }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: "block", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                style={inputStyle(focused === "email", !!errors.email)}
              />
              {errors.email && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: RED, marginTop: "0.25rem" }}>{errors.email}</p>}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" style={{ display: "block", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>
                Message
              </label>
              <textarea
                id="message"
                placeholder="How can we help?"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused(null)}
                style={{ ...inputStyle(focused === "message", !!errors.message), resize: "vertical" as const, lineHeight: 1.6 }}
              />
              {errors.message && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: RED, marginTop: "0.25rem" }}>{errors.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              style={{ alignSelf: "flex-start", background: sending ? "rgba(0,212,255,0.5)" : CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.7rem 1.5rem", border: "none", cursor: sending ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "background 0.15s ease" }}
            >
              {sending ? (
                <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending…</>
              ) : user ? (
                <><Send size={14} /> Send Message</>
              ) : (
                <><LogIn size={14} /> Sign Up / Log In to Send</>
              )}
            </button>

          </form>
        </div>

        {/* Placeholder styles for input ::placeholder */}
        <style>{`
          #name::placeholder, #email::placeholder, #message::placeholder {
            color: rgba(255,255,255,0.3);
          }
        `}</style>

      </main>
    </div>
  );
}
