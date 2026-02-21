import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLiveStockDetail } from "@/hooks/use-live-stocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Newspaper, TrendingUp, Loader2 } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";
import { cn } from "@/lib/utils";

import { AIRadarSignalCard } from "@/components/stock-detail/AIRadarSignalCard";
import { PhaseCard } from "@/components/stock-detail/PhaseCard";
import { AIDecisionGuidance } from "@/components/stock-detail/AIDecisionGuidance";
import { getFundamentalPhase, getSentimentPhase, getTechnicalPhase } from "@/components/stock-detail/phase-data";

function ViewModeToggle({ simple, onToggle }: { simple: boolean; onToggle: () => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      <button
        onClick={simple ? undefined : onToggle}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
          simple
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Simple
      </button>
      <button
        onClick={simple ? onToggle : undefined}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
          !simple
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Advanced
      </button>
    </div>
  );
}

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const { data: stock, isLoading, error } = useLiveStockDetail(ticker || "");
  const breakdownRef = useRef<HTMLDivElement>(null);
  const [simpleMode, setSimpleMode] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading live data...</span>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-4">
            {error ? "Failed to load stock data" : "Stock not found"}
          </h1>
          {error && <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>}
          <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const isCrypto = stock.assetType === "crypto";
  const displayTicker = isCrypto ? stock.ticker.replace("USD", "") : stock.ticker;

  const fundamentalPhase = getFundamentalPhase(stock);
  const sentimentPhase = getSentimentPhase(stock);
  const technicalPhase = getTechnicalPhase(stock);

  const handleViewBreakdown = () => {
    breakdownRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Price Header + Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-bold">{displayTicker}</h1>
              <Badge variant="secondary">{isCrypto ? "CRYPTO" : stock.exchange.toUpperCase()}</Badge>
            </div>
            <p className="text-muted-foreground">{stock.name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="font-display text-3xl font-bold">${stock.price.toFixed(2)}</p>
              <p className={cn("font-medium", isPositive ? "text-signal-buy" : "text-signal-sell")}>
                {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
              </p>
            </div>
            <ViewModeToggle simple={simpleMode} onToggle={() => setSimpleMode(!simpleMode)} />
          </div>
        </div>

        {/* 1️⃣ AI Radar Signal Card */}
        <AIRadarSignalCard stock={stock} isCrypto={isCrypto} onViewBreakdown={handleViewBreakdown} />

        {/* 2️⃣ 3-Phase Breakdown */}
        <div ref={breakdownRef} className="mt-8 space-y-6">
          <PhaseCard
            icon={<BarChart3 className="w-5 h-5" />}
            title={isCrypto ? "Market Structure" : "Fundamental Strength"}
            score={stock.phaseScores.fundamental}
            simple={simpleMode}
            {...fundamentalPhase}
          />
          <PhaseCard
            icon={<Newspaper className="w-5 h-5" />}
            title="News & Sentiment"
            score={stock.phaseScores.sentiment}
            simple={simpleMode}
            {...sentimentPhase}
          />
          <PhaseCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Technical Momentum"
            score={stock.phaseScores.technical}
            simple={simpleMode}
            {...technicalPhase}
          />
        </div>

        {/* 3️⃣ AI Decision Guidance */}
        <div className="mt-8 mb-8">
          <AIDecisionGuidance stock={stock} isCrypto={isCrypto} />
        </div>
      </main>
    </div>
  );
}
