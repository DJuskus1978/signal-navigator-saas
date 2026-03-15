import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Star, ArrowLeft, TrendingUp } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/stripe-helpers";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";
const GOLD       = "#FFB800";

// ── Tier pick limits ──────────────────────────────────────────────────────────
const TIER_LIMITS: Record<string, number> = {
  novice:        1,
  day_trader:    5,
  pro_day_trader: 10,
  bull_trader:   15,
};

const UPGRADE_INFO: Record<string, { tier: "day_trader" | "pro_day_trader" | "bull_trader"; label: string; price: string }> = {
  novice:        { tier: "day_trader",       label: "Day Trader",       price: "$9/mo"  },
  day_trader:    { tier: "pro_day_trader",   label: "Pro Day Trader",   price: "$19/mo" },
  pro_day_trader:{ tier: "bull_trader",      label: "Bull Trader",      price: "$29/mo" },
};

// ── Daily picks data (sorted: Strong Buy first, then Buy, by score desc) ─────
interface DailyPick {
  ticker: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  score: number;
  signal: "STRONG BUY" | "BUY";
  confidence: "Strong" | "Moderate";
  reasons: string[];
}

const DAILY_PICKS: DailyPick[] = [
  {
    ticker: "NVDA", name: "NVIDIA Corporation",
    price: "891.03", change: "+4.2%", positive: true,
    score: 94, signal: "STRONG BUY", confidence: "Strong",
    reasons: [
      "Revenue grew +122% YoY driven by data centre AI demand",
      "RSI recovery from oversold with volume surge above 200-day MA",
      "Analyst consensus: 42 Buy, 3 Hold — institutional accumulation rising",
    ],
  },
  {
    ticker: "META", name: "Meta Platforms Inc",
    price: "562.10", change: "+2.8%", positive: true,
    score: 91, signal: "STRONG BUY", confidence: "Strong",
    reasons: [
      "Ad revenue accelerating with AI-powered targeting improvements",
      "MACD bullish crossover confirmed on daily chart",
      "News sentiment at 3-month high following Llama announcements",
    ],
  },
  {
    ticker: "MSFT", name: "Microsoft Corporation",
    price: "415.20", change: "+1.6%", positive: true,
    score: 89, signal: "STRONG BUY", confidence: "Strong",
    reasons: [
      "Azure cloud growth accelerating to 31% — ahead of consensus",
      "Copilot monetisation starting to reflect in enterprise ARR numbers",
      "Free cash flow yield of 3.2% with consistent dividend growth trajectory",
    ],
  },
  {
    ticker: "AAPL", name: "Apple Inc",
    price: "224.53", change: "+1.1%", positive: true,
    score: 87, signal: "STRONG BUY", confidence: "Strong",
    reasons: [
      "Services segment $26B/quarter — high-margin recurring revenue base",
      "Breaking out of 8-week consolidation above $220 resistance level",
      "Institutional net buying at highest level since Q4 2023",
    ],
  },
  {
    ticker: "AMZN", name: "Amazon.com Inc",
    price: "198.75", change: "+2.3%", positive: true,
    score: 86, signal: "STRONG BUY", confidence: "Strong",
    reasons: [
      "AWS operating margin expanded to 38% — record quarterly level",
      "Technical breakout above prior all-time high on above-average volume",
    ],
  },
  {
    ticker: "TSM", name: "Taiwan Semiconductor",
    price: "168.90", change: "+2.0%", positive: true,
    score: 84, signal: "BUY", confidence: "Strong",
    reasons: [
      "3nm capacity fully booked through 2025 by NVDA and AAPL",
      "Revenue guidance raised +30% YoY on AI chip fabrication demand",
    ],
  },
  {
    ticker: "LLY", name: "Eli Lilly and Company",
    price: "812.40", change: "+3.1%", positive: true,
    score: 83, signal: "BUY", confidence: "Strong",
    reasons: [
      "Mounjaro/Zepbound demand far exceeding supply — backlog growing",
      "Pipeline of next-generation GLP-1 drugs offers multi-year growth runway",
    ],
  },
  {
    ticker: "GOOGL", name: "Alphabet Inc",
    price: "175.40", change: "+0.9%", positive: true,
    score: 82, signal: "BUY", confidence: "Moderate",
    reasons: [
      "Search revenue resilient; YouTube Shorts monetisation improving",
      "Gemini AI integration driving cloud deal wins above Q3 expectations",
    ],
  },
  {
    ticker: "JPM", name: "JPMorgan Chase & Co",
    price: "225.60", change: "+0.5%", positive: true,
    score: 81, signal: "BUY", confidence: "Strong",
    reasons: [
      "Net interest income beat by $1.2B; credit quality remains solid",
      "Trading revenues strongest since 2021 with macro volatility tailwind",
    ],
  },
  {
    ticker: "UNH", name: "UnitedHealth Group",
    price: "495.80", change: "-0.4%", positive: false,
    score: 80, signal: "BUY", confidence: "Moderate",
    reasons: [
      "Optum Health revenues growing 13% — margin expansion intact",
      "Near 52-week low creates compelling risk/reward entry point",
    ],
  },
  {
    ticker: "V", name: "Visa Inc",
    price: "282.30", change: "+0.7%", positive: true,
    score: 79, signal: "BUY", confidence: "Moderate",
    reasons: [
      "Cross-border payment volumes up 16% YoY — international recovery",
      "Strong buyback programme: $2.5B repurchased in most recent quarter",
    ],
  },
  {
    ticker: "ASML", name: "ASML Holding NV",
    price: "824.70", change: "+1.8%", positive: true,
    score: 78, signal: "BUY", confidence: "Moderate",
    reasons: [
      "EUV backlog secured through 2026; sole supplier of critical litho tools",
      "AI-driven chip demand pulling forward 2025 capex commitments",
    ],
  },
  {
    ticker: "HD", name: "The Home Depot Inc",
    price: "371.40", change: "+0.6%", positive: true,
    score: 77, signal: "BUY", confidence: "Moderate",
    reasons: [
      "Housing repair backlog elevated — Pro segment outperforming",
      "SRS Distribution acquisition adds $6.7B in annualised revenue",
    ],
  },
  {
    ticker: "COST", name: "Costco Wholesale Corp",
    price: "892.10", change: "+0.3%", positive: true,
    score: 76, signal: "BUY", confidence: "Moderate",
    reasons: [
      "Membership fee income at all-time high — 92.7% renewal rate",
      "E-commerce penetration growing, diversifying from in-store reliance",
    ],
  },
  {
    ticker: "BRK.B", name: "Berkshire Hathaway B",
    price: "448.20", change: "+0.2%", positive: true,
    score: 75, signal: "BUY", confidence: "Moderate",
    reasons: [
      "$167B cash hoard provides unmatched optionality in volatile markets",
      "Insurance segment earnings at record with combined ratio improving",
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function DailyPicksPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { data: subscription } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const tier       = subscription?.tier ?? "novice";
  const visibleN   = TIER_LIMITS[tier] ?? 1;
  const upgradeInfo = UPGRADE_INFO[tier];

  const today    = new Date();
  const dateStr  = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const handleUpgrade = async (upgradeTier: "day_trader" | "pro_day_trader" | "bull_trader") => {
    if (!user) { navigate("/auth"); return; }
    setLoadingTier(upgradeTier);
    try { await startCheckout(upgradeTier); } finally { setLoadingTier(null); }
  };

  const TIER_LABELS: Record<string, string> = {
    novice: "Novice Trader (Free Trial)",
    day_trader: "Day Trader",
    pro_day_trader: "Pro Day Trader",
    bull_trader: "Bull Trader",
  };

  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: WHITE }}>
      <style>{`
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Sticky Nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>
          <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Star size={14} color={GOLD} fill={GOLD} />
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: 0 }}>
              StocksRadars™ Daily Picks
            </p>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", textTransform: "uppercase", color: WHITE, margin: "0 0 0.35rem", lineHeight: 1, letterSpacing: "-0.01em" }}>
            Today's AI-Selected<br />
            <span style={{ color: CYAN }}>Buy Signals</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, margin: 0 }}>
              {dateStr}
            </p>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: NAVY, background: tier === "bull_trader" ? GOLD : CYAN, padding: "0.2rem 0.6rem" }}>
              {TIER_LABELS[tier]}
            </span>
          </div>
        </div>

        {/* ── Picks count banner ── */}
        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${GREEN}`, padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <TrendingUp size={16} color={GREEN} />
            <div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: GREEN }}>
                {visibleN} Pick{visibleN !== 1 ? "s" : ""} Available
              </span>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", color: WHITE, margin: 0, marginTop: "0.1rem" }}>
                AI-selected Buy &amp; Strong Buy signals — refreshed daily at market open
              </p>
            </div>
          </div>
          {upgradeInfo && (
            <button
              onClick={() => handleUpgrade(upgradeInfo.tier)}
              disabled={loadingTier === upgradeInfo.tier}
              style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.5rem 1.1rem", border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", opacity: loadingTier ? 0.7 : 1 }}
            >
              {loadingTier === upgradeInfo.tier ? "Loading…" : `Unlock All — ${upgradeInfo.price}`}
            </button>
          )}
        </div>

        {/* ── Picks list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {DAILY_PICKS.map((pick, i) => {
            const isVisible = i < visibleN;
            const signalColor = pick.signal === "STRONG BUY" ? GREEN : CYAN;

            // Determine which upgrade is needed to unlock this pick
            const unlockTier = Object.entries(TIER_LIMITS).find(([, limit]) => limit > i)?.[0] as string | undefined;
            const unlockInfo = unlockTier && UPGRADE_INFO[unlockTier];

            return (
              <div key={pick.ticker} style={{ position: "relative" }}>
                {/* Card content (always rendered, blurred when locked) */}
                <div style={{
                  background: NAVY2,
                  border: `1px solid ${BORDER_CLR}`,
                  borderLeft: `5px solid ${signalColor}`,
                  padding: "1.25rem 1.5rem",
                  filter: isVisible ? "none" : "blur(5px)",
                  pointerEvents: isVisible ? "auto" : "none",
                  userSelect: isVisible ? "auto" : "none",
                  transition: "filter 0.2s ease",
                }}>
                  {/* Row 1: rank + ticker + badges + score */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "0.85rem", color: MUTED, minWidth: "1.5rem" }}>#{i + 1}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.4rem", color: WHITE, letterSpacing: "0.02em", lineHeight: 1 }}>
                            {pick.ticker}
                          </span>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: NAVY, background: signalColor, padding: "0.2rem 0.5rem" }}>
                            {pick.signal}
                          </span>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: pick.confidence === "Strong" ? GREEN : GOLD, background: "transparent", border: `1px solid ${pick.confidence === "Strong" ? GREEN : GOLD}`, padding: "0.15rem 0.45rem" }}>
                            {pick.confidence}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: MUTED, margin: "0.2rem 0 0", lineHeight: 1 }}>
                          {pick.name}
                        </p>
                      </div>
                    </div>

                    {/* Right: RadarScore + price */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                          RadarScore™
                        </p>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2rem", color: CYAN, lineHeight: 1 }}>
                          {pick.score}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                          Price
                        </p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", color: WHITE, margin: 0, lineHeight: 1.2 }}>
                          ${pick.price}
                        </p>
                        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: pick.positive ? GREEN : "#FF4757", margin: 0 }}>
                          {pick.change}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: AI signal reasons */}
                  <div style={{ borderTop: `1px solid ${BORDER_CLR}`, paddingTop: "0.75rem" }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: CYAN, marginBottom: "0.4rem" }}>
                      Why this stock?
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {pick.reasons.map((reason, ri) => (
                        <li key={ri} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, lineHeight: 1.45 }}>
                          <span style={{ color: signalColor, flexShrink: 0, marginTop: "1px" }}>▸</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Lock overlay */}
                {!isVisible && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                    background: "rgba(10,15,46,0.75)",
                    backdropFilter: "blur(2px)",
                  }}>
                    <Lock size={18} color={MUTED} style={{ opacity: 0.7 }} />
                    {unlockInfo ? (
                      <>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: WHITE, margin: 0, textAlign: "center" }}>
                          Upgrade to {unlockInfo.label} to unlock
                        </p>
                        <button
                          onClick={() => handleUpgrade(unlockInfo.tier)}
                          disabled={!!loadingTier}
                          style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.5rem 1.25rem", border: "none", cursor: "pointer", opacity: loadingTier ? 0.7 : 1 }}
                        >
                          {loadingTier === unlockInfo.tier ? "Loading…" : `${unlockInfo.label} — ${unlockInfo.price}`}
                        </button>
                      </>
                    ) : (
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                        Upgrade to unlock
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Disclaimer ── */}
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, lineHeight: 1.5, marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: `1px solid ${BORDER_CLR}`, textAlign: "center", opacity: 0.7 }}>
          Daily Picks are generated by the RadarScore™ AI engine and updated each trading day. This is not financial advice. Always conduct your own research before making investment decisions.
        </p>

      </main>
    </div>
  );
}
