import type { Stock } from "@/lib/types";
import { generateAISignals, getAIVerdict } from "@/lib/ai-signals";
import { Check, X } from "lucide-react";

const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

interface AISignalsCardProps { stock: Stock }

export function AISignalsCard({ stock }: AISignalsCardProps) {
  const signals = generateAISignals(stock);
  const verdict = getAIVerdict(stock);
  const score   = stock.radarScores?.["medium-term"]?.radarScore ?? stock.score;

  if (signals.length === 0) return null;

  return (
    <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.25rem 0" }}>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.5rem" }}>
          AI Signals
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.05em", textTransform: "uppercase", color: WHITE, margin: 0 }}>
            {verdict.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED }}>Confidence:</span>
            <span style={{ background: CYAN, color: NAVY2, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.1em", padding: "0.15rem 0.5rem", borderRadius: "2px" }}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: BORDER_CLR, margin: "0 1.25rem" }} />

      {/* Signal rows */}
      <div style={{ padding: "0.875rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {signals.map((signal, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {signal.positive
              ? <Check size={14} color={GREEN} style={{ flexShrink: 0 }} />
              : <X size={14} color={RED} style={{ flexShrink: 0 }} />
            }
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE, lineHeight: 1.4 }}>
              {signal.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
