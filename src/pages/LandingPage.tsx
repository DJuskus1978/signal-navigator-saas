import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/stripe-helpers";
import insideDashboardNewImg from "@/assets/inside-radar-dashboard-new.jpeg";
import insideSignalScoreImg from "@/assets/inside-radar-signal-score-new.jpeg";
import insideAnalystRatingsImg from "@/assets/inside-radar-analyst-ratings.jpeg";
import decisionGuidanceImg from "@/assets/decision-guidance.jpeg";
import marketSentimentImg from "@/assets/market-sentiment-dashboard.jpeg";
import avatarSarah from "@/assets/avatar-sarah.jpg";
import avatarJames from "@/assets/avatar-james.jpg";
import avatarElena from "@/assets/avatar-elena.jpg";
import avatarDavid from "@/assets/avatar-david.jpg";
import avatarPriya from "@/assets/avatar-priya.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp, Crown, Zap, BarChart3, Shield, Menu, X } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";
import { IPhoneFrame } from "@/components/IPhoneFrame";
import { useSwipe } from "@/hooks/use-swipe";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY        = "#0A0F2E";
const NAVY2       = "#0F1A3E";
const CYAN        = "#00D4FF";
const GREEN       = "#00C896";
const RED         = "#FF4757";
const GOLD        = "#FFB800";
const BORDER_CLR  = "#1E3A7B";
const MUTED       = "#6B7A99";
const WHITE       = "#FFFFFF";

// ── Framer variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

