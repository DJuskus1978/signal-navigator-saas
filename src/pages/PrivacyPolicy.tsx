import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="font-display text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground font-medium">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>StocksRadars ("we", "us", "our") is committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">2. Data Controller</h2>
            <p>StocksRadars acts as the data controller for the personal data processed through our platform. For any inquiries, contact us at <span className="text-primary">privacy@stocksradars.com</span>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">3. Data We Collect</h2>
            <p>We collect the following types of personal data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Email address, display name, and authentication credentials.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, timestamps, and interaction patterns.</li>
              <li><strong className="text-foreground">Payment Data:</strong> Billing information processed securely through our third-party payment provider (Stripe). We do not store your full credit card details.</li>
              <li><strong className="text-foreground">Technical Data:</strong> IP address, browser type, device information, and operating system.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">4. Legal Basis for Processing (GDPR)</h2>
            <p>We process your personal data based on the following legal grounds:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Contractual Necessity:</strong> To provide the Service you signed up for.</li>
              <li><strong className="text-foreground">Legitimate Interest:</strong> To improve our Service, prevent fraud, and ensure security.</li>
              <li><strong className="text-foreground">Consent:</strong> For optional marketing communications. You can withdraw consent at any time.</li>
              <li><strong className="text-foreground">Legal Obligation:</strong> To comply with applicable laws and regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">5. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To create and manage your account</li>
              <li>To provide stock recommendations and analysis</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send service-related communications</li>
              <li>To improve and personalize the Service</li>
              <li>To ensure platform security and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">6. Your Rights (GDPR)</h2>
            <p>Under the GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Right of Access:</strong> Request a copy of your personal data.</li>
              <li><strong className="text-foreground">Right to Rectification:</strong> Request correction of inaccurate data.</li>
              <li><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong className="text-foreground">Right to Restrict Processing:</strong> Request limitation of data processing.</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong className="text-foreground">Right to Object:</strong> Object to processing based on legitimate interests.</li>
              <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent at any time for consent-based processing.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at <span className="text-primary">privacy@stocksradars.com</span>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">7. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide the Service. After account deletion, we retain data for up to 30 days for backup purposes, after which it is permanently deleted. Financial transaction records may be retained longer as required by law.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">8. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data, including encryption in transit and at rest, access controls, and regular security assessments.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">9. Third-Party Services</h2>
            <p>We may share data with trusted third-party service providers who assist in operating the Service, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Authentication providers</li>
              <li>Payment processors (Stripe)</li>
              <li>Cloud hosting providers</li>
              <li>Analytics services</li>
            </ul>
            <p className="mt-2">All third parties are bound by data processing agreements in compliance with GDPR.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">10. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use tracking cookies for advertising purposes. For more details, refer to our cookie preferences in the platform settings.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">11. International Data Transfers</h2>
            <p>Your data may be processed in countries outside the European Economic Area (EEA). In such cases, we ensure adequate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">12. Children's Privacy</h2>
            <p>StocksRadars is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">13. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">14. Supervisory Authority</h2>
            <p>If you believe your data protection rights have been violated, you have the right to lodge a complaint with your local Data Protection Authority (DPA).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">15. Contact</h2>
            <p>For privacy-related inquiries, please contact us at <span className="text-primary">privacy@stocksradars.com</span>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} StocksRadars. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
