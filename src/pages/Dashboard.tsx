import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockCard } from "@/components/StockCard";
import { Exchange } from "@/lib/types";
import { Search, Filter, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RadarLogo } from "@/components/RadarLogo";
import { useLiveStocks, useSearchStocks } from "@/hooks/use-live-stocks";
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
  const [activeTab, setActiveTab] = useState<Exchange>("nasdaq");
  const [globalSearch, setGlobalSearch] = useState("");

  const { data: stocks = [], isLoading, error } = useLiveStocks(activeTab);
  const { data: searchResults = [], isLoading: isSearching } = useSearchStocks(globalSearch);

  const isGlobalSearchActive = globalSearch.length >= 2;

  const filteredStocks = stocks.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || s.recommendation === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
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
          <p className="text-muted-foreground">Real-time StocksRadars across major indices</p>
        </div>

        {/* Global Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search any stock (e.g. MCD, Disney, Tesla...)"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {isGlobalSearchActive && (
            <div className="mt-3">
              {isSearching ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No results for "{globalSearch}"</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
                  {searchResults.map((stock) => (
                    <StockCard key={stock.ticker} stock={stock} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isGlobalSearchActive && (
        <>
        {/* Local Filters */}
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
              <SelectItem value="all">All Radars</SelectItem>
              <SelectItem value="strong-buy">🟢🟢 Strong Buy</SelectItem>
              <SelectItem value="buy">🟢 Buy</SelectItem>
              <SelectItem value="hold">🟡 Hold</SelectItem>
              <SelectItem value="dont-buy">🟠 Don't Buy</SelectItem>
              <SelectItem value="sell">🔴 Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="nasdaq" onValueChange={(v) => setActiveTab(v as Exchange)}>
          <TabsList className="mb-6">
            <TabsTrigger value="nasdaq">Nasdaq</TabsTrigger>
            <TabsTrigger value="dow">Dow Jones</TabsTrigger>
            <TabsTrigger value="sp500">S&P 500</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Fetching live data...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-2">Failed to load live data</p>
                <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
              </div>
            ) : filteredStocks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No stocks match your filters.</p>
            ) : (
              <div className="space-y-3">
                {filteredStocks.map((stock) => (
                  <StockCard key={stock.ticker} stock={stock} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </>
        )}
      </main>
    </div>
  );
}
