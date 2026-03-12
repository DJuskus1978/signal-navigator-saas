import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const SB_URL = () => Deno.env.get("SUPABASE_URL")!;
const SB_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AV_BASE = "https://www.alphavantage.co/query";

/* ── Universe of tickers per index ── */
const INDEX_UNIVERSE: Record<string, string[]> = {
  nasdaq: [
    "AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","NFLX",
    "AMD","INTC","ADBE","PYPL","QCOM","AVGO","CSCO","PEP",
    "COST","SBUX","MDLZ","GILD","ISRG","REGN","ADP","LRCX",
  ],
  dow: [
    "UNH","GS","HD","CAT","CRM","V","JPM","WMT",
    "MCD","DIS","NKE","BA","IBM","AXP","MMM","JNJ",
    "PG","KO","MRK","TRV","DOW","AMGN","HON","CSCO",
  ],
  sp500: [
    "BRK-B","XOM","LLY","MA","ABBV","PFE","COST","T",
    "CVX","BAC","WFC","ORCL","TMO","ACN","LIN","DHR",
    "PM","NEE","UPS","RTX","LOW","SPGI","INTU","SYK",
  ],
};

const POSITIONS_PER_INDEX = 10;
const INITIAL_CAPITAL = 100_000;

/* ══════════════════════════════════════════════════════════════════════════
   PROFESSIONAL RISK MANAGEMENT CONSTANTS
   Based on institutional trading desk practices
   ══════════════════════════════════════════════════════════════════════════ */

// Position-level risk controls
const HARD_STOP_LOSS_PCT = -8;          // Max loss per position before forced exit
const TRAILING_STOP_PCT = 12;           // Trailing stop distance from peak (%)
const TAKE_PROFIT_TARGET_PCT = 25;      // Partial profit-taking trigger
const TAKE_PROFIT_SELL_FRACTION = 0.5;  // Sell 50% at take-profit target

// Position sizing
const MAX_POSITION_PCT = 5;             // Max 5% of portfolio in any single stock
const MIN_POSITION_VALUE = 500;         // Don't open tiny positions

// Entry filters — avoid chasing & bad risk/reward
const MAX_DAY_CHANGE_FOR_ENTRY = 4;     // Don't buy stocks up >4% today (chasing)
const MIN_RISK_REWARD_RATIO = 2.0;      // Require 2:1 reward-to-risk minimum

// Portfolio-level risk
const MAX_PORTFOLIO_DRAWDOWN_PCT = 15;  // If portfolio down >15%, shift to defensive
const MAX_CASH_RESERVE_PCT = 20;        // Always keep some powder dry

// Cooldown: don't re-enter a recently stopped-out position
const COOLDOWN_DAYS = 5;

/* ── Types ── */
interface StockQuote {
  symbol: string; price: number; change: number; changesPercentage: number;
  pe: number | null; volume: number; avgVolume: number;
  marketCap: number; previousClose: number;
}

interface OpenPosition {
  ticker: string; exchange: string; shares: number;
  entry_price: number; entry_date: string; current_price: number;
  score: number; recommendation: string;
  unrealized_pnl: number; unrealized_pnl_pct: number;
  action: "hold" | "buy";
  peak_price: number;       // Highest price since entry (for trailing stop)
  exit_reason?: string;     // Why we sold (for transparency)
}

interface ClosedPosition {
  ticker: string; exchange: string; shares: number;
  entry_price: number; entry_date: string; exit_price: number;
  realized_pnl: number; realized_pnl_pct: number;
  recommendation: string; exit_score: number;
  exit_reason: string;      // "stop-loss" | "trailing-stop" | "take-profit" | "signal-sell" | "drawdown-defense"
}

