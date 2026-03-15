import { useRef, useState } from "react";
import type { InvestorProfile } from "@/lib/types";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLiveStockDetail } from "@/hooks/use-live-stocks";
import { useSubscription } from "@/hooks/use-subscription";
import { ArrowLeft, BarChart3, Newspaper, TrendingUp, Loader2, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";

import { StockSignalPanel } from "@/components/stock-detail/StockSignalPanel";
import { PhaseCard } from "@/components/stock-detail/PhaseCard";
import { AIDecisionGuidance } from "@/components/stock-detail/AIDecisionGuidance";
import { AnalystRatingsSection } from "@/components/stock-detail/AnalystRatingsSection";
import { AISignalsCard } from "@/components/AISignalsCard";
import { MarketSentiment } from "@/components/MarketSentiment";
import { getFundamentalPhase, getSentimentPhase, getTechnicalPhase } from "@/components/stock-detail/phase-data";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

// ── View mode toggle ──────────────────────────────────────────────────────────
function ViewModeToggle({ simple, onToggle, advancedLocked, onLockedClick }: {
  simple: boolean; onToggle: () => void; advancedLocked?: boolean; onLockedClick?: () => void;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", background: NAVY2, border: `1px solid ${BORDER_CLR}`, padding: "2px" }}>
      <button
        onClick={simple ? undefined : onToggle}
        style={{ padding: "0.3rem 0.9rem", background: simple ? CYAN : "transparent", color: simple ? NAVY : MUTED, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: simple ? "default" : "pointer", transition: "all 0.15s ease" }}>
        Simple
      </button>
      {advancedLocked ? (
        <button
          onClick={onLockedClick}
          style={{ padding: "0.3rem 0.9rem", background: "transparent", color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: "pointer", opacity: 0.5, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <Lock size={10} /> Advanced
        </button>
      ) : (
        <button
          onClick={simple ? onToggle : undefined}
          style={{ padding: "0.3rem 0.9rem", background: !simple ? CYAN : "transparent", color: !simple ? NAVY : MUTED, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: !simple ? "default" : "pointer", transition: "all 0.15s ease" }}>
          Advanced
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StockDetail() {
  const { ticker }                          = useParams<{ ticker: string }>();
  const { data: stock, isLoading, error }   = useLiveStockDetail(ticker || "");
  const { data: subscription }              = useSubscription();
  const navigate                            = useNavigate();
  const breakdownRef                        = useRef<HTMLDivElement>(null);
  const [simpleMode, setSimpleMode]         = useState(true);
  const [profile, setProfile]               = useState<InvestorProfile>("medium-term");
  const [showMore, setShowMore]             = useState(false);

  const hasAdvancedAccess = subscription?.tier === "pro_day_trader" || subscription?.tier === "bull_trader";
  const goToPricing = () => {
    navigate("/");
    setTimeout(() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
        <Loader2 size={20} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.9rem", color: MUTED }}>Loading live data...</span>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.8rem", textTransform: "uppercase", color: WHITE, marginBottom: "1rem" }}>
            {error ? "Failed to load stock data" : "Stock not found"}
          </h1>
          {error && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, marginBottom: "1.5rem" }}>{(error as Error).message}</p>}
          <Link to="/dashboard" style={{ display: "inline-block", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.8rem 1.5rem", textDecoration: "none" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPositive    = stock.change >= 0;
  const isCrypto      = stock.assetType === "crypto";
  const displayTicker = isCrypto ? stock.ticker.replace("USD", "") : stock.ticker;

  const fundamentalPhase = getFundamentalPhase(stock);
  const sentimentPhase   = getSentimentPhase(stock);
  const technicalPhase   = getTechnicalPhase(stock);

  const handleViewBreakdown = () => breakdownRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ minHeight: "100vh", background: NAVY }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* ── Back link ── */}
        <Link to="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, textDecoration: "none", marginBottom: "1.75rem" }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* ── Price header ── */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", color: WHITE, letterSpacing: "-0.01em", margin: 0, lineHeight: 1 }}>
                {displayTicker}
              </h1>
              <span style={{ background: "rgba(0,212,255,0.1)", border: `1px solid rgba(0,212,255,0.3)`, color: CYAN, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.2rem 0.6rem" }}>
                {isCrypto ? "CRYPTO" : stock.exchange.toUpperCase()}
              </span>
            </div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, margin: 0 }}>{stock.name}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2rem", color: WHITE, margin: 0, lineHeight: 1 }}>
                ${stock.price.toFixed(2)}
              </p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: isPositive ? GREEN : RED, margin: 0 }}>
                {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
              </p>
            </div>
            <ViewModeToggle simple={simpleMode} onToggle={() => setSimpleMode(!simpleMode)} advancedLocked={!hasAdvancedAccess} onLockedClick={goToPricing} />
          </div>
        </div>

        {/* ── StockSignalPanel ── */}
        <StockSignalPanel
          stock={stock}
          isCrypto={isCrypto}
          onViewBreakdown={handleViewBreakdown}
          profile={profile}
          onProfileChange={setProfile}
          lockedProfiles={hasAdvancedAccess ? [] : (["short-term", "long-term"] as InvestorProfile[])}
          onLockedProfileClick={goToPricing}
        />

        {/* ── AI Signals ── */}
        <div style={{ marginTop: "1.5rem" }}>
          <AISignalsCard stock={stock} />
        </div>

        {/* ── Decision Guidance ── */}
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <AIDecisionGuidance stock={stock} isCrypto={isCrypto} profile={profile} />
        </div>

        {/* ── 3-Phase Breakdown ── */}
        <div ref={breakdownRef} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
          <PhaseCard
            icon={<BarChart3 size={16} />}
            title={isCrypto ? "Market Structure" : "Fundamental Strength"}
            score={stock.phaseScores.fundamental}
            simple={simpleMode}
            initialExpanded={false}
            {...fundamentalPhase}
          />
          <PhaseCard
            icon={<Newspaper size={16} />}
            title="News & Sentiment"
            score={stock.phaseScores.sentiment}
            simple={simpleMode}
            {...sentimentPhase}
          />
          <PhaseCard
            icon={<TrendingUp size={16} />}
            title="Technical Momentum"
            score={stock.phaseScores.technical}
            simple={simpleMode}
            {...technicalPhase}
          />
        </div>

        {/* ── More Indicators toggle ── */}
        <button
          onClick={() => setShowMore(!showMore)}
          style={{ width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "transparent", border: `1px solid ${BORDER_CLR}`, color: CYAN, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", marginBottom: "1rem", transition: "background 0.15s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          More Indicators
          {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showMore && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
            {!isCrypto && stock.analystData ? (
              <AnalystRatingsSection analystData={stock.analystData} currentPrice={stock.price} ticker={displayTicker} />
            ) : !isCrypto ? (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, textAlign: "center", padding: "1rem 0" }}>
                No analyst data available for this ticker
              </p>
            ) : null}
            <MarketSentiment />
          </div>
        )}

      </main>
    </div>
  );
}
