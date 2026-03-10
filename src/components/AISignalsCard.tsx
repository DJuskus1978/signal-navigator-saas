import type { Stock } from "@/lib/types";
import { generateAISignals, getAIVerdict } from "@/lib/ai-signals";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface AISignalsCardProps {
  stock: Stock;
}

export function AISignalsCard({ stock }: AISignalsCardProps) {
  const signals = generateAISignals(stock);
  const verdict = getAIVerdict(stock);
  const score = stock.radarScores?.balanced?.radarScore ?? stock.score;

  if (signals.length === 0) return null;

  return (
    <Card className="border border-border overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm text-foreground">
            {verdict.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span className="font-display font-bold text-sm text-foreground">{score}</span>
          </div>
        </div>

        <p className="text-xs font-medium text-muted-foreground mb-3">AI signals:</p>
        <div className="space-y-2">
          {signals.map((signal, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {signal.positive ? (
                <Check className="w-4 h-4 text-signal-buy shrink-0" />
              ) : (
                <X className="w-4 h-4 text-signal-sell shrink-0" />
              )}
              <span className="text-foreground">{signal.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
