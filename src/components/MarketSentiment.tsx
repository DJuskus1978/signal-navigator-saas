import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Line, ComposedChart } from "recharts";
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
    staleTime: 30 * 60_000, // 30 min
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}

// Gauge SVG component
function SentimentGauge({ value, label }: { value: number; label: string }) {
  // value 0-100, maps to angle -135 to +135 (270° arc)
  const angle = -135 + (value / 100) * 270;
  const needleLength = 52;
  const cx = 70, cy = 70;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + needleLength * Math.cos(rad - Math.PI / 2);
  const ny = cy + needleLength * Math.sin(rad - Math.PI / 2);

  // Color based on sentiment
  const color = value > 55 ? "hsl(var(--signal-buy))" : value < 45 ? "hsl(var(--signal-sell))" : "hsl(var(--muted-foreground))";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 95" className="w-44 h-auto">
        {/* Background arc */}
        <path
          d="M 15 70 A 55 55 0 0 1 125 70"
          fill="none"
          stroke="hsl(var(--muted) / 0.4)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Colored arc — green portion based on value */}
        <path
          d="M 15 70 A 55 55 0 0 1 125 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 173} 173`}
          className="transition-all duration-700"
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="hsl(var(--foreground))" />
        {/* Labels */}
        <text x="10" y="90" fill="hsl(var(--muted-foreground))" fontSize="8" textAnchor="start">Bearish</text>
        <text x={cx} y="12" fill="hsl(var(--muted-foreground))" fontSize="8" textAnchor="middle">Neutral</text>
        <text x="130" y="90" fill="hsl(var(--muted-foreground))" fontSize="8" textAnchor="end">Bullish</text>
      </svg>
      <p className="font-display font-bold text-lg -mt-1">{label}</p>
    </div>
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
      <Card className="p-5 bg-card border-border">
        <SentimentGauge value={data.gaugeValue} label={data.sentiment} />
      </Card>

      {/* S&P 500 tracker card */}
      <Card className="p-5 bg-card border-border">
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-signal-buy inline-block" />
            <div>
              <p className="text-xs text-muted-foreground">S&P 500 tracker</p>
              <p className="font-display font-bold text-lg">{(data.currentPrice / 10).toFixed(3)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <div>
              <p className="text-xs text-muted-foreground">125-day moving average</p>
              <p className="font-display font-bold text-lg">{(data.ma / 10).toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[priceMin - yPad, priceMax + yPad]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => v.toFixed(0)} />
              <Area type="monotone" dataKey="close" stroke="hsl(var(--signal-buy))" fill="hsl(var(--signal-buy) / 0.1)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="ma" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center leading-relaxed">
          When the S&P 500 tracker is above its moving average of the prior 125 days, that's a sign of positive momentum. If it's below, it could indicate that the market is more cautious.
        </p>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        The data is provided by Alpha Vantage and should not be considered investment advice.
      </p>
    </div>
  );
}
