import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target, ChevronDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OpenPosition {
  ticker: string;
  exchange: string;
  shares: number;
  entry_price: number;
  entry_date: string;
  current_price: number;
  score: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  action: "hold" | "buy";
}

interface ClosedPosition {
  ticker: string;
  exchange: string;
  shares: number;
  entry_price: number;
  exit_price: number;
  realized_pnl: number;
  realized_pnl_pct: number;
}

interface HoldingsSummary {
  total_positions: number;
  buys_today: number;
  sells_today: number;
  holds: number;
}

interface HoldingsData {
  open_positions?: OpenPosition[];
  closed_today?: ClosedPosition[];
  summary?: HoldingsSummary;
}

// Legacy format support
interface LegacyHolding {
  ticker: string;
  score: number;
  price: number;
  changePercent: number;
}

interface PortfolioSnapshot {
  snapshot_date: string;
  portfolio_value: number;
  initial_value: number;
  cash_balance: number | null;
  total_realized_pnl: number | null;
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
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(val);
}

function getSnapshotForDate(snapshots: PortfolioSnapshot[], targetDate: string): PortfolioSnapshot | null {
  let best: PortfolioSnapshot | null = null;
  for (const s of snapshots) {
    if (s.snapshot_date <= targetDate) best = s;
    else break;
  }
  return best;
}

function parseHoldings(raw: unknown): HoldingsData | null {
  if (!raw || typeof raw !== "object") return null;
  const h = raw as Record<string, unknown>;
  if (h.open_positions) return raw as HoldingsData;
  // Legacy: array of {ticker, score, price, changePercent}
  if (Array.isArray(raw)) {
    return {
      open_positions: (raw as LegacyHolding[]).map((l) => ({
        ticker: l.ticker, exchange: "", shares: 0,
        entry_price: l.price, entry_date: "", current_price: l.price,
        score: l.score, unrealized_pnl: 0, unrealized_pnl_pct: l.changePercent,
        action: "hold" as const,
      })),
      closed_today: [],
      summary: { total_positions: (raw as LegacyHolding[]).length, buys_today: 0, sells_today: 0, holds: (raw as LegacyHolding[]).length },
    };
  }
  return null;
}

