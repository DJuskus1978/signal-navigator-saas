import { Card, CardContent } from "@/components/ui/card";
import type { Stock, InvestorProfile } from "@/lib/types";
import { getSignalLabel } from "@/lib/radar-scoring";
import { Compass } from "lucide-react";

interface Props {
  stock: Stock;
  isCrypto: boolean;
  profile: InvestorProfile;
}

function generateGuidance(stock: Stock, isCrypto: boolean, profile: InvestorProfile): string {
  const radar = stock.radarScores?.[profile];
  const score = radar?.radarScore ?? 50;
  const signal = radar?.signal ?? stock.recommendation;
  const f = isCrypto ? "market structure" : "fundamentals";

  if (score >= 80) {
    return `Overall conditions suggest strong alignment across all analysis phases. ${isCrypto ? "Market structure" : "Fundamentals"} and technicals both support a constructive outlook. Long-term positioning appears favorable, while short-term momentum may offer entry opportunities.`;
  }
  if (score >= 65) {
    return `Overall conditions suggest moderate-to-positive positioning. ${isCrypto ? "Market structure indicators" : "Underlying fundamentals"} provide a reasonable foundation, supported by favorable momentum signals.`;
  }
  if (score >= 45) {
    return `Overall conditions are mixed, with no clear directional consensus across the three phases. Short-term traders may see volatility, while long-term investors may focus on underlying ${f} rather than near-term noise.`;
  }
  if (score >= 30) {
    return `Caution is warranted. Weakening momentum and mixed sentiment create a challenging environment. Risk management should be prioritized while monitoring ${f} for stability signals.`;
  }
  return `Overall conditions suggest elevated caution. Multiple analysis phases are showing stress signals. Risk management should be prioritized, and ${f} developments should be monitored closely before considering new positions.`;
}

export function AIDecisionGuidance({ stock, isCrypto, profile }: Props) {
  return (
    <Card className="border-2 border-primary bg-background">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-5 h-5 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            StocksRadars Decision Guidance
          </p>
        </div>
        <p className="text-sm text-primary leading-relaxed">
          {generateGuidance(stock, isCrypto, profile)}
        </p>
        <p className="text-[10px] text-primary/50 mt-4">
          This information is not a personal recommendation or investment advice. Conduct your own research and consider your financial situation before making any investment decisions.
        </p>
      </CardContent>
    </Card>
  );
}
