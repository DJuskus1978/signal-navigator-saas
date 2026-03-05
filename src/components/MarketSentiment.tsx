import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

interface SentimentData {
  sentiment: string;
  gaugeValue: number;
  currentPrice: number;
  ma: number;
  chartData: { date: string; close: number; ma: number }[];
}

function edgeFnUrl(fn: string) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/${fn}`;
}

function useMarketSentiment() {
  return useQuery<SentimentData>({
    queryKey: ["market-sentiment"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(edgeFnUrl("market-sentiment"), {
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}

// Gauge matching the ConsensusGauge style from AnalystRatingsSection
function SentimentGauge({ value, label }: { value: number; label: string }) {
  // value 0-100: 0=bearish, 50=neutral, 100=bullish
  // Map to needle angle: -90 (bearish) to +90 (bullish)
  const needleRotation = -90 + (value / 100) * 180;

  const color =
    value > 55 ? "text-signal-buy" :
    value < 45 ? "text-signal-sell" :
    "text-signal-hold";

  return (
    <Card>
      <div className="p-6 text-center">
        <div className="relative w-48 h-28 mx-auto mb-4">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Gray arc background */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Colored gradient arc */}
            <defs>
              <linearGradient id="sentimentGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
              stroke="url(#sentimentGaugeGradient)"
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
          <span className="absolute -left-2 -bottom-5 text-[10px] text-muted-foreground whitespace-nowrap">Bearish</span>
          <span className="absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] text-muted-foreground">Neutral</span>
          <span className="absolute -right-2 -bottom-5 text-[10px] text-muted-foreground whitespace-nowrap">Bullish</span>
        </div>
        <p className={`text-3xl font-display font-bold ${color}`}>
          {label}
        </p>
      </div>
    </Card>
  );
}

export function MarketSentiment() {
  const { data, isLoading, error } = useMarketSentiment();

  if (isLoading) {
    return (
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading market sentiment...</span>
        </div>
      </Card>
    );
  }

  if (error || !data) return null;

  const formatDate = (d: string) => {
    const m = new Date(d);
    return m.toLocaleDateString("en-US", { month: "short" });
  };

  // Deduplicate month labels
  const seen = new Set<string>();
  const tickFormatter = (d: string) => {
    const label = formatDate(d);
    if (seen.has(label)) return "";
    seen.add(label);
    return label;
  };

  const priceMin = Math.min(...data.chartData.map(d => Math.min(d.close, d.ma)));
  const priceMax = Math.max(...data.chartData.map(d => Math.max(d.close, d.ma)));
  const yPad = (priceMax - priceMin) * 0.1;

  return (
    <div className="mb-6 space-y-3">
      <h2 className="font-display text-xl font-bold">Sentiment</h2>

      {/* Gauge card */}
      <SentimentGauge value={data.gaugeValue} label={data.sentiment} />

      {/* S&P 500 tracker card */}
      <Card className="p-5 bg-card border-border">
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-signal-buy inline-block" />
            <div>
              <p className="text-xs text-muted-foreground">S&P 500 tracker</p>
              <p className="font-display font-bold text-lg">{(data.currentPrice / 1000).toFixed(3)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-signal-hold inline-block" />
            <div>
              <p className="text-xs text-muted-foreground">125-day moving average</p>
              <p className="font-display font-bold text-lg">{(data.ma / 1000).toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
               <XAxis
                dataKey="date"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                orientation="bottom"
              />
              <YAxis
                domain={[priceMin - yPad, priceMax + yPad]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={45}
                orientation="right"
                tickFormatter={(v: number) => (v / 1000).toFixed(3)}
              />
              <Line type="monotone" dataKey="close" stroke="hsl(var(--signal-buy))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="ma" stroke="hsl(var(--signal-hold))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-3 text-center leading-relaxed">
          When the S&P 500 tracker is above its moving average of the prior 125 days, that's a sign of positive momentum. If it's below, it could indicate that the market is more cautious.
        </p>
      </Card>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        The data is provided by Alpha Vantage and should not be considered investment advice.
      </p>
    </div>
  );
}
