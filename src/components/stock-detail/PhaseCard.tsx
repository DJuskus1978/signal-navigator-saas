import { useState, useEffect } from "react";
import { ChevronDown, DollarSign, Landmark, BarChartHorizontal, Newspaper, TrendingUp, Search, Gauge, Activity, PieChart } from "lucide-react";
import type { SignalLevel } from "./types";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const GOLD       = "#FFB800";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

interface SubBlock {
  icon: string;
  title: string;
  items: { label: string; value: string; signal?: SignalLevel }[];
}

interface PhaseCardProps {
  initialExpanded?: boolean;
  icon: React.ReactNode;
  title: string;
  score: number;
  statusLabel: string;
  statusLevel: SignalLevel;
  interpretation: string;
  subBlocks: SubBlock[];
  detailRows: { label: string; value: string; hint?: string; signal?: SignalLevel }[];
  simple?: boolean;
}

function signalColor(level: SignalLevel): string {
  if (level === "bullish") return GREEN;
  if (level === "bearish") return RED;
  return GOLD;
}

function leftBorderColor(level: SignalLevel): string {
  if (level === "bullish") return GREEN;
  if (level === "bearish") return RED;
  return GOLD;
}

function valueColor(signal?: SignalLevel, isNA?: boolean): string {
  if (isNA) return MUTED;
  if (signal === "bullish") return GREEN;
  if (signal === "bearish") return RED;
  if (signal === "neutral") return GOLD;
  return WHITE;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  "dollar-sign":          DollarSign,
  "landmark":             Landmark,
  "bar-chart-horizontal": BarChartHorizontal,
  "newspaper":            Newspaper,
  "trending-up":          TrendingUp,
  "search":               Search,
  "gauge":                Gauge,
  "activity":             Activity,
  "pie-chart":            PieChart,
};

function SubBlockSection({ block }: { block: SubBlock }) {
  const IconComp = iconMap[block.icon];
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
        {IconComp && <IconComp size={12} color={MUTED} />}
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.63rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
          {block.title}
        </p>
      </div>
      <div>
        {block.items.map((item) => {
          const isNA = item.value === "N/A";
          return (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0", borderBottom: `1px solid ${BORDER_CLR}` }}>
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>{item.label}</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: valueColor(item.signal, isNA), fontStyle: isNA ? "italic" : "normal" }}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PhaseCard({ icon, title, score, statusLabel, statusLevel, interpretation, subBlocks, detailRows, simple = false, initialExpanded = false }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(!simple && initialExpanded);
  useEffect(() => { if (initialExpanded) setExpanded(!simple); }, [simple, initialExpanded]);

  const accentColor = leftBorderColor(statusLevel);
  const badgeColor  = signalColor(statusLevel);

  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${accentColor}`, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ color: accentColor, display: "flex", flexShrink: 0 }}>{icon}</span>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.08em", textTransform: "uppercase", color: WHITE, margin: 0, lineHeight: 1.2 }}>
              {title}
            </p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, margin: 0, marginTop: "0.15rem" }}>
              Score: {score}
            </p>
          </div>
        </div>
        {/* Sharp status badge — no rounded-full */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: badgeColor, padding: "0.2rem 0.65rem", flexShrink: 0 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: NAVY, flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: NAVY }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Interpretation */}
      <div style={{ padding: "0 1.25rem 1.25rem" }}>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, lineHeight: 1.65, margin: 0 }}>
          {interpretation}
        </p>
      </div>

      {/* Advanced expand toggle */}
      {!simple && (
        <>
          <div style={{ height: "1px", background: BORDER_CLR }} />
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ width: "100%", background: "none", border: "none", padding: "0.75rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: CYAN, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {expanded ? "Hide" : "See"} Key Metrics
            <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>

          {expanded && (
            <div style={{ borderTop: `1px solid ${BORDER_CLR}`, padding: "1.25rem" }}>
              {detailRows.map((row) => {
                const isNA = row.value === "N/A";
                return (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${BORDER_CLR}` }}>
                    <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>{row.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {row.hint && row.signal && (
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "0.15rem 0.45rem",
                          color: isNA ? MUTED : (row.signal === "bullish" ? NAVY : row.signal === "bearish" ? NAVY : NAVY),
                          background: isNA ? "rgba(107,122,153,0.2)" : (row.signal === "bullish" ? GREEN : row.signal === "bearish" ? RED : GOLD),
                          opacity: isNA ? 0.5 : 1,
                        }}>
                          {row.hint}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: valueColor(row.signal, isNA), fontStyle: isNA ? "italic" : "normal" }}>
                        {row.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Colored bottom accent bar */}
      <div style={{ height: "3px", background: accentColor }} />
    </div>
  );
}
