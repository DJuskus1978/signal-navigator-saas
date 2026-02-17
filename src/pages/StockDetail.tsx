import { useParams, Link } from "react-router-dom";
import { getStockByTicker } from "@/lib/mock-data";
import { getRecommendationLabel } from "@/lib/recommendation-engine";
import { TrafficLight } from "@/components/TrafficLight";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Newspaper, BarChart3 } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";
import { cn } from "@/lib/utils";

type SignalLevel = "bullish" | "bearish" | "neutral";

function getSignalColor(signal: SignalLevel) {
  if (signal === "bullish") return "hsl(var(--signal-buy))";
  if (signal === "bearish") return "hsl(var(--signal-sell))";
  return "hsl(var(--signal-hold))";
}

function getSignalBg(signal: SignalLevel) {
  if (signal === "bullish") return "hsl(var(--signal-buy-bg))";
  if (signal === "bearish") return "hsl(var(--signal-sell-bg))";
  return "hsl(var(--signal-hold-bg))";
}

function Indicator({ label, value, hint, signal }: { label: string; value: string | number; hint?: string; signal?: SignalLevel }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {signal && hint && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ color: getSignalColor(signal), backgroundColor: getSignalBg(signal) }}
          >
            {hint}
          </span>
        )}
        <span className="font-medium text-sm font-display">{value}</span>
      </div>
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
    "strong-buy": `${stock.name} scores exceptionally across all three phases — strong fundamentals, positive market sentiment, and bullish technical radars. This is a high-conviction entry opportunity.`,
    buy: `${stock.name} shows solid fundamentals reinforced by positive news sentiment. Technical indicators confirm the upward momentum — a good time to consider entering.`,
    hold: `${stock.name} has decent fundamentals but mixed radars from news and technicals. Hold existing positions and monitor for stronger directional cues.`,
    "dont-buy": `${stock.name} shows concerning radars across our analysis phases. Fundamentals or sentiment are weak, and technicals don't support entry. Wait for conditions to improve.`,
    sell: `${stock.name} is flagged across all phases — deteriorating fundamentals, negative sentiment, and bearish technicals. Consider reducing exposure.`,
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
            <div className="space-y-4">
              {[
                { label: "Fundamentals", value: phaseScores.fundamental, icon: <BarChart3 className="w-4 h-4" /> },
                { label: "Sentiment", value: phaseScores.sentiment, icon: <Newspaper className="w-4 h-4" /> },
                { label: "Technicals", value: phaseScores.technical, icon: <TrendingUp className="w-4 h-4" /> },
              ].map((phase) => {
                const normalized = Math.max(0, Math.min(100, (phase.value + 100) / 2));
                const barColor = phase.value > 30
                  ? "hsl(var(--signal-buy))"
                  : phase.value < -30
                    ? "hsl(var(--signal-sell))"
                    : "hsl(var(--signal-hold))";
                return (
                  <div key={phase.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {phase.icon}
                        <span className="font-medium">{phase.label}</span>
                      </div>
                      <span className={cn(
                        "font-display font-bold",
                        phase.value > 0 ? "text-signal-buy" : phase.value < 0 ? "text-signal-sell" : "text-muted-foreground"
                      )}>
                        {phase.value > 0 ? "+" : ""}{phase.value}
                      </span>
                    </div>
                    <Progress value={normalized} className="h-2" style={{ "--progress-color": barColor } as React.CSSProperties} />
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>Bearish -100</span>
                      <span>0</span>
                      <span>Bullish +100</span>
                    </div>
                  </div>
                );
              })}
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
              signal={s.newsScore > 30 ? "bullish" : s.newsScore < -30 ? "bearish" : "neutral"}
            />
            <Indicator
              label="Articles Analyzed"
              value={s.newsCount}
            />
            <Indicator
              label="Social Sentiment"
              value={s.socialScore > 0 ? `+${s.socialScore.toFixed(0)}` : s.socialScore.toFixed(0)}
              hint={s.socialScore > 20 ? "Bullish buzz" : s.socialScore < -20 ? "Bearish chatter" : "Neutral"}
              signal={s.socialScore > 20 ? "bullish" : s.socialScore < -20 ? "bearish" : "neutral"}
            />
            <Indicator
              label="Analyst Rating"
              value={`${s.analystRating.toFixed(1)} / 5.0`}
              hint={s.analystRating >= 4 ? "Buy consensus" : s.analystRating >= 3 ? "Hold consensus" : "Sell consensus"}
              signal={s.analystRating >= 4 ? "bullish" : s.analystRating >= 3 ? "neutral" : "bearish"}
            />
            <Indicator
              label="Insider Activity"
              value={s.insiderActivity > 0 ? "Net Buying" : s.insiderActivity < -0.2 ? "Net Selling" : "Neutral"}
              hint={`Score: ${s.insiderActivity.toFixed(2)}`}
              signal={s.insiderActivity > 0 ? "bullish" : s.insiderActivity < -0.2 ? "bearish" : "neutral"}
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
                signal={f.peRatio < 15 ? "bullish" : f.peRatio > 35 ? "bearish" : "neutral"}
              />
              <Indicator
                label="Forward P/E"
                value={f.forwardPE.toFixed(1)}
                hint={f.forwardPE < f.peRatio ? "Growth expected" : "Slowing growth"}
                signal={f.forwardPE < f.peRatio ? "bullish" : "bearish"}
              />
              <Indicator
                label="Earnings Growth"
                value={`${f.earningsGrowth.toFixed(1)}%`}
                hint={f.earningsGrowth > 15 ? "Strong" : f.earningsGrowth > 0 ? "Positive" : "Declining"}
                signal={f.earningsGrowth > 15 ? "bullish" : f.earningsGrowth > 0 ? "neutral" : "bearish"}
              />
              <Indicator
                label="Revenue Growth"
                value={`${f.revenueGrowth.toFixed(1)}%`}
                hint={f.revenueGrowth > 15 ? "Strong" : f.revenueGrowth > 0 ? "Positive" : "Declining"}
                signal={f.revenueGrowth > 15 ? "bullish" : f.revenueGrowth > 0 ? "neutral" : "bearish"}
              />
              <Indicator
                label="Profit Margin"
                value={`${f.profitMargin.toFixed(1)}%`}
                hint={f.profitMargin > 20 ? "Excellent" : f.profitMargin > 10 ? "Good" : "Low"}
                signal={f.profitMargin > 20 ? "bullish" : f.profitMargin > 10 ? "neutral" : "bearish"}
              />
              <Indicator
                label="Debt/Equity"
                value={f.debtToEquity.toFixed(2)}
                hint={f.debtToEquity < 0.5 ? "Low leverage" : f.debtToEquity > 2 ? "High leverage" : "Moderate"}
                signal={f.debtToEquity < 0.5 ? "bullish" : f.debtToEquity > 2 ? "bearish" : "neutral"}
              />
              <Indicator
                label="Return on Equity"
                value={`${f.returnOnEquity.toFixed(1)}%`}
                hint={f.returnOnEquity > 20 ? "Excellent" : f.returnOnEquity > 10 ? "Good" : "Below avg"}
                signal={f.returnOnEquity > 20 ? "bullish" : f.returnOnEquity > 10 ? "neutral" : "bearish"}
              />
              <Indicator
                label="FCF Yield"
                value={`${f.freeCashFlowYield.toFixed(1)}%`}
                hint={f.freeCashFlowYield > 5 ? "Attractive" : f.freeCashFlowYield > 2 ? "Fair" : "Low"}
                signal={f.freeCashFlowYield > 5 ? "bullish" : f.freeCashFlowYield > 2 ? "neutral" : "bearish"}
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
                signal={t.rsi < 30 ? "bullish" : t.rsi > 70 ? "bearish" : "neutral"}
              />
              <Indicator
                label="MACD"
                value={t.macd.toFixed(2)}
                hint={t.macd > t.macdSignal ? "Bullish crossover" : "Bearish crossover"}
                signal={t.macd > t.macdSignal ? "bullish" : "bearish"}
              />
              <Indicator label="MACD Signal" value={t.macdSignal.toFixed(2)} />
              <Indicator
                label="EMA 20"
                value={`$${t.ema20.toFixed(2)}`}
                hint={t.ema20 > t.sma50 ? "Short-term bullish" : "Short-term bearish"}
                signal={t.ema20 > t.sma50 ? "bullish" : "bearish"}
              />
              <Indicator
                label="SMA 50"
                value={`$${t.sma50.toFixed(2)}`}
                hint={t.sma50 > t.sma200 ? "Above 200-day" : "Below 200-day"}
                signal={t.sma50 > t.sma200 ? "bullish" : "bearish"}
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
                signal={t.atr > stock.price * 0.04 ? "bearish" : "neutral"}
              />
              <Indicator
                label="Volume"
                value={`${(t.volume / 1_000_000).toFixed(1)}M`}
                hint={t.volume > t.avgVolume ? "Above average" : "Below average"}
                signal={t.volume > t.avgVolume ? "bullish" : "neutral"}
              />
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          StocksRadars does not serve as financial advice. The data shown is for recommendational purposes only.
        </p>
      </main>
    </div>
  );
}
