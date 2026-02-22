import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockCard } from "@/components/StockCard";
import { Exchange } from "@/lib/types";
import { Search, LogOut, Loader2, Lock, CreditCard, ArrowRight, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openCustomerPortal } from "@/lib/stripe-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { RadarLogo } from "@/components/RadarLogo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLiveStocks, useSearchStocks } from "@/hooks/use-live-stocks";
import { useSubscription } from "@/hooks/use-subscription";

const TIER_LABELS: Record<string, string> = {
  novice: "Novice Trader",
  day_trader: "Day Trader",
  pro_day_trader: "Pro Day Trader",
  bull_trader: "Bull Trader",
};

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const goToPricing = () => {
    navigate("/");
    setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  const [search, setSearch] = useState("");
  
  const [activeTab, setActiveTab] = useState<Exchange>("nasdaq");

  const { data: subscription } = useSubscription();
  const { data: stocks = [], isLoading, error } = useLiveStocks(activeTab);
  const { data: searchResults = [], isLoading: isSearching } = useSearchStocks(search);

  // Detect return from Stripe checkout and refresh subscription
  const hasHandledCheckout = useRef(false);
  useEffect(() => {
    if (searchParams.get("checkout") === "success" && !hasHandledCheckout.current) {
      hasHandledCheckout.current = true;
      // Remove the query param
      setSearchParams({}, { replace: true });

      // Re-sync subscription from Stripe then refresh local cache
      const sync = async () => {
        await supabase.functions.invoke("check-subscription");
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        // Read updated tier
        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("user_id", user?.id ?? "")
          .single();
        const tierLabel = TIER_LABELS[data?.subscription_tier ?? "novice"] ?? "your new plan";
        toast.success(`Congrats, you are now a "${tierLabel}"! 🎉`, {
          duration: 6000,
        });
      };
      sync();
    }
  }, [searchParams, setSearchParams, queryClient, user]);

  const isSearchActive = search.length >= 2;
  const hasCrypto = subscription?.hasCryptoAccess ?? false;
  const maxPreloaded = subscription?.tier === "novice" ? 2 : Infinity;

  const visibleStocks = stocks.slice(0, maxPreloaded);
  const isLimited = stocks.length > visibleStocks.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-border bg-card shadow-sm hover:bg-accent">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {subscription && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium w-fit">
                    {TIER_LABELS[subscription.tier]}
                  </span>
                )}
                <span className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </span>
                <div className="border-t border-border my-2" />
                <Button variant="ghost" className="justify-start gap-2" onClick={goToPricing}>
                  <ArrowRight className="w-4 h-4" /> Pricing Plans
                </Button>
                {subscription && subscription.tier !== "novice" && (
                  <Button variant="ghost" className="justify-start gap-2" onClick={openCustomerPortal}>
                    <CreditCard className="w-4 h-4" /> Manage Plan
                  </Button>
                )}
                <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={signOut}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Trial expired overlay */}
        {subscription?.isTrialExpired && subscription.tier === "novice" && (
          <div className="mb-8 p-8 rounded-2xl border-2 border-destructive/30 bg-destructive/5 text-center">
            <h2 className="font-display text-2xl font-bold mb-2">Your free trial has ended</h2>
            <p className="text-muted-foreground mb-4">
              Upgrade to a paid plan to continue getting real-time stock radars and recommendations.
            </p>
            <Button size="lg" onClick={goToPricing} className="gap-2">
              View Plans & Upgrade <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Real-time StocksRadars across major indices</p>
          {subscription && subscription.tier !== "bull_trader" && (
            <p className="text-sm text-signal-buy mt-1">
              {subscription.tier === "novice" && !subscription.isTrialExpired
                ? <>Free trial — {subscription.trialDaysLeft} day{subscription.trialDaysLeft !== 1 ? "s" : ""} left, {subscription.dailyLimit} stock checks/day. </>
                : <>{subscription.dailyLimit < Infinity ? `${subscription.dailyLimit} stock checks/day. ` : ""}</>
              }
              <button onClick={goToPricing} className="text-primary font-semibold underline underline-offset-2">Upgrade for more</button>
            </p>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search any stock (e.g. MCD, Disney, Tesla...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results */}
        {isSearchActive && (
          <div className="mb-6">
            {isSearching ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No results for "{search}"</p>
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

        {/* Tab view (hidden while searching) */}
        {!isSearchActive && (
          <Tabs defaultValue="nasdaq" onValueChange={(v) => setActiveTab(v as Exchange)}>
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="nasdaq">Nasdaq</TabsTrigger>
              <TabsTrigger value="dow">Dow Jones</TabsTrigger>
              <TabsTrigger value="sp500">S&P 500</TabsTrigger>
              {hasCrypto ? (
                <TabsTrigger value="crypto">Crypto</TabsTrigger>
              ) : (
                <TabsTrigger value="crypto" disabled className="gap-1.5 opacity-50">
                  <Lock className="w-3 h-3" /> Crypto
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={activeTab}>
              {activeTab === "crypto" && !hasCrypto ? (
                <div className="text-center py-16 space-y-3">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground font-medium">Crypto radars are exclusive to the Bull Trader plan</p>
                  <Link to="/#pricing">
                    <Button size="sm">Upgrade to Bull Trader</Button>
                  </Link>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Fetching live data...</span>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-destructive mb-2">Failed to load live data</p>
                  <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                </div>
              ) : visibleStocks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No stocks match your filters.</p>
              ) : (
                <div className="space-y-3">
                  {visibleStocks.map((stock) => (
                    <StockCard key={stock.ticker} stock={stock} />
                  ))}
                  {isLimited && (
                    <div className="text-center py-6 border border-dashed border-border rounded-xl">
                      <p className="text-muted-foreground text-sm mb-2">
                        You can see, open, search and get full radars of only {maxPreloaded} Stocks/Tickers per day
                      </p>
                      <Button size="sm" onClick={goToPricing}>Upgrade to see all</Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