// ── Radar animation ───────────────────────────────────────────────────────────
function RadarVisual() {
  return (
    <div style={{ position: "relative", width: "320px", height: "320px", flexShrink: 0 }}>
      {/* Concentric rings */}
      {[320, 213, 107].map((size, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: `${size}px`, height: `${size}px`,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: `1px solid rgba(0,212,255,${0.12 + i * 0.1})`,
          animation: `radarRingPulse ${2.2 + i * 0.6}s ease-in-out infinite`,
        }} />
      ))}

      {/* Crosshair lines */}
      <div style={{ position: "absolute", top: "50%", left: "4px", right: "4px", height: "1px", background: "rgba(0,212,255,0.1)", transform: "translateY(-50%)" }} />
      <div style={{ position: "absolute", left: "50%", top: "4px", bottom: "4px", width: "1px", background: "rgba(0,212,255,0.1)", transform: "translateX(-50%)" }} />

      {/* Sweep line */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: "148px", height: "2px",
        transformOrigin: "left center",
        background: `linear-gradient(to right, ${CYAN}, transparent)`,
        animation: "radarSweep 3s linear infinite",
      }} />

      {/* Sweep fade sector */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: "148px", height: "148px",
        transformOrigin: "left bottom",
        transform: "translate(0, -100%)",
        background: `conic-gradient(from 270deg, rgba(0,212,255,0.07) 0deg, transparent 80deg)`,
        animation: "radarSweep 3s linear infinite",
        pointerEvents: "none",
      }} />

      {/* Signal dots */}
      {[
        { top: "26%", left: "63%", color: GREEN,  delay: "0.4s" },
        { top: "54%", left: "22%", color: GOLD,   delay: "1.0s" },
        { top: "71%", left: "67%", color: RED,    delay: "1.7s" },
      ].map((dot, i) => (
        <div key={i} style={{
          position: "absolute",
          top: dot.top, left: dot.left,
          width: "10px", height: "10px",
          borderRadius: "50%",
          background: dot.color,
          boxShadow: `0 0 10px ${dot.color}80`,
          animation: `dotPulse 2s ease-in-out ${dot.delay} infinite`,
        }} />
      ))}

      {/* Floating RadarScore card */}
      <div style={{
        position: "absolute",
        bottom: "12px", left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(15,26,62,0.96)",
        border: `1px solid ${BORDER_CLR}`,
        borderLeft: `3px solid ${CYAN}`,
        padding: "0.5rem 1.1rem",
        whiteSpace: "nowrap",
        animation: "floatCard 3.5s ease-in-out infinite",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
      }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", color: CYAN, textTransform: "uppercase", marginBottom: "0.2rem" }}>
          RadarScore™
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.7rem", color: WHITE, lineHeight: 1 }}>84</span>
          <span style={{ background: GREEN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.1em", padding: "0.15rem 0.45rem", borderRadius: "2px" }}>BUY</span>
        </div>
      </div>
    </div>
  );
}

// ── Ticker bar ────────────────────────────────────────────────────────────────
const TICKERS = [
  { sym: "AAPL", val: "+2.3%", color: GREEN },
  { sym: "MSFT", val: "+1.8%", color: GREEN },
  { sym: "NVDA", val: "+4.1%", color: GREEN },
  { sym: "GOOGL", val: "-0.6%", color: RED   },
  { sym: "AMZN", val: "+1.2%", color: GREEN },
  { sym: "META", val: "+3.4%", color: GREEN },
  { sym: "TSLA", val: "-1.9%", color: RED   },
  { sym: "BTC",  val: "+2.7%", color: GREEN },
  { sym: "ETH",  val: "+1.5%", color: GREEN },
  { sym: "JPM",  val: "+0.8%", color: GREEN },
  { sym: "V",    val: "+0.4%", color: GREEN },
  { sym: "DIS",  val: "-0.3%", color: RED   },
  { sym: "NFLX", val: "+1.1%", color: GREEN },
  { sym: "AMD",  val: "+3.2%", color: GREEN },
  { sym: "SPY",  val: "+0.9%", color: GREEN },
];

function TickerBar() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, overflow: "hidden", padding: "0.55rem 0" }}>
      <div style={{ display: "flex", animation: "tickerScroll 35s linear infinite", width: "max-content" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginRight: "2.5rem", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", color: CYAN }}>{t.sym}</span>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: t.color, fontWeight: 500 }}>{t.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared card style ─────────────────────────────────────────────────────────
function navyCard(leftColor: string = CYAN): React.CSSProperties {
  return {
    background: NAVY2,
    border: `1px solid ${BORDER_CLR}`,
    borderLeft: `5px solid ${leftColor}`,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  };
}

// ── Step card ─────────────────────────────────────────────────────────────────
function StepCard({ icon: Icon, num, title, desc }: { icon: React.ElementType; num: number; title: string; desc: string }) {
  return (
    <div style={{ ...navyCard(CYAN), padding: "2rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ width: "44px", height: "44px", background: "rgba(0,212,255,0.12)", border: `1px solid rgba(0,212,255,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={CYAN} />
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", color: "rgba(0,212,255,0.15)", lineHeight: 1 }}>{num}</span>
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em", textTransform: "uppercase", color: WHITE, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen]           = useState(false);
  const [loadingTier, setLoadingTier]     = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [insideIndex, setInsideIndex]     = useState(0);
  const [newsIndex, setNewsIndex]         = useState(0);
  const { user }                          = useAuth();
  const navigate                          = useNavigate();
  const pricingRef                        = useRef<HTMLElement>(null);

  const testimonials = [
    { name: "Sarah M.",   role: "Retail Investor",      avatar: avatarSarah, quote: "StocksRadars cut through all the noise. I used to spend hours reading conflicting opinions online — now I check my radars in 30 seconds and make confident decisions." },
    { name: "James T.",   role: "Part-time Trader",     avatar: avatarJames, quote: "The simplicity is what sold me. No jargon, no complicated charts — just a clear green, yellow, or red light. I've made smarter trades in two weeks than I did in six months on my own." },
    { name: "Elena R.",   role: "First-time Investor",  avatar: avatarElena, quote: "I was overwhelmed by the amount of stock information out there. StocksRadars made it so easy to understand what to buy and what to avoid. It's like having a financial advisor in my pocket." },
    { name: "David K.",   role: "Freelance Designer",   avatar: avatarDavid, quote: "I don't have time to research every stock. StocksRadars saves me hours every week and the recommendations have been spot-on. Fastest investing decisions I've ever made." },
    { name: "Priya N.",   role: "Software Engineer",    avatar: avatarPriya, quote: "I love data but hated sifting through endless financial reports. StocksRadars distills everything into one clear radar — it helped me navigate the market with real confidence." },
    { name: "Marcus L.",  role: "Small Business Owner", avatar: avatarDavid, quote: "As someone who invests on the side, I needed something dead simple. StocksRadars gives me a quick, reliable read on any stock — I check it every morning before the market opens." },
  ];

  const nextTestimonial = () => setTestimonialIndex((p) => (p + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIndex((p) => (p - 1 + testimonials.length) % testimonials.length);

  const insideSwipe     = useSwipe(() => setInsideIndex((p) => (p + 1) % 3), () => setInsideIndex((p) => (p - 1 + 3) % 3));
  const newsSwipe       = useSwipe(() => setNewsIndex((p) => (p + 1) % 3),   () => setNewsIndex((p) => (p - 1 + 3) % 3));
  const testimonialSwipe = useSwipe(nextTestimonial, prevTestimonial);

  const trackPlanClick = (planName: string, price: number) => {
    (window as any).gtag?.("event", "select_plan", { event_category: "pricing", plan_name: planName, plan_price: price });
  };

  const handlePlanClick = async (tier: "day_trader" | "pro_day_trader" | "bull_trader") => {
    const planMap = { day_trader: { name: "Day Trader", price: 9 }, pro_day_trader: { name: "Pro Day Trader", price: 19 }, bull_trader: { name: "Bull Trader", price: 29 } };
    trackPlanClick(planMap[tier].name, planMap[tier].price);
    if (!user) { navigate("/auth"); return; }
    setLoadingTier(tier);
    try { await startCheckout(tier); } finally { setLoadingTier(null); }
  };

  // GA pricing section view
  useEffect(() => {
    const el = pricingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { (window as any).gtag?.("event", "view_pricing_section", { event_category: "engagement" }); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const insideSlides = [
    { src: insideDashboardNewImg, alt: "StocksRadars dashboard showing ADBE stock with Buy recommendation, AI score 66, and expanded RadarScore with investor profile selector" },
    { src: insideSignalScoreImg,  alt: "StocksRadars signal card with Hold recommendation, Fundamentals/News/Technical weight bars, and AI confidence signals" },
    { src: insideAnalystRatingsImg, alt: "StocksRadars external analyst ratings with gauge, 12-month price target, and ratings distribution for MRK" },
  ];
  const newsSlides = [
    { src: decisionGuidanceImg,   alt: "StocksRadars Decision Guidance showing fundamental strength, news sentiment, and technical momentum analysis" },
    { src: marketSentimentImg,    alt: "StocksRadars General Market Sentiment gauge with bullish, neutral, bearish signals and S&P 500 tracker chart" },
  ];

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: WHITE }}>

      {/* ── CSS keyframes ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes radarRingPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.6); opacity: 0.6; }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-6px); }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes cyanPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(0,212,255,0); }
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }} aria-label="StocksRadars home">
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link to="/about" style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, textDecoration: "none", padding: "0.4rem 0.75rem" }}
              className="hidden md:block hover:text-white transition-colors">About</Link>
            <a href="#pricing" style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, textDecoration: "none", padding: "0.4rem 0.75rem" }}
              className="hidden md:block hover:text-white transition-colors">Pricing</a>
            <Link to="/auth" style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, textDecoration: "none", padding: "0.4rem 0.75rem" }}>
              Sign In
            </Link>
            <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.5rem 1.25rem", textDecoration: "none", borderRadius: 0 }}>
              Get Started
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, padding: "0.4rem", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: "0.25rem" }} aria-label="Toggle menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </nav>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {[
                  { to: "/about", label: "About" },
                  { to: "/contact", label: "Contact Us" },
                ].map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                    style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.9rem", color: WHITE, textDecoration: "none", padding: "0.6rem 0", borderBottom: `1px solid ${BORDER_CLR}` }}>
                    {item.label}
                  </Link>
                ))}
                <a href="#pricing" onClick={() => setMenuOpen(false)}
                  style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.9rem", color: WHITE, textDecoration: "none", padding: "0.6rem 0", borderBottom: `1px solid ${BORDER_CLR}` }}>
                  Pricing
                </a>
                <Link to="/auth" onClick={() => setMenuOpen(false)}
                  style={{ display: "inline-flex", justifyContent: "center", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.75rem", textDecoration: "none", borderRadius: 0, marginTop: "0.5rem" }}>
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "5rem 1.5rem 4rem" }} aria-label="Stock recommendations overview">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }} className="block md:grid">

          {/* Left */}
          <div>
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "1rem" }}>
                RadarScore™ AI Engine
              </p>
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(4rem, 8vw, 7rem)", lineHeight: 0.95, letterSpacing: "-0.01em", textTransform: "uppercase", margin: "0 0 1.5rem" }}>
              <span style={{ color: WHITE }}>AI STOCK</span><br />
              <span style={{ color: CYAN }}>SIGNALS</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
              style={{ fontFamily: "'Barlow', sans-serif", fontSize: "1.1rem", color: MUTED, lineHeight: 1.6, marginBottom: "2rem", maxWidth: "420px" }}>
              Professional trading rules for smart retail investors. RadarScore™ analyses fundamentals, sentiment and technicals — delivering one clear signal.
            </motion.p>

            {/* Market pills */}
            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
              style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem" }}>
              {["NASDAQ", "S&P 500", "DOW JONES", "CRYPTO"].map((m) => (
                <span key={m} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: CYAN, background: "rgba(0,212,255,0.08)", border: `1px solid rgba(0,212,255,0.25)`, padding: "0.3rem 0.85rem" }}>
                  {m}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
              style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.9rem 2rem", textDecoration: "none", borderRadius: 0, animation: "cyanPulse 2s ease-in-out infinite" }}>
                Start Free Trial
              </Link>
              <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "transparent", color: WHITE, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.9rem 2rem", textDecoration: "none", borderRadius: 0, border: `1px solid ${BORDER_CLR}` }}>
                See How It Works
              </a>
            </motion.div>
          </div>

          {/* Right — iPhone mockup (desktop only) */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden md:flex"
            style={{ justifyContent: "center", alignItems: "center" }}>
            <IPhoneFrame>
              <img
                src={insideDashboardNewImg}
                alt="StocksRadars dashboard on iPhone"
                style={{ width: "100%", display: "block" }}
              />
            </IPhoneFrame>
          </motion.div>
        </div>
      </section>

      {/* ── TICKER BAR ──────────────────────────────────────────────────────── */}
      <TickerBar />

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 1.5rem" }} aria-label="How StocksRadars work">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Simple Process</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", letterSpacing: "0.02em", color: WHITE, margin: 0 }}>
            How StocksRadars Work
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          {[
            { icon: Zap,      num: 1, title: "Sign Up Free",       desc: "Create your free stock analysis account in seconds with Apple, Google or email." },
            { icon: Shield,   num: 2, title: "Choose Your Plan",    desc: "Unlock unlimited stock recommendations and full market coverage." },
            { icon: BarChart3, num: 3, title: "Get StocksRadars",   desc: "See clear Buy, Hold, or Sell signals for every Nasdaq, Dow Jones, S&P 500 stock & crypto." },
          ].map((step, i) => (
            <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}>
              <StepCard {...step} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── INSIDE THE RADAR ────────────────────────────────────────────────── */}
      <section style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, padding: "6rem 1.5rem" }} aria-label="Inside StocksRadars">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Platform Preview</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", letterSpacing: "0.02em", color: WHITE, marginBottom: "1rem" }}>
            Inside the StocksRadars
          </h2>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.95rem", color: MUTED, lineHeight: 1.7, marginBottom: "3rem" }}>
            Select your investment horizon — <em style={{ color: WHITE }}>Short</em>, <em style={{ color: WHITE }}>Medium</em>, or <em style={{ color: WHITE }}>Long term</em> — and get personalised AI-powered Stock Radars instantly.
          </p>

          <div className="flex justify-center" {...insideSwipe}>
            <div style={{ width: "100%", maxWidth: "280px", margin: "0 auto" }}>
              <AnimatePresence mode="wait">
                <motion.div key={insideIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                  <IPhoneFrame>
                    <img src={insideSlides[insideIndex].src} alt={insideSlides[insideIndex].alt} style={{ width: "100%", height: "auto" }} loading="lazy" />
                  </IPhoneFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button onClick={() => setInsideIndex((p) => (p - 1 + insideSlides.length) % insideSlides.length)} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Previous screenshot"><ChevronLeft size={16} /></button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {insideSlides.map((_, i) => (
                <button key={i} onClick={() => setInsideIndex(i)} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === insideIndex ? CYAN : BORDER_CLR, border: "none", cursor: "pointer", padding: 0 }} aria-label={`Screenshot ${i + 1}`} />
              ))}
            </div>
            <button onClick={() => setInsideIndex((p) => (p + 1) % insideSlides.length)} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Next screenshot"><ChevronRight size={16} /></button>
          </div>
        </motion.div>
      </section>

      {/* ── NEWS & SENTIMENT ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: "700px", margin: "0 auto", padding: "6rem 1.5rem" }} aria-label="News sentiment analysis">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>AI Analysis</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", letterSpacing: "0.02em", color: WHITE, marginBottom: "1rem" }}>
            Real-Time News & Sentiment
          </h2>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.95rem", color: MUTED, lineHeight: 1.7, marginBottom: "3rem" }}>
            Our AI RadarScore™ scans thousands of news sources and market signals to deliver clear stock insights you can act on instantly.
          </p>

          <div className="flex justify-center" {...newsSwipe}>
            <div style={{ width: "100%", maxWidth: "280px", margin: "0 auto" }}>
              <AnimatePresence mode="wait">
                <motion.div key={newsIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                  <IPhoneFrame>
                    <img src={newsSlides[newsIndex].src} alt={newsSlides[newsIndex].alt} style={{ width: "100%", height: "auto" }} loading="lazy" />
                  </IPhoneFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button onClick={() => setNewsIndex((p) => (p - 1 + newsSlides.length) % newsSlides.length)} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Previous"><ChevronLeft size={16} /></button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {newsSlides.map((_, i) => (
                <button key={i} onClick={() => setNewsIndex(i)} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === newsIndex ? CYAN : BORDER_CLR, border: "none", cursor: "pointer", padding: 0 }} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
            <button onClick={() => setNewsIndex((p) => (p + 1) % newsSlides.length)} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Next"><ChevronRight size={16} /></button>
          </div>
        </motion.div>
      </section>

      {/* ── SECTION 1: RADARSCORE AI ENGINE ─────────────────────────────────── */}
      <section style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>RadarScore™ AI Engine</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", color: WHITE, margin: 0 }}>What Powers Our Intelligence</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "2rem", alignItems: "center" }} className="block md:grid">
            {/* ANALYZES column */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginBottom: "1rem" }}>ANALYZES</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Fundamental Analysis", desc: "Financial ratios & earnings" },
                  { label: "News Sentiment",        desc: "Real-time market news" },
                  { label: "Momentum",              desc: "Market momentum signals" },
                  { label: "Institutional",         desc: "Trading behavior patterns" },
                ].map((item) => (
                  <div key={item.label} style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "0.875rem 1rem" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: WHITE, marginBottom: "0.2rem" }}>{item.label}</div>
                    <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "48px", height: "48px", border: `2px solid ${CYAN}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.5rem", color: CYAN }}>→</span>
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" }}>Output</span>
              </div>
            </motion.div>

            {/* DELIVERS column */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, marginBottom: "1rem" }}>DELIVERS</p>
              <div style={{ background: NAVY, border: `2px solid ${CYAN}`, borderLeft: `5px solid ${CYAN}`, padding: "1.5rem", boxShadow: `0 0 40px rgba(0,212,255,0.1)` }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.5rem" }}>Simple Stock Radar</p>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, marginBottom: "1.5rem", lineHeight: 1.5 }}>You can act on instantly</p>
                {/* MSFT sample card */}
                <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `3px solid ${GREEN}`, padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: WHITE }}>MSFT</div>
                      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED }}>Microsoft Corp</div>
                    </div>
                    <span style={{ background: GREEN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.1em", padding: "0.2rem 0.6rem", borderRadius: "2px" }}>BUY</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.2rem", color: WHITE, lineHeight: 1 }}>84</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", color: MUTED, textTransform: "uppercase" }}>RadarScore™</span>
                  </div>
                  <div style={{ height: "4px", background: BORDER_CLR, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: "84%", height: "100%", background: GREEN, borderRadius: "2px" }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: INSTITUTIONAL TRADING PRACTICES ───────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "6rem 1.5rem" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ marginBottom: "3rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Professional Edge</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", color: WHITE, marginBottom: "0.75rem" }}>Institutional Trading Practices</h2>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.95rem", color: MUTED }}>Professional rules used by hedge funds &amp; investment desks — built into every StocksRadars signal.</p>
        </motion.div>

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1px", marginBottom: "0.5rem", padding: "0 1rem" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN }}>PRACTICE</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN }}>IMPLEMENTATION</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "Hard Stop-Loss",  color: RED,   desc: "Auto-exit at -8% loss — strict capital protection rule" },
            { label: "Trailing Stop",   color: GOLD,  desc: "-12% from peak price — locks profits on winning trades" },
            { label: "Take-Profit",     color: GREEN, desc: "Sell 50% at +25% gain — institutional profit-taking strategy" },
            { label: "Position Sizing", color: CYAN,  desc: "Kelly-inspired sizing adjusted for volatility (max 5% per stock)" },
            { label: "No Chasing",      color: GOLD,  desc: "Avoid buying stocks already +4% intraday or crashing > -5%" },
            { label: "Cash Reserve",    color: CYAN,  desc: "Keep 20% cash available for opportunities" },
            { label: "Defensive Mode",  color: RED,   desc: "If portfolio drops >15%, enter only highest conviction signals" },
          ].map((row, i) => (
            <motion.div key={row.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5} variants={fadeUp}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${row.color}`, padding: "0.875rem 1rem", alignItems: "center" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", color: row.color }}>{row.label}</div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, lineHeight: 1.5 }}>{row.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: THE 12 GOLDEN RULES ──────────────────────────────────── */}
      <section style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Core Discipline of Successful Investors</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", color: WHITE, margin: 0 }}>The 12 Golden Rules</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.75rem" }}>
            {[
              { n: 1,  color: CYAN,  rule: "Never invest money you cannot afford to lose" },
              { n: 2,  color: GOLD,  rule: "Always define your investing horizon" },
              { n: 3,  color: GREEN, rule: "Diversify across sectors and companies" },
              { n: 4,  color: CYAN,  rule: "Protect capital before chasing profits" },
              { n: 5,  color: RED,   rule: "Never risk more than 1–3% of portfolio per trade" },
              { n: 6,  color: CYAN,  rule: "Avoid emotional trading decisions" },
              { n: 7,  color: CYAN,  rule: "Ignore short-term market hype" },
              { n: 8,  color: GOLD,  rule: "Focus on strong companies with real growth" },
              { n: 9,  color: GREEN, rule: "Patience beats frequent trading" },
              { n: 10, color: CYAN,  rule: "Continuously learn from market data" },
              { n: 11, color: RED,   rule: "Use objective tools and analytics" },
              { n: 12, color: CYAN,  rule: "Let data guide decisions — not emotions" },
            ].map((item, i) => (
              <motion.div key={item.n} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.1} variants={fadeUp}>
                <div style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${item.color}`, padding: "1rem 1rem 1rem 0.875rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>{item.n}</span>
                  </div>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, lineHeight: 1.4, margin: 0 }}>{item.rule}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: RISK MANAGEMENT FRAMEWORK ────────────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "6rem 1.5rem" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ marginBottom: "3rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>How professionals think about capital</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", color: WHITE, margin: 0 }}>Risk Management Framework</h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
          {/* The Professional Mindset */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
            <div style={{ ...navyCard(CYAN), padding: "1.75rem", height: "100%" }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "1.25rem" }}>The Professional Mindset</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, padding: "1rem" }}>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>First ask</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", color: CYAN, margin: 0 }}>"How much can I lose?"</p>
                </div>
                <div style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, padding: "1rem" }}>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, marginBottom: "0.35rem" }}>Then ask</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", color: GOLD, margin: 0 }}>"How much can I gain?"</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Portfolio Allocation Model */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
            <div style={{ ...navyCard(CYAN), padding: "1.75rem", height: "100%" }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "1.25rem" }}>Portfolio Allocation Model</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Core Holdings",          pct: "50–60%", width: 55, color: CYAN  },
                  { label: "Growth Opportunities",   pct: "20–30%", width: 25, color: GREEN },
                  { label: "Tactical Trades",        pct: "10–20%", width: 15, color: GOLD  },
                  { label: "Cash Reserve",           pct: "20%",    width: 20, color: MUTED },
                ].map((row) => (
                  <div key={row.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: WHITE }}>{row.label}</span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: row.color }}>{row.pct}</span>
                    </div>
                    <div style={{ height: "5px", background: BORDER_CLR, overflow: "hidden" }}>
                      <div style={{ width: `${row.width}%`, height: "100%", background: row.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-width proportion bar */}
        <div style={{ height: "12px", display: "flex", overflow: "hidden", marginBottom: "1rem" }}>
          {[{ w: 55, c: CYAN }, { w: 25, c: GREEN }, { w: 15, c: GOLD }, { w: 5, c: MUTED }].map((s, i) => (
            <div key={i} style={{ flex: s.w, background: s.c }} />
          ))}
        </div>

        {/* Banner */}
        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.18em", textTransform: "uppercase", color: CYAN }}>CAPITAL PROTECTION FIRST</span>
        </div>
      </section>

      {/* ── SECTION 5: DAILY TRADING DISCIPLINE ─────────────────────────────── */}
      <section style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Before entering any trade, ask these 4 questions</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", color: WHITE, margin: 0 }}>Daily Trading Discipline</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
            {[
              { n: 1, color: CYAN,  q: "What is my risk?",                        a: "Define maximum acceptable loss before entry",        bar: CYAN  },
              { n: 2, color: GOLD,  q: "What is my exit level?",                  a: "Set stop-loss and take-profit targets",              bar: GOLD  },
              { n: 3, color: GREEN, q: "What is my position size?",               a: "Size based on risk tolerance (1–3% per trade)",      bar: GREEN },
              { n: 4, color: RED,   q: "Does signal align with my horizon?",      a: "Confirm timeframe matches your strategy",            bar: RED   },
            ].map((item, i) => (
              <motion.div key={item.n} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.15} variants={fadeUp}>
                <div style={{ background: WHITE, position: "relative", overflow: "hidden", padding: "1.5rem", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", color: NAVY }}>{item.n}</span>
                    </div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.04em", color: NAVY, margin: 0 }}>{item.q}</p>
                  </div>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", color: "#4A5568", lineHeight: 1.5, flex: 1, margin: 0 }}>{item.a}</p>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: item.bar }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Warning banner */}
          <div style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.5rem 2rem", textAlign: "center" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.16em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
              If the answer to any question is unclear — DO NOT TRADE.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: THE GOAL OF SUCCESSFUL INVESTING ──────────────────────── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "6rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }} className="block md:grid">

          {/* Left */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.5rem" }}>Philosophy</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 400, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>The Goal of</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 4vw, 3.5rem)", textTransform: "uppercase", color: WHITE, lineHeight: 0.95, margin: "0 0 1.25rem" }}>Successful Investing</h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "1.05rem", color: MUTED, fontStyle: "italic", marginBottom: "1.75rem" }}>is not to win every trade.</p>
            <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.9rem", color: WHITE, lineHeight: 1.7, margin: 0 }}>
                It's about <span style={{ color: CYAN }}>protecting capital</span>, staying <span style={{ color: GOLD }}>disciplined</span>, and letting <span style={{ color: GREEN }}>compound returns</span> work over time.
              </p>
            </div>
            <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.9rem 2rem", textDecoration: "none", borderRadius: 0 }}>
              Start Your Free Trial
            </Link>
          </motion.div>

          {/* Right — comparisons */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { better: "Consistent returns",  vs: "One big win",      betterColor: GREEN, vsColor: RED   },
                { better: "Capital protection",  vs: "Chasing gains",    betterColor: GREEN, vsColor: RED   },
                { better: "Compound growth",     vs: "Frequent trading", betterColor: GREEN, vsColor: RED   },
                { better: "Data-driven signals", vs: "Gut feeling",      betterColor: GREEN, vsColor: RED   },
              ].map((row) => (
                <div key={row.better} style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, padding: "0.875rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: row.betterColor }}>✓ {row.better}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: MUTED, textTransform: "uppercase" }}>over</span>
                  <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", color: MUTED, textDecoration: "line-through" }}>{row.vs}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" ref={pricingRef} style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, padding: "6rem 1.5rem" }} aria-label="StocksRadars pricing plans">
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Plans</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", letterSpacing: "0.02em", color: WHITE, marginBottom: "0.75rem" }}>
              StocksRadars Pricing
            </h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.95rem", color: MUTED }}>Pick the plan that fits your trading style. Upgrade or downgrade anytime.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.25rem" }}>

            {/* Novice Trader */}
            {(() => {
              const features = ["2 stock checks per day", "Nasdaq, Dow & S&P 500", "Buy/Hold/Sell radars", "Basic technical analysis"];
              return (
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
                  <div style={{ ...navyCard(GREEN), padding: "1.75rem", display: "flex", flexDirection: "column", height: "100%" }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GREEN, marginBottom: "0.75rem" }}>NOVICE TRADER</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.8rem", color: WHITE, lineHeight: 1 }}>$0</span>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>/month</span>
                    </div>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, marginBottom: "1.5rem" }}>7-day free trial</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                      {features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE }}>
                          <span style={{ color: GREEN, marginTop: "2px", flexShrink: 0 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/auth" onClick={() => trackPlanClick("Novice Trader", 0)} style={{ display: "block", textAlign: "center", background: GREEN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.85rem", textDecoration: "none", borderRadius: 0 }}>
                      Start Free
                    </Link>
                  </div>
                </motion.div>
              );
            })()}

            {/* Day Trader */}
            {(() => {
              const features = ["25 real-time stock checks/day", "All Nasdaq, Dow & S&P 500", "Simple Traders Radars", "Real-time Buy/Hold/Sell radars", "Technical & fundamental analysis"];
              return (
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
                  <div style={{ ...navyCard(CYAN), padding: "1.75rem", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}><TrendingUp size={18} color={CYAN} /></div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>DAY TRADER</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.8rem", color: WHITE, lineHeight: 1 }}>$9</span>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>/month</span>
                    </div>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, marginBottom: "1.5rem" }}>Cancel anytime</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                      {features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE }}>
                          <span style={{ color: GREEN, marginTop: "2px", flexShrink: 0 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handlePlanClick("day_trader")} disabled={loadingTier === "day_trader"}
                      style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.85rem", border: "none", borderRadius: 0, cursor: "pointer", width: "100%", opacity: loadingTier === "day_trader" ? 0.6 : 1 }}>
                      {loadingTier === "day_trader" ? "Loading…" : "Get Started"}
                    </button>
                  </div>
                </motion.div>
              );
            })()}

            {/* Pro Day Trader — featured */}
            {(() => {
              const features = ["50 real-time stock checks/day", "All Nasdaq, Dow & S&P 500", "Simple + Advanced Radars", "Real-time Buy/Hold/Sell radars", "Technical & fundamental analysis", "Radars adapted to Investor Profiles", "Confidence indicators"];
              return (
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}>
                  <div style={{ background: NAVY2, border: `2px solid ${CYAN}`, borderLeft: `5px solid ${CYAN}`, boxShadow: `0 0 40px rgba(0,212,255,0.15)`, padding: "1.75rem", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.18em", padding: "0.2rem 0.75rem" }}>MOST POPULAR</div>
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}><Zap size={18} color={CYAN} /></div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem", marginTop: "0.75rem" }}>PRO DAY TRADER</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.8rem", color: WHITE, lineHeight: 1 }}>$19</span>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>/month</span>
                    </div>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, marginBottom: "1.5rem" }}>Cancel anytime</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                      {features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE }}>
                          <span style={{ color: GREEN, marginTop: "2px", flexShrink: 0 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handlePlanClick("pro_day_trader")} disabled={loadingTier === "pro_day_trader"}
                      style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.85rem", border: "none", borderRadius: 0, cursor: "pointer", width: "100%", opacity: loadingTier === "pro_day_trader" ? 0.6 : 1 }}>
                      {loadingTier === "pro_day_trader" ? "Loading…" : "Get Started"}
                    </button>
                  </div>
                </motion.div>
              );
            })()}

            {/* Bull Trader */}
            {(() => {
              const features = ["Unlimited real-time stock checks", "All Nasdaq, Dow & S&P 500", "Simple + Advanced Radars", "Real-time Buy/Hold/Sell radars", "Technical & fundamental analysis", "Crypto radars (BTC, ETH & more)", "Radars adapted to Investor Profiles", "Confidence indicators", "Priority support"];
              return (
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp}>
                  <div style={{ ...navyCard(GOLD), padding: "1.75rem", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}><Crown size={18} color={GOLD} /></div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: "0.75rem" }}>BULL TRADER</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.8rem", color: WHITE, lineHeight: 1 }}>$29</span>
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>/month</span>
                    </div>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, marginBottom: "1.5rem" }}>Cancel anytime</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                      {features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE }}>
                          <span style={{ color: GREEN, marginTop: "2px", flexShrink: 0 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => handlePlanClick("bull_trader")} disabled={loadingTier === "bull_trader"}
                      style={{ background: GOLD, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.85rem", border: "none", borderRadius: 0, cursor: "pointer", width: "100%", opacity: loadingTier === "bull_trader" ? 0.6 : 1 }}>
                      {loadingTier === "bull_trader" ? "Loading…" : "Get Started"}
                    </button>
                  </div>
                </motion.div>
              );
            })()}

          </div>
        </div>
      </section>

      {/* ── FOUNDER QUOTE ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "5rem 1.5rem" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "1rem", color: MUTED, lineHeight: 1.8, fontStyle: "italic", marginBottom: "1.5rem" }}>
            "Our proprietary AI-powered algorithm — RadarScore™ — analyses massive amounts of market data, delivering a single, clear stock recommendation you can trust. No jargon, no complexity: just actionable radars designed for everyday investors who want professional-grade insights without the learning curve."
          </p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: CYAN }}>D. Juskus — Founder</p>
        </motion.div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section style={{ background: NAVY2, borderTop: `1px solid ${BORDER_CLR}`, borderBottom: `1px solid ${BORDER_CLR}`, padding: "6rem 1.5rem" }} aria-label="Customer reviews">
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>Reviews</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 4vw, 3rem)", textTransform: "uppercase", letterSpacing: "0.02em", color: WHITE, marginBottom: "0.75rem" }}>
              What investors say
            </h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.9rem", color: MUTED }}>Real reviews from everyday investors using our stock recommendation tool</p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={testimonialIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} {...testimonialSwipe}>
              <div style={{ ...navyCard(CYAN), padding: "2rem 2rem 1.75rem" }}>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.95rem", color: MUTED, lineHeight: 1.75, fontStyle: "italic", marginBottom: "1.5rem" }}>
                  "{testimonials[testimonialIndex].quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <img src={testimonials[testimonialIndex].avatar} alt={testimonials[testimonialIndex].name} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${BORDER_CLR}` }} />
                  <div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: WHITE, letterSpacing: "0.05em" }}>{testimonials[testimonialIndex].name}</p>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED }}>{testimonials[testimonialIndex].role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
            <button onClick={prevTestimonial} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Previous testimonial"><ChevronLeft size={16} /></button>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIndex(i)} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === testimonialIndex ? CYAN : BORDER_CLR, border: "none", cursor: "pointer", padding: 0 }} aria-label={`Testimonial ${i + 1}`} />
              ))}
            </div>
            <button onClick={nextTestimonial} style={{ background: "none", border: `1px solid ${BORDER_CLR}`, color: WHITE, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Next testimonial"><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: NAVY, borderTop: `1px solid ${BORDER_CLR}`, padding: "3rem 1.5rem 2.5rem" }} role="contentinfo">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </div>

          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED, maxWidth: "560px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            This information is not a personal recommendation or investment advice. Conduct your own research and consider your financial situation before making any investment decisions.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {[
              { to: "/about",   label: "About"   },
              { to: "/terms",   label: "Terms"   },
              { to: "/privacy", label: "Privacy" },
              { to: "/brand",   label: "Brand"   },
              { to: "/contact", label: "Contact" },
            ].map((link) => (
              <Link key={link.to} to={link.to} style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, textDecoration: "none" }}
                className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${BORDER_CLR}`, paddingTop: "1.5rem" }}>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED }}>© {new Date().getFullYear()} StocksRadars — AI Stock Recommendations. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
