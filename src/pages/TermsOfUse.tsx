import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

export default function TermsOfUse() {
  return (
    <div style={{ minHeight: "100vh", background: NAVY }}>
      <style>{`
        .legal-prose h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 1.1rem; letter-spacing: 0.06em; text-transform: uppercase; color: ${WHITE}; margin-bottom: 0.75rem; margin-top: 0; }
        .legal-prose p, .legal-prose li { font-family: 'Barlow', sans-serif; font-size: 0.88rem; color: ${MUTED}; line-height: 1.75; }
        .legal-prose ul { padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .legal-prose strong { color: ${WHITE}; font-weight: 600; }
        .legal-prose .highlight { color: ${CYAN}; }
        .legal-prose section { margin-bottom: 1.75rem; padding-bottom: 1.75rem; border-bottom: 1px solid ${BORDER_CLR}; }
        .legal-prose section:last-child { border-bottom: none; }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
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

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: CYAN, marginBottom: "0.3rem" }}>
            Legal
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2.5rem", textTransform: "uppercase", color: WHITE, margin: 0, lineHeight: 1, letterSpacing: "-0.01em" }}>
            Terms of Use
          </h1>
        </div>

        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.75rem" }}>
          <div className="legal-prose">
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, fontWeight: 600, marginBottom: "1.5rem" }}>
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing and using StocksRadars ("the Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Service.</p>
            </section>

            <section>
              <h2>2. Disclaimer — Not Financial Advice</h2>
              <p><strong>StocksRadars does not serve as financial advice. The data shown is for informational purposes only.</strong></p>
              <p>All information, recommendations, radars, and analysis provided by StocksRadars are for informational and educational purposes only. Nothing on this platform constitutes a solicitation, recommendation, endorsement, or offer to buy or sell any securities or other financial instruments.</p>
              <p>You should always conduct your own research and consult with a qualified financial advisor before making any investment decisions. StocksRadars and its operators shall not be held liable for any losses or damages arising from the use of the information provided.</p>
            </section>

            <section>
              <h2>3. No Guarantees</h2>
              <p>Past performance is not indicative of future results. The stock market involves risk, and you may lose some or all of your invested capital. StocksRadars makes no guarantees regarding the accuracy, completeness, or timeliness of the data or recommendations provided.</p>
            </section>

            <section>
              <h2>4. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. StocksRadars reserves the right to suspend or terminate accounts that violate these terms.</p>
            </section>

            <section>
              <h2>5. Subscription &amp; Payments</h2>
              <p>Paid subscriptions are billed on a monthly basis. You may cancel your subscription at any time. Refunds are handled on a case-by-case basis. StocksRadars reserves the right to modify pricing with 30 days' notice to existing subscribers.</p>
            </section>

            <section>
              <h2>6. Intellectual Property</h2>
              <p>All content, branding, algorithms, and data analysis methodologies on StocksRadars are the intellectual property of StocksRadars. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
            </section>

            <section>
              <h2>7. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, StocksRadars shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Service, including but not limited to financial losses resulting from investment decisions made based on information provided by the Service.</p>
            </section>

            <section>
              <h2>8. Changes to Terms</h2>
              <p>StocksRadars reserves the right to update these Terms of Use at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2>9. Governing Law</h2>
              <p>These terms are governed by and construed in accordance with the laws of the European Union and the applicable member state jurisdiction.</p>
            </section>

            <section>
              <h2>10. Contact</h2>
              <p>For questions regarding these Terms of Use, please contact us at <span className="highlight">support@stocksradars.com</span>.</p>
            </section>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${BORDER_CLR}`, padding: "1.5rem 1.25rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: MUTED }}>
            © {new Date().getFullYear()} StocksRadars. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