/* ── Supabase helper ── */
async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`,
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Supabase REST error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

/* ════════════════════════════════════════════════════════════════════════════
   ADAPTIVE RadarScore™ — reads parameters from DB for self-learning
   ════════════════════════════════════════════════════════════════════════════ */

interface ScoringParams {
  weight_fundamental: number; weight_sentiment: number; weight_technical: number;
  threshold_strong_buy: number; threshold_buy: number;
  threshold_hold: number; threshold_dont_buy: number;
  pe_excellent: number; pe_good: number; pe_fair: number; pe_high: number;
  fund_pe_excellent_score: number; fund_pe_good_score: number;
  fund_pe_fair_score: number; fund_pe_high_score: number;
  fund_pe_very_high_score: number; fund_pe_multiplier: number;
  sent_vol_surge: number; sent_vol_high: number;
  sent_vol_above_avg: number; sent_vol_normal: number;
  tech_strong_bull: number; tech_bull: number; tech_slight_bull: number;
  tech_slight_bear: number; tech_bear: number; tech_strong_bear: number;
}

const DEFAULT_PARAMS: ScoringParams = {
  weight_fundamental: 0.40, weight_sentiment: 0.25, weight_technical: 0.35,
  threshold_strong_buy: 60, threshold_buy: 30, threshold_hold: 5, threshold_dont_buy: -15,
  pe_excellent: 12, pe_good: 18, pe_fair: 25, pe_high: 35,
  fund_pe_excellent_score: 25, fund_pe_good_score: 15, fund_pe_fair_score: 5,
  fund_pe_high_score: -5, fund_pe_very_high_score: -15, fund_pe_multiplier: 2,
  sent_vol_surge: 2.0, sent_vol_high: 1.5, sent_vol_above_avg: 1.2, sent_vol_normal: 0.8,
  tech_strong_bull: 3.0, tech_bull: 1.5, tech_slight_bull: 0.3,
  tech_slight_bear: -0.3, tech_bear: -1.5, tech_strong_bear: -3.0,
};

async function loadScoringParams(): Promise<{ params: ScoringParams; round: number }> {
  try {
    const rows = await sbFetch("scoring_parameters?select=param_key,param_value,optimization_round");
    if (!Array.isArray(rows) || rows.length === 0) return { params: { ...DEFAULT_PARAMS }, round: 0 };
    const p = { ...DEFAULT_PARAMS };
    let round = 0;
    for (const r of rows) {
      if (r.param_key in p) (p as Record<string, number>)[r.param_key] = Number(r.param_value);
      round = Math.max(round, r.optimization_round ?? 0);
    }
    return { params: p, round };
  } catch {
    return { params: { ...DEFAULT_PARAMS }, round: 0 };
  }
}

function calculateFundamentalScore(pe: number | null, p: ScoringParams): number {
  if (pe === null || pe <= 0) return 0;
  let score = 0;
  if (pe < p.pe_excellent) score += p.fund_pe_excellent_score;
  else if (pe < p.pe_good) score += p.fund_pe_good_score;
  else if (pe < p.pe_fair) score += p.fund_pe_fair_score;
  else if (pe < p.pe_high) score += p.fund_pe_high_score;
  else score += p.fund_pe_very_high_score;
  return score * p.fund_pe_multiplier;
}

function calculateSentimentScore(changesPct: number, volumeRatio: number, p: ScoringParams): number {
  let score = 0;
  if (volumeRatio > p.sent_vol_surge && changesPct > 0) score += 20;
  else if (volumeRatio > p.sent_vol_high && changesPct > 0) score += 12;
  else if (volumeRatio > p.sent_vol_above_avg) score += 5;
  else if (volumeRatio > p.sent_vol_normal) score += 0;
  else if (changesPct < -1) score -= 10;
  else score -= 3;

  if (changesPct > p.tech_strong_bull) score += 15;
  else if (changesPct > 1) score += 8;
  else if (changesPct > 0) score += 3;
  else if (changesPct > -1) score -= 3;
  else if (changesPct > p.tech_strong_bear) score -= 8;
  else score -= 15;

  return score;
}

function calculateTechnicalScore(
  changesPct: number, volumeRatio: number, fundamentalBias: number,
  p: ScoringParams, entryPrice?: number, currentPrice?: number
): number {
  let score = 0;
  if (changesPct > p.tech_strong_bull) score += 22;
  else if (changesPct > p.tech_bull) score += 14;
  else if (changesPct > p.tech_slight_bull) score += 5;
  else if (changesPct > p.tech_slight_bear) score += 0;
  else if (changesPct > p.tech_bear) score -= 10;
  else if (changesPct > p.tech_strong_bear) score -= 15;
  else score -= 20;

  if (volumeRatio > p.sent_vol_surge) score += 12;
  else if (volumeRatio > 1.3) score += 7;
  else if (volumeRatio > p.sent_vol_normal) score += 0;
  else score -= 5;

  if (entryPrice && currentPrice) {
    const posRet = ((currentPrice - entryPrice) / entryPrice) * 100;
    if (posRet > 10) score += 20;
    else if (posRet > 5) score += 12;
    else if (posRet > 1) score += 5;
    else if (posRet > -1) score += 0;
    else if (posRet > -5) score -= 10;
    else score -= 18;
  }

  if (Math.abs(changesPct) > p.tech_strong_bull && fundamentalBias > 20) score += 8;
  else if (Math.abs(changesPct) > 5) score -= 5;

  return score;
}

function calculateRadarScore(
  quote: StockQuote, p: ScoringParams, entryPrice?: number
): { score: number; recommendation: string; fundScore: number; sentScore: number; techScore: number } {
  const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const fundScore = calculateFundamentalScore(quote.pe, p);
  const sentScore = calculateSentimentScore(quote.changesPercentage, volumeRatio, p);
  const techScore = calculateTechnicalScore(
    quote.changesPercentage, volumeRatio, fundScore, p, entryPrice, quote.price
  );
  const combined = Math.round(
    fundScore * p.weight_fundamental + sentScore * p.weight_sentiment + techScore * p.weight_technical
  );
  let recommendation: string;
  if (combined >= p.threshold_strong_buy) recommendation = "strong-buy";
  else if (combined >= p.threshold_buy) recommendation = "buy";
  else if (combined >= p.threshold_hold) recommendation = "hold";
  else if (combined >= p.threshold_dont_buy) recommendation = "dont-buy";
  else recommendation = "sell";
  return { score: combined, recommendation, fundScore, sentScore, techScore };
}

/* ── Alpha Vantage data fetching ── */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAVQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  try {
    const r = await fetch(`${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const d = await r.json();
    const gq = d?.["Global Quote"];
    if (!gq || !gq["05. price"]) return null;
    const price = parseFloat(gq["05. price"]);
    const previousClose = parseFloat(gq["08. previous close"] || "0");
    const volume = parseInt(gq["06. volume"] || "0", 10);
    const change = Math.round((price - previousClose) * 100) / 100;
    const changesPct = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
    return {
      symbol, price, change, changesPercentage: changesPct,
      pe: null, volume, avgVolume: volume,
      marketCap: 0, previousClose,
    };
  } catch (e) {
    console.error(`AV quote error for ${symbol}:`, e);
    return null;
  }
}

