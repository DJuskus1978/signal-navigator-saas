import { Stock } from "@/lib/types";
import { useLiveStockDetail } from "@/hooks/use-live-stocks";
import { MarketSentiment } from "./MarketSentiment";
import { AnalystRatingsSection } from "./stock-detail/AnalystRatingsSection";
import { Loader2 } from "lucide-react";

interface Props {
  stock: Stock;
}

export function ExpandedStockIndicators({ stock }: Props) {
  const { data: detailStock, isLoading } = useLiveStockDetail(stock.ticker);
  const displayStock = detailStock || stock;

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* General Market Sentiment */}
      <MarketSentiment />

      {/* External Analyst Ratings */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading analyst data...</span>
        </div>
      ) : displayStock.analystData && displayStock.assetType !== "crypto" ? (
        <AnalystRatingsSection analystData={displayStock.analystData} currentPrice={displayStock.price} />
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">No analyst data available for this ticker</p>
      )}
    </div>
  );
}
