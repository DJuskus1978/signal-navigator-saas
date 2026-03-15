import { useState } from "react";
import { Stock, Recommendation } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { ExpandedStockIndicators } from "./ExpandedStockIndicators";
import { useLiveStockDetail } from "@/hooks/use-live-stocks";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const GOLD       = "#FFB800";
const ORANGE     = "#F97316";
const BORDER_CLR = "#1E3A7B";
const WHITE      = "#FFFFFF";

// ── Signal helpers ─────────────────────────────────────────────────────────────
function signalColor(rec: Recommendation): string {
  if (rec === "strong-buy" || rec === "buy") return GREEN;
  if (rec === "hold")                         return GOLD;
  if (rec === "dont-buy")                     return ORANGE;
  return RED;
}

function signalLabel(rec: Recommendation): string {
  if (rec === "strong-buy") return "STRONG BUY";
  if (rec === "buy")        return "BUY";
  if (rec === "hold")       return "HOLD";
  if (rec === "dont-buy")   return "AVOID";
  return "SELL";
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface StockCardProps {
  stock: Stock;
  blurred?: boolean;
  defaultExpanded?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StockCard({ stock, blurred = false, defaultExpanded = false }: StockCardProps) {
  const navigate  = useNavigate();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hovered,  setHovered]  = useState(false);

  const { data: detailStock } = useLiveStockDetail(stock.ticker);
  const displayStock = detailStock || stock;

  const isPositive   = displayStock.change >= 0;
  const isCrypto     = displayStock.assetType === "crypto";
  const ticker       = isCrypto ? displayStock.ticker.replace("USD", "") : displayStock.ticker;
  const signal       = displayStock.radarScores?.["medium-term"]?.signal ?? displayStock.recommendation;
  const radarScore   = displayStock.radarScores?.["medium-term"]?.radarScore ?? displayStock.score;
  const confidence   = displayStock.radarScores?.["medium-term"]?.confidence;
  const accentColor  = signalColor(signal);

  return (
    <div
      style={{
        background:   NAVY2,
        border:       `1px solid ${hovered ? accentColor : BORDER_CLR}`,
        borderLeft:   `5px solid ${accentColor}`,
        overflow:     "hidden",
        transition:   "border-color 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      {/* ── Main row — click navigates to full detail ── */}
      <div
        onClick={() => !blurred && navigate(`/stock/${stock.ticker}`)}
        style={{ padding: "1rem", cursor: blurred ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}
      >

        {/* Ticker + name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.3rem", textTransform: "uppercase", color: WHITE, margin: 0, lineHeight: 1.1, letterSpacing: "0.02em" }}>
            {ticker}
          </p>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: "#A0ABBE", margin: 0, marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
            {displayStock.name}
          </p>
        </div>

        {/* Price + change */}
        <div style={{ textAlign: "right", filter: blurred ? "blur(4px)" : "none" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: WHITE, margin: 0, lineHeight: 1.1 }}>
            ${displayStock.price.toFixed(2)}
          </p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.8rem", color: isPositive ? GREEN : RED, margin: 0, marginTop: "0.1rem" }}>
            {isPositive ? "+" : ""}{displayStock.change.toFixed(2)} ({isPositive ? "+" : ""}{displayStock.changePercent.toFixed(2)}%)
          </p>
        </div>

        {/* Signal badge + RadarScore */}
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem", flexShrink: 0, filter: blurred ? "blur(4px)" : "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Signal badge */}
          <span style={{ background: accentColor, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.2rem 0.6rem", display: "inline-block" }}>
            {signalLabel(signal)}
          </span>

          {/* RadarScore */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: CYAN, lineHeight: 1 }}>
              AI
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.4rem", color: CYAN, lineHeight: 1 }}>
              {radarScore}
            </span>
          </div>

          {/* Confidence */}
          {confidence && (
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.65rem", color: "#A0ABBE", lineHeight: 1 }}>
              {confidence}
            </span>
          )}
        </div>
      </div>

      {/* ── View Radars button ── */}
      {!blurred && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(0,212,255,0.06)`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          style={{ width: "100%", padding: "0.625rem 1rem", background: "transparent", border: "none", borderTop: `1px solid ${BORDER_CLR}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background 0.15s ease" }}
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: CYAN }}>
            View Radars
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: CYAN }}>
            {expanded ? <ChevronUp size={13} /> : <ArrowRight size={13} />}
          </div>
        </button>
      )}

      {/* ── Expanded indicators ── */}
      {expanded && !blurred && (
        <div style={{ borderTop: `1px solid ${BORDER_CLR}` }}>
          <div style={{ padding: "0.875rem 1rem 0.5rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
              RadarScore™ AI Signal
            </p>
          </div>
          <ExpandedStockIndicators stock={stock} />
        </div>
      )}

    </div>
  );
}