async function fetchAllQuotes(tickers: string[], apiKey: string): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 1200;
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const quotes = await Promise.all(batch.map((t) => fetchAVQuote(t, apiKey)));
    for (const q of quotes) if (q) results.set(q.symbol, q);
    if (i + BATCH_SIZE < tickers.length) await delay(BATCH_DELAY);
  }
  return results;
}

/* ── Snapshot helpers ── */
async function getPreviousSnapshot() {
  const rows = await sbFetch("portfolio_snapshots?select=*&order=snapshot_date.desc&limit=1");
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function getFirstSnapshot() {
  const rows = await sbFetch(
    "portfolio_snapshots?select=benchmark_sp500_initial,benchmark_nasdaq_initial,benchmark_dow_initial&order=snapshot_date.asc&limit=1"
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/* ── Trade history helpers ── */
async function recordTradeOpen(pos: OpenPosition, score: number, rec: string, paramsVersion: number) {
  await sbFetch("trade_history", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      ticker: pos.ticker, exchange: pos.exchange,
      entry_date: pos.entry_date, entry_price: pos.entry_price,
      shares: pos.shares, entry_score: score,
      entry_recommendation: rec, is_open: true,
      params_version: paramsVersion,
    }),
  });
}

async function recordTradeClose(
  ticker: string, entryDate: string, exitPrice: number,
  exitScore: number, exitRec: string,
  realizedPnl: number, realizedPnlPct: number, holdingDays: number
) {
  const openTrades = await sbFetch(
    `trade_history?ticker=eq.${ticker}&entry_date=eq.${entryDate}&is_open=eq.true&limit=1`
  );
  if (Array.isArray(openTrades) && openTrades.length > 0) {
    await sbFetch(`trade_history?id=eq.${openTrades[0].id}`, {
      method: "PATCH",
      body: JSON.stringify({
        is_open: false, exit_date: new Date().toISOString().split("T")[0],
        exit_price: exitPrice, exit_score: exitScore,
        exit_recommendation: exitRec, realized_pnl: realizedPnl,
        realized_pnl_pct: realizedPnlPct, holding_days: holdingDays,
      }),
    });
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PROFESSIONAL RISK MANAGEMENT FUNCTIONS
   ══════════════════════════════════════════════════════════════════════════ */

/** Check if a position should be exited based on professional risk rules */
function checkRiskExits(
  pos: OpenPosition,
  currentPrice: number,
  portfolioValue: number,
  portfolioDrawdownPct: number
): { shouldExit: boolean; exitReason: string; sellFraction: number } {

  const pnlPct = ((currentPrice - pos.entry_price) / pos.entry_price) * 100;
  const peakPrice = Math.max(pos.peak_price || pos.entry_price, currentPrice);
  const drawdownFromPeak = ((currentPrice - peakPrice) / peakPrice) * 100;

  // 1. HARD STOP-LOSS — non-negotiable, like a bank's risk desk
  if (pnlPct <= HARD_STOP_LOSS_PCT) {
    return { shouldExit: true, exitReason: "stop-loss", sellFraction: 1.0 };
  }

  // 2. TRAILING STOP — protect profits once a position has run up
  //    Only activates after position is at least 5% in profit
  if (pnlPct > 5 && drawdownFromPeak <= -TRAILING_STOP_PCT) {
    return { shouldExit: true, exitReason: "trailing-stop", sellFraction: 1.0 };
  }

  // 3. TAKE-PROFIT — partial sell at target (like institutional profit-taking)
  if (pnlPct >= TAKE_PROFIT_TARGET_PCT) {
    return { shouldExit: true, exitReason: "take-profit", sellFraction: TAKE_PROFIT_SELL_FRACTION };
  }

  // 4. PORTFOLIO DRAWDOWN DEFENSE — reduce risk when overall portfolio is hurting
  if (portfolioDrawdownPct <= -MAX_PORTFOLIO_DRAWDOWN_PCT && pnlPct < 0) {
    return { shouldExit: true, exitReason: "drawdown-defense", sellFraction: 1.0 };
  }

  return { shouldExit: false, exitReason: "", sellFraction: 0 };
}

/** Professional position sizing: risk-based, capped, volatility-aware */
function calculatePositionSize(
  quote: StockQuote,
  score: number,
  availableCash: number,
  portfolioValue: number
): number {
  // Max allowed position value (% of portfolio)
  const maxPositionValue = portfolioValue * (MAX_POSITION_PCT / 100);

  // Base allocation: higher confidence = bigger position (Kelly-inspired)
  // Score ranges roughly -50 to +80; normalize to 0.3–1.0 multiplier
  const confidenceMultiplier = Math.max(0.3, Math.min(1.0, (score + 50) / 130));

  // Volatility penalty: high intraday moves = smaller position
  const volatility = Math.abs(quote.changesPercentage);
  const volPenalty = volatility > 3 ? 0.5 : volatility > 2 ? 0.7 : volatility > 1 ? 0.85 : 1.0;

  // Volume liquidity check: lower volume = smaller position
  const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const liquidityMult = volumeRatio < 0.5 ? 0.5 : volumeRatio < 0.8 ? 0.75 : 1.0;

  const idealValue = maxPositionValue * confidenceMultiplier * volPenalty * liquidityMult;

  // Never exceed available cash or max position size
  const positionValue = Math.min(idealValue, availableCash, maxPositionValue);

  // Skip tiny positions
  if (positionValue < MIN_POSITION_VALUE) return 0;

  return positionValue;
}

/** Check entry quality — professional brokers don't chase or take bad risk/reward */
function isQualityEntry(quote: StockQuote, score: number): boolean {
  // Don't chase: avoid buying stocks that already ran up a lot today
  if (quote.changesPercentage > MAX_DAY_CHANGE_FOR_ENTRY) return false;

  // Don't catch falling knives: avoid stocks down >5% today
  if (quote.changesPercentage < -5) return false;

  // Minimum risk/reward ratio check
  // Estimated upside = score-based expectation, downside = stop-loss distance
  const estimatedUpsidePct = Math.max(1, score * 0.4);  // rough proxy
  const downsidePct = Math.abs(HARD_STOP_LOSS_PCT);
  if (estimatedUpsidePct / downsidePct < MIN_RISK_REWARD_RATIO) return false;

  // Volume sanity: don't trade in a vacuum
  if (quote.volume < 10000) return false;

  return true;
}

/** Check if a ticker is in cooldown (recently stopped out) */
function isInCooldown(ticker: string, closedPositions: ClosedPosition[]): boolean {
  const recent = closedPositions.find(
    (c) => c.ticker === ticker && (c.exit_reason === "stop-loss" || c.exit_reason === "trailing-stop")
  );
  if (!recent) return false;
  // closedPositions are from today, so if stopped out today → cooldown
  return true;
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN HANDLER
   ══════════════════════════════════════════════════════════════════════════ */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    const avKey = Deno.env.get("ALPHA_VANTAGE_API_KEY")!;
    const today = new Date().toISOString().split("T")[0];

    /* 0. Load adaptive scoring parameters from DB */
    const { params: sp, round: paramsRound } = await loadScoringParams();

    /* 1. Load previous state */
    const prev = await getPreviousSnapshot();
    const isFirstDay = !prev || !prev.holdings?.open_positions;

    let cash = isFirstDay ? INITIAL_CAPITAL : parseFloat(prev.cash_balance ?? INITIAL_CAPITAL);
    let totalRealizedPnl = isFirstDay ? 0 : parseFloat(prev.total_realized_pnl ?? 0);
    let openPositions: OpenPosition[] = isFirstDay ? [] : (prev.holdings?.open_positions ?? []);
    const closedToday: ClosedPosition[] = [];

    // Load recently closed trades for cooldown checking
    let recentStopOuts: string[] = [];
    try {
      const recentTrades = await sbFetch(
        `trade_history?is_open=eq.false&exit_date=gte.${new Date(Date.now() - COOLDOWN_DAYS * 86400000).toISOString().split("T")[0]}&select=ticker,exit_recommendation`
      );
      if (Array.isArray(recentTrades)) {
        recentStopOuts = recentTrades
          .filter((t: any) => t.exit_recommendation === "sell" || t.exit_recommendation === "dont-buy")
          .map((t: any) => t.ticker);
      }
    } catch { /* ignore */ }

    /* 2. Gather all tickers */
    const allUniverseTickers = new Set<string>();
    for (const tickers of Object.values(INDEX_UNIVERSE)) for (const t of tickers) allUniverseTickers.add(t);
    for (const p of openPositions) allUniverseTickers.add(p.ticker);
    allUniverseTickers.add("SPY"); allUniverseTickers.add("QQQ"); allUniverseTickers.add("DIA");

    /* 3. Fetch all quotes via Alpha Vantage */
    const allQuotes = await fetchAllQuotes([...allUniverseTickers], avKey);

    /* 4. Calculate portfolio drawdown for defensive mode */
    const currentPosValue = openPositions.reduce((s, p) => {
      const q = allQuotes.get(p.ticker);
      return s + (q ? q.price * p.shares : p.current_price * p.shares);
    }, 0);
    const currentPortfolioValue = cash + currentPosValue;
    const portfolioDrawdownPct = ((currentPortfolioValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
    const isDefensiveMode = portfolioDrawdownPct <= -MAX_PORTFOLIO_DRAWDOWN_PCT;

    /* 5. Score open positions → HOLD, SELL, or RISK-EXIT */
    const keptPositions: OpenPosition[] = [];
    let riskExitsCount = 0;
    let takeProfitCount = 0;

    for (const pos of openPositions) {
      const quote = allQuotes.get(pos.ticker);
      if (!quote) { keptPositions.push({ ...pos, action: "hold" }); continue; }

      // Update peak price for trailing stop
      const peakPrice = Math.max(pos.peak_price || pos.entry_price, quote.price);

      const { score, recommendation } = calculateRadarScore(quote, sp, pos.entry_price);
      const unrealized_pnl = Math.round((quote.price - pos.entry_price) * pos.shares * 100) / 100;
      const unrealized_pnl_pct = Math.round(((quote.price - pos.entry_price) / pos.entry_price) * 10000) / 100;

      // ── Professional Risk Checks (priority over signal-based exits) ──
      const riskCheck = checkRiskExits(
        { ...pos, peak_price: peakPrice },
        quote.price,
        currentPortfolioValue,
        portfolioDrawdownPct
      );

      const shouldSignalSell = recommendation === "sell" || recommendation === "dont-buy";
      const shouldExit = riskCheck.shouldExit || shouldSignalSell;
      const exitReason = riskCheck.shouldExit ? riskCheck.exitReason : "signal-sell";
      const sellFraction = riskCheck.shouldExit ? riskCheck.sellFraction : 1.0;

      if (shouldExit) {
        const sharesToSell = sellFraction < 1.0 ? Math.floor(pos.shares * sellFraction * 100) / 100 : pos.shares;
        const sharesRemaining = Math.round((pos.shares - sharesToSell) * 100) / 100;

        const realized_pnl = Math.round((quote.price - pos.entry_price) * sharesToSell * 100) / 100;
        const realized_pnl_pct = Math.round(((quote.price - pos.entry_price) / pos.entry_price) * 10000) / 100;
        cash += sharesToSell * quote.price;
        totalRealizedPnl += realized_pnl;

        const entryDate = new Date(pos.entry_date);
        const holdingDays = Math.round((Date.now() - entryDate.getTime()) / 86400000);

        closedToday.push({
          ticker: pos.ticker, exchange: pos.exchange, shares: sharesToSell,
          entry_price: pos.entry_price, entry_date: pos.entry_date,
          exit_price: quote.price, realized_pnl, realized_pnl_pct,
          recommendation, exit_score: score,
          exit_reason: exitReason,
        });

        if (exitReason === "stop-loss" || exitReason === "trailing-stop") riskExitsCount++;
        if (exitReason === "take-profit") takeProfitCount++;

        // Record trade close for learning
        recordTradeClose(
          pos.ticker, pos.entry_date, quote.price,
          score, `${recommendation}:${exitReason}`, realized_pnl, realized_pnl_pct, holdingDays
        ).catch(console.error);

        // Keep remaining shares if partial sell (take-profit)
        if (sharesRemaining > 0) {
          keptPositions.push({
            ...pos, shares: sharesRemaining, current_price: quote.price,
            score, recommendation, unrealized_pnl: Math.round((quote.price - pos.entry_price) * sharesRemaining * 100) / 100,
            unrealized_pnl_pct, action: "hold", peak_price: peakPrice,
          });
        }
      } else {
        keptPositions.push({
          ...pos, current_price: quote.price, score, recommendation,
          unrealized_pnl, unrealized_pnl_pct, action: "hold",
          peak_price: peakPrice,
        });
      }
    }

    /* 6. Count free slots per index */
    const slotsUsed: Record<string, number> = { nasdaq: 0, dow: 0, sp500: 0 };
    for (const p of keptPositions) slotsUsed[p.exchange] = (slotsUsed[p.exchange] || 0) + 1;

    const heldTickers = new Set(keptPositions.map((p) => p.ticker));
    const newPositions: OpenPosition[] = [];

    /* 7. Score candidates & buy best (with professional entry filters) */
    const globalBoughtTickers = new Set(heldTickers);

    // In defensive mode, only buy strong-buy signals and reduce position sizes
    const defensiveBuyFilter = isDefensiveMode
      ? (rec: string) => rec === "strong-buy"
      : (rec: string) => rec === "buy" || rec === "strong-buy";

    // Calculate available cash for new positions (keep reserve)
    const reserveAmount = currentPortfolioValue * (MAX_CASH_RESERVE_PCT / 100);
    const deployableCash = Math.max(0, cash - reserveAmount);

    for (const [exchange, universe] of Object.entries(INDEX_UNIVERSE)) {
      const freeSlots = POSITIONS_PER_INDEX - (slotsUsed[exchange] || 0);
      if (freeSlots <= 0) continue;

      const scored = universe
        .filter((t) => !globalBoughtTickers.has(t))
        .filter((t) => !recentStopOuts.includes(t)) // Cooldown check
        .map((ticker) => {
          const quote = allQuotes.get(ticker);
          if (!quote) return null;
          const result = calculateRadarScore(quote, sp);

          // Professional entry quality gate
          if (!isQualityEntry(quote, result.score)) return null;

          return { ticker, quote, ...result };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .filter((s) => defensiveBuyFilter(s.recommendation))
        .sort((a, b) => b.score - a.score)
        .slice(0, freeSlots);

      for (const s of scored) {
        globalBoughtTickers.add(s.ticker);
        newPositions.push({
          ticker: s.ticker, exchange, shares: 0,
          entry_price: s.quote.price, entry_date: today,
          current_price: s.quote.price, score: s.score,
          recommendation: s.recommendation,
          unrealized_pnl: 0, unrealized_pnl_pct: 0, action: "buy",
          peak_price: s.quote.price,
        });
      }
    }

    /* 8. Professional position sizing (risk-based, not equal weight) */
    if (newPositions.length > 0 && deployableCash > 0) {
      let remainingCash = deployableCash;

      // Size positions from highest to lowest conviction
      const sortedNew = [...newPositions].sort((a, b) => b.score - a.score);

      for (const pos of sortedNew) {
        const quote = allQuotes.get(pos.ticker);
        if (!quote || remainingCash <= 0) continue;

        const positionValue = calculatePositionSize(
          quote, pos.score, remainingCash, currentPortfolioValue
        );

        if (positionValue <= 0) continue;

        pos.shares = Math.floor((positionValue / pos.entry_price) * 100) / 100;
        const spent = pos.shares * pos.entry_price;
        remainingCash -= spent;
        cash -= spent;
      }
    }

    const validNew = newPositions.filter((p) => p.shares > 0);

    // Record new trade opens for learning
    for (const pos of validNew) {
      recordTradeOpen(pos, pos.score, pos.recommendation, paramsRound).catch(console.error);
    }

    /* 9. Combine all open positions */
    const allOpen = [...keptPositions, ...validNew];

    /* 10. Portfolio value */
    const posValue = allOpen.reduce((s, p) => s + p.shares * p.current_price, 0);
    const portfolioValue = Math.round((cash + posValue) * 100) / 100;

    /* 11. Benchmarks */
    const spyQ = allQuotes.get("SPY");
    const qqqQ = allQuotes.get("QQQ");
    const diaQ = allQuotes.get("DIA");
    const bench = {
      sp500: spyQ ? spyQ.price * 10 : null,
      nasdaq: qqqQ ? qqqQ.price * 40 : null,
      dow: diaQ ? diaQ.price * 100 : null,
    };

    const first = isFirstDay ? null : await getFirstSnapshot();
    const sp500Init = isFirstDay ? bench.sp500 : (first?.benchmark_sp500_initial ?? bench.sp500);
    const nasdaqInit = isFirstDay ? bench.nasdaq : (first?.benchmark_nasdaq_initial ?? bench.nasdaq);
    const dowInit = isFirstDay ? bench.dow : (first?.benchmark_dow_initial ?? bench.dow);

    /* 12. Upsert today's snapshot */
    const snapshot = {
      snapshot_date: today,
      portfolio_value: portfolioValue,
      initial_value: INITIAL_CAPITAL,
      cash_balance: Math.round(cash * 100) / 100,
      total_realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
      holdings: {
        open_positions: allOpen,
        closed_today: closedToday,
        summary: {
          total_positions: allOpen.length,
          buys_today: validNew.length,
          sells_today: closedToday.length,
          holds: keptPositions.length,
          risk_exits: riskExitsCount,
          take_profits: takeProfitCount,
          defensive_mode: isDefensiveMode,
          cash_reserve_pct: Math.round((cash / portfolioValue) * 10000) / 100,
        },
        scoring: {
          params_version: paramsRound,
          weights: {
            fundamental: sp.weight_fundamental,
            sentiment: sp.weight_sentiment,
            technical: sp.weight_technical,
          },
          thresholds: {
            strong_buy: sp.threshold_strong_buy,
            buy: sp.threshold_buy,
            hold: sp.threshold_hold,
            dont_buy: sp.threshold_dont_buy,
          },
        },
        risk_management: {
          stop_loss_pct: HARD_STOP_LOSS_PCT,
          trailing_stop_pct: TRAILING_STOP_PCT,
          take_profit_pct: TAKE_PROFIT_TARGET_PCT,
          max_position_pct: MAX_POSITION_PCT,
          max_drawdown_pct: MAX_PORTFOLIO_DRAWDOWN_PCT,
          cash_reserve_pct: MAX_CASH_RESERVE_PCT,
          cooldown_days: COOLDOWN_DAYS,
        },
      },
      benchmark_sp500: bench.sp500,
      benchmark_nasdaq: bench.nasdaq,
      benchmark_dow: bench.dow,
      benchmark_sp500_initial: sp500Init,
      benchmark_nasdaq_initial: nasdaqInit,
      benchmark_dow_initial: dowInit,
    };

    await sbFetch("portfolio_snapshots?on_conflict=snapshot_date", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(snapshot),
    });

    return j({
      success: true, date: today,
      portfolio_value: portfolioValue,
      cash_balance: Math.round(cash * 100) / 100,
      open_positions: allOpen.length,
      buys_today: validNew.length,
      sells_today: closedToday.length,
      holds: keptPositions.length,
      risk_exits: riskExitsCount,
      take_profits: takeProfitCount,
      defensive_mode: isDefensiveMode,
      realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
      benchmark_sp500: bench.sp500,
      benchmark_nasdaq: bench.nasdaq,
      benchmark_dow: bench.dow,
      scoring_engine: `RadarScore™ PRO adaptive (round ${paramsRound}) — F:${sp.weight_fundamental} S:${sp.weight_sentiment} T:${sp.weight_technical}`,
      risk_management: "ACTIVE: stop-loss, trailing-stop, take-profit, position-sizing, drawdown-defense",
      params_version: paramsRound,
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
