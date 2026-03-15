import type { Stock, InvestorProfile } from "@/lib/types";
import { generateGuidance } from "@/lib/ai-decision-guidance";
import { Compass, ArrowRight, ShieldAlert } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const GOLD       = "#FFB800";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

interface Props { stock: Stock; isCrypto: boolean; profile: InvestorProfile }

export function AIDecisionGuidance({ stock, isCrypto: _isCrypto, profile }: Props) {
  const radar = stock.radarScores?.[profile];

  if (!radar) {
    return (
      <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <Compass size={16} color={CYAN} />
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
            StocksRadars Decision Guidance
          </p>
        </div>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, lineHeight: 1.6, margin: 0 }}>
          Guidance is generated once RadarScore™ data has loaded for this stock.
        </p>
      </div>
    );
  }

  const guidance = generateGuidance(
    radar.signal,
    radar.profile,
    radar.normalized,
    radar.confidence,
    radar.dominantDimension,
  );

  const headlineColor =
    radar.confidence === "Strong"   ? GREEN :
    radar.confidence === "Moderate" ? GOLD  :
                                      MUTED;

  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>

      {/* Header */}
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: `1px solid ${BORDER_CLR}`, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Compass size={15} color={CYAN} style={{ flexShrink: 0 }} />
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, margin: 0 }}>
          StocksRadars Decision Guidance
        </p>
      </div>

      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Headline */}
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.03em", color: headlineColor, margin: 0, lineHeight: 1.3 }}>
          {guidance.headline}
        </p>

        {/* Rationale */}
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, lineHeight: 1.65, margin: 0 }}>
          {guidance.rationale}
        </p>

        {/* Action box */}
        <div style={{ background: NAVY, border: `1px solid ${BORDER_CLR}`, borderLeft: `3px solid ${CYAN}`, padding: "0.875rem 1rem", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
          <ArrowRight size={14} color={CYAN} style={{ flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE, lineHeight: 1.6, margin: 0 }}>
            {guidance.action}
          </p>
        </div>

        {/* Caveat */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <ShieldAlert size={12} color={MUTED} style={{ flexShrink: 0, marginTop: "2px", opacity: 0.6 }} />
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: MUTED, lineHeight: 1.6, margin: 0 }}>
            {guidance.caveat}
          </p>
        </div>

        {/* Disclaimer */}
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.68rem", color: MUTED, lineHeight: 1.5, margin: 0, paddingTop: "0.75rem", borderTop: `1px solid ${BORDER_CLR}`, opacity: 0.6 }}>
          This information is not a personal recommendation or investment advice. Conduct your own research and consider your financial situation before making any investment decisions.
        </p>
      </div>
    </div>
  );
}
