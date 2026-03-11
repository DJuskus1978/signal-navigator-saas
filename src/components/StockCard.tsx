import { useState } from "react";
import { Stock } from "@/lib/types";
import { TrafficLight } from "./TrafficLight";
import { AIScoreBadge } from "./AIScoreBadge";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ExpandedStockIndicators } from "./ExpandedStockIndicators";

interface StockCardProps {
  stock: Stock;
  blurred?: boolean;
}

export function StockCard({ stock, blurred = false }: StockCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const isPositive = stock.change >= 0;

  return (
    <Card className={cn("border border-border overflow-hidden", blurred && "select-none")}>
      {/* Main row — navigates to full detail */}
      <div
        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => !blurred && navigate(`/stock/${stock.ticker}`)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-lg leading-tight">
              {stock.assetType === "crypto" ? stock.ticker.replace("USD", "") : stock.ticker}
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[220px]">{stock.name}</p>
          </div>

          <div className={cn("text-right mx-4", blurred && "blur-sm")}>
            <p className="font-semibold text-lg">${stock.price.toFixed(2)}</p>
            <p className={cn("text-sm font-medium", isPositive ? "text-signal-buy" : "text-signal-sell")}>
              {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
            </p>
          </div>

          <div className={cn("flex flex-col items-end gap-1", blurred && "blur-sm")}>
            <TrafficLight recommendation={stock.recommendation} size="sm" />
            <AIScoreBadge score={stock.radarScores?.balanced?.radarScore ?? stock.score} />
          </div>
        </div>
      </div>

      {/* More Indicators toggle */}
      {!blurred && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="w-full px-4 py-2 border-t border-border flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-accent/50 transition-colors"
        >
          More Indicators
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Expanded indicators */}
      {expanded && !blurred && (
        <div className="border-t border-border">
          <ExpandedStockIndicators stock={stock} />
        </div>
      )}
    </Card>
  );
}
