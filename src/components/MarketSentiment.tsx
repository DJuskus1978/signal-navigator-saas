import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const GOLD       = "#FFB800";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

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

function SentimentGauge({ value, label }: { value: number; label: string }) {
  const needleRotation = -90 + (value / 100) * 180;
  const color = value > 55 ? GREEN : value < 45 ? RED : GOLD;

  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${color}`, padding: "1.5rem", textAlign: "center" }}>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "1rem" }}>
        Market Sentiment Gauge
      </p>
      <div style={{ position: "relative", width: "192px", height: "112px", margin: "0 auto 1rem" }}>
        <svg viewBox="0 0 200 110" style={{ width: "100%", height: "100%" }}>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={BORDER_CLR} strokeWidth="16" strokeLinecap="round" />
          <defs>
            <linearGradient id="sentimentGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={RED}  />
              <stop offset="25%"  stopColor="#FF8C42" />
              <stop offset="50%"  stopColor={GOLD} />
              <stop offset="75%"  stopColor="#00A878" />
              <stop offset="100%" stopColor={GREEN} />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#sentimentGaugeGradient)" strokeWidth="16" strokeLinecap="round" />
          <g transform={`rotate(${needleRotation}, 100, 100)`}>
            <line x1="100" y1="100" x2="100" y2="30" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill={WHITE} />
          </g>
        </svg>
        <span style={{ position: "absolute", left: "-4px", bottom: "-18px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, color: RED, textTransform: "uppercase" }}>Bearish</span>
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "-14px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Neutral</span>
        <span style={{ position: "absolute", right: "-4px", bottom: "-18px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, color: GREEN, textTransform: "uppercase" }}>Bullish</span>
      </div>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2rem", color: color, marginTop: "1.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </p>
    </div>
  );
}

export function MarketSentiment() {
  const { data, isLoading, error } = useMarketSentiment();

  if (isLoading) {
    return (
      <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
        <Loader2 size={16} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED }}>Loading market sentiment...</span>
      </div>
    );
  }

  if (error || !data) return null;

  const chartEntries = data.chartData;
  const lastDate = chartEntries[chartEntries.length - 1]?.date;
  const findMonthEntry = (m: number) => chartEntries.find(e => new Date(e.date).getMonth() === m);
  const monthTicks = [findMonthEntry(8), findMonthEntry(10), findMonthEntry(0)].filter(Boolean).map(e => e!.date);
  if (lastDate) monthTicks.push(lastDate);
  const formatTick = (d: string) => d === lastDate ? "Today" : new Date(d).toLocaleDateString("en-US", { month: "short" });

  const priceMin = Math.min(...data.chartData.map(d => Math.min(d.close, d.ma)));
  const priceMax = Math.max(...data.chartData.map(d => Math.max(d.close, d.ma)));
  const yPad = (priceMax - priceMin) * 0.1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.12em", textTransform: "uppercase", color: WHITE, margin: 0 }}>
        General Market Sentiment
      </h2>

      <SentimentGauge value={data.gaugeValue} label={data.sentiment} />

      {/* Signal legend */}
      <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.75rem 1rem", alignItems: "start" }}>
          <span style={{ fontSize: "1rem" }}>🟢</span>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: GREEN }}>Bullish</span> — Market has positive momentum — generally a good environment to invest or hold stocks
          </p>
          <span style={{ fontSize: "1rem" }}>🟡</span>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: GOLD }}>Neutral</span> — Market is flat — no strong signal either way, stay the course
          </p>
          <span style={{ fontSize: "1rem" }}>🔴</span>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: RED }}>Bearish</span> — Market is trending down — be cautious, maybe hold off on new investments
          </p>
        </div>
      </div>

      {/* S&P500 chart */}
      <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${GREEN}`, padding: "1.25rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "10px", height: "10px", background: GREEN, flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, margin: 0 }}>S&amp;P 500 tracker</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: WHITE, margin: 0 }}>{(data.currentPrice / 1000).toFixed(3)}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "10px", height: "10px", background: GOLD, flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, margin: 0 }}>125-day moving average</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: WHITE, margin: 0 }}>{(data.ma / 1000).toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div style={{ height: "192px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
              <XAxis dataKey="date" tickFormatter={formatTick} ticks={monthTicks} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
              <YAxis domain={[priceMin - yPad, priceMax + yPad]} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={45} orientation="right" tickCount={6} tickFormatter={(v: number) => (v / 1000).toFixed(3)} />
              <Line type="monotone" dataKey="close" stroke={GREEN} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="ma"    stroke={GOLD}  strokeWidth={2}   dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.68rem", color: MUTED, textAlign: "center", lineHeight: 1.6, marginTop: "0.75rem" }}>
          When the S&amp;P 500 tracker is above its 125-day moving average, that's a sign of positive momentum. If it's below, the market may be more cautious.
        </p>
      </div>

      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.68rem", color: MUTED, textAlign: "center", opacity: 0.6 }}>
        Data provided by Alpha Vantage and should not be considered investment advice.
      </p>
    </div>
  );
}
