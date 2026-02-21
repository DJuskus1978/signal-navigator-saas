import { Card, CardContent } from "@/components/ui/card";
import type { Stock } from "@/lib/types";

interface Props {
  stock: Stock;
  isCrypto: boolean;
}

function generateGuidance(stock: Stock, isCrypto: boolean): string {
  const { phaseScores } = stock;
  const c = phaseScores.combined;
  const f = phaseScores.fundamental;
  const t = phaseScores.technical;

  if (c >= 40) {
    return `Overall conditions suggest strong alignment across all analysis phases. ${isCrypto ? "Market structure" : "Fundamentals"} and technicals both support a constructive outlook. Long-term positioning appears favorable, while short-term momentum may offer entry opportunities.`;
  }
  if (c >= 15) {
    return `Overall conditions suggest moderate stability. ${isCrypto ? "Market structure indicators" : "Underlying fundamentals"} provide a reasonable foundation, though not all signals are in agreement. Investors may focus on ${f > t ? "the solid " + (isCrypto ? "market positioning" : "fundamentals") + " while monitoring technical developments" : "strengthening technical trends while keeping an eye on " + (isCrypto ? "market structure" : "fundamental") + " shifts"}.`;
  }
  if (c >= -10) {
    return `Overall conditions are mixed, with no clear directional consensus across the three phases. Short-term traders may see volatility, while long-term investors may focus on ${isCrypto ? "underlying market structure" : "underlying fundamentals"} rather than near-term noise.`;
  }
  return `Overall conditions suggest elevated caution. Multiple analysis phases are showing stress signals. Risk management should be prioritized, and ${isCrypto ? "market structure" : "fundamental"} developments should be monitored closely before considering new positions.`;
}

export function AIDecisionGuidance({ stock, isCrypto }: Props) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧭</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            AI Decision Guidance
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {generateGuidance(stock, isCrypto)}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-4">
          StocksRadars does not serve as financial advice. The data shown is for informational and guidance purposes only.
        </p>
      </CardContent>
    </Card>
  );
}
