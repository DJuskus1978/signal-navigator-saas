import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/stripe-helpers";
import insideRadarImg from "@/assets/inside-radar.jpeg";
import newsSentimentImg from "@/assets/news-sentiment.jpeg";
import fmpLogo from "@/assets/fmp-logo-full.svg";
import avatarSarah from "@/assets/avatar-sarah.jpg";
import avatarJames from "@/assets/avatar-james.jpg";
import avatarElena from "@/assets/avatar-elena.jpg";
import avatarDavid from "@/assets/avatar-david.jpg";
import avatarPriya from "@/assets/avatar-priya.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrafficLight } from "@/components/TrafficLight";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight, BarChart3, Shield, Zap, Menu, X } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = async (tier: "day_trader" | "pro_day_trader" | "bull_trader") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoadingTier(tier);
    try {
      await startCheckout(tier);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="StocksRadars — Stock Recommendations Home">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button size="sm">Get Started</Button>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-xl hover:bg-accent transition-colors border border-border"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>

        {/* Dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-card overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
                <Link to="/about" className="px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium" onClick={() => setMenuOpen(false)}>
                  About
                </Link>
                <a href="#pricing" className="px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium" onClick={() => setMenuOpen(false)}>
                  Pricing
                </a>
                <Link to="/auth" className="px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium sm:hidden" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/auth" className="sm:hidden" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32" aria-label="Stock recommendations overview">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              AI-powered stock radars
            </span>
          </motion.div>
          <motion.p
            className="font-display text-xl md:text-2xl font-semibold text-muted-foreground italic mb-3"
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
          >
            "We analyze. You decide."
          </motion.p>
          <motion.h1
            className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6"
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
          >
            Stock buy, hold & sell radars for{" "}
            <span className="text-primary">everyday investors</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
          >
            Stop guessing which stocks to buy. StocksRadars analyzes fundamentals, news sentiment, and technical indicators across Nasdaq, Dow Jones, S&P 500, & crypto — delivering clear buy, hold, or sell radars with a simple traffic light.
           </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
          >
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="text-base px-8">
                View Pricing
              </Button>
            </a>
          </motion.div>

          {/* Traffic light preview */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-4"
            initial="hidden" animate="visible" custom={5} variants={fadeUp}
            role="img"
            aria-label="Stock recommendation traffic lights showing buy, hold, don't buy, and sell signals"
          >
            <TrafficLight recommendation="buy" size="lg" />
            <TrafficLight recommendation="hold" size="lg" />
            <TrafficLight recommendation="dont-buy" size="lg" />
            <TrafficLight recommendation="sell" size="lg" />
          </motion.div>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-6"
            initial="hidden" animate="visible" custom={6} variants={fadeUp}
          >
            <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Our global partner for financial & stocks data
            </p>
            <a href="https://financialmodelingprep.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={fmpLogo} alt="Financial Modeling Prep logo" className="h-10" />
              <span className="font-display text-xl text-muted-foreground">Financial Modeling Prep</span>
            </a>
          </motion.div>

          <motion.p
            className="mt-10 text-base text-muted-foreground/80 mb-0 max-w-2xl mx-auto italic"
            initial="hidden" animate="visible" custom={6} variants={fadeUp}
          >
            Our proprietary AI-powered stock analysis algorithm evaluates each stock through three phases — fundamental analysis, real-time news sentiment, and technical indicators — delivering a single, clear stock recommendation you can trust. No jargon, no complexity: just actionable stock radars designed for beginner and everyday investors who want professional-grade stock market insights without the learning curve.
          </motion.p>
        </div>
      </section>

      {/* Inside Radar */}
      <section className="container mx-auto px-4 -mt-10 pb-20" aria-label="Inside StocksRadars">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="font-display text-3xl font-bold mb-4">Inside the StocksRadars</h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            See how our AI stock screener breaks down fundamentals, sentiment, and technicals into clear, actionable recommendations
          </p>
          <div className="rounded-2xl border border-border overflow-hidden shadow-lg bg-card">
            <img
              src={insideRadarImg}
              alt="StocksRadars stock analysis dashboard showing fundamental analysis scores, news sentiment ratings, and technical indicator breakdown for a Nasdaq stock"
              className="w-full h-auto"
              loading="lazy"
              width="800"
              height="600"
            />
          </div>
        </motion.div>
      </section>

      {/* News & Sentiment */}
      <section className="container mx-auto px-4 pb-20" aria-label="News sentiment analysis">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="font-display text-3xl font-bold mb-4">Real-Time Stock News & Sentiment Analysis</h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            AI-powered news analysis and market sentiment scoring to help you make informed stock trading decisions
          </p>
          <div className="rounded-2xl border border-border overflow-hidden shadow-lg bg-card">
            <img
              src={newsSentimentImg}
              alt="StocksRadars real-time stock news sentiment analysis showing headline scoring, analyst ratings, and insider trading activity for S&P 500 stocks"
              className="w-full h-auto"
              loading="lazy"
              width="800"
              height="600"
            />
          </div>
        </motion.div>
      </section>

      {/* Advanced investors callout */}
      <section className="container mx-auto px-4 pb-20">
        <motion.p
          className="text-center text-lg md:text-xl text-muted-foreground italic max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          For the more advanced investor, dive deeper into detailed fundamental and technical radars — all the data you need to make informed decisions, in one place.
        </motion.p>
      </section>

      {/* How It Works */}
      <section className="bg-card border-y border-border py-20" aria-label="How StocksRadars work">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-4">How StocksRadars Work</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Three simple steps to smarter stock investing decisions
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Zap, title: "Sign Up Free", desc: "Create your free stock analysis account in seconds with Google or email." },
              { icon: Shield, title: "Choose Your Plan", desc: "Unlock unlimited stock recommendations and full market coverage for just $7/month." },
              { icon: BarChart3, title: "Get StocksRadars", desc: "See clear Buy, Hold, or Sell recommendations for every Nasdaq, Dow Jones, S&P 500, & crypto stock." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Radars */}
      <section className="container mx-auto px-4 py-20" aria-label="Customer reviews">
        <h2 className="font-display text-3xl font-bold text-center mb-4">What investors say about StocksRadars</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Real reviews from everyday investors using our stock recommendation tool

        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Sarah M.",
              role: "Retail Investor",
              avatar: avatarSarah,
              quote: "StocksRadars cut through all the noise. I used to spend hours reading conflicting opinions online — now I check my radars in 30 seconds and make confident decisions.",
            },
            {
              name: "James T.",
              role: "Part-time Trader",
              avatar: avatarJames,
              quote: "The simplicity is what sold me. No jargon, no complicated charts — just a clear green, yellow, or red light. I've made smarter trades in two weeks than I did in six months on my own.",
            },
            {
              name: "Elena R.",
              role: "First-time Investor",
              avatar: avatarElena,
              quote: "I was overwhelmed by the amount of stock information out there. StocksRadars made it so easy to understand what to buy and what to avoid. It's like having a financial advisor in my pocket.",
            },
            {
              name: "David K.",
              role: "Freelance Designer",
              avatar: avatarDavid,
              quote: "I don't have time to research every stock. StocksRadars saves me hours every week and the recommendations have been spot-on. Fastest investing decisions I've ever made.",
            },
            {
              name: "Priya N.",
              role: "Software Engineer",
              avatar: avatarPriya,
              quote: "I love data but hated sifting through endless financial reports. StocksRadars distills everything into one clear radar — it helped me navigate the market with real confidence.",
            },
          ].map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-4 py-20" aria-label="StocksRadars pricing plans">
        <h2 className="font-display text-3xl font-bold text-center mb-4">StocksRadars Pricing</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Pick the plan that fits your trading style. Upgrade or downgrade anytime.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* Novice Trader */}
          <Card className="border border-border relative overflow-hidden">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">NOVICE TRADER</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">7-day free trial</p>
              <ul className="text-sm text-left space-y-3 mb-6">
                {[
                  "2 stock checks per day",
                  "Nasdaq, Dow & S&P 500",
                  "Buy/Hold/Sell radars",
                  "Basic technical analysis",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-signal-buy hover:bg-signal-buy/90 text-white" size="lg">Start Free</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Day Trader */}
          <Card className="border border-border relative overflow-hidden">
            <div className="absolute -top-1 -right-1 w-16 h-16 flex items-center justify-center">
              <span className="text-3xl drop-shadow-md" role="img" aria-label="Lightning">⚡</span>
            </div>
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">DAY TRADER</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-4xl font-bold">$9</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">Cancel anytime</p>
              <ul className="text-sm text-left space-y-3 mb-6">
                {[
                  "25 real-time stock checks/day",
                  "All Nasdaq, Dow & S&P 500",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full active:scale-95 active:opacity-70 transition-all" size="lg" onClick={() => handlePlanClick("day_trader")} disabled={loadingTier === "day_trader"}>
                {loadingTier === "day_trader" ? <span className="flex items-center gap-2"><RadarLogo size={24} /> Loading…</span> : "Get Started"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Day Trader */}
          <Card className="border-2 border-primary shadow-lg relative overflow-hidden pt-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-0 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-b-lg whitespace-nowrap z-10">
              MOST POPULAR
            </div>
            <div className="absolute top-2 right-2 w-12 h-12 flex items-center justify-center">
              <span className="text-2xl drop-shadow-md" role="img" aria-label="Rocket">🚀</span>
            </div>
            <CardContent className="p-6 pt-6 text-center">
              <p className="text-sm font-semibold text-muted-foreground mb-2">PRO DAY TRADER</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-4xl font-bold">$19</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">Cancel anytime</p>
              <ul className="text-sm text-left space-y-3 mb-6">
                {[
                  "50 real-time stock checks/day",
                  "All Nasdaq, Dow & S&P 500",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                  "Confidence indicators",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full active:scale-95 active:opacity-70 transition-all" size="lg" onClick={() => handlePlanClick("pro_day_trader")} disabled={loadingTier === "pro_day_trader"}>
                {loadingTier === "pro_day_trader" ? <span className="flex items-center gap-2"><RadarLogo size={24} /> Loading…</span> : "Get Started"}
              </Button>
            </CardContent>
          </Card>

          {/* Bull Trader */}
          <Card className="border border-border relative overflow-hidden">
            <div className="absolute -top-1 -right-1 w-16 h-16 flex items-center justify-center">
              <span className="text-3xl drop-shadow-md" role="img" aria-label="Money">💵</span>
            </div>
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">BULL TRADER</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-4xl font-bold">$29</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">Cancel anytime</p>
              <ul className="text-sm text-left space-y-3 mb-6">
                {[
                  "Unlimited real-time stock checks",
                  "All Nasdaq, Dow & S&P 500",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                  "Crypto radars (BTC, ETH & more)",
                  "Confidence indicators",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full active:scale-95 active:opacity-70 transition-all" size="lg" onClick={() => handlePlanClick("bull_trader")} disabled={loadingTier === "bull_trader"}>
                {loadingTier === "bull_trader" ? <span className="flex items-center gap-2"><RadarLogo size={24} /> Loading…</span> : "Get Started"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-4">
          <p className="font-medium text-foreground/80">
            StocksRadars does not serve as financial advice. Stock recommendations are for informational purposes only.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/terms" className="hover:text-foreground underline underline-offset-4">Terms of Use</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground underline underline-offset-4">Privacy Policy</Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} StocksRadars — AI Stock Recommendations. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
