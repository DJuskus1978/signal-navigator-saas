import type { Stock } from "@/lib/types";
import type { SignalLevel } from "./types";
import { getPhaseStatus } from "./types";

interface SubBlock {
  icon: string;
  title: string;
  items: { label: string; value: string; signal?: SignalLevel }[];
}

interface DetailRow {
  label: string;
  value: string;
  hint?: string;
  signal?: SignalLevel;
}

interface PhaseData {
  statusLabel: string;
  statusLevel: SignalLevel;
  interpretation: string;
  subBlocks: SubBlock[];
  detailRows: DetailRow[];
}

// ─── Fundamental Phase ───────────────────────────────────────────────────────

export function getFundamentalPhase(stock: Stock): PhaseData {
  const f = stock.fundamental;
  const score = stock.phaseScores.fundamental;
  const { label, level } = getPhaseStatus(score);
  const isCrypto = stock.assetType === "crypto";

  if (isCrypto && stock.cryptoMarket) {
    const cm = stock.cryptoMarket;
    return {
      statusLabel: label === "Strong" ? "Strong Structure" : label === "Stable" ? "Stable" : "Weakening",
      statusLevel: level,
      interpretation: score >= 15
        ? `${stock.name} shows robust market structure with strong positioning and healthy activity metrics.`
        : score >= 0
          ? `Market structure for ${stock.name} is stable with no major red flags detected.`
          : `${stock.name} shows signs of structural weakness — monitor closely for further deterioration.`,
      subBlocks: [
        {
          icon: "📊", title: "Market Position",
          items: [
            { label: "Market Cap Rank", value: `#${cm.marketCapRank}`, signal: cm.marketCapRank <= 5 ? "bullish" : cm.marketCapRank <= 15 ? "neutral" : "bearish" },
            { label: "Supply Circulating", value: `${cm.circulatingSupplyPercent.toFixed(0)}%`, signal: cm.circulatingSupplyPercent > 80 ? "bullish" : "neutral" },
          ],
        },
        {
          icon: "📈", title: "Price Trends",
          items: [
            { label: "24h", value: `${cm.priceChange24h > 0 ? "+" : ""}${cm.priceChange24h.toFixed(1)}%`, signal: cm.priceChange24h > 1 ? "bullish" : cm.priceChange24h < -1 ? "bearish" : "neutral" },
            { label: "7d", value: `${cm.priceChange7d > 0 ? "+" : ""}${cm.priceChange7d.toFixed(1)}%`, signal: cm.priceChange7d > 3 ? "bullish" : cm.priceChange7d < -3 ? "bearish" : "neutral" },
            { label: "30d", value: `${cm.priceChange30d > 0 ? "+" : ""}${cm.priceChange30d.toFixed(1)}%`, signal: cm.priceChange30d > 5 ? "bullish" : cm.priceChange30d < -5 ? "bearish" : "neutral" },
          ],
        },
        {
          icon: "⚡", title: "Activity",
          items: [
            { label: "Vol/MCap", value: cm.volumeToMarketCap.toFixed(3), signal: cm.volumeToMarketCap > 0.1 ? "bullish" : cm.volumeToMarketCap < 0.02 ? "bearish" : "neutral" },
            { label: "30d Volatility", value: `${cm.volatility30d.toFixed(0)}%`, signal: cm.volatility30d > 80 ? "bearish" : "neutral" },
          ],
        },
      ],
      detailRows: [
        { label: "Market Cap Rank", value: `#${cm.marketCapRank}`, hint: cm.marketCapRank <= 5 ? "Top tier" : "Mid-cap", signal: cm.marketCapRank <= 5 ? "bullish" : "neutral" },
        { label: "24h Change", value: `${cm.priceChange24h > 0 ? "+" : ""}${cm.priceChange24h.toFixed(2)}%`, hint: cm.priceChange24h > 3 ? "Strong up" : cm.priceChange24h < -3 ? "Sharp drop" : "Moderate", signal: cm.priceChange24h > 1 ? "bullish" : cm.priceChange24h < -1 ? "bearish" : "neutral" },
        { label: "7d Change", value: `${cm.priceChange7d > 0 ? "+" : ""}${cm.priceChange7d.toFixed(2)}%`, hint: cm.priceChange7d > 5 ? "Strong trend" : "Moderate", signal: cm.priceChange7d > 3 ? "bullish" : cm.priceChange7d < -3 ? "bearish" : "neutral" },
        { label: "30d Change", value: `${cm.priceChange30d > 0 ? "+" : ""}${cm.priceChange30d.toFixed(2)}%`, hint: cm.priceChange30d > 10 ? "Strong rally" : "Moderate", signal: cm.priceChange30d > 5 ? "bullish" : cm.priceChange30d < -5 ? "bearish" : "neutral" },
        { label: "Vol/MCap Ratio", value: cm.volumeToMarketCap.toFixed(3), hint: cm.volumeToMarketCap > 0.1 ? "High activity" : "Normal", signal: cm.volumeToMarketCap > 0.1 ? "bullish" : "neutral" },
        { label: "Circulating Supply", value: `${cm.circulatingSupplyPercent.toFixed(0)}%`, hint: cm.circulatingSupplyPercent > 80 ? "Mostly circulating" : "Dilution risk", signal: cm.circulatingSupplyPercent > 80 ? "bullish" : "bearish" },
        { label: "30d Volatility", value: `${cm.volatility30d.toFixed(0)}%`, hint: cm.volatility30d > 80 ? "Very high" : "Moderate", signal: cm.volatility30d > 80 ? "bearish" : "neutral" },
      ],
    };
  }

  return {
    statusLabel: label === "Strong" ? "Strong Fundamentals" : label === "Stable" ? "Stable" : "Weakening",
    statusLevel: level,
    interpretation: score >= 15
      ? `The company shows stable revenue growth, strong margins, and manageable debt levels.`
      : score >= 0
        ? `Fundamentals are adequate with no major concerns, though growth metrics are mixed.`
        : `Fundamental indicators show signs of stress — declining growth or elevated leverage.`,
    subBlocks: [
      {
        icon: "💰", title: "Profitability",
        items: [
          { label: "Revenue Growth", value: `${f.revenueGrowth > 0 ? "+" : ""}${f.revenueGrowth.toFixed(1)}%`, signal: f.revenueGrowth > 10 ? "bullish" : f.revenueGrowth > 0 ? "neutral" : "bearish" },
          { label: "Earnings Growth", value: `${f.earningsGrowth > 0 ? "+" : ""}${f.earningsGrowth.toFixed(1)}%`, signal: f.earningsGrowth > 15 ? "bullish" : f.earningsGrowth > 0 ? "neutral" : "bearish" },
          { label: "Profit Margin", value: `${f.profitMargin.toFixed(1)}%`, signal: f.profitMargin > 20 ? "bullish" : f.profitMargin > 10 ? "neutral" : "bearish" },
        ],
      },
      {
        icon: "🏦", title: "Financial Health",
        items: [
          { label: "Debt/Equity", value: f.debtToEquity.toFixed(2), signal: f.debtToEquity < 0.5 ? "bullish" : f.debtToEquity > 2 ? "bearish" : "neutral" },
          { label: "Return on Equity", value: `${f.returnOnEquity.toFixed(1)}%`, signal: f.returnOnEquity > 20 ? "bullish" : f.returnOnEquity > 10 ? "neutral" : "bearish" },
          { label: "FCF Yield", value: `${f.freeCashFlowYield.toFixed(1)}%`, signal: f.freeCashFlowYield > 5 ? "bullish" : f.freeCashFlowYield > 2 ? "neutral" : "bearish" },
        ],
      },
      {
        icon: "📊", title: "Valuation",
        items: [
          { label: "P/E Ratio", value: f.peRatio.toFixed(1), signal: f.peRatio < 15 ? "bullish" : f.peRatio > 35 ? "bearish" : "neutral" },
          { label: "Forward P/E", value: f.forwardPE.toFixed(1), signal: f.forwardPE < f.peRatio ? "bullish" : "bearish" },
        ],
      },
    ],
    detailRows: [
      { label: "P/E Ratio", value: f.peRatio.toFixed(1), hint: f.peRatio < 15 ? "Undervalued" : f.peRatio > 35 ? "Overvalued" : "Fair value", signal: f.peRatio < 15 ? "bullish" : f.peRatio > 35 ? "bearish" : "neutral" },
      { label: "Forward P/E", value: f.forwardPE.toFixed(1), hint: f.forwardPE < f.peRatio ? "Growth expected" : "Slowing growth", signal: f.forwardPE < f.peRatio ? "bullish" : "bearish" },
      { label: "Earnings Growth", value: `${f.earningsGrowth.toFixed(1)}%`, hint: f.earningsGrowth > 15 ? "Strong" : f.earningsGrowth > 0 ? "Positive" : "Declining", signal: f.earningsGrowth > 15 ? "bullish" : f.earningsGrowth > 0 ? "neutral" : "bearish" },
      { label: "Revenue Growth", value: `${f.revenueGrowth.toFixed(1)}%`, hint: f.revenueGrowth > 15 ? "Strong" : f.revenueGrowth > 0 ? "Positive" : "Declining", signal: f.revenueGrowth > 15 ? "bullish" : f.revenueGrowth > 0 ? "neutral" : "bearish" },
      { label: "Profit Margin", value: `${f.profitMargin.toFixed(1)}%`, hint: f.profitMargin > 20 ? "Excellent" : f.profitMargin > 10 ? "Good" : "Low", signal: f.profitMargin > 20 ? "bullish" : f.profitMargin > 10 ? "neutral" : "bearish" },
      { label: "Debt/Equity", value: f.debtToEquity.toFixed(2), hint: f.debtToEquity < 0.5 ? "Low leverage" : f.debtToEquity > 2 ? "High leverage" : "Moderate", signal: f.debtToEquity < 0.5 ? "bullish" : f.debtToEquity > 2 ? "bearish" : "neutral" },
      { label: "Return on Equity", value: `${f.returnOnEquity.toFixed(1)}%`, hint: f.returnOnEquity > 20 ? "Excellent" : f.returnOnEquity > 10 ? "Good" : "Below avg", signal: f.returnOnEquity > 20 ? "bullish" : f.returnOnEquity > 10 ? "neutral" : "bearish" },
      { label: "FCF Yield", value: `${f.freeCashFlowYield.toFixed(1)}%`, hint: f.freeCashFlowYield > 5 ? "Attractive" : f.freeCashFlowYield > 2 ? "Fair" : "Low", signal: f.freeCashFlowYield > 5 ? "bullish" : f.freeCashFlowYield > 2 ? "neutral" : "bearish" },
    ],
  };
}

