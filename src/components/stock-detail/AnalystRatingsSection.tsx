import { Card, CardContent } from "@/components/ui/card";
import type { AnalystData, AnalystConsensus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface Props {
  analystData: AnalystData;
  currentPrice: number;
}

// ─── Consensus Gauge ─────────────────────────────────────────────────────────

const CONSENSUS_POSITIONS: Record<AnalystConsensus, number> = {
  "Strong Sell": -90,
  "Sell": -45,
  "Hold": 0,
  "Buy": 45,
  "Strong Buy": 90,
};

function ConsensusGauge({ consensus }: { consensus: AnalystConsensus }) {
  const angle = CONSENSUS_POSITIONS[consensus] ?? 0;
  // Needle rotation: -90 = far left (Strong Sell), +90 = far right (Strong Buy)
  const needleRotation = angle;

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="relative w-48 h-28 mx-auto mb-4">
          {/* Arc background */}
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Gray arc background */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Colored arc - gradient from red through yellow to green */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(0, 75%, 50%)" />
                <stop offset="25%" stopColor="hsl(25, 90%, 50%)" />
                <stop offset="50%" stopColor="hsl(45, 95%, 50%)" />
                <stop offset="75%" stopColor="hsl(145, 65%, 42%)" />
                <stop offset="100%" stopColor="hsl(150, 80%, 35%)" />
              </linearGradient>
            </defs>
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Needle */}
            <g transform={`rotate(${needleRotation}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
            </g>
          </svg>
          {/* Labels around arc */}
          <span className="absolute left-0 bottom-0 text-[10px] text-muted-foreground">Strong Sell</span>
          <span className="absolute left-4 top-2 text-[10px] text-muted-foreground">Sell</span>
          <span className="absolute left-1/2 -translate-x-1/2 -top-1 text-[10px] text-muted-foreground">Hold</span>
          <span className="absolute right-4 top-2 text-[10px] text-muted-foreground">Buy</span>
          <span className="absolute right-0 bottom-0 text-[10px] text-muted-foreground">Strong Buy</span>
        </div>
        <p className={cn(
          "text-xl font-display font-bold",
          consensus.includes("Buy") ? "text-signal-buy" :
          consensus.includes("Sell") ? "text-signal-sell" :
          "text-signal-hold"
        )}>
          {consensus}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Price Target Card ───────────────────────────────────────────────────────

function PriceTargetCard({ priceTarget, currentPrice }: {
  priceTarget: NonNullable<AnalystData["priceTarget"]>;
  currentPrice: number;
}) {
  const consensus = priceTarget.targetConsensus;
  const high = priceTarget.targetHigh;
  const low = priceTarget.targetLow;
  const upsidePercent = currentPrice > 0 ? ((consensus - currentPrice) / currentPrice * 100) : 0;
  const highPercent = currentPrice > 0 ? ((high - currentPrice) / currentPrice * 100) : 0;
  const lowPercent = currentPrice > 0 ? ((low - currentPrice) / currentPrice * 100) : 0;

  // Position current price on the range bar
  const range = high - low;
  const currentPosition = range > 0 ? Math.max(0, Math.min(100, ((currentPrice - low) / range) * 100)) : 50;
  const avgPosition = range > 0 ? Math.max(0, Math.min(100, ((consensus - low) / range) * 100)) : 50;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="font-display text-3xl font-bold">${consensus.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            12 month average target · {priceTarget.totalAnalysts} Analyst{priceTarget.totalAnalysts !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Price range bar */}
        <div className="relative h-20 mt-8 mb-6">
          {/* Range bar */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-muted rounded-full">
            {/* Highlighted range between current and avg */}
            <div
              className="absolute h-full bg-primary/30 rounded-full"
              style={{
                left: `${Math.min(currentPosition, avgPosition)}%`,
                width: `${Math.abs(avgPosition - currentPosition)}%`,
              }}
            />
          </div>

          {/* Current price marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-muted-foreground border-2 border-background" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">${currentPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Average target marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${avgPosition}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-background" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Low · ${low.toFixed(2)}</p>
            <p className={cn("font-medium", lowPercent >= 0 ? "text-signal-buy" : "text-signal-sell")}>
              {lowPercent >= 0 ? "+" : ""}{lowPercent.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Avg · ${consensus.toFixed(2)}</p>
            <p className={cn("font-medium", upsidePercent >= 0 ? "text-signal-buy" : "text-signal-sell")}>
              {upsidePercent >= 0 ? "+" : ""}{upsidePercent.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">High · ${high.toFixed(2)}</p>
            <p className={cn("font-medium", highPercent >= 0 ? "text-signal-buy" : "text-signal-sell")}>
              {highPercent >= 0 ? "+" : ""}{highPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Ratings Distribution ────────────────────────────────────────────────────

function RatingsDistribution({ distribution }: {
  distribution: NonNullable<AnalystData["ratingsDistribution"]>;
}) {
  const total = distribution.totalAnalysts || 1;
  const rows = [
    { label: "Strong Buy", count: distribution.strongBuy, color: "bg-signal-buy" },
    { label: "Buy", count: distribution.buy, color: "bg-signal-buy/70" },
    { label: "Hold", count: distribution.hold, color: "bg-primary" },
    { label: "Sell", count: distribution.sell, color: "bg-signal-sell/70" },
    { label: "Strong Sell", count: distribution.strongSell, color: "bg-signal-sell" },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Ratings distribution · {total} analyst{total !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2.5">
          {rows.map((row) => {
            const pct = Math.round((row.count / total) * 100);
            return (
              <div key={row.label} className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", row.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-28 text-right">
                  {pct}% {row.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Section ────────────────────────────────────────────────────────────

export function AnalystRatingsSection({ analystData, currentPrice }: Props) {
  const hasAnyData = analystData.consensus || analystData.priceTarget || analystData.ratingsDistribution;
  if (!hasAnyData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-bold">External Analyst Ratings</h2>
      </div>

      {analystData.consensus && (
        <ConsensusGauge consensus={analystData.consensus} />
      )}

      {analystData.priceTarget && (
        <PriceTargetCard priceTarget={analystData.priceTarget} currentPrice={currentPrice} />
      )}

      {analystData.ratingsDistribution && (
        <RatingsDistribution distribution={analystData.ratingsDistribution} />
      )}

      <p className="text-[10px] text-muted-foreground/60 text-center">
        The data is provided by Financial Modeling Prep and should not be considered investment advice. Analyst projections are not guarantees and the price can both go up or down.
      </p>
    </div>
  );
}
