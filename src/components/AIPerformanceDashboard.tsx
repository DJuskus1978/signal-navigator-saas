import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioSnapshot {
  snapshot_date: string;
  portfolio_value: number;
  initial_value: number;
  benchmark_sp500: number | null;
  benchmark_nasdaq: number | null;
  benchmark_dow: number | null;
  benchmark_sp500_initial: number | null;
  benchmark_nasdaq_initial: number | null;
  benchmark_dow_initial: number | null;
  holdings: unknown;
}

type Period = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "Daily",
  "1w": "Weekly",
  "1m": "Monthly",
  "3m": "Quarterly",
  "6m": "Half Year",
  "1y": "Annual",
};

function usePortfolioSnapshots() {
  return useQuery<PortfolioSnapshot[]>({
    queryKey: ["portfolio-snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PortfolioSnapshot[];
    },
    staleTime: 60_000,
  });
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function periodToDays(p: Period): number {
  switch (p) {
    case "1d": return 1;
    case "1w": return 7;
    case "1m": return 30;
    case "3m": return 90;
    case "6m": return 180;
    case "1y": return 365;
  }
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function getSnapshotForDate(snapshots: PortfolioSnapshot[], targetDate: string): PortfolioSnapshot | null {
  // Find the closest snapshot on or before the target date
  let best: PortfolioSnapshot | null = null;
  for (const s of snapshots) {
    if (s.snapshot_date <= targetDate) best = s;
    else break;
  }
  return best;
}

export function AIPerformanceDashboard() {
  const { data: snapshots = [], isLoading } = usePortfolioSnapshots();
  const [period, setPeriod] = useState<Period>("1d");

  const { latest, periodStart, strategies, daysTracking, hasData } = useMemo(() => {
    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const first = snapshots.length > 0 ? snapshots[0] : null;

    const cutoffDate = daysAgo(periodToDays(period));
    const periodStart = snapshots.length > 0 ? getSnapshotForDate(snapshots, cutoffDate) ?? first : null;

    const hasData = latest !== null && periodStart !== null && first !== null;

    let portfolioReturn = 0;
    let sp500Return: number | null = null;
    let nasdaqReturn: number | null = null;
    let dowReturn: number | null = null;

    if (hasData) {
      const startVal = periodStart.portfolio_value || first!.initial_value;
      portfolioReturn = ((latest.portfolio_value - startVal) / startVal) * 100;

      if (latest.benchmark_sp500 && periodStart.benchmark_sp500) {
        sp500Return = ((latest.benchmark_sp500 - periodStart.benchmark_sp500) / periodStart.benchmark_sp500) * 100;
      } else if (latest.benchmark_sp500 && first!.benchmark_sp500_initial) {
        sp500Return = ((latest.benchmark_sp500 - first!.benchmark_sp500_initial) / first!.benchmark_sp500_initial) * 100;
      }

      if (latest.benchmark_nasdaq && periodStart.benchmark_nasdaq) {
        nasdaqReturn = ((latest.benchmark_nasdaq - periodStart.benchmark_nasdaq) / periodStart.benchmark_nasdaq) * 100;
      } else if (latest.benchmark_nasdaq && first!.benchmark_nasdaq_initial) {
        nasdaqReturn = ((latest.benchmark_nasdaq - first!.benchmark_nasdaq_initial) / first!.benchmark_nasdaq_initial) * 100;
      }

      if (latest.benchmark_dow && periodStart.benchmark_dow) {
        dowReturn = ((latest.benchmark_dow - periodStart.benchmark_dow) / periodStart.benchmark_dow) * 100;
      } else if (latest.benchmark_dow && first!.benchmark_dow_initial) {
        dowReturn = ((latest.benchmark_dow - first!.benchmark_dow_initial) / first!.benchmark_dow_initial) * 100;
      }
    }

    const strategies = [
      { name: "StocksRadars AI", returnPct: portfolioReturn, highlight: true },
      { name: "S&P 500", returnPct: sp500Return ?? 0, highlight: false },
      { name: "NASDAQ", returnPct: nasdaqReturn ?? 0, highlight: false },
      { name: "Dow Jones", returnPct: dowReturn ?? 0, highlight: false },
    ];

    return { latest, periodStart, strategies, daysTracking: snapshots.length, hasData };
  }, [snapshots, period]);

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-10 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const portfolioReturn = hasData
    ? strategies.find((s) => s.highlight)?.returnPct ?? 0
    : 0;
  const isPositive = portfolioReturn >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-lg text-foreground">
              Live AI Performance Tracker
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time portfolio powered by StocksRadars AI — {daysTracking > 0 ? `tracking for ${daysTracking} day${daysTracking !== 1 ? "s" : ""}` : "starting today"}
          </p>
        </div>

        <CardContent className="p-6">
          {/* Period selector */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  period === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {!hasData ? (
            <div className="text-center py-6">
              <BarChart3 className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground mb-1">Portfolio tracking just started</p>
              <p className="text-sm text-muted-foreground">
                Our AI is selecting the top 10 stocks from each major index daily.
                <br />Check back to see live performance results.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Target className="w-4 h-4" /> Starting value: $100,000
              </div>
            </div>
          ) : (
            <>
              {/* Main portfolio value */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">StocksRadars AI Portfolio</p>
                <p className="font-display text-4xl font-bold text-foreground">
                  {formatCurrency(latest!.portfolio_value)}
                </p>
                <div className={cn(
                  "inline-flex items-center gap-1 mt-2 text-lg font-bold",
                  isPositive ? "text-signal-buy" : "text-signal-sell"
                )}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {portfolioReturn >= 0 ? "+" : ""}{portfolioReturn.toFixed(1)}%
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({PERIOD_LABELS[period]})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Started: {formatCurrency(snapshots[0]?.initial_value ?? 100000)}
                </p>
              </div>

              {/* Performance comparison table */}
              {strategies.length > 1 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Strategy</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                          {PERIOD_LABELS[period]} Return
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategies.map((s) => (
                        <tr key={s.name} className={cn(
                          "border-t border-border",
                          s.highlight && "bg-primary/5"
                        )}>
                          <td className={cn(
                            "px-4 py-3 font-medium",
                            s.highlight && "text-primary font-semibold"
                          )}>
                            {s.highlight && "🤖 "}{s.name}
                          </td>
                          <td className={cn(
                            "px-4 py-3 text-right font-bold tabular-nums",
                            s.returnPct >= 0 ? "text-signal-buy" : "text-signal-sell"
                          )}>
                            {s.returnPct >= 0 ? "+" : ""}{s.returnPct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
                AI dynamically selects &amp; rebalances top 10 stocks from Nasdaq, S&amp;P 500 &amp; Dow Jones daily based on RadarScore™
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
