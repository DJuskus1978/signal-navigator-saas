import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const SB_URL = () => Deno.env.get("SUPABASE_URL")!;
const SB_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/* ── Helpers ── */

async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY(),
      Authorization: `Bearer ${SB_KEY()}`,
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  return res.json();
}

interface Trade {
  id: string;
  ticker: string;
  entry_score: number;
  entry_recommendation: string;
  exit_score: number | null;
  exit_recommendation: string | null;
  realized_pnl: number | null;
  realized_pnl_pct: number | null;
  holding_days: number | null;
  params_version: number;
}

interface Param {
  param_key: string;
  param_value: number;
  optimization_round: number;
}

/* ════════════════════════════════════════════════════════════════════════════
   SELF-LEARNING OPTIMIZATION ENGINE
   
   Analyzes closed trade outcomes and adjusts scoring parameters to:
   1. Increase weights for phases that correlate with winning trades
   2. Shift thresholds to reduce false positives (bad buys) and false negatives
   3. Constrain changes within safe bounds to prevent runaway optimization
   ════════════════════════════════════════════════════════════════════════════ */

// Safety bounds — parameters can never drift outside these ranges
const BOUNDS: Record<string, [number, number]> = {
  weight_fundamental: [0.20, 0.55],
  weight_sentiment:   [0.10, 0.40],
  weight_technical:   [0.20, 0.55],
  threshold_strong_buy: [45, 80],
  threshold_buy:        [15, 45],
  threshold_hold:       [-5, 20],
  threshold_dont_buy:   [-30, 0],
  pe_excellent:  [8, 16],
  pe_good:       [14, 22],
  pe_fair:       [20, 30],
  pe_high:       [28, 45],
  fund_pe_excellent_score: [15, 35],
  fund_pe_good_score:      [8, 22],
  fund_pe_fair_score:      [0, 12],
  fund_pe_high_score:      [-15, 0],
  fund_pe_very_high_score: [-25, -5],
  fund_pe_multiplier:      [1.2, 3.0],
  sent_vol_surge:     [1.5, 3.0],
  sent_vol_high:      [1.2, 2.0],
  sent_vol_above_avg: [1.0, 1.5],
  sent_vol_normal:    [0.5, 1.0],
  tech_strong_bull:  [2.0, 5.0],
  tech_bull:         [1.0, 2.5],
  tech_slight_bull:  [0.1, 0.8],
  tech_slight_bear:  [-0.8, -0.1],
  tech_bear:         [-2.5, -1.0],
  tech_strong_bear:  [-5.0, -2.0],
};

// Max single-step change as % of current value
const MAX_STEP_PCT = 0.15; // 15% max per optimization round

function clamp(key: string, value: number): number {
  const bounds = BOUNDS[key];
  if (!bounds) return value;
  return Math.max(bounds[0], Math.min(bounds[1], value));
}

