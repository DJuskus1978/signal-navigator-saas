import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { startCheckout } from "@/lib/stripe-helpers";
import heroBannerImg from "@/assets/hero-banner-new.jpg";
import insideRadarSignalImg from "@/assets/inside-radar-signal.jpeg";
import insideRadarPhasesImg from "@/assets/inside-radar-phases.jpeg";
import insideRadarDashboardImg from "@/assets/inside-radar-dashboard.jpeg";
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
import { ArrowRight, BarChart3, Shield, Zap, Menu, X, TrendingUp, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { RadarLogo } from "@/components/RadarLogo";
import { IPhoneFrame } from "@/components/IPhoneFrame";

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
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const pricingRef = useRef<HTMLElement>(null);

  const testimonials = [
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
    {
      name: "Marcus L.",
      role: "Small Business Owner",
      avatar: avatarDavid,
      quote: "As someone who invests on the side, I needed something dead simple. StocksRadars gives me a quick, reliable read on any stock — I check it every morning before the market opens.",
    },
  ];

  const nextTestimonial = () => setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  // Track pricing section view on scroll
  useEffect(() => {
    const el = pricingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          (window as any).gtag?.("event", "view_pricing_section", {
            event_category: "engagement",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trackPlanClick = (planName: string, price: number) => {
    (window as any).gtag?.("event", "select_plan", {
      event_category: "pricing",
      plan_name: planName,
      plan_price: price,
    });
  };

  const handlePlanClick = async (tier: "day_trader" | "pro_day_trader" | "bull_trader") => {
    const planMap = {
      day_trader: { name: "Day Trader", price: 9 },
      pro_day_trader: { name: "Pro Day Trader", price: 19 },
      bull_trader: { name: "Bull Trader", price: 29 },
    };
    trackPlanClick(planMap[tier].name, planMap[tier].price);

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
        <div className="w-full flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="StocksRadars — Stock Recommendations Home">
            <RadarLogo />
            <span className="font-display font-bold text-xl">Stocks<span className="text-primary">Radars</span></span>
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
                <Link to="/contact" className="px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium" onClick={() => setMenuOpen(false)}>
                  Contact Us
                </Link>
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

      {/* Hero Banner Image */}
      <div className="w-full">
        <img
          src={heroBannerImg}
          alt="StocksRadars hero banner showing financial charts, radar target, and market analysis illustrations"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Hero Text */}
      <section className="container mx-auto px-4 py-12 md:py-20" aria-label="Stock recommendations overview">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6"
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
          >
            Smart, Clear <span className="text-primary">AI Stock Decision Tool</span> — Made Simple for{" "}
            <span className="text-foreground">Everyday Investors</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto"
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
          >
            Stop guessing which stocks to buy. Our RadarScore™ analyzes Real-Time Market Data - fundamentals, news sentiment, and technical indicators — delivering clear buy, hold, or sell radars with a simple traffic light.
          </motion.p>
          <motion.p
            className="text-base md:text-xl font-medium text-muted-foreground/50 mb-10 tracking-wide"
            initial="hidden" animate="visible" custom={3.5} variants={fadeUp}
          >
            Nasdaq &nbsp;·&nbsp; Dow Jones &nbsp;·&nbsp; S&amp;P 500 &nbsp;·&nbsp; Crypto
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
            <p className="w-full text-center text-xs font-semibold text-muted-foreground tracking-wide mt-2">RadarScore™</p>
          </motion.div>

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
            Choose your investor profile: <em>Conservative</em>, <em>Balanced</em>, or <em>Active</em> — and get personalized stocks radars.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <IPhoneFrame>
              <img
                src={insideRadarSignalImg}
                alt="StocksRadars signal card showing AAPL stock with Buy recommendation, Balanced profile selected, and Fundamentals/News/Technical weight bars"
                className="w-full h-auto"
                loading="lazy"
              />
            </IPhoneFrame>
            <IPhoneFrame>
              <img
                src={insideRadarPhasesImg}
                alt="StocksRadars analysis phases showing Fundamental Strength, News & Sentiment, and Technical Momentum breakdowns with Decision Guidance"
                className="w-full h-auto"
                loading="lazy"
              />
            </IPhoneFrame>
            <IPhoneFrame>
              <img
                src={insideRadarDashboardImg}
                alt="StocksRadars dashboard showing stock list with AAPL and MSFT, search bar, and index tabs for Nasdaq, Dow Jones, S&P 500 and Crypto"
                className="w-full h-auto"
                loading="lazy"
              />
            </IPhoneFrame>
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
          <div className="flex justify-center">
            <IPhoneFrame>
              <img
                src={newsSentimentImg}
                alt="StocksRadars real-time stock news sentiment analysis showing headline scoring, analyst ratings, and insider trading activity for S&P 500 stocks"
                className="w-full h-auto"
                loading="lazy"
              />
            </IPhoneFrame>
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
              { icon: Shield, title: "Choose Your Plan", desc: "Unlock unlimited stock recommendations and full market coverage for just $9/month." },
              { icon: BarChart3, title: "Get StocksRadars", desc: "See clear Buy, Hold, or Sell recommendations for every Nasdaq, Dow Jones, S&P 500 stock & crypto." },
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



      <section id="pricing" ref={pricingRef} className="container mx-auto px-4 py-20" aria-label="StocksRadars pricing plans">
        <h2 className="font-display text-3xl font-bold text-center mb-4">StocksRadars Pricing</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Pick the plan that fits your trading style. Upgrade or downgrade anytime.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* Novice Trader */}
          <Card className="border border-border relative overflow-hidden flex flex-col">
            <CardContent className="p-6 text-center flex flex-col flex-1">
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
              <div className="mt-auto">
                <Link to="/auth" onClick={() => trackPlanClick("Novice Trader", 0)}>
                  <Button className="w-full bg-signal-buy hover:bg-signal-buy/90 text-white" size="lg">Start Free</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Day Trader */}
          <Card className="border border-border relative overflow-hidden flex flex-col">
            <div className="absolute top-3 right-3">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <CardContent className="p-6 text-center flex flex-col flex-1">
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
                  "Simple Traders Radars",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button className="w-full active:scale-95 active:opacity-70 transition-all" size="lg" onClick={() => handlePlanClick("day_trader")} disabled={loadingTier === "day_trader"}>
                  {loadingTier === "day_trader" ? <span className="flex items-center gap-2"><RadarLogo size={24} /> Loading…</span> : "Get Started"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro Day Trader */}
          <Card className="border-2 border-primary shadow-lg relative overflow-hidden pt-4 flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-0 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-b-lg whitespace-nowrap z-10">
              MOST POPULAR
            </div>
            <div className="absolute top-5 right-3">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <CardContent className="p-6 pt-6 text-center flex flex-col flex-1">
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
                  "Simple + Advanced Traders Radars",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                  "Radars adapted to Investor Profiles",
                  "Confidence indicators",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button className="w-full active:scale-95 active:opacity-70 transition-all" size="lg" onClick={() => handlePlanClick("pro_day_trader")} disabled={loadingTier === "pro_day_trader"}>
                  {loadingTier === "pro_day_trader" ? <span className="flex items-center gap-2"><RadarLogo size={24} /> Loading…</span> : "Get Started"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bull Trader */}
          <Card className="border border-border relative overflow-hidden flex flex-col">
            <div className="absolute top-3 right-3">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <CardContent className="p-6 text-center flex flex-col flex-1">
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
                  "Simple + Advanced Traders Radars",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                  "Crypto radars (BTC, ETH & more)",
                  "Radars adapted to Investor Profiles",
                  "Confidence indicators",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button className="w-full active:scale-95 active:opacity-70 transition-all" size="lg" onClick={() => handlePlanClick("bull_trader")} disabled={loadingTier === "bull_trader"}>
                  {loadingTier === "bull_trader" ? <span className="flex items-center gap-2"><RadarLogo size={24} /> Loading…</span> : "Get Started"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Algorithm Description & FMP Partner */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            className="text-base text-muted-foreground/80 mb-6 max-w-2xl mx-auto italic"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
          >
            Our proprietary AI-powered stock algorithm - RadarScore™ - analyze massive amounts of market data — fundamental analysis, real-time news sentiment, and technical indicators — delivering a single, clear stock recommendation you can trust.
            <br /><br />
            No jargon, no complexity: just actionable stock radars designed for beginner and everyday investors who want professional-grade stock market insights without the learning curve.
          </motion.p>

          <motion.p
            className="text-sm font-medium text-muted-foreground mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0.5} variants={fadeUp}
          >
            Founder - D. Juskus
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
          >
            <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Our global partner for financial & stocks data
            </p>
            <a href="https://financialmodelingprep.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={fmpLogo} alt="Financial Modeling Prep logo" className="h-10" />
              <span className="font-display text-xl text-muted-foreground">Financial Modeling Prep</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Customer Testimonials Slider */}
      <section className="container mx-auto px-4 py-20" aria-label="Customer reviews">
        <h2 className="font-display text-3xl font-bold text-center mb-4">What investors say about StocksRadars</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Real reviews from everyday investors using our stock recommendation tool
        </p>
        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full">
                <CardContent className="p-8">
                  <p className="text-base text-muted-foreground mb-6 italic leading-relaxed">"{testimonials[testimonialIndex].quote}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonials[testimonialIndex].avatar}
                      alt={testimonials[testimonialIndex].name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{testimonials[testimonialIndex].name}</p>
                      <p className="text-xs text-muted-foreground">{testimonials[testimonialIndex].role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === testimonialIndex ? "bg-primary" : "bg-border"}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full border border-border hover:bg-accent transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-4">
          <p className="font-medium text-foreground/80">
            StocksRadars does not serve as financial advice. Stock recommendations are for informational purposes only.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/about" className="hover:text-foreground underline underline-offset-4">About</Link>
            <span>·</span>
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
