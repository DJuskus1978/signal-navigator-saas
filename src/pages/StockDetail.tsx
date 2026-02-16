import { useParams, Link } from "react-router-dom";
import { getStockByTicker } from "@/lib/mock-data";
import { getRecommendationLabel, getPhaseEmoji } from "@/lib/recommendation-engine";
import { TrafficLight } from "@/components/TrafficLight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Newspaper, BarChart3 } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";
import { cn } from "@/lib/utils";

function Indicator({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="font-medium text-sm">{value}</span>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function PhaseBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  // Map score range roughly -100..+100 to 0..100 for progress
  const normalized = Math.max(0, Math.min(100, (score + 80) / 1.6));
  const emoji = getPhaseEmoji(score);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-semibold">{emoji} {score > 0 ? "+" : ""}{score}</span>
      </div>
      <Progress value={normalized} className="h-2" />
    </div>
  );
}

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const stock = getStockByTicker(ticker || "");

  if (!stock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Stock not found</h1>
          <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const { technical: t, fundamental: f, sentiment: s, phaseScores } = stock;

  const explanations: Record<string, string> = {
    "strong-buy": `${stock.name} scores exceptionally across all three phases — strong fundamentals, positive market sentiment, and bullish technical signals. This is a high-conviction entry opportunity.`,
    buy: `${stock.name} shows solid fundamentals reinforced by positive news sentiment. Technical indicators confirm the upward momentum — a good time to consider entering.`,
    hold: `${stock.name} has decent fundamentals but mixed signals from news and technicals. Hold existing positions and monitor for stronger directional cues.`,
    "dont-buy": `${stock.name} shows concerning signals across our analysis phases. Fundamentals or sentiment are weak, and technicals don't support entry. Wait for conditions to improve.`,
    sell: `${stock.name} is flagged across all phases — deteriorating fundamentals, negative sentiment, and bearish technicals. Consider reducing exposure.`,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StockRadar</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-bold">{stock.ticker}</h1>
              <Badge variant="secondary">{stock.exchange.toUpperCase()}</Badge>
            </div>
            <p className="text-muted-foreground">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold">${stock.price.toFixed(2)}</p>
            <p className={cn("font-medium", isPositive ? "text-signal-buy" : "text-signal-sell")}>
              {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <Card className="mb-6 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrafficLight recommendation={stock.recommendation} size="lg" />
              <Badge variant="outline">{stock.confidence} confidence</Badge>
            </div>
            <p className="text-muted-foreground mb-6">{explanations[stock.recommendation]}</p>

            {/* 3-Phase Score Breakdown */}
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Analysis Phases</p>
              <PhaseBar label="Fundamentals (40%)" score={phaseScores.fundamental} icon={<BarChart3 className="w-4 h-4" />} />
              <PhaseBar label="News & Sentiment (25%)" score={phaseScores.sentiment} icon={<Newspaper className="w-4 h-4" />} />
              <PhaseBar label="Technicals (35%)" score={phaseScores.technical} icon={<TrendingUp className="w-4 h-4" />} />
            </div>
          </CardContent>
        </Card>

        {/* Sentiment / News */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="w-5 h-5" /> News & Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium italic">"{s.headline}"</p>
            </div>
            <Indicator
              label="News Sentiment"
              value={s.newsScore > 0 ? `+${s.newsScore.toFixed(0)}` : s.newsScore.toFixed(0)}
              hint={s.newsScore > 30 ? "Positive" : s.newsScore > -30 ? "Mixed" : "Negative"}
            />
            <Indicator
              label="Articles Analyzed"
              value={s.newsCount}
            />
            <Indicator
              label="Social Sentiment"
              value={s.socialScore > 0 ? `+${s.socialScore.toFixed(0)}` : s.socialScore.toFixed(0)}
              hint={s.socialScore > 20 ? "Bullish buzz" : s.socialScore < -20 ? "Bearish chatter" : "Neutral"}
            />
            <Indicator
              label="Analyst Rating"
              value={`${s.analystRating.toFixed(1)} / 5.0`}
              hint={s.analystRating >= 4 ? "Buy consensus" : s.analystRating >= 3 ? "Hold consensus" : "Sell consensus"}
            />
            <Indicator
              label="Insider Activity"
              value={s.insiderActivity > 0 ? "Net Buying" : s.insiderActivity < -0.2 ? "Net Selling" : "Neutral"}
              hint={`Score: ${s.insiderActivity.toFixed(2)}`}
            />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Fundamental */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Fundamentals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Indicator
                label="P/E Ratio"
                value={f.peRatio.toFixed(1)}
                hint={f.peRatio < 15 ? "Undervalued" : f.peRatio > 35 ? "Overvalued" : "Fair value"}
              />
              <Indicator
                label="Forward P/E"
                value={f.forwardPE.toFixed(1)}
                hint={f.forwardPE < f.peRatio ? "Growth expected" : "Slowing growth"}
              />
              <Indicator
                label="Earnings Growth"
                value={`${f.earningsGrowth.toFixed(1)}%`}
                hint={f.earningsGrowth > 15 ? "Strong" : f.earningsGrowth > 0 ? "Positive" : "Declining"}
              />
              <Indicator
                label="Revenue Growth"
                value={`${f.revenueGrowth.toFixed(1)}%`}
                hint={f.revenueGrowth > 15 ? "Strong" : f.revenueGrowth > 0 ? "Positive" : "Declining"}
              />
              <Indicator
                label="Profit Margin"
                value={`${f.profitMargin.toFixed(1)}%`}
                hint={f.profitMargin > 20 ? "Excellent" : f.profitMargin > 10 ? "Good" : "Low"}
              />
              <Indicator
                label="Debt/Equity"
                value={f.debtToEquity.toFixed(2)}
                hint={f.debtToEquity < 0.5 ? "Low leverage" : f.debtToEquity > 2 ? "High leverage" : "Moderate"}
              />
              <Indicator
                label="Return on Equity"
                value={`${f.returnOnEquity.toFixed(1)}%`}
                hint={f.returnOnEquity > 20 ? "Excellent" : f.returnOnEquity > 10 ? "Good" : "Below avg"}
              />
              <Indicator
                label="FCF Yield"
                value={`${f.freeCashFlowYield.toFixed(1)}%`}
                hint={f.freeCashFlowYield > 5 ? "Attractive" : f.freeCashFlowYield > 2 ? "Fair" : "Low"}
              />
            </CardContent>
          </Card>

          {/* Technical */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Indicator
                label="RSI (14)"
                value={t.rsi.toFixed(1)}
                hint={t.rsi < 30 ? "Oversold" : t.rsi > 70 ? "Overbought" : "Neutral"}
              />
              <Indicator
                label="MACD"
                value={t.macd.toFixed(2)}
                hint={t.macd > t.macdSignal ? "Bullish crossover" : "Bearish crossover"}
              />
              <Indicator label="MACD Signal" value={t.macdSignal.toFixed(2)} />
              <Indicator
                label="EMA 20"
                value={`$${t.ema20.toFixed(2)}`}
                hint={t.ema20 > t.sma50 ? "Short-term bullish" : "Short-term bearish"}
              />
              <Indicator
                label="SMA 50"
                value={`$${t.sma50.toFixed(2)}`}
                hint={t.sma50 > t.sma200 ? "Above 200-day" : "Below 200-day"}
              />
              <Indicator label="SMA 200" value={`$${t.sma200.toFixed(2)}`} />
              <Indicator
                label="Bollinger Bands"
                value={`$${t.bollingerLower.toFixed(0)} – $${t.bollingerUpper.toFixed(0)}`}
              />
              <Indicator
                label="ATR (Volatility)"
                value={`$${t.atr.toFixed(2)}`}
                hint={t.atr > stock.price * 0.04 ? "High volatility" : "Normal"}
              />
              <Indicator
                label="Volume"
                value={`${(t.volume / 1_000_000).toFixed(1)}M`}
                hint={t.volume > t.avgVolume ? "Above average" : "Below average"}
              />
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          This is not financial advice. Data shown is for educational purposes only.
        </p>
      </main>
    </div>
  );
}
