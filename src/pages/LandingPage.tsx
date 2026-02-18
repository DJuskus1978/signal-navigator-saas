import { Link } from "react-router-dom";
import insideRadarImg from "@/assets/inside-radar.jpeg";
import newsSentimentImg from "@/assets/news-sentiment.jpeg";
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
          <Link to="/" className="flex items-center gap-2" aria-label="StocksRadars — Stock Recommendations Home">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Main navigation">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32" aria-label="Stock recommendations overview">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              AI-powered stock radars
            </span>
          </motion.div>
          <motion.h1
            className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6"
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
          >
            Stock buy, hold & sell radars for{" "}
            <span className="text-primary">everyday investors</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
          >
            Stop guessing which stocks to buy. StocksRadars analyzes fundamentals, news sentiment, and technical indicators across Nasdaq, Dow Jones, and S&P 500 — delivering clear buy, hold, or sell radars with a simple traffic light.
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
              <Button size="lg" variant="outline" className="text-base px-8">
                View Pricing
              </Button>
            </a>
          </motion.div>

          {/* Traffic light preview */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-4"
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
            role="img"
            aria-label="Stock recommendation traffic lights showing buy, hold, don't buy, and sell signals"
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
            Our proprietary AI-powered stock analysis algorithm evaluates each stock through three phases — fundamental analysis, real-time news sentiment, and technical indicators — delivering a single, clear stock recommendation you can trust. No jargon, no complexity: just actionable stock radars designed for beginner and everyday investors who want professional-grade stock market insights without the learning curve.
          </motion.p>
        </div>
      </section>

      {/* Inside Radar */}
      <section className="container mx-auto px-4 -mt-10 pb-20" aria-label="Inside stock analysis radar">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="font-display text-3xl font-bold mb-4">Inside the Stock Analysis Radar</h2>
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
      <section className="bg-card border-y border-border py-20" aria-label="How stock recommendations work">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-4">How stock recommendations work</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Three simple steps to smarter stock investing decisions
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Zap, title: "Sign Up Free", desc: "Create your free stock analysis account in seconds with Google or email." },
              { icon: Shield, title: "Choose Your Plan", desc: "Unlock unlimited stock recommendations and full market coverage for just $7/month." },
              { icon: BarChart3, title: "Get Stock Radars", desc: "See clear Buy, Hold, or Sell recommendations for every Nasdaq, Dow Jones, and S&P 500 stock." },
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
              quote: "StocksRadars cut through all the noise. I used to spend hours reading conflicting opinions online — now I check my radars in 30 seconds and make confident decisions.",
            },
            {
              name: "James T.",
              role: "Part-time Trader",
              quote: "The simplicity is what sold me. No jargon, no complicated charts — just a clear green, yellow, or red light. I've made smarter trades in two weeks than I did in six months on my own.",
            },
            {
              name: "Elena R.",
              role: "First-time Investor",
              quote: "I was overwhelmed by the amount of stock information out there. StocksRadars made it so easy to understand what to buy and what to avoid. It's like having a financial advisor in my pocket.",
            },
            {
              name: "David K.",
              role: "Freelance Designer",
              quote: "I don't have time to research every stock. StocksRadars saves me hours every week and the recommendations have been spot-on. Fastest investing decisions I've ever made.",
            },
            {
              name: "Priya N.",
              role: "Software Engineer",
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
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
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

      <section id="pricing" className="container mx-auto px-4 py-20" aria-label="Stock analysis pricing plans">
        <h2 className="font-display text-3xl font-bold text-center mb-4">Stock analysis pricing</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Start with free stock recommendations, upgrade when you're ready for unlimited access.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Plan */}
          <Card className="border border-border">
            <CardContent className="p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">FREE</p>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-display text-5xl font-bold">$0</span>
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
                <Button className="w-full bg-signal-buy hover:bg-signal-buy/90 text-white" size="lg">Start Free Trial</Button>
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
                <span className="font-display text-5xl font-bold">$7</span>
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