// ─── Sentiment Phase ────────────────────────────────────────────────────────

export function getSentimentPhase(stock: Stock): PhaseData {
  const s = stock.sentiment;
  const score = stock.phaseScores.sentiment;
  const { label, level } = getPhaseStatus(score);

  const newsSignal: SignalLevel = s.newsScore > 30 ? "bullish" : s.newsScore < -30 ? "bearish" : "neutral";
  const socialSignal: SignalLevel = s.socialScore > 20 ? "bullish" : s.socialScore < -20 ? "bearish" : "neutral";
  const analystSignal: SignalLevel = s.analystRating >= 4 ? "bullish" : s.analystRating >= 3 ? "neutral" : "bearish";

  return {
    statusLabel: label === "Strong" ? "Positive Sentiment" : label === "Stable" ? "Mixed" : "Negative Tone",
    statusLevel: level,
    interpretation: score >= 15
      ? `Recent news flow is positive, with analysts maintaining constructive outlooks.`
      : score >= 0
        ? `Recent news flow is neutral, with no major sentiment shifts detected.`
        : `Sentiment indicators are turning negative — news tone and analyst revisions warrant attention.`,
    subBlocks: [
      {
        icon: "📰", title: "Headlines Tone",
        items: [
          { label: "News Sentiment", value: newsSignal === "bullish" ? "Positive" : newsSignal === "bearish" ? "Negative" : "Neutral", signal: newsSignal },
          { label: "Articles Analyzed", value: String(s.newsCount) },
        ],
      },
      {
        icon: "📈", title: "Market Reaction",
        items: [
          { label: "Social Buzz", value: socialSignal === "bullish" ? "Bullish buzz" : socialSignal === "bearish" ? "Bearish chatter" : "Neutral", signal: socialSignal },
          { label: "Insider Activity", value: s.insiderActivity > 0 ? "Net Buying" : s.insiderActivity < -0.2 ? "Net Selling" : "Neutral", signal: s.insiderActivity > 0 ? "bullish" : s.insiderActivity < -0.2 ? "bearish" : "neutral" },
        ],
      },
      {
        icon: "🔎", title: "Analyst Direction",
        items: [
          { label: "Consensus", value: s.analystRating >= 4 ? "Buy consensus" : s.analystRating >= 3 ? "Hold consensus" : "Sell consensus", signal: analystSignal },
          { label: "Rating", value: `${s.analystRating.toFixed(1)} / 5.0`, signal: analystSignal },
        ],
      },
    ],
    detailRows: [
      { label: "News Sentiment", value: s.newsScore > 0 ? `+${s.newsScore.toFixed(0)}` : s.newsScore.toFixed(0), hint: newsSignal === "bullish" ? "Positive" : newsSignal === "bearish" ? "Negative" : "Mixed", signal: newsSignal },
      { label: "Articles Analyzed", value: String(s.newsCount) },
      { label: "Social Sentiment", value: s.socialScore > 0 ? `+${s.socialScore.toFixed(0)}` : s.socialScore.toFixed(0), hint: socialSignal === "bullish" ? "Bullish buzz" : socialSignal === "bearish" ? "Bearish chatter" : "Neutral", signal: socialSignal },
      { label: "Analyst Rating", value: `${s.analystRating.toFixed(1)} / 5.0`, hint: analystSignal === "bullish" ? "Buy consensus" : analystSignal === "neutral" ? "Hold consensus" : "Sell consensus", signal: analystSignal },
      { label: "Insider Activity", value: s.insiderActivity > 0 ? "Net Buying" : s.insiderActivity < -0.2 ? "Net Selling" : "Neutral", hint: `Score: ${s.insiderActivity.toFixed(2)}`, signal: s.insiderActivity > 0 ? "bullish" : s.insiderActivity < -0.2 ? "bearish" : "neutral" },
    ],
  };
}

