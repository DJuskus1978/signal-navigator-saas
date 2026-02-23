import { Stock } from "@/lib/types";
import { TrafficLight } from "./TrafficLight";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface StockCardProps {
  stock: Stock;
  blurred?: boolean;
}

export function StockCard({ stock, blurred = false }: StockCardProps) {
  const navigate = useNavigate();
  const isPositive = stock.change >= 0;
  const hasRadar = stock.hasDetailData !== false;

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-shadow border border-border",
        blurred && "select-none"
      )}
      onClick={() => !blurred && navigate(`/stock/${stock.ticker}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-display font-bold text-lg leading-tight">
                {stock.assetType === "crypto" ? stock.ticker.replace("USD", "") : stock.ticker}
              </p>
              <p className="text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[220px]">{stock.name}</p>
            </div>
          </div>
        </div>

        <div className={cn("text-right mx-4", blurred && "blur-sm")}>
          <p className="font-semibold text-lg">${stock.price.toFixed(2)}</p>
          <p className={cn("text-sm font-medium", isPositive ? "text-signal-buy" : "text-signal-sell")}>
            {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
          </p>
        </div>

        <div className={cn("flex flex-col items-end gap-1", blurred && "blur-sm")}>
          {hasRadar ? (
            <>
              <TrafficLight recommendation={stock.recommendation} size="sm" />
              <p className="text-[10px] font-semibold text-muted-foreground tracking-wide">RadarScore™</p>
            </>
          ) : (
            <div className="flex items-center gap-1 text-primary text-sm font-medium">
              <span>View Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
