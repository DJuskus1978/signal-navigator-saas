import { useEffect } from "react";
import { Link } from "react-router-dom";
import founderPhoto from "@/assets/founder-photo.jpeg";
import { RadarLogo } from "@/components/RadarLogo";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function AboutPage() {
  useEffect(() => {
    document.title = "About StocksRadars — 20 Years of Trading Experience";
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }} aria-label="StocksRadars Home">
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: MUTED, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      {/* Founder section */}
      <section style={{ flex: 1, maxWidth: "900px", margin: "0 auto", padding: "4rem 1.25rem" }} aria-label="About the founder">
        <motion.div
          style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "flex-start" }}
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          {/* Section label */}
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.3rem" }}>
              From the Founder
            </p>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", textTransform: "uppercase", color: WHITE, margin: 0, lineHeight: 1, letterSpacing: "-0.01em" }}>
              About Us
            </h1>
          </div>

          {/* Content card */}
          <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-start" }}>
              {/* Photo */}
              <div style={{ flexShrink: 0 }}>
                <img
                  src={founderPhoto}
                  alt="Donatas Juskus — Founder of StocksRadars"
                  style={{ width: "180px", height: "180px", objectFit: "cover", border: `2px solid ${BORDER_CLR}` }}
                />
              </div>

              {/* Quote */}
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: MUTED, lineHeight: 1.75, margin: 0 }}>
                    I've been actively trading stocks for over 20 years, managing a seven-figure portfolio built primarily through short-term trading strategies. With a Master's in International Business and an entrepreneurial drive from a young age, I turned what started as a passion for the markets into a steady, growing income stream.
                  </p>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: MUTED, lineHeight: 1.75, margin: 0 }}>
                    Along the way, I tried it all — premium brokerages, top-tier consultants, expensive advisory services. Investment decisions are tough, and most solutions out there are built for Wall Street, not for everyday people.
                  </p>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: MUTED, lineHeight: 1.75, margin: 0 }}>
                    That's why I created <span style={{ color: WHITE, fontWeight: 600 }}>StocksRadars</span>. I gathered two decades of hard-won knowledge and experience into one simple platform — designed for those who don't have years to spend learning or hours each day sifting through endless data.
                  </p>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.88rem", color: MUTED, lineHeight: 1.75, margin: 0 }}>
                    It's for everyday investors who want clear, honest, actionable stock recommendations so they can make confident investment decisions on their own.
                  </p>
                </div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", color: WHITE, marginTop: "1.25rem", letterSpacing: "0.04em" }}>
                  — Donatas Juskus
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER_CLR}`, padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED, lineHeight: 1.6 }}>
            This information is not a personal recommendation or investment advice. Conduct your own research and consider your financial situation before making any investment decisions.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <Link to="/terms" style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: MUTED, textDecoration: "underline", textUnderlineOffset: "3px" }}>Terms of Use</Link>
            <span style={{ color: MUTED }}>·</span>
            <Link to="/privacy" style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.78rem", color: MUTED, textDecoration: "underline", textUnderlineOffset: "3px" }}>Privacy Policy</Link>
          </div>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED }}>
            © {new Date().getFullYear()} StocksRadars — AI Stock Recommendations. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
