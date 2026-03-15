import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
        </div>

        <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${CYAN}`, padding: "1.75rem" }}>
          <div className="legal-prose">
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: WHITE, fontWeight: 600, marginBottom: "1.5rem" }}>
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            <section>
              <h2>1. Introduction</h2>
              <p>StocksRadars ("we", "us", "our") is committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.</p>
            </section>

            <section>
              <h2>2. Data Controller</h2>
              <p>StocksRadars acts as the data controller for the personal data processed through our platform. For any inquiries, contact us at <span className="highlight">privacy@stocksradars.com</span>.</p>
            </section>

            <section>
              <h2>3. Data We Collect</h2>
              <p>We collect the following types of personal data:</p>
              <ul>
                <li><strong>Account Information:</strong> Email address, display name, and authentication credentials.</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, timestamps, and interaction patterns.</li>
                <li><strong>Payment Data:</strong> Billing information processed securely through our third-party payment provider (Stripe). We do not store your full credit card details.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and operating system.</li>
              </ul>
            </section>

            <section>
              <h2>4. Legal Basis for Processing (GDPR)</h2>
              <p>We process your personal data based on the following legal grounds:</p>
              <ul>
                <li><strong>Contractual Necessity:</strong> To provide the Service you signed up for.</li>
                <li><strong>Legitimate Interest:</strong> To improve our Service, prevent fraud, and ensure security.</li>
                <li><strong>Consent:</strong> For optional marketing communications. You can withdraw consent at any time.</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations.</li>
              </ul>
            </section>

            <section>
              <h2>5. How We Use Your Data</h2>
              <ul>
                <li>To create and manage your account</li>
                <li>To provide stock recommendations and analysis</li>
                <li>To process payments and manage subscriptions</li>
                <li>To send service-related communications</li>
                <li>To improve and personalize the Service</li>
                <li>To ensure platform security and prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2>6. Your Rights (GDPR)</h2>
              <p>Under the GDPR, you have the following rights:</p>
              <ul>
                <li><strong>Right of Access:</strong> Request a copy of your personal data.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data.</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing.</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests.</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time for consent-based processing.</li>
              </ul>
              <p>To exercise any of these rights, contact us at <span className="highlight">privacy@stocksradars.com</span>.</p>
            </section>

            <section>
              <h2>7. Data Retention</h2>
              <p>We retain your personal data for as long as your account is active or as needed to provide the Service. After account deletion, we retain data for up to 30 days for backup purposes, after which it is permanently deleted. Financial transaction records may be retained longer as required by law.</p>
            </section>

            <section>
              <h2>8. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal data, including encryption in transit and at rest, access controls, and regular security assessments.</p>
            </section>

            <section>
              <h2>9. Third-Party Services</h2>
              <p>We may share data with trusted third-party service providers who assist in operating the Service, including:</p>
              <ul>
                <li>Authentication providers</li>
                <li>Payment processors (Stripe)</li>
                <li>Cloud hosting providers</li>
                <li>Analytics services</li>
              </ul>
              <p>All third parties are bound by data processing agreements in compliance with GDPR.</p>
            </section>

            <section>
              <h2>10. Cookies</h2>
              <p>We use essential cookies for authentication and session management. We do not use tracking cookies for advertising purposes. For more details, refer to our cookie preferences in the platform settings.</p>
            </section>

            <section>
              <h2>11. International Data Transfers</h2>
              <p>Your data may be processed in countries outside the European Economic Area (EEA). In such cases, we ensure adequate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.</p>
            </section>

            <section>
              <h2>12. Children's Privacy</h2>
              <p>StocksRadars is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors.</p>
            </section>

            <section>
              <h2>13. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2>14. Supervisory Authority</h2>
              <p>If you believe your data protection rights have been violated, you have the right to lodge a complaint with your local Data Protection Authority (DPA).</p>
            </section>

            <section>
              <h2>15. Contact</h2>
              <p>For privacy-related inquiries, please contact us at <span className="highlight">privacy@stocksradars.com</span>.</p>
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
