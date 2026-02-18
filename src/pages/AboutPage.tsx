import { Link } from "react-router-dom";
import founderPhoto from "@/assets/founder-photo.jpeg";
import { RadarLogo } from "@/components/RadarLogo";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="StocksRadars Home">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Founder's Statement */}
      <section className="container mx-auto px-4 py-20" aria-label="About the founder">
        <motion.div
          className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <div className="shrink-0">
            <img
              src={founderPhoto}
              alt="Donatas Juskus — Founder of StocksRadars"
              className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover shadow-lg border-2 border-primary/20"
            />
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
              From the Founder
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-4">
              20 Years of Trading. One Simple Tool.
            </h1>
            <blockquote className="text-muted-foreground text-sm md:text-base leading-relaxed space-y-3">
              <p>
                I've been actively trading stocks for over 20 years, managing a seven-figure portfolio built primarily through short-term trading strategies. With a Master's in International Business and an entrepreneurial drive from a young age, I turned what started as a passion for the markets into a steady, growing income stream.
              </p>
              <p>
                Along the way, I tried it all — premium brokerages, top-tier consultants, expensive advisory services. Investment decisions are tough, and most solutions out there are built for Wall Street, not for everyday people.
              </p>
              <p>
                That's why I created <span className="text-foreground font-medium">StocksRadars</span>. I gathered two decades of hard-won knowledge and experience into one simple platform — designed for those who don't have years to spend learning or hours each day sifting through endless data. It's for everyday investors who want clear, honest, actionable stock recommendations so they can make confident investment decisions on their own.
              </p>
            </blockquote>
            <p className="mt-4 font-display font-semibold text-foreground">— Donatas Juskus</p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 mt-auto" role="contentinfo">
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
