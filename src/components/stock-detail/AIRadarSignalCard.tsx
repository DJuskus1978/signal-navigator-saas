import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getRadarStatus, getConfidencePercent } from "./types";
import type { Stock } from "@/lib/types";

interface Props {
  stock: Stock;
  isCrypto: boolean;
  onViewBreakdown: () => void;
}

function getStatusStyles(color: "constructive" | "neutral" | "cautious") {
  switch (color) {
    case "constructive":
      return { dot: "hsl(var(--signal-buy))", bg: "hsl(var(--signal-buy-bg))", text: "text-signal-buy" };
    case "neutral":
      return { dot: "hsl(var(--signal-hold))", bg: "hsl(var(--signal-hold-bg))", text: "text-signal-hold" };
    case "cautious":
      return { dot: "hsl(var(--signal-sell))", bg: "hsl(var(--signal-sell-bg))", text: "text-signal-sell" };
  }
}

function generateSummary(stock: Stock, isCrypto: boolean): string {
  const { phaseScores } = stock;
  const f = phaseScores.fundamental;
  const s = phaseScores.sentiment;
  const t = phaseScores.technical;

  if (isCrypto) {
    if (f >= 20 && t >= 20) return `${stock.name} shows strong market structure and bullish technical momentum, supported by positive sentiment.`;
    if (f >= 10 && t < 0) return `${stock.name} maintains solid market positioning, but short-term technical momentum shows mild pressure.`;
    if (f < 0 && s < 0) return `${stock.name} faces headwinds in both market structure and sentiment. Technical signals suggest caution.`;
    if (t >= 15 && f < 5) return `${stock.name} shows improving technical momentum, though underlying market structure remains mixed.`;
    return `${stock.name} displays mixed signals across market structure, sentiment, and technicals. Monitor for clearer direction.`;
  }

  if (f >= 20 && t >= 20) return `${stock.name} scores strongly across all phases — solid fundamentals, positive sentiment, and bullish technicals align.`;
  if (f >= 15 && t < 0) return `Solid company fundamentals remain intact, but short-term technical momentum shows mild pressure.`;
  if (f < 0 && s < -10) return `${stock.name} faces fundamental headwinds compounded by negative market sentiment. Technical indicators confirm caution.`;
  if (t >= 15 && f < 5) return `Technical momentum is strengthening for ${stock.name}, though underlying fundamentals remain average.`;
  if (s >= 20 && f >= 10) return `Positive news flow and solid fundamentals create a constructive backdrop for ${stock.name}.`;
  return `${stock.name} shows mixed conditions across fundamentals, sentiment, and technicals. A balanced outlook is warranted.`;
}

export function AIRadarSignalCard({ stock, isCrypto, onViewBreakdown }: Props) {
  const { phaseScores } = stock;
  const status = getRadarStatus(phaseScores.combined);
  const styles = getStatusStyles(status.color);
  const confidencePercent = getConfidencePercent(stock.confidence, phaseScores.combined);
  const summary = generateSummary(stock, isCrypto);

  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-8">
        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          AI Radar Signal
        </p>

        {/* Big Status Badge */}
        <div className="flex justify-center mb-8">
          <div
            className="inline-flex items-center gap-3 rounded-full px-6 py-3"
            style={{ backgroundColor: styles.bg }}
          >
            <span
              className="w-3 h-3 rounded-full animate-pulse-glow"
              style={{ backgroundColor: styles.dot }}
            />
            <span className={cn("font-display text-2xl font-bold", styles.text)}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Low</span>
            <span className="font-display font-bold text-sm text-foreground">{confidencePercent}%</span>
            <span>High</span>
          </div>
          <Progress value={confidencePercent} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Based on combined {isCrypto ? "market structure" : "fundamental strength"}, news sentiment, and technical momentum.
          </p>
        </div>

        {/* Summary */}
        <p className="text-center text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
          {summary}
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={onViewBreakdown} className="font-display">
            View Breakdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
