import { useState } from "react";
import { Stock } from "@/lib/types";
import type { InvestorProfile } from "@/lib/types";
import { useLiveStockDetail } from "@/hooks/use-live-stocks";
import { MarketSentiment } from "./MarketSentiment";
import { AnalystRatingsSection } from "./stock-detail/AnalystRatingsSection";
import { AIRadarSignalCard } from "./stock-detail/AIRadarSignalCard";
import { AISignalsCard } from "./AISignalsCard";
import { AIDecisionGuidance } from "./stock-detail/AIDecisionGuidance";
import { PhaseCard } from "./stock-detail/PhaseCard";
import { getFundamentalPhase, getSentimentPhase, getTechnicalPhase } from "./stock-detail/phase-data";
import { BarChart3, Newspaper, TrendingUp, Loader2 } from "lucide-react";

interface Props {
  stock: Stock;
}

export function ExpandedStockIndicators({ stock }: Props) {
  const { data: detailStock, isLoading } = useLiveStockDetail(stock.ticker);
  const displayStock = detailStock || stock;
  const [profile, setProfile] = useState<InvestorProfile>("balanced");

  const isCrypto = displayStock.assetType === "crypto";
  const fundamentalPhase = getFundamentalPhase(displayStock);
  const sentimentPhase = getSentimentPhase(displayStock);
  const technicalPhase = getTechnicalPhase(displayStock);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading radar data...</span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* External Analyst Ratings */}
      {!isCrypto && displayStock.analystData ? (
        <AnalystRatingsSection analystData={displayStock.analystData} currentPrice={displayStock.price} />
      ) : !isCrypto ? (
        <p className="text-xs text-muted-foreground text-center py-2">No analyst data available for this ticker</p>
      ) : null}

      {/* AI Radar Signal Card */}
      <AIRadarSignalCard
        stock={displayStock}
        isCrypto={isCrypto}
        onViewBreakdown={() => {}}
        profile={profile}
        onProfileChange={setProfile}
        lockedProfiles={[]}
      />

      {/* AI Signals */}
      <AISignalsCard stock={displayStock} />

      {/* AI Decision Guidance */}
      <AIDecisionGuidance stock={displayStock} isCrypto={isCrypto} profile={profile} />

      {/* 3-Phase Breakdown */}
      <PhaseCard
        icon={<BarChart3 className="w-5 h-5" />}
        title={isCrypto ? "Market Structure" : "Fundamental Strength"}
        score={displayStock.phaseScores.fundamental}
        simple={true}
        initialExpanded={false}
        {...fundamentalPhase}
      />
      <PhaseCard
        icon={<Newspaper className="w-5 h-5" />}
        title="News & Sentiment"
        score={displayStock.phaseScores.sentiment}
        simple={true}
        {...sentimentPhase}
      />
      <PhaseCard
        icon={<TrendingUp className="w-5 h-5" />}
        title="Technical Momentum"
        score={displayStock.phaseScores.technical}
        simple={true}
        {...technicalPhase}
      />

      {/* General Market Sentiment */}
      <MarketSentiment />
    </div>
  );
}
