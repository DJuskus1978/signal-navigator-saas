import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StockCard } from "@/components/StockCard";
import { Exchange } from "@/lib/types";
import { Search, LogOut, Loader2, Lock, CreditCard, ArrowRight, Menu, MessageCircle } from "lucide-react";
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
import { MarketSentiment } from "@/components/MarketSentiment";
import { useSubscription } from "@/hooks/use-subscription";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const GREEN      = "#00C896";
const RED        = "#FF4757";
const GOLD       = "#FFB800";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

const TIER_LABELS: Record<string, string> = {
  novice: "Novice Trader",
  day_trader: "Day Trader",
  pro_day_trader: "Pro Day Trader",
  bull_trader: "Bull Trader",
};

const TABS: { value: Exchange; label: string }[] = [
  { value: "nasdaq", label: "Nasdaq" },
  { value: "dow",    label: "Dow Jones" },
  { value: "sp500",  label: "S&P 500" },
  { value: "crypto", label: "Crypto" },
];

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
  const [search, setSearch]     = useState("");
  const [activeTab, setActiveTab] = useState<Exchange>("nasdaq");
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: subscription } = useSubscription();
  const { data: stocks = [], isLoading, error } = useLiveStocks(activeTab);
  const { data: searchResults = [], isLoading: isSearching } = useSearchStocks(search, activeTab === "crypto" ? "crypto" : "stock");

  // Detect return from Stripe checkout and refresh subscription
  const hasHandledCheckout = useRef(false);
  useEffect(() => {
    if (searchParams.get("checkout") === "success" && !hasHandledCheckout.current) {
      hasHandledCheckout.current = true;
      setSearchParams({}, { replace: true });

      const sync = async () => {
        await supabase.functions.invoke("check-subscription");
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("user_id", user?.id ?? "")
          .single();
        const tierLabel = TIER_LABELS[data?.subscription_tier ?? "novice"] ?? "your new plan";
        toast.success(`Congrats, you are now a "${tierLabel}"! 🎉`, { duration: 6000 });
      };
      sync();
    }
  }, [searchParams, setSearchParams, queryClient, user]);

  const isSearchActive = search.length >= 2;
  const hasCrypto      = subscription?.hasCryptoAccess ?? false;
  const maxPreloaded   = subscription?.tier === "novice" ? 2 : Infinity;
  const visibleStocks  = stocks.slice(0, maxPreloaded);
  const isLimited      = stocks.length > visibleStocks.length;

  const isTrialActive = subscription?.tier === "novice" && !subscription?.isTrialExpired;
  const isPaidLimited = subscription && subscription.tier !== "bull_trader" && subscription.tier !== "novice";

  return (
    <div style={{ minHeight: "100vh", background: NAVY }}>

      {/* ── Sticky Nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: NAVY2, border: `1px solid ${BORDER_CLR}`, cursor: "pointer" }}>
                <Menu size={18} color={WHITE} />
              </button>
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
                <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
                <div className="border-t border-border my-2" />
                <Button variant="ghost" className="justify-start gap-2" onClick={goToPricing}>
                  <ArrowRight className="w-4 h-4" /> Pricing Plans
                </Button>
                {subscription && subscription.tier !== "novice" && (
                  <Button variant="ghost" className="justify-start gap-2" onClick={openCustomerPortal}>
                    <CreditCard className="w-4 h-4" /> Manage Plan
                  </Button>
                )}
                <Link to="/contact">
                  <Button variant="ghost" className="justify-start gap-2 w-full">
                    <MessageCircle className="w-4 h-4" /> Contact Us
                  </Button>
                </Link>
                <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={signOut}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* ── Trial Expired overlay ── */}
        {subscription?.isTrialExpired && subscription.tier === "novice" && (
          <div style={{ marginBottom: "2rem", background: NAVY2, border: `1px solid ${RED}`, borderLeft: `5px solid ${RED}`, padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.6rem", textTransform: "uppercase", color: WHITE, marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
              Your free trial has ended
            </h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: MUTED, marginBottom: "1.25rem", lineHeight: 1.6 }}>
              Upgrade to a paid plan to continue getting real-time stock radars and recommendations.
            </p>
            <button
              onClick={goToPricing}
              style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.75rem 1.75rem", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              View Plans &amp; Upgrade <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── Page Title ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.3rem" }}>
            RadarScore™ AI Signals
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", textTransform: "uppercase", color: WHITE, margin: 0, lineHeight: 1, letterSpacing: "-0.01em" }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: "#A0ABBE", marginTop: "0.4rem" }}>
            Real-time AI signals across major indices
          </p>
        </div>

        {/* ── Free Trial Banner ── */}
        {isTrialActive && (
          <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${GOLD}`, padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: GOLD, flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
              <div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD }}>
                  Free Trial
                </span>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: WHITE, margin: 0, marginTop: "0.1rem" }}>
                  {subscription.trialDaysLeft} day{subscription.trialDaysLeft !== 1 ? "s" : ""} left &middot; {subscription.dailyLimit} stock check{subscription.dailyLimit !== 1 ? "s" : ""} per day
                </p>
              </div>
            </div>
            <button
              onClick={goToPricing}
              style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.5rem 1.1rem", border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* ── Paid-but-limited note ── */}
        {isPaidLimited && (subscription?.dailyLimit ?? Infinity) < Infinity && (
          <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.82rem", color: MUTED, margin: 0 }}>
              {subscription!.dailyLimit} stock checks/day on your current plan.
            </p>
            <button onClick={goToPricing} style={{ background: "transparent", border: "none", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: CYAN, cursor: "pointer", padding: 0 }}>
              Upgrade for more
            </button>
          </div>
        )}

        {/* ── Search ── */}
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <Search size={16} color={searchFocused ? CYAN : MUTED} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", transition: "color 0.15s ease" }} />
          <input
            type="text"
            placeholder={activeTab === "crypto" ? "Search any cryptocurrency (e.g. Bitcoin, ETH, Solana...)" : "Search any stock (e.g. MCD, Disney, Tesla...)"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%",
              height: "48px",
              background: NAVY2,
              border: `1px solid ${searchFocused ? CYAN : BORDER_CLR}`,
              borderRadius: 0,
              paddingLeft: "42px",
              paddingRight: "1rem",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.88rem",
              color: WHITE,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s ease",
            }}
          />
          <style>{`input::placeholder { color: rgba(255,255,255,0.35); }`}</style>
        </div>

        {/* ── Search Results ── */}
        {isSearchActive && (
          <div style={{ marginBottom: "1.5rem" }}>
            {isSearching ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem 0" }}>
                <Loader2 size={16} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED }}>Searching...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, padding: "1rem 0" }}>No results for "{search}"</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: MUTED }}>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
                {searchResults.map((stock) => (
                  <StockCard key={stock.ticker} stock={stock} defaultExpanded={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab view (hidden while searching) ── */}
        {!isSearchActive && (
          <div>
            {/* Tab bar */}
            <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, display: "flex", marginBottom: "1.5rem", overflowX: "auto" }}>
              {TABS.map(({ value, label }) => {
                const isActive  = activeTab === value;
                const isLocked  = value === "crypto" && !hasCrypto;
                return (
                  <button
                    key={value}
                    onClick={() => !isLocked && setActiveTab(value)}
                    style={{
                      flex: "1 1 auto",
                      padding: "0.875rem 1rem",
                      background: "transparent",
                      border: "none",
                      borderBottom: isActive ? `2px solid ${CYAN}` : "2px solid transparent",
                      color: isActive ? CYAN : isLocked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.82rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: isLocked ? "default" : "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isLocked && <Lock size={10} color={GOLD} />}
                    {label}
                    {isLocked && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.12em", background: GOLD, color: NAVY, padding: "0.1rem 0.35rem" }}>
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "crypto" && !hasCrypto ? (
              <div style={{ textAlign: "center", padding: "4rem 0" }}>
                <div style={{ width: "48px", height: "48px", background: NAVY2, border: `1px solid ${BORDER_CLR}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <Lock size={20} color={MUTED} />
                </div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.08em", textTransform: "uppercase", color: WHITE, marginBottom: "0.5rem" }}>
                  Crypto Signals Locked
                </p>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, marginBottom: "1.25rem" }}>
                  Crypto radars are exclusive to the Bull Trader plan
                </p>
                <button
                  onClick={goToPricing}
                  style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.625rem 1.5rem", border: "none", cursor: "pointer" }}
                >
                  Upgrade to Bull Trader
                </button>
              </div>
            ) : isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "4rem 0" }}>
                <Loader2 size={20} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: MUTED }}>Fetching live data...</span>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "4rem 0" }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: RED, marginBottom: "0.5rem" }}>Failed to load live data</p>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED }}>{(error as Error).message}</p>
              </div>
            ) : visibleStocks.length === 0 ? (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, textAlign: "center", padding: "2rem 0" }}>No stocks match your filters.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {visibleStocks.map((stock) => (
                  <StockCard key={stock.ticker} stock={stock} defaultExpanded={true} />
                ))}
                {isLimited && (
                  <div style={{ textAlign: "center", padding: "1.5rem", background: NAVY2, border: `1px dashed ${BORDER_CLR}` }}>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.83rem", color: MUTED, marginBottom: "1rem" }}>
                      You can see, open, search and get full radars of only {maxPreloaded} Stocks/Tickers per day
                    </p>
                    <button
                      onClick={goToPricing}
                      style={{ background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.5rem 1.25rem", border: "none", cursor: "pointer" }}
                    >
                      Upgrade to see all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