// ─── Technical Phase ────────────────────────────────────────────────────────

export function getTechnicalPhase(stock: Stock): PhaseData {
  const t = stock.technical;
  const score = stock.phaseScores.technical;
  const { label, level } = getPhaseStatus(score);

  const trendShort: SignalLevel = t.ema20 > t.sma50 ? "bullish" : "bearish";
  const trendMid: SignalLevel = t.sma50 > t.sma200 ? "bullish" : "bearish";

  return {
    statusLabel: label === "Strong" ? "Strengthening" : label === "Stable" ? "Neutral" : "Weakening",
    statusLevel: level,
    interpretation: score >= 15
      ? `Technical momentum is strong, with key moving averages and oscillators aligned bullishly.`
      : score >= 0
        ? `Short-term momentum is soft, while the long-term trend remains intact.`
        : `Technical indicators point to weakening momentum — key support levels should be monitored.`,
    subBlocks: [
      {
        icon: "📈", title: "Trend",
        items: [
          { label: "Short-term (EMA 20)", value: trendShort === "bullish" ? "Upward" : "Downward", signal: trendShort },
          { label: "Medium-term (SMA 50)", value: trendMid === "bullish" ? "Above 200-day" : "Below 200-day", signal: trendMid },
          { label: "Long-term (SMA 200)", value: t.sma200 < t.sma50 ? "Golden Cross" : "Death Cross", signal: t.sma200 < t.sma50 ? "bullish" : "bearish" },
        ],
      },
      {
        icon: "⚡", title: "Momentum",
        items: [
          { label: "RSI (14)", value: t.rsi < 30 ? "Oversold" : t.rsi > 70 ? "Overbought" : `${t.rsi.toFixed(0)} — Neutral`, signal: t.rsi < 30 ? "bullish" : t.rsi > 70 ? "bearish" : "neutral" },
          { label: "MACD", value: t.macd > t.macdSignal ? "Bullish crossover" : "Bearish crossover", signal: t.macd > t.macdSignal ? "bullish" : "bearish" },
        ],
      },
      {
        icon: "📊", title: "Activity",
        items: [
          { label: "Volume", value: t.volume > t.avgVolume ? "Above average" : "Below average", signal: t.volume > t.avgVolume ? "bullish" : "neutral" },
          { label: "Volatility (ATR)", value: t.atr > stock.price * 0.04 ? "High" : "Normal", signal: t.atr > stock.price * 0.04 ? "bearish" : "neutral" },
        ],
      },
    ],
    detailRows: [
      { label: "RSI (14)", value: t.rsi.toFixed(1), hint: t.rsi < 30 ? "Oversold" : t.rsi > 70 ? "Overbought" : "Neutral", signal: t.rsi < 30 ? "bullish" : t.rsi > 70 ? "bearish" : "neutral" },
      { label: "MACD", value: t.macd.toFixed(2), hint: t.macd > t.macdSignal ? "Bullish crossover" : "Bearish crossover", signal: t.macd > t.macdSignal ? "bullish" : "bearish" },
      { label: "MACD Signal", value: t.macdSignal.toFixed(2), hint: t.macdSignal > 0 ? "Bullish" : t.macdSignal < 0 ? "Bearish" : "Neutral", signal: t.macdSignal > 0 ? "bullish" : t.macdSignal < 0 ? "bearish" : "neutral" },
      { label: "EMA 20", value: `$${t.ema20.toFixed(2)}`, hint: t.ema20 > t.sma50 ? "Short-term bullish" : "Short-term bearish", signal: t.ema20 > t.sma50 ? "bullish" : "bearish" },
      { label: "SMA 50", value: `$${t.sma50.toFixed(2)}`, hint: t.sma50 > t.sma200 ? "Above 200-day" : "Below 200-day", signal: t.sma50 > t.sma200 ? "bullish" : "bearish" },
      { label: "SMA 200", value: `$${t.sma200.toFixed(2)}`, hint: t.sma200 < t.sma50 ? "Below 50-day" : "Above 50-day", signal: t.sma200 < t.sma50 ? "bullish" : "bearish" },
      { label: "Bollinger Bands", value: `$${t.bollingerLower.toFixed(0)} – $${t.bollingerUpper.toFixed(0)}`, hint: stock.price < t.bollingerLower ? "Near lower band" : stock.price > t.bollingerUpper ? "Near upper band" : "Within range", signal: stock.price < t.bollingerLower ? "bullish" : stock.price > t.bollingerUpper ? "bearish" : "neutral" },
      { label: "ATR (Volatility)", value: `$${t.atr.toFixed(2)}`, hint: t.atr > stock.price * 0.04 ? "High volatility" : "Normal", signal: t.atr > stock.price * 0.04 ? "bearish" : "neutral" },
      { label: "Volume", value: `${(t.volume / 1_000_000).toFixed(1)}M`, hint: t.volume > t.avgVolume ? "Above average" : "Below average", signal: t.volume > t.avgVolume ? "bullish" : "neutral" },
    ],
  };
}
