import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
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

        <h1 className="font-display text-3xl font-bold mb-8">Terms of Use</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground font-medium">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using StocksRadars ("the Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">2. Disclaimer — Not Financial Advice</h2>
            <p><strong className="text-foreground">StocksRadars does not serve as financial advice. The data shown is for informational purposes only.</strong></p>
            <p>All information, recommendations, radars, and analysis provided by StocksRadars are for informational and educational purposes only. Nothing on this platform constitutes a solicitation, recommendation, endorsement, or offer to buy or sell any securities or other financial instruments.</p>
            <p>You should always conduct your own research and consult with a qualified financial advisor before making any investment decisions. StocksRadars and its operators shall not be held liable for any losses or damages arising from the use of the information provided.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">3. No Guarantees</h2>
            <p>Past performance is not indicative of future results. The stock market involves risk, and you may lose some or all of your invested capital. StocksRadars makes no guarantees regarding the accuracy, completeness, or timeliness of the data or recommendations provided.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">4. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. StocksRadars reserves the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">5. Subscription & Payments</h2>
            <p>Paid subscriptions are billed on a monthly basis. You may cancel your subscription at any time. Refunds are handled on a case-by-case basis. StocksRadars reserves the right to modify pricing with 30 days' notice to existing subscribers.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
            <p>All content, branding, algorithms, and data analysis methodologies on StocksRadars are the intellectual property of StocksRadars. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, StocksRadars shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Service, including but not limited to financial losses resulting from investment decisions made based on information provided by the Service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p>StocksRadars reserves the right to update these Terms of Use at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">9. Governing Law</h2>
            <p>These terms are governed by and construed in accordance with the laws of the European Union and the applicable member state jurisdiction.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground mb-3">10. Contact</h2>
            <p>For questions regarding these Terms of Use, please contact us at <span className="text-primary">support@stocksradars.com</span>.</p>
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
