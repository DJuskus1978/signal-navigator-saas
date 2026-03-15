import { useRef, useState } from "react";
import { Stock } from "@/lib/types";
import type { InvestorProfile } from "@/lib/types";
import { useLiveStockDetail } from "@/hooks/use-live-stocks";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "react-router-dom";
import { MarketSentiment } from "./MarketSentiment";
import { AnalystRatingsSection } from "./stock-detail/AnalystRatingsSection";
import { StockSignalPanel } from "./stock-detail/StockSignalPanel";
import { AISignalsCard } from "./AISignalsCard";
import { AIDecisionGuidance } from "./stock-detail/AIDecisionGuidance";
import { PhaseCard } from "./stock-detail/PhaseCard";
import { getFundamentalPhase, getSentimentPhase, getTechnicalPhase } from "./stock-detail/phase-data";
import { BarChart3, Newspaper, TrendingUp, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";

interface Props {
  stock: Stock;
}

export function ExpandedStockIndicators({ stock }: Props) {
  const { data: detailStock, isLoading } = useLiveStockDetail(stock.ticker);
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();
  const displayStock = detailStock || stock;
  const [profile, setProfile] = useState<InvestorProfile>("medium-term");
  const [showMore, setShowMore] = useState(false);
  const breakdownRef = useRef<HTMLDivElement>(null);

  const hasAdvancedAccess = subscription?.tier === "pro_day_trader" || subscription?.tier === "bull_trader";
  const goToPricing = () => {
    navigate("/");
    setTimeout(() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const isCrypto = displayStock.assetType === "crypto";
  const fundamentalPhase = getFundamentalPhase(displayStock);
  const sentimentPhase = getSentimentPhase(displayStock);
  const technicalPhase = getTechnicalPhase(displayStock);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "2rem 0" }}>
        <Loader2 size={16} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED }}>Loading radar data...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* AI Radar Signal Card */}
      <StockSignalPanel
        stock={displayStock}
        isCrypto={isCrypto}
        onViewBreakdown={() => breakdownRef.current?.scrollIntoView({ behavior: "smooth" })}
        profile={profile}
        onProfileChange={setProfile}
        lockedProfiles={hasAdvancedAccess ? [] : (["short-term", "long-term"] as InvestorProfile[])}
        onLockedProfileClick={goToPricing}
      />

      {/* AI Signals */}
      <AISignalsCard stock={displayStock} />

      {/* AI Decision Guidance */}
      <AIDecisionGuidance stock={displayStock} isCrypto={isCrypto} profile={profile} />

      {/* 3-Phase Breakdown */}
      <div ref={breakdownRef} />
      <PhaseCard
        icon={<BarChart3 size={16} />}
        title={isCrypto ? "Market Structure" : "Fundamental Strength"}
        score={displayStock.phaseScores.fundamental}
        simple={true}
        initialExpanded={false}
        {...fundamentalPhase}
      />
      <PhaseCard
        icon={<Newspaper size={16} />}
        title="News & Sentiment"
        score={displayStock.phaseScores.sentiment}
        simple={true}
        {...sentimentPhase}
      />
      <PhaseCard
        icon={<TrendingUp size={16} />}
        title="Technical Momentum"
        score={displayStock.phaseScores.technical}
        simple={true}
        {...technicalPhase}
      />

      {/* More Indicators toggle */}
      <button
        onClick={() => setShowMore(!showMore)}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        style={{ width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "transparent", border: `1px solid ${BORDER_CLR}`, color: CYAN, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.15s ease" }}
      >
        More Indicators
        {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {showMore && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!isCrypto && displayStock.analystData ? (
            <AnalystRatingsSection analystData={displayStock.analystData} currentPrice={displayStock.price} ticker={displayStock.ticker} />
          ) : !isCrypto ? (
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, textAlign: "center", padding: "0.5rem 0" }}>No analyst data available for this ticker</p>
          ) : null}
          <MarketSentiment />
        </div>
      )}
    </div>
  );
}
