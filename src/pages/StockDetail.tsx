import { useParams, Link } from "react-router-dom";
import { getStockByTicker } from "@/lib/mock-data";
import { getRecommendationLabel } from "@/lib/recommendation-engine";
import { TrafficLight } from "@/components/TrafficLight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
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
  const { technical: t, fundamental: f } = stock;

  const explanations: Record<string, string> = {
    buy: `${stock.name} shows strong technical momentum with favorable fundamentals. Our analysis suggests this is a good entry point.`,
    hold: `${stock.name} is stable but lacks clear directional signals. We recommend holding current positions and watching for a clearer trend.`,
    "dont-buy": `${stock.name} has mixed signals. Technical and fundamental indicators suggest waiting for better conditions before entering a position.`,
    sell: `${stock.name} shows weakening momentum with deteriorating fundamentals. Consider reducing exposure or exiting the position.`,
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
            <p className="text-muted-foreground">{explanations[stock.recommendation]}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Technical */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Analysis</CardTitle>
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
                label="SMA 50"
                value={`$${t.sma50.toFixed(2)}`}
                hint={t.sma50 > t.sma200 ? "Above 200-day" : "Below 200-day"}
              />
              <Indicator label="SMA 200" value={`$${t.sma200.toFixed(2)}`} />
              <Indicator
                label="Volume"
                value={`${(t.volume / 1_000_000).toFixed(1)}M`}
                hint={t.volume > t.avgVolume ? "Above average" : "Below average"}
              />
            </CardContent>
          </Card>

          {/* Fundamental */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fundamental Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Indicator
                label="P/E Ratio"
                value={f.peRatio.toFixed(1)}
                hint={f.peRatio < 15 ? "Undervalued" : f.peRatio > 35 ? "Overvalued" : "Fair value"}
              />
              <Indicator
                label="Earnings Growth"
                value={`${f.earningsGrowth.toFixed(1)}%`}
                hint={f.earningsGrowth > 10 ? "Strong" : f.earningsGrowth > 0 ? "Positive" : "Declining"}
              />
              <Indicator
                label="Debt/Equity"
                value={f.debtToEquity.toFixed(2)}
                hint={f.debtToEquity < 0.5 ? "Low leverage" : f.debtToEquity > 2 ? "High leverage" : "Moderate"}
              />
              <Indicator
                label="Revenue Growth"
                value={`${f.revenueGrowth.toFixed(1)}%`}
                hint={f.revenueGrowth > 15 ? "Strong" : f.revenueGrowth > 0 ? "Positive" : "Declining"}
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
