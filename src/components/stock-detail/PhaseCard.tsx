import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, DollarSign, Landmark, BarChartHorizontal, Newspaper, TrendingUp, Search, Gauge, Activity, PieChart } from "lucide-react";
import type { SignalLevel } from "./types";

interface SubBlock {
  icon: string;
  title: string;
  items: { label: string; value: string; signal?: SignalLevel }[];
}

interface PhaseCardProps {
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

function getStatusColor(level: SignalLevel) {
  if (level === "bullish") return { bg: "hsl(var(--signal-buy))", text: "white" };
  if (level === "bearish") return { bg: "hsl(var(--signal-sell))", text: "white" };
  return { bg: "hsl(var(--signal-hold))", text: "white" };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "dollar-sign": DollarSign,
  "landmark": Landmark,
  "bar-chart-horizontal": BarChartHorizontal,
  "newspaper": Newspaper,
  "trending-up": TrendingUp,
  "search": Search,
  "gauge": Gauge,
  "activity": Activity,
  "pie-chart": PieChart,
};

function SubBlockSection({ block }: { block: SubBlock }) {
  const IconComponent = iconMap[block.icon];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : <span>{block.icon}</span>} {block.title}
      </p>
      <div className="space-y-1">
        {block.items.map((item) => {
          const color = item.signal === "bullish" ? "text-signal-buy" : item.signal === "bearish" ? "text-signal-sell" : "text-signal-hold";
          return (
            <div key={item.label} className="flex justify-between items-center text-sm py-0.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={cn("font-medium", color)}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PhaseCard({ icon, title, score, statusLabel, statusLevel, interpretation, subBlocks, detailRows, simple = false }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const styles = getStatusColor(statusLevel);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon} {title}
          </CardTitle>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: styles.bg, color: styles.text }}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {statusLabel}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Interpretation — always visible */}
        <p className={cn(
          "text-sm italic",
          simple ? "text-foreground" : "text-foreground"
        )}>
          {interpretation}
        </p>

        {/* Expandable Details — only in Advanced mode */}
        {!simple && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Hide" : "See"} Key Metrics
              <ChevronDown className={cn("w-3.5 h-3.5 ml-1 transition-transform", expanded && "rotate-180")} />
            </Button>

            {expanded && (
              <div className="space-y-0 border-t border-border pt-2">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-2">
                      {row.hint && row.signal && (
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            color: row.signal === "bullish" ? "hsl(var(--signal-buy))" : row.signal === "bearish" ? "hsl(var(--signal-sell))" : "hsl(var(--signal-hold))",
                            backgroundColor: row.signal === "bullish" ? "hsl(var(--signal-buy-bg))" : row.signal === "bearish" ? "hsl(var(--signal-sell-bg))" : "hsl(var(--signal-hold-bg))",
                          }}
                        >
                          {row.hint}
                        </span>
                      )}
                      <span className="font-medium text-sm font-display">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
