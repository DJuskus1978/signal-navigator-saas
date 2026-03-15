import type { AnalystData, AnalystConsensus } from "@/lib/types";
import { Users } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const GOLD       = "#FFB800";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

interface Props { analystData: AnalystData; currentPrice: number; ticker?: string }

const CONSENSUS_POSITIONS: Record<AnalystConsensus, number> = {
  "Strong Sell": -90, "Sell": -45, "Hold": 0, "Buy": 45, "Strong Buy": 90,
};

function consensusColor(c: AnalystConsensus): string {
  if (c.includes("Buy"))  return GREEN;
  if (c.includes("Sell")) return RED;
  return GOLD;
}

function ConsensusGauge({ consensus }: { consensus: AnalystConsensus }) {
  const angle = CONSENSUS_POSITIONS[consensus] ?? 0;
  const color = consensusColor(consensus);
  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${color}`, padding: "1.5rem" }}>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "1rem" }}>
        Analyst Consensus
      </p>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: "192px", height: "112px" }}>
          <svg viewBox="0 0 200 110" style={{ width: "100%", height: "100%" }}>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={BORDER_CLR} strokeWidth="16" strokeLinecap="round" />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={RED}  />
                <stop offset="25%"  stopColor="#FF8C42" />
                <stop offset="50%"  stopColor={GOLD} />
                <stop offset="75%"  stopColor="#00A878" />
                <stop offset="100%" stopColor={GREEN} />
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="16" strokeLinecap="round" />
            <g transform={`rotate(${angle}, 100, 100)`}>
              <line x1="100" y1="100" x2="100" y2="30" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill={WHITE} />
            </g>
          </svg>
          <span style={{ position: "absolute", left: "-4px", bottom: "-18px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", color: RED, textTransform: "uppercase", whiteSpace: "nowrap" }}>Strong Sell</span>
          <span style={{ position: "absolute", left: "6px", top: "-2px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Sell</span>
          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "-14px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Hold</span>
          <span style={{ position: "absolute", right: "6px", top: "-2px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Buy</span>
          <span style={{ position: "absolute", right: "-4px", bottom: "-18px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", color: GREEN, textTransform: "uppercase", whiteSpace: "nowrap" }}>Strong Buy</span>
        </div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2rem", color: color, marginTop: "1.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {consensus}
        </p>
      </div>
    </div>
  );
}

function PriceTargetCard({ priceTarget, currentPrice }: { priceTarget: NonNullable<AnalystData["priceTarget"]>; currentPrice: number }) {
  const { targetConsensus: consensus, targetHigh: high, targetLow: low, totalAnalysts } = priceTarget;
  const upsidePct   = currentPrice > 0 ? ((consensus - currentPrice) / currentPrice * 100) : 0;
  const highPct     = currentPrice > 0 ? ((high - currentPrice) / currentPrice * 100) : 0;
  const lowPct      = currentPrice > 0 ? ((low - currentPrice) / currentPrice * 100) : 0;
  const range       = high - low;
  const curPos      = range > 0 ? Math.max(0, Math.min(100, ((currentPrice - low) / range) * 100)) : 50;
  const avgPos      = range > 0 ? Math.max(0, Math.min(100, ((consensus - low) / range) * 100)) : 50;

  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.25rem" }}>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>
        12-Month Price Target
      </p>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2rem", color: WHITE, lineHeight: 1, marginBottom: "0.25rem" }}>
        ${consensus.toFixed(2)}
      </p>
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: MUTED, marginBottom: "1.25rem" }}>
        Average target · {totalAnalysts} analyst{totalAnalysts !== 1 ? "s" : ""}
      </p>

      {/* Range bar */}
      <div style={{ position: "relative", height: "48px", marginBottom: "1rem" }}>
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, right: 0, height: "6px", background: BORDER_CLR }}>
          <div style={{ position: "absolute", height: "100%", background: "rgba(0,212,255,0.2)", left: `${Math.min(curPos, avgPos)}%`, width: `${Math.abs(avgPos - curPos)}%` }} />
        </div>
        {/* Current price dot */}
        <div style={{ position: "absolute", top: "50%", left: `${curPos}%`, transform: "translate(-50%, -50%)" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: MUTED, border: `2px solid ${NAVY2}` }} />
          <div style={{ position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", background: NAVY, border: `1px solid ${BORDER_CLR}`, padding: "1px 5px" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.62rem", fontWeight: 700, color: WHITE }}>${currentPrice.toFixed(2)}</span>
          </div>
        </div>
        {/* Avg dot */}
        <div style={{ position: "absolute", top: "50%", left: `${avgPos}%`, transform: "translate(-50%, -50%)" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: CYAN, border: `2px solid ${NAVY2}` }} />
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {[
          { label: "Low", price: low, pct: lowPct },
          { label: "Avg", price: consensus, pct: upsidePct },
          ...(Math.abs(high - consensus) > 0.01 ? [{ label: "High", price: high, pct: highPct }] : []),
        ].map((item) => (
          <div key={item.label}>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, margin: 0 }}>{item.label} · ${item.price.toFixed(2)}</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: item.pct >= 0 ? GREEN : RED, margin: 0 }}>
              {item.pct >= 0 ? "+" : ""}{item.pct.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingsDistribution({ distribution }: { distribution: NonNullable<AnalystData["ratingsDistribution"]> }) {
  const total = distribution.totalAnalysts || 1;
  const rows = [
    { label: "Strong Buy",  count: distribution.strongBuy,  color: GREEN },
    { label: "Buy",         count: distribution.buy,         color: "#00A878" },
    { label: "Hold",        count: distribution.hold,        color: GOLD },
    { label: "Sell",        count: distribution.sell,        color: "#FF8C42" },
    { label: "Strong Sell", count: distribution.strongSell,  color: RED },
  ];

  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.25rem" }}>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.75rem" }}>
        Ratings Distribution · {total} analyst{total !== 1 ? "s" : ""}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {rows.map((row) => {
          const pct = Math.round((row.count / total) * 100);
          return (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, height: "8px", background: BORDER_CLR, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: row.color, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", color: row.color, width: "96px", textAlign: "right" }}>
                {pct}% {row.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AnalystRatingsSection({ analystData, currentPrice, ticker }: Props) {
  const hasAnyData = analystData.consensus || analystData.priceTarget || analystData.ratingsDistribution;
  if (!hasAnyData) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <Users size={15} color={CYAN} />
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.12em", textTransform: "uppercase", color: WHITE, margin: 0 }}>
          External Analyst Ratings{ticker && <span style={{ color: CYAN }}> · {ticker}</span>}
        </h2>
      </div>

      {analystData.consensus && <ConsensusGauge consensus={analystData.consensus} />}
      {analystData.priceTarget && <PriceTargetCard priceTarget={analystData.priceTarget} currentPrice={currentPrice} />}
      {analystData.ratingsDistribution && <RatingsDistribution distribution={analystData.ratingsDistribution} />}

      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.68rem", color: MUTED, textAlign: "center", lineHeight: 1.5, opacity: 0.7 }}>
        Data provided by Alpha Vantage and should not be considered investment advice. Analyst projections are not guarantees.
      </p>
    </div>
  );
}
