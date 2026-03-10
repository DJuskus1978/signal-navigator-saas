import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortfolioSnapshot {
  snapshot_date: string;
  portfolio_value: number;
  initial_value: number;
  benchmark_sp500: number | null;
  benchmark_nasdaq: number | null;
  benchmark_sp500_initial: number | null;
  benchmark_nasdaq_initial: number | null;
  holdings: unknown;
}

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

function formatReturn(current: number, initial: number): string {
  const pct = ((current - initial) / initial) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function AIPerformanceDashboard() {
  const { data: snapshots = [], isLoading } = usePortfolioSnapshots();

  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const first = snapshots.length > 0 ? snapshots[0] : null;

  // If no data yet, show "tracking started" state
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

  const hasData = latest !== null && first !== null;
  const portfolioReturn = hasData
    ? ((latest.portfolio_value - first.initial_value) / first.initial_value) * 100
    : 0;
  const sp500Return = hasData && latest.benchmark_sp500 && first.benchmark_sp500_initial
    ? ((latest.benchmark_sp500 - first.benchmark_sp500_initial) / first.benchmark_sp500_initial) * 100
    : null;
  const nasdaqReturn = hasData && latest.benchmark_nasdaq && first.benchmark_nasdaq_initial
    ? ((latest.benchmark_nasdaq - first.benchmark_nasdaq_initial) / first.benchmark_nasdaq_initial) * 100
    : null;

  const strategies = [
    {
      name: "StocksRadars AI",
      returnPct: portfolioReturn,
      highlight: true,
    },
    ...(sp500Return !== null
      ? [{ name: "S&P 500", returnPct: sp500Return, highlight: false }]
      : []),
    ...(nasdaqReturn !== null
      ? [{ name: "NASDAQ", returnPct: nasdaqReturn, highlight: false }]
      : []),
  ];

  const daysTracking = snapshots.length;
  const isPositive = portfolioReturn >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-primary/20 overflow-hidden">
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
          {!hasData ? (
            <div className="text-center py-6">
              <BarChart3 className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground mb-1">Portfolio tracking just started</p>
              <p className="text-sm text-muted-foreground">
                Our AI is selecting the top 30 stocks across Nasdaq, S&P 500, and Dow Jones.
                <br />Check back daily to see live performance results.
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
                  {formatCurrency(latest.portfolio_value)}
                </p>
                <div className={cn(
                  "inline-flex items-center gap-1 mt-2 text-lg font-bold",
                  isPositive ? "text-signal-buy" : "text-signal-sell"
                )}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {portfolioReturn >= 0 ? "+" : ""}{portfolioReturn.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Started: {formatCurrency(first.initial_value)}
                </p>
              </div>

              {/* Performance comparison table */}
              {strategies.length > 1 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Strategy</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Return</th>
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
                AI dynamically selects top 10 stocks from each major index daily based on RadarScore™
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