function limitStep(current: number, proposed: number): number {
  const maxDelta = Math.max(Math.abs(current) * MAX_STEP_PCT, 0.5);
  const delta = proposed - current;
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
  return Math.round((current + clamped) * 1000) / 1000;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    /* 1. Load closed trades */
    const trades: Trade[] = await sbFetch(
      "trade_history?is_open=eq.false&realized_pnl_pct=not.is.null&order=exit_date.desc&limit=500"
    );

    if (!Array.isArray(trades) || trades.length < 10) {
      return j({
        success: false,
        reason: `Need at least 10 closed trades to optimize. Current: ${Array.isArray(trades) ? trades.length : 0}`,
      });
    }

    /* 2. Load current parameters */
    const paramsRows: Param[] = await sbFetch("scoring_parameters?select=param_key,param_value,optimization_round");
    const params: Record<string, number> = {};
    let currentRound = 0;
    for (const p of paramsRows) {
      params[p.param_key] = Number(p.param_value);
      currentRound = Math.max(currentRound, p.optimization_round);
    }
    const newRound = currentRound + 1;

    /* 3. Analyze trade outcomes */
    const winners = trades.filter(t => (t.realized_pnl_pct ?? 0) > 0);
    const losers  = trades.filter(t => (t.realized_pnl_pct ?? 0) <= 0);

    const winRate = winners.length / trades.length;
    const avgReturn = trades.reduce((s, t) => s + (t.realized_pnl_pct ?? 0), 0) / trades.length;
    const avgWinner = winners.length > 0
      ? winners.reduce((s, t) => s + (t.realized_pnl_pct ?? 0), 0) / winners.length
      : 0;
    const avgLoser = losers.length > 0
      ? losers.reduce((s, t) => s + (t.realized_pnl_pct ?? 0), 0) / losers.length
      : 0;

    // Score distribution analysis
    const avgWinnerScore = winners.length > 0
      ? winners.reduce((s, t) => s + t.entry_score, 0) / winners.length
      : 0;
    const avgLoserScore = losers.length > 0
      ? losers.reduce((s, t) => s + t.entry_score, 0) / losers.length
      : 0;

    // Recommendation effectiveness
    const recGroups: Record<string, { wins: number; losses: number; avgPnl: number }> = {};
    for (const t of trades) {
      const rec = t.entry_recommendation;
      if (!recGroups[rec]) recGroups[rec] = { wins: 0, losses: 0, avgPnl: 0 };
      if ((t.realized_pnl_pct ?? 0) > 0) recGroups[rec].wins++;
      else recGroups[rec].losses++;
      recGroups[rec].avgPnl += (t.realized_pnl_pct ?? 0);
    }
    for (const k of Object.keys(recGroups)) {
      const total = recGroups[k].wins + recGroups[k].losses;
      recGroups[k].avgPnl = total > 0 ? recGroups[k].avgPnl / total : 0;
    }

    /* 4. Calculate parameter adjustments */
    const changes: Array<{ key: string; old: number; new: number; reason: string }> = [];

    function adjust(key: string, newVal: number, reason: string) {
      const old = params[key];
      if (old === undefined) return;
      let adjusted = limitStep(old, newVal);
      adjusted = clamp(key, adjusted);
      if (Math.abs(adjusted - old) > 0.001) {
        changes.push({ key, old, new: adjusted, reason });
        params[key] = adjusted;
      }
    }

    // ── A. Adjust buy threshold based on loser entry scores ──
    // If many losers entered with scores just above the buy threshold,
    // raise the threshold to be more selective
    if (winRate < 0.50 && losers.length >= 5) {
      // Too many losing trades → raise buy threshold
      const newBuyThreshold = params.threshold_buy + (avgLoserScore - params.threshold_buy) * 0.3;
      adjust("threshold_buy", newBuyThreshold,
        `Win rate ${(winRate * 100).toFixed(1)}% < 50% → raising buy threshold to filter weak entries`);
      
      // Also raise strong-buy proportionally
      const sbRatio = params.threshold_strong_buy / params.threshold_buy;
      adjust("threshold_strong_buy", params.threshold_buy * sbRatio,
        `Maintaining strong-buy/buy ratio after buy threshold adjustment`);
    } else if (winRate > 0.65 && avgReturn > 2) {
      // Very high win rate → we can be slightly more aggressive
      adjust("threshold_buy", params.threshold_buy * 0.95,
        `Win rate ${(winRate * 100).toFixed(1)}% > 65% with ${avgReturn.toFixed(1)}% avg return → slightly lowering buy threshold`);
    }

    // ── B. Adjust sell threshold based on exit outcomes ──
    // If stocks sold at "dont-buy" actually recovered (false sells),
    // lower the threshold; if they kept dropping, keep it
    const soldAsDontBuy = trades.filter(t => t.exit_recommendation === "dont-buy");
    if (soldAsDontBuy.length >= 3) {
      const avgDontBuyPnl = soldAsDontBuy.reduce((s, t) => s + (t.realized_pnl_pct ?? 0), 0) / soldAsDontBuy.length;
      if (avgDontBuyPnl < -5) {
        // Sells are working well, make the sell trigger slightly more aggressive
        adjust("threshold_dont_buy", params.threshold_dont_buy + 2,
          `Dont-buy exits avg ${avgDontBuyPnl.toFixed(1)}% loss → tightening sell trigger to exit sooner`);
      }
    }

    // ── C. Adjust phase weights based on score-outcome correlation ──
    // Analyze which phase scores best predict winners vs losers
    // We use entry_score as a proxy; in future with per-phase scores in trade_history
    // we could do per-phase correlation analysis
    
    // If high-score entries are losing → fundamentals may be overweighted
    if (avgLoserScore > 40 && winRate < 0.55) {
      // High-confidence entries are still losing → reduce fundamental weight, boost technical
      adjust("weight_fundamental", params.weight_fundamental - 0.02,
        `High-score losers (avg score ${avgLoserScore.toFixed(0)}) → reducing fundamental weight`);
      adjust("weight_technical", params.weight_technical + 0.02,
        `Compensating by increasing technical weight for better momentum sensitivity`);
    }

    // If low-score entries are winning → we're being too conservative
    if (avgWinnerScore < 35 && winRate > 0.50) {
      adjust("weight_sentiment", params.weight_sentiment + 0.015,
        `Winners entering at low scores (avg ${avgWinnerScore.toFixed(0)}) → boosting sentiment weight`);
    }

    // ── D. Normalize weights to sum to 1.0 ──
    const wSum = params.weight_fundamental + params.weight_sentiment + params.weight_technical;
    if (Math.abs(wSum - 1.0) > 0.001) {
      params.weight_fundamental = Math.round((params.weight_fundamental / wSum) * 1000) / 1000;
      params.weight_sentiment   = Math.round((params.weight_sentiment / wSum) * 1000) / 1000;
      params.weight_technical   = Math.round((1 - params.weight_fundamental - params.weight_sentiment) * 1000) / 1000;
    }

    // ── E. Adjust P/E thresholds based on sector performance ──
    // If stocks with high P/E are winning, relax the P/E penalty thresholds
    const highPeWinners = winners.filter(t => t.entry_score > 50);
    if (highPeWinners.length > winners.length * 0.3) {
      adjust("pe_fair", params.pe_fair + 1,
        `${highPeWinners.length} high-score winners → relaxing P/E fair threshold`);
    }

    // ── F. Adjust momentum thresholds based on holding period success ──
    const shortHolds = trades.filter(t => (t.holding_days ?? 0) <= 3);
    const longHolds  = trades.filter(t => (t.holding_days ?? 0) > 10);
    if (shortHolds.length >= 3) {
      const shortWinRate = shortHolds.filter(t => (t.realized_pnl_pct ?? 0) > 0).length / shortHolds.length;
      if (shortWinRate < 0.4) {
        // Quick exits are mostly losses → we're buying into volatility, need stricter momentum
        adjust("tech_strong_bull", params.tech_strong_bull + 0.2,
          `Short holds (<3d) win rate ${(shortWinRate * 100).toFixed(0)}% → raising momentum threshold`);
      }
    }
    if (longHolds.length >= 3) {
      const longWinRate = longHolds.filter(t => (t.realized_pnl_pct ?? 0) > 0).length / longHolds.length;
      if (longWinRate > 0.65) {
        // Long holds are profitable → hold threshold is working, maybe can enter more
        adjust("threshold_hold", params.threshold_hold - 1,
          `Long holds (>10d) win rate ${(longWinRate * 100).toFixed(0)}% → lowering hold threshold to keep positions longer`);
      }
    }

    /* 5. Persist updated parameters */
    if (changes.length > 0) {
      for (const c of changes) {
        await sbFetch(`scoring_parameters?param_key=eq.${c.key}`, {
          method: "PATCH",
          body: JSON.stringify({
            param_value: c.new,
            optimization_round: newRound,
            updated_at: new Date().toISOString(),
          }),
        });
      }
    }

    /* 6. Log the optimization round */
    await sbFetch("optimization_log", {
      method: "POST",
      body: JSON.stringify({
        round_number: newRound,
        trades_analyzed: trades.length,
        win_rate: Math.round(winRate * 10000) / 100,
        avg_return_pct: Math.round(avgReturn * 100) / 100,
        avg_winner_pct: Math.round(avgWinner * 100) / 100,
        avg_loser_pct: Math.round(avgLoser * 100) / 100,
        parameter_changes: changes,
        notes: changes.length > 0
          ? `Round ${newRound}: ${changes.length} parameter(s) adjusted based on ${trades.length} trades (${(winRate * 100).toFixed(1)}% win rate)`
          : `Round ${newRound}: No adjustments needed — parameters performing well (${(winRate * 100).toFixed(1)}% win rate)`,
      }),
    });

    return j({
      success: true,
      round: newRound,
      trades_analyzed: trades.length,
      win_rate: `${(winRate * 100).toFixed(1)}%`,
      avg_return: `${avgReturn.toFixed(2)}%`,
      avg_winner: `${avgWinner.toFixed(2)}%`,
      avg_loser: `${avgLoser.toFixed(2)}%`,
      changes_made: changes.length,
      changes,
      recommendation_breakdown: recGroups,
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
