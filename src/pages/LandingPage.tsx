import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrafficLight } from "@/components/TrafficLight";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, BarChart3, Shield, Zap } from "lucide-react";
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
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Smart investing made simple
            </span>
          </motion.div>
          <motion.h1
            className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6"
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
          >
            Simple stock recommendations for{" "}
            <span className="text-primary">everyday investors</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
          >
            Stop guessing. StocksRadars analyzes technical and fundamental data across Nasdaq, Dow Jones, and S&P 500 — and tells you exactly what to do with a simple traffic light.
           </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
          >
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="text-base px-8 border-foreground">
                View Pricing
              </Button>
            </a>
          </motion.div>

          {/* Traffic light preview */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-4"
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
          >
            <TrafficLight recommendation="buy" size="lg" />
            <TrafficLight recommendation="hold" size="lg" />
            <TrafficLight recommendation="dont-buy" size="lg" />
            <TrafficLight recommendation="sell" size="lg" />
          </motion.div>

          <motion.p
            className="mt-10 text-base text-muted-foreground/80 mb-0 max-w-2xl mx-auto italic"
            initial="hidden" animate="visible" custom={5} variants={fadeUp}
          >
            Our proprietary AI-powered algorithm evaluates each stock through three phases — fundamentals, real-time news sentiment, and technical indicators — delivering a single, clear recommendation you can trust. No jargon, no complexity: just actionable radars designed for everyday investors who want professional-grade insights without the learning curve.
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-card border-y border-border py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Three simple steps to smarter investing decisions
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Zap, title: "Sign Up", desc: "Create your free account in seconds with Google or email." },
              { icon: Shield, title: "Subscribe", desc: "Unlock full access to all recommendations for just €7/month." },
              { icon: BarChart3, title: "Get Radars", desc: "See clear Buy, Hold, or Sell recommendations for every stock." },
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

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="font-display text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Start free, upgrade when you're ready.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Plan */}
          <Card className="border border-border">
            <CardContent className="p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">FREE</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-5xl font-bold">€0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground text-sm mb-8">7-day free trial</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                {[
                  "2 stock checks per day",
                  "Nasdaq, Dow & S&P 500 coverage",
                  "Buy/Hold/Sell radars",
                  "Basic technical analysis",
                  "Mobile-friendly dashboard",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full" size="lg" variant="outline">Start Free Trial</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-primary shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
              MOST POPULAR
            </div>
            <CardContent className="p-8 text-center">
              <p className="text-sm font-medium text-primary mb-2">PRO</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-5xl font-bold">€7</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground text-sm mb-8">Cancel anytime</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                {[
                  "Unlimited stock checks",
                  "All Nasdaq, Dow & S&P 500 stocks",
                  "Real-time Buy/Hold/Sell radars",
                  "Technical & fundamental analysis",
                  "Confidence indicators",
                  "Mobile-friendly dashboard",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-buy mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full" size="lg">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} StocksRadars. All rights reserved.</p>
          <p className="mt-1">Not financial advice. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
