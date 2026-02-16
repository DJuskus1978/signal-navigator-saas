import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockCard } from "@/components/StockCard";
import { getStocksByExchange } from "@/lib/mock-data";
import { Exchange, Recommendation } from "@/lib/types";
import { Search, Filter, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RadarLogo } from "@/components/RadarLogo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const renderStockList = (exchange: Exchange) => {
    let stocks = getStocksByExchange(exchange);

    if (search) {
      const q = search.toLowerCase();
      stocks = stocks.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    if (filter !== "all") {
      stocks = stocks.filter((s) => s.recommendation === filter);
    }

    return (
      <div className="space-y-3">
        {stocks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No stocks match your filters.</p>
        ) : (
          stocks.map((stock) => <StockCard key={stock.ticker} stock={stock} />)
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StockRadar</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time stock recommendations across major indices</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ticker or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Signals</SelectItem>
              <SelectItem value="buy">🟢 Buy</SelectItem>
              <SelectItem value="hold">🟡 Hold</SelectItem>
              <SelectItem value="dont-buy">🟠 Don't Buy</SelectItem>
              <SelectItem value="sell">🔴 Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="nasdaq">
          <TabsList className="mb-6">
            <TabsTrigger value="nasdaq">Nasdaq</TabsTrigger>
            <TabsTrigger value="dow">Dow Jones</TabsTrigger>
            <TabsTrigger value="sp500">S&P 500</TabsTrigger>
          </TabsList>
          <TabsContent value="nasdaq">{renderStockList("nasdaq")}</TabsContent>
          <TabsContent value="dow">{renderStockList("dow")}</TabsContent>
          <TabsContent value="sp500">{renderStockList("sp500")}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