export function AIPerformanceDashboard() {
  const { data: snapshots = [], isLoading } = usePortfolioSnapshots();
  const [period, setPeriod] = useState<Period>("1d");
  const [showPositions, setShowPositions] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const { latest, strategies, daysTracking, hasData, holdingsData } = useMemo(() => {
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

    const holdingsData = latest ? parseHoldings(latest.holdings) : null;

    return { latest, strategies, daysTracking: snapshots.length, hasData, holdingsData };
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

  const portfolioReturn = hasData ? strategies.find((s) => s.highlight)?.returnPct ?? 0 : 0;
  const isPositive = portfolioReturn >= 0;
  const summary = holdingsData?.summary;
  const openPositions = holdingsData?.open_positions ?? [];
  const closedToday = holdingsData?.closed_today ?? [];
  const top5 = [...openPositions].sort((a, b) => b.score - a.score).slice(0, 5);
  const cashBalance = latest?.cash_balance ?? 0;
  const realizedPnl = latest?.total_realized_pnl ?? 0;

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
              {/* Portfolio value + stats */}
              <div className="text-center mb-4">
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
                  Started: {formatCurrency(latest!.initial_value ?? 100000)}
                </p>
              </div>

              {/* Live stats row */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  <StatBox label="Open Positions" value={summary.total_positions.toString()} />
                  <StatBox
                    label="Cash"
                    value={formatCurrency(cashBalance)}
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                  />
                  <StatBox
                    label="Today's Buys"
                    value={summary.buys_today.toString()}
                    icon={<ArrowUpRight className="w-3.5 h-3.5 text-signal-buy" />}
                  />
                  <StatBox
                    label="Today's Sells"
                    value={summary.sells_today.toString()}
                    icon={<ArrowDownRight className="w-3.5 h-3.5 text-signal-sell" />}
                  />
                </div>
              )}

              {/* Realized P&L */}
              {realizedPnl !== 0 && (
                <div className={cn(
                  "flex items-center justify-between px-4 py-2.5 mb-4 rounded-lg border",
                  realizedPnl >= 0 ? "border-signal-buy/20 bg-signal-buy/5" : "border-signal-sell/20 bg-signal-sell/5"
                )}>
                  <span className="text-xs font-medium text-muted-foreground">Total Realized P&L</span>
                  <span className={cn("font-bold text-sm tabular-nums", realizedPnl >= 0 ? "text-signal-buy" : "text-signal-sell")}>
                    {realizedPnl >= 0 ? "+" : ""}{formatCurrency(realizedPnl)}
                  </span>
                </div>
              )}

              {/* Performance comparison */}
              {strategies.length > 1 && (
                <div className="rounded-xl border border-border overflow-hidden mb-4">
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
                        <tr key={s.name} className={cn("border-t border-border", s.highlight && "bg-primary/5")}>
                          <td className={cn("px-4 py-3 font-medium", s.highlight && "text-primary font-semibold")}>
                            {s.highlight && "🤖 "}{s.name}
                          </td>
                          <td className={cn("px-4 py-3 text-right font-bold tabular-nums", s.returnPct >= 0 ? "text-signal-buy" : "text-signal-sell")}>
                            {s.returnPct >= 0 ? "+" : ""}{s.returnPct.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top 5 Open Positions */}
              {top5.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowPositions(!showPositions)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-accent/50 transition-colors rounded-lg border border-border py-2"
                  >
                    Top 5 AI Picks (Open Positions)
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showPositions && "rotate-180")} />
                  </button>
                  {showPositions && (
                    <div className="mt-3 rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ticker</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Score</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">P&L</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top5.map((h, i) => (
                            <tr key={h.ticker} className="border-t border-border">
                              <td className="px-3 py-2.5 font-semibold text-foreground">
                                <span className="text-muted-foreground mr-1">{i + 1}.</span>
                                {h.ticker}
                                <span className="text-[10px] text-muted-foreground ml-1 uppercase">{h.exchange}</span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                                {Math.round(h.score)}
                              </td>
                              <td className={cn(
                                "px-3 py-2.5 text-right font-bold tabular-nums text-xs",
                                h.unrealized_pnl_pct >= 0 ? "text-signal-buy" : "text-signal-sell"
                              )}>
                                {h.unrealized_pnl_pct >= 0 ? "+" : ""}{h.unrealized_pnl_pct.toFixed(1)}%
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                                  h.action === "buy"
                                    ? "bg-signal-buy/10 text-signal-buy"
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {h.action === "buy" ? "New" : "Hold"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Closed today */}
              {closedToday.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowClosed(!showClosed)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-signal-sell hover:bg-accent/50 transition-colors rounded-lg border border-border py-2"
                  >
                    Closed Today ({closedToday.length})
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showClosed && "rotate-180")} />
                  </button>
                  {showClosed && (
                    <div className="mt-3 rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ticker</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Entry</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Exit</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {closedToday.map((c) => (
                            <tr key={c.ticker} className="border-t border-border">
                              <td className="px-3 py-2.5 font-semibold text-foreground">{c.ticker}</td>
                              <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">${c.entry_price.toFixed(2)}</td>
                              <td className="px-3 py-2.5 text-right text-foreground tabular-nums">${c.exit_price.toFixed(2)}</td>
                              <td className={cn(
                                "px-3 py-2.5 text-right font-bold tabular-nums text-xs",
                                c.realized_pnl >= 0 ? "text-signal-buy" : "text-signal-sell"
                              )}>
                                {c.realized_pnl >= 0 ? "+" : ""}{c.realized_pnl_pct.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center mt-4 italic">
                AI dynamically selects &amp; rebalances top 10 stocks from Nasdaq, S&amp;P 500 &amp; Dow Jones daily (30 total positions) based on RadarScore™. Positions are held or closed based on daily scoring decisions.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
