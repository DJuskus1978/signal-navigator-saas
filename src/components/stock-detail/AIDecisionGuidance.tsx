import { Card, CardContent } from "@/components/ui/card";
import type { Stock, InvestorProfile } from "@/lib/types";
import { getSignalLabel } from "@/lib/radar-scoring";
import { Compass } from "lucide-react";

interface Props {
  stock: Stock;
  isCrypto: boolean;
  profile: InvestorProfile;
}

function describePhase(score: number): "strong" | "positive" | "neutral" | "weak" | "negative" {
  if (score >= 75) return "strong";
  if (score >= 60) return "positive";
  if (score >= 40) return "neutral";
  if (score >= 25) return "weak";
  return "negative";
}

const FUND_LABELS: Record<ReturnType<typeof describePhase>, string> = {
  strong: "shows solid fundamentals",
  positive: "shows reasonable fundamentals",
  neutral: "presents mixed fundamentals",
  weak: "shows weakening fundamentals",
  negative: "shows concerning fundamentals",
};
const FUND_LABELS_CRYPTO: Record<ReturnType<typeof describePhase>, string> = {
  strong: "shows strong market structure",
  positive: "shows favorable market structure",
  neutral: "presents mixed market structure signals",
  weak: "shows weakening market structure",
  negative: "shows stressed market structure",
};
const SENT_LABELS: Record<ReturnType<typeof describePhase>, string> = {
  strong: "strongly positive sentiment",
  positive: "positive sentiment",
  neutral: "neutral sentiment",
  weak: "cautious sentiment",
  negative: "negative sentiment",
};
const TECH_LABELS: Record<ReturnType<typeof describePhase>, string> = {
  strong: "strong technical momentum",
  positive: "favorable technical trends",
  neutral: "neutral technical signals",
  weak: "weakening technical momentum",
  negative: "bearish technical momentum",
};

function generateGuidance(stock: Stock, isCrypto: boolean, profile: InvestorProfile): string {
  const ps = stock.phaseScores;
  const fLevel = describePhase(ps.fundamental);
  const sLevel = describePhase(ps.sentiment);
  const tLevel = describePhase(ps.technical);

  const fundDesc = isCrypto ? FUND_LABELS_CRYPTO[fLevel] : FUND_LABELS[fLevel];
  const sentDesc = SENT_LABELS[sLevel];
  const techDesc = TECH_LABELS[tLevel];

  const name = stock.name;

  // Build a coherent sentence reflecting all three phases accurately
  return `${name} ${fundDesc}, with ${sentDesc} and ${techDesc}. Investors should weigh all three dimensions when evaluating positioning.`;
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
