import { useState } from "react";
import type { Stock, InvestorProfile, Recommendation } from "@/lib/types";
import { PROFILE_WEIGHTS, CRYPTO_PROFILE_WEIGHTS } from "@/lib/types";
import { getConsensusSummary } from "@/lib/signal-consensus";
import { BarChart3, Newspaper, TrendingUp, Lock, ChevronDown, ChevronUp } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const NAVY   = "#0A0F2E";
const NAVY2  = "#0F1A3E";
const CYAN   = "#00D4FF";
const GREEN  = "#00C896";
const RED    = "#FF4757";
const GOLD   = "#FFB800";
const ORANGE = "#FF8C42";
const MUTED  = "#6B7A99";
const BORDER = "#E0E8F0";

// ─── Signal config ────────────────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<Recommendation, { label: string; color: string }> = {
  "strong-buy": { label: "STRONG BUY", color: GREEN  },
  "buy":        { label: "BUY",        color: GREEN  },
  "hold":       { label: "HOLD",       color: GOLD   },
  "dont-buy":   { label: "AVOID",      color: ORANGE },
  "sell":       { label: "SELL",       color: RED    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pillarColor(score: number): string {
  if (score >= 65) return GREEN;
  if (score >= 45) return GOLD;
  return RED;
}

function pillarStatus(score: number): string {
  if (score >= 70) return "STRONG";
  if (score >= 55) return "POSITIVE";
  if (score >= 45) return "NEUTRAL";
  if (score >= 35) return "WEAK";
  return "NEGATIVE";
}

// ─── Profile metadata ─────────────────────────────────────────────────────────

const PROFILES: InvestorProfile[] = ["short-term", "medium-term", "long-term"];

const PROFILE_META: Record<InvestorProfile, { label: string; period: string }> = {
  "short-term":  { label: "SHORT TERM",  period: "1d – 3mo" },
  "medium-term": { label: "MEDIUM TERM", period: "3 – 6mo"  },
  "long-term":   { label: "LONG TERM",   period: "6mo+"     },
};

// ─── Shared style factories ───────────────────────────────────────────────────

function whiteCard(leftColor: string = CYAN): React.CSSProperties {
  return {
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    borderLeft: `5px solid ${leftColor}`,
    boxShadow: "0 4px 20px rgba(10,15,46,0.08)",
  };
}

const darkCard: React.CSSProperties = {
  background: NAVY2,
  border: "1px solid rgba(0,212,255,0.15)",
  borderLeft: `5px solid ${CYAN}`,
  boxShadow: "0 4px 20px rgba(10,15,46,0.30)",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: CYAN,
  marginBottom: "0.625rem",
};

// ─── Small primitives ─────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <p style={sectionLabel}>{text}</p>;
}

function CyanRule() {
  return (
    <div style={{ width: "2.2rem", height: "3px", background: CYAN, marginBottom: "0.875rem" }} />
  );
}

function SignalBadge({ signal }: { signal: Recommendation }) {
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <span style={{
      display: "inline-block",
      background: cfg.color,
      color: NAVY,
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 800,
      fontSize: "0.95rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      padding: "0.3rem 1rem",
      borderRadius: "3px",
    }}>
      {cfg.label}
    </span>
  );
}

