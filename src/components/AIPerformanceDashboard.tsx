import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, BarChart3, Target, ChevronDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const GOLD       = "#FFB800";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface OpenPosition {
  ticker: string;
  exchange: string;
  shares: number;
  entry_price: number;
  entry_date: string;
  current_price: number;
  score: number;
  recommendation?: string;
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
  "1d": "Daily", "1w": "Weekly", "1m": "Monthly",
  "3m": "Quarterly", "6m": "Half Year", "1y": "Annual",
};

// ── Data hook ─────────────────────────────────────────────────────────────────
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
    case "1d": return 1;  case "1w": return 7;   case "1m": return 30;
    case "3m": return 90; case "6m": return 180; case "1y": return 365;
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

function signalColor(rec?: string): string {
  if (rec === "strong-buy" || rec === "buy") return GREEN;
  if (rec === "hold") return GOLD;
  return RED;
}

// ── Stat box ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, icon, color = WHITE }: { label: string; value: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, padding: "0.875rem 1rem", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", marginBottom: "0.25rem" }}>
        {icon}
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.3rem", color, lineHeight: 1 }}>
          {value}
        </span>
      </div>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED }}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIPerformanceDashboard() {
  const { data: snapshots = [], isLoading } = usePortfolioSnapshots();
  const [period, setPeriod]           = useState<Period>("1d");
  const [showPositions, setShowPositions] = useState(false);
  const [showClosed, setShowClosed]   = useState(false);

  const { latest, strategies, daysTracking, hasData, holdingsData } = useMemo(() => {
    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const first  = snapshots.length > 0 ? snapshots[0] : null;
    const cutoffDate  = daysAgo(periodToDays(period));
    const periodStart = snapshots.length > 0 ? getSnapshotForDate(snapshots, cutoffDate) ?? first : null;
    const hasData = latest !== null && periodStart !== null && first !== null;

    let portfolioReturn = 0;
    let sp500Return: number | null = null;
    let nasdaqReturn: number | null = null;
    let dowReturn: number | null = null;

    if (hasData) {
      const startVal = periodStart.portfolio_value || first!.initial_value;
      portfolioReturn = ((latest.portfolio_value - startVal) / startVal) * 100;
      if (latest.benchmark_sp500 && periodStart.benchmark_sp500)
        sp500Return = ((latest.benchmark_sp500 - periodStart.benchmark_sp500) / periodStart.benchmark_sp500) * 100;
      else if (latest.benchmark_sp500 && first!.benchmark_sp500_initial)
        sp500Return = ((latest.benchmark_sp500 - first!.benchmark_sp500_initial) / first!.benchmark_sp500_initial) * 100;
      if (latest.benchmark_nasdaq && periodStart.benchmark_nasdaq)
        nasdaqReturn = ((latest.benchmark_nasdaq - periodStart.benchmark_nasdaq) / periodStart.benchmark_nasdaq) * 100;
      else if (latest.benchmark_nasdaq && first!.benchmark_nasdaq_initial)
        nasdaqReturn = ((latest.benchmark_nasdaq - first!.benchmark_nasdaq_initial) / first!.benchmark_nasdaq_initial) * 100;
      if (latest.benchmark_dow && periodStart.benchmark_dow)
        dowReturn = ((latest.benchmark_dow - periodStart.benchmark_dow) / periodStart.benchmark_dow) * 100;
      else if (latest.benchmark_dow && first!.benchmark_dow_initial)
        dowReturn = ((latest.benchmark_dow - first!.benchmark_dow_initial) / first!.benchmark_dow_initial) * 100;
    }

    const strategies = [
      { name: "StocksRadars AI", returnPct: portfolioReturn,   highlight: true },
      { name: "S&P 500",         returnPct: sp500Return ?? 0,   highlight: false },
      { name: "NASDAQ",          returnPct: nasdaqReturn ?? 0,  highlight: false },
      { name: "Dow Jones",       returnPct: dowReturn ?? 0,     highlight: false },
    ];
    const holdingsData = latest ? parseHoldings(latest.holdings) : null;
    return { latest, strategies, daysTracking: snapshots.length, hasData, holdingsData };
  }, [snapshots, period]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", color: MUTED, letterSpacing: "0.1em" }}>
          Loading performance data…
        </div>
      </div>
    );
  }

  const portfolioReturn = hasData ? (strategies.find((s) => s.highlight)?.returnPct ?? 0) : 0;
  const isPositive      = portfolioReturn >= 0;
  const summary         = holdingsData?.summary;
  const openPositions   = holdingsData?.open_positions ?? [];
  const closedToday     = holdingsData?.closed_today ?? [];
  const top5            = [...openPositions].sort((a, b) => b.score - a.score).slice(0, 5);
  const cashBalance     = latest?.cash_balance ?? 0;
  const realizedPnl     = latest?.total_realized_pnl ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: `1px solid ${BORDER_CLR}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Target size={18} color={CYAN} style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, margin: 0, lineHeight: 1 }}>
            AI Performance Tracker
          </p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", color: WHITE, margin: "0.2rem 0 0", lineHeight: 1 }}>
            Live AI Portfolio
          </p>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED, margin: "0.25rem 0 0", lineHeight: 1 }}>
            Real-time portfolio powered by StocksRadars AI —{" "}
            {daysTracking > 0 ? `tracking for ${daysTracking} day${daysTracking !== 1 ? "s" : ""}` : "starting today"}
          </p>
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
        {/* Period selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.3rem 0.85rem",
                background: period === key ? CYAN : "transparent",
                color: period === key ? NAVY : MUTED,
                border: `1px solid ${period === key ? CYAN : BORDER_CLR}`,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {!hasData ? (
          /* ── No data state ── */
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <BarChart3 size={40} color={`${CYAN}50`} style={{ margin: "0 auto 1rem" }} />
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", color: WHITE, marginBottom: "0.5rem" }}>
              Portfolio tracking just started
            </p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Our AI is selecting the top 10 stocks from each major index daily.<br />
              Check back to see live performance results.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,212,255,0.1)", border: `1px solid rgba(0,212,255,0.25)`, padding: "0.5rem 1.25rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", color: CYAN }}>
              <Target size={14} color={CYAN} />
              Starting value: $100,000
            </div>
          </div>
        ) : (
          <>
            {/* Portfolio value + P&L */}
            <div style={{ textAlign: "center", marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: `1px solid ${BORDER_CLR}` }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: MUTED, margin: "0 0 0.4rem" }}>
                StocksRadars AI Portfolio
              </p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2.2rem, 6vw, 3rem)", color: WHITE, margin: 0, lineHeight: 1 }}>
                {formatCurrency(latest!.portfolio_value)}
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                {isPositive
                  ? <TrendingUp size={18} color={GREEN} />
                  : <TrendingDown size={18} color={RED} />}
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.4rem", color: isPositive ? GREEN : RED }}>
                  {portfolioReturn >= 0 ? "+" : ""}{portfolioReturn.toFixed(1)}%
                </span>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED }}>
                  ({PERIOD_LABELS[period]})
                </span>
              </div>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, margin: "0.4rem 0 0" }}>
                Started: {formatCurrency(latest!.initial_value ?? 100000)}
              </p>
            </div>

            {/* Stats grid */}
            {summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.25rem" }} className="sm:grid-cols-4">
                <StatBox label="Open Positions" value={summary.total_positions.toString()} />
                <StatBox label="Cash Balance"   value={formatCurrency(cashBalance)} icon={<DollarSign size={13} color={CYAN} />} color={CYAN} />
                <StatBox label="Today's Buys"   value={summary.buys_today.toString()} icon={<ArrowUpRight size={13} color={GREEN} />} color={GREEN} />
                <StatBox label="Today's Sells"  value={summary.sells_today.toString()} icon={<ArrowDownRight size={13} color={RED} />} color={RED} />
              </div>
            )}

            {/* Realized P&L strip */}
            {realizedPnl !== 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", marginBottom: "1.25rem", background: NAVY, border: `1px solid ${BORDER_CLR}`, borderLeft: `3px solid ${realizedPnl >= 0 ? GREEN : RED}` }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
                  Total Realized P&L
                </span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: realizedPnl >= 0 ? GREEN : RED }}>
                  {realizedPnl >= 0 ? "+" : ""}{formatCurrency(realizedPnl)}
                </span>
              </div>
            )}

            {/* Performance comparison table */}
            {strategies.length > 1 && (
              <div style={{ border: `1px solid ${BORDER_CLR}`, overflow: "hidden", marginBottom: "1.25rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: NAVY }}>
                      <th style={{ textAlign: "left", padding: "0.625rem 1rem", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED }}>
                        Strategy
                      </th>
                      <th style={{ textAlign: "right", padding: "0.625rem 1rem", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED }}>
                        {PERIOD_LABELS[period]} Return
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategies.map((s) => (
                      <tr key={s.name} style={{ borderTop: `1px solid ${BORDER_CLR}`, background: s.highlight ? "rgba(0,212,255,0.04)" : "transparent" }}>
                        <td style={{ padding: "0.75rem 1rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: s.highlight ? 700 : 500, fontSize: "0.85rem", color: s.highlight ? CYAN : WHITE }}>
                          {s.highlight ? "🤖 " : ""}{s.name}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1rem", color: s.returnPct >= 0 ? GREEN : RED }}>
                          {s.returnPct >= 0 ? "+" : ""}{s.returnPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top 5 open positions */}
            {top5.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <button
                  onClick={() => setShowPositions(!showPositions)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.6rem", background: "transparent", border: `1px solid ${BORDER_CLR}`, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: CYAN, transition: "background 0.15s ease" }}
                >
                  Top 5 AI Picks (Open Positions)
                  <ChevronDown size={13} color={CYAN} style={{ transform: showPositions ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                </button>
                {showPositions && (
                  <div style={{ border: `1px solid ${BORDER_CLR}`, borderTop: "none", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: NAVY }}>
                          {["Ticker", "Score", "P&L", "Status"].map((h, i) => (
                            <th key={h} style={{ padding: "0.5rem 0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, textAlign: i === 0 ? "left" : "right" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {top5.map((h, i) => (
                          <tr key={h.ticker} style={{ borderTop: `1px solid ${BORDER_CLR}` }}>
                            <td style={{ padding: "0.6rem 0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: WHITE }}>
                              <span style={{ color: MUTED, marginRight: "0.25rem" }}>{i + 1}.</span>
                              {h.ticker}
                              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.65rem", color: MUTED, marginLeft: "0.25rem", textTransform: "uppercase" }}>{h.exchange}</span>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: WHITE }}>
                              {Math.round(h.score)}
                              {h.recommendation && (
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: signalColor(h.recommendation), marginLeft: "0.3rem" }}>
                                  {h.recommendation === "strong-buy" ? "S.Buy" : h.recommendation}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "0.85rem", color: h.unrealized_pnl_pct >= 0 ? GREEN : RED }}>
                              {h.unrealized_pnl_pct >= 0 ? "+" : ""}{h.unrealized_pnl_pct.toFixed(1)}%
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.15rem 0.5rem", background: h.action === "buy" ? "rgba(0,200,150,0.15)" : "rgba(107,122,153,0.15)", color: h.action === "buy" ? GREEN : MUTED }}>
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
              <div style={{ marginBottom: "0.75rem" }}>
                <button
                  onClick={() => setShowClosed(!showClosed)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,71,87,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.6rem", background: "transparent", border: `1px solid ${BORDER_CLR}`, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: RED, transition: "background 0.15s ease" }}
                >
                  Closed Today ({closedToday.length})
                  <ChevronDown size={13} color={RED} style={{ transform: showClosed ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                </button>
                {showClosed && (
                  <div style={{ border: `1px solid ${BORDER_CLR}`, borderTop: "none", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: NAVY }}>
                          {["Ticker", "Entry", "Exit", "P&L"].map((h, i) => (
                            <th key={h} style={{ padding: "0.5rem 0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, textAlign: i === 0 ? "left" : "right" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {closedToday.map((c) => (
                          <tr key={c.ticker} style={{ borderTop: `1px solid ${BORDER_CLR}` }}>
                            <td style={{ padding: "0.6rem 0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: WHITE }}>{c.ticker}</td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", color: MUTED }}>${c.entry_price.toFixed(2)}</td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", color: WHITE }}>${c.exit_price.toFixed(2)}</td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "0.85rem", color: c.realized_pnl >= 0 ? GREEN : RED }}>
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

            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.68rem", color: MUTED, textAlign: "center", marginTop: "1rem", lineHeight: 1.5, opacity: 0.7 }}>
              AI dynamically selects &amp; rebalances top 10 stocks from Nasdaq, S&amp;P 500 &amp; Dow Jones daily (30 total positions) based on RadarScore™. Positions are held or closed based on daily scoring decisions.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