function MiniSignalBadge({ signal }: { signal: Recommendation }) {
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <span style={{
      display: "inline-block",
      background: cfg.color,
      color: NAVY,
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 800,
      fontSize: "0.58rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "0.1rem 0.45rem",
      borderRadius: "2px",
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  stock: Stock;
  isCrypto: boolean;
  onViewBreakdown: () => void;
  profile: InvestorProfile;
  onProfileChange: (p: InvestorProfile) => void;
  lockedProfiles?: InvestorProfile[];
  onLockedProfileClick?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StockSignalPanel({
  stock, isCrypto, onViewBreakdown, profile, onProfileChange,
  lockedProfiles = [], onLockedProfileClick,
}: Props) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [hoveringBtn, setHoveringBtn] = useState(false);

  const radar      = stock.radarScores?.[profile];
  const signal     = radar?.signal      ?? stock.recommendation;
  const radarScore = radar?.radarScore  ?? 50;
  const confidence = radar?.confidence  ?? "Weak";
  const normalized = radar?.normalized;
  const consensus  = radar ? getConsensusSummary(radar.signal, stock.analystData) : null;

  const weights = isCrypto ? CRYPTO_PROFILE_WEIGHTS[profile] : PROFILE_WEIGHTS[profile];

  const confidenceLabel =
    confidence === "Strong"   ? "HIGH CONFIDENCE"     :
    confidence === "Moderate" ? "MODERATE CONFIDENCE" :
                                "LOW CONFIDENCE";

  const signalColor = SIGNAL_CONFIG[signal].color;

  const pillars = [
    {
      key:      "fundamental",
      label:    isCrypto ? "MARKET STRUCTURE" : "FUNDAMENTALS",
      Icon:     BarChart3,
      score:    normalized?.fundamental ?? 50,
      weight:   Math.round(weights.fundamental * 100),
    },
    {
      key:      "sentiment",
      label:    "NEWS & SENTIMENT",
      Icon:     Newspaper,
      score:    normalized?.sentiment ?? 50,
      weight:   Math.round(weights.sentiment * 100),
    },
    {
      key:      "technical",
      label:    "TECHNICAL MOMENTUM",
      Icon:     TrendingUp,
      score:    normalized?.technical ?? 50,
      weight:   Math.round(weights.technical * 100),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── 1. SIGNAL HERO CARD ────────────────────────────────────────────── */}
      <div>
        <SectionLabel text="RadarScore™ AI Signal" />
        <div style={{ ...whiteCard(CYAN), padding: "2rem 1.75rem", position: "relative", overflow: "hidden" }}>
          {/* Cyan label row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: CYAN,
            }}>
              RadarScore™ AI
            </span>
            <span style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.7rem",
              color: MUTED,
            }}>
              {isCrypto ? "Crypto-Weighted" : "Equity-Weighted"}
            </span>
          </div>

          <CyanRule />

          {/* Score + badge centred */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "6rem",
              lineHeight: 1,
              color: NAVY,
              letterSpacing: "-0.02em",
            }}>
              {radarScore}
            </div>

            <SignalBadge signal={signal} />

            <p style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: MUTED,
              marginTop: "0.15rem",
            }}>
              {confidenceLabel}
            </p>

            {consensus && (
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.72rem",
                color: MUTED,
                textAlign: "center",
                maxWidth: "260px",
                lineHeight: 1.5,
                marginTop: "0.25rem",
              }}>
                {consensus.explanation}
              </p>
            )}
          </div>

          {/* Bottom signal bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: signalColor }} />
        </div>
      </div>

      {/* ── 2. SCORE GAUGE ─────────────────────────────────────────────────── */}
      <div>
        <SectionLabel text="Score Gauge" />
        <div style={{ ...darkCard, padding: "1.25rem 1.5rem" }}>
          <div style={{ position: "relative", marginBottom: "0.625rem" }}>
            {/* Gradient track */}
            <div style={{
              height: "10px",
              borderRadius: "5px",
              background: `linear-gradient(to right, ${RED} 0%, ${GOLD} 50%, ${GREEN} 100%)`,
            }} />
            {/* Marker */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: `${Math.min(Math.max(radarScore, 3), 97)}%`,
              transform: "translate(-50%, -50%)",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: `3px solid ${signalColor}`,
              boxShadow: `0 0 12px ${signalColor}80`,
              transition: "left 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
            {[
              { label: "SELL", color: RED   },
              { label: "HOLD", color: GOLD  },
              { label: "BUY",  color: GREEN },
            ].map((item) => (
              <span key={item.label} style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: item.color,
              }}>
                {item.label}
              </span>
            ))}
          </div>
          <div style={{
            textAlign: "center",
            marginTop: "0.625rem",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.35)",
          }}>
            SCORE OUT OF 100
          </div>
        </div>
      </div>

      {/* ── 3. INVESTMENT HORIZON ──────────────────────────────────────────── */}
      <div>
        <SectionLabel text="Investment Horizon" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
          {PROFILES.map((p) => {
            const isActive = profile === p;
            const isLocked = lockedProfiles.includes(p);
            const pRadar   = stock.radarScores?.[p];
            const pSignal  = pRadar?.signal;

            return (
              <button
                key={p}
                onClick={isLocked ? onLockedProfileClick : () => onProfileChange(p)}
                style={{
                  background: "#FFFFFF",
                  border:     isActive ? `1px solid ${CYAN}` : `1px solid ${BORDER}`,
                  borderLeft: isActive ? `5px solid ${CYAN}` : `5px solid ${BORDER}`,
                  padding:    "0.875rem 0.75rem",
                  textAlign:  "left",
                  cursor:     "pointer",
                  opacity:    isLocked ? 0.55 : 1,
                  boxShadow:  isActive ? `0 4px 16px rgba(0,212,255,0.18)` : "0 2px 8px rgba(10,15,46,0.06)",
                  transition: "all 0.15s ease",
                  borderRadius: 0,
                  width: "100%",
                }}
              >
                <div style={{
                  fontFamily:    "'Barlow Condensed', sans-serif",
                  fontSize:      "0.68rem",
                  fontWeight:    700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color:         isActive ? CYAN : MUTED,
                  marginBottom:  "0.2rem",
                  display:       "flex",
                  alignItems:    "center",
                  gap:           "0.3rem",
                }}>
                  {isLocked && <Lock size={9} />}
                  {PROFILE_META[p].label}
                </div>
                <div style={{
                  fontFamily:   "'Barlow', sans-serif",
                  fontSize:     "0.68rem",
                  color:        MUTED,
                  marginBottom: "0.45rem",
                }}>
                  {PROFILE_META[p].period}
                </div>
                {pSignal && !isLocked && <MiniSignalBadge signal={pSignal} />}
                {isLocked && (
                  <span style={{
                    fontFamily:    "'Barlow Condensed', sans-serif",
                    fontSize:      "0.58rem",
                    fontWeight:    700,
                    letterSpacing: "0.1em",
                    color:         MUTED,
                    textTransform: "uppercase",
                  }}>
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. ANALYSIS PILLARS ────────────────────────────────────────────── */}
      <div>
        <SectionLabel text="Analysis Pillars" />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {pillars.map((pillar, idx) => {
            const pColor    = pillarColor(pillar.score);
            const pStatus   = pillarStatus(pillar.score);
            const isOpen    = expandedPillar === pillar.key;
            const PillarIcon = pillar.Icon;

            return (
              <div
                key={pillar.key}
                style={{ ...whiteCard(pColor), position: "relative", overflow: "hidden" }}
              >
                {/* Bottom bar */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "3px", background: pColor,
                }} />

                {/* Header row — the toggle button */}
                <button
                  onClick={() => setExpandedPillar(isOpen ? null : pillar.key)}
                  style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        "0.75rem",
                    width:      "100%",
                    background: "none",
                    border:     "none",
                    padding:    "1rem 1.25rem 1rem 1rem",
                    cursor:     "pointer",
                    textAlign:  "left",
                  }}
                >
                  {/* Numbered circle */}
                  <div style={{
                    width:          "44px",
                    height:         "44px",
                    borderRadius:   "50%",
                    background:     pColor,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    flexShrink:     0,
                  }}>
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize:   "1.1rem",
                      color:      "#FFFFFF",
                    }}>
                      {idx + 1}
                    </span>
                  </div>

                  {/* Label + sub */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily:    "'Barlow Condensed', sans-serif",
                      fontSize:      "0.82rem",
                      fontWeight:    700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color:         NAVY,
                      marginBottom:  "0.15rem",
                    }}>
                      {pillar.label}
                    </div>
                    <div style={{
                      fontFamily: "'Barlow', sans-serif",
                      fontSize:   "0.68rem",
                      color:      MUTED,
                    }}>
                      {pillar.weight}% weight · Score {pillar.score}/100
                    </div>
                  </div>

                  {/* Status badge + icon */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                    <div style={{
                      background:    pColor,
                      color:         NAVY,
                      fontFamily:    "'Barlow Condensed', sans-serif",
                      fontSize:      "0.58rem",
                      fontWeight:    800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding:       "0.15rem 0.5rem",
                      borderRadius:  "2px",
                    }}>
                      {pStatus}
                    </div>
                    <PillarIcon size={13} color={MUTED} />
                  </div>

                  {/* Chevron */}
                  <div style={{ marginLeft: "0.25rem", color: MUTED }}>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div style={{
                    padding:    "0.875rem 1.25rem 1.125rem",
                    borderTop:  `1px solid ${BORDER}`,
                    background: "#FAFBFC",
                  }}>
                    {/* Score bar */}
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.65rem", color: MUTED }}>
                          Normalised Score
                        </span>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize:   "0.65rem",
                          fontWeight: 700,
                          color:      NAVY,
                        }}>
                          {pillar.score} / 100
                        </span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "3px", background: BORDER, overflow: "hidden" }}>
                        <div style={{
                          height:     "100%",
                          width:      `${pillar.score}%`,
                          background: pColor,
                          borderRadius: "3px",
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>

                    {/* Weight bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.65rem", color: MUTED }}>
                          Profile Weight
                        </span>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize:   "0.65rem",
                          fontWeight: 700,
                          color:      NAVY,
                        }}>
                          {pillar.weight}%
                        </span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "3px", background: BORDER, overflow: "hidden" }}>
                        <div style={{
                          height:       "100%",
                          width:        `${pillar.weight}%`,
                          background:   CYAN,
                          borderRadius: "3px",
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. VIEW FULL BREAKDOWN ─────────────────────────────────────────── */}
      <button
        onClick={onViewBreakdown}
        onMouseEnter={() => setHoveringBtn(true)}
        onMouseLeave={() => setHoveringBtn(false)}
        style={{
          width:         "100%",
          background:    hoveringBtn ? NAVY2 : NAVY,
          color:         "#FFFFFF",
          fontFamily:    "'Barlow Condensed', sans-serif",
          fontSize:      "0.8rem",
          fontWeight:    700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding:       "0.9rem 1.5rem",
          border:        "none",
          borderRadius:  0,
          cursor:        "pointer",
          transition:    "background 0.15s ease",
        }}
      >
        View Full Breakdown
      </button>

    </div>
  );
}
