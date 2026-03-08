import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";

export default function MarketingPlanPage() {
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - hidden when printing */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 print:hidden">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">Stocks<span className="text-primary">Radars</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="/downloads/stocksradars-marketing-plan.md" download>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> Download MD
              </Button>
            </a>
            <Button onClick={handlePrintPDF} size="sm" className="gap-2">
              <FileText className="w-4 h-4" /> Save as PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl print:max-w-none print:py-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 print:hidden">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Print header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold">StocksRadars — 3-Week Social Media & Ads Plan</h1>
          <p className="text-sm text-muted-foreground">Facebook & X | Australian & Canadian Markets</p>
        </div>

        <div className="space-y-10 print:space-y-6">
          {/* Title */}
          <div className="print:hidden">
            <h1 className="font-display text-3xl font-bold mb-2">3-Week Social Media & Ads Plan</h1>
            <p className="text-muted-foreground">Facebook & X — Australian & Canadian Markets</p>
          </div>

          {/* Overview */}
          <Section title="Campaign Overview">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ["Duration", "3 weeks (21 days)"],
                ["Platforms", "Facebook, X (Twitter)"],
                ["Markets", "Australia & Canada"],
                ["Goal", "Trial → Paid subscribers"],
                ["Budget Split", "60% FB, 40% X"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground text-sm">{value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Target Audience */}
          <Section title="Target Audience">
            <Table headers={["Attribute", "Details"]} rows={[
              ["Age", "25–55"],
              ["Interests", "Stock trading, investing, Nasdaq, S&P 500, Dow Jones"],
              ["Behavior", "Online traders, finance app users, business news readers"],
              ["Geo", "Australia (AEST 7–9 AM) & Canada (ET 7–9 AM)"],
            ]} />
          </Section>

          {/* Week 1 */}
          <Section title="Week 1 — AWARENESS (Problem/Solution)">
            <WeekSchedule items={[
              { day: "Mon", platform: "FB", format: "Static 1200×628", visual: "ad-stop-guessing.jpg", headline: "Stop Guessing. Start Trading Smarter.", body: "Most amateur traders rely on gut feeling. StocksRadars uses AI to give you clear Buy, Hold, or Sell signals — like a traffic light for stocks. Try it free for 7 days." },
              { day: "Tue", platform: "X", format: "Square 1080×1080", visual: "ad-square-traffic-light.jpg", headline: "🟢 Buy. 🟡 Hold. 🔴 Sell. That's it.", body: "No jargon. No confusion. StocksRadars gives you clear stock recommendations powered by AI. Start your free trial → stocksradars.com" },
              { day: "Wed", platform: "FB", format: "Story 1080×1920", visual: "ad-story-trade-smarter.jpg", headline: "What if trading was as simple as a traffic light?", body: "Swipe Up → Free Trial" },
              { day: "Thu", platform: "X", format: "Image 1200×628", visual: "ad-stop-guessing.jpg", headline: "Personal testimonial style", body: "I used to spend hours reading charts. Now I open StocksRadars, check the traffic light, and make my move. 🟢🟡🔴 AI-powered. Simple." },
              { day: "Fri", platform: "FB", format: "Carousel (3 cards)", visual: "—", headline: "Problem → Solution → CTA", body: "Card 1: Tired of guessing? Card 2: Meet your AI stock radar. Card 3: Start free for 7 days." },
              { day: "Sat–Sun", platform: "Both", format: "Boost", visual: "Top performer", headline: "Reshare best performer", body: "Boost top-performing post with $20–50 spend per market." },
            ]} />
          </Section>

          {/* Week 2 */}
          <Section title="Week 2 — EDUCATION (Product Demo & Social Proof)">
            <WeekSchedule items={[
              { day: "Mon", platform: "FB", format: "Static 1200×628", visual: "ad-one-glance.jpg", headline: "See Every Stock at a Glance", body: "Our AI dashboard scans Nasdaq, Dow & S&P 500 — gives each stock a traffic light rating. No financial degree required." },
              { day: "Tue", platform: "X", format: "Thread (3 tweets)", visual: "—", headline: "Educational thread", body: "Tweet 1: Built for YOU, not Wall Street. Tweet 2: 15+ indicators → one signal. Tweet 3: No jargon, just trade smarter." },
              { day: "Wed", platform: "FB", format: "Static 1200×628", visual: "ad-pricing-value.jpg", headline: "Plans Starting at $9/month", body: "From casual investor to full-time trader — all plans include AI Buy/Hold/Sell signals. Start with free 7-day trial." },
              { day: "Thu", platform: "X", format: "Square 1080×1080", visual: "ad-square-traffic-light.jpg", headline: "User testimonial style", body: '"I checked StocksRadars before buying AAPL. The radar said 🟢 Strong Buy. Best $9/month ever."' },
              { day: "Fri", platform: "FB", format: "Static 1200×628", visual: "ad-one-glance.jpg", headline: "Your AI Trading Assistant", body: "Analyzes technicals, fundamentals & news for 1,500+ stocks. You just check the color." },
              { day: "Sat–Sun", platform: "Both", format: "Retargeting", visual: "Top performer", headline: "Retarget website visitors", body: "Urgency copy: 'Don't miss out — trial ends soon'" },
            ]} />
          </Section>

          {/* Week 3 */}
          <Section title="Week 3 — CONVERSION (Pricing & Urgency)">
            <WeekSchedule items={[
              { day: "Mon", platform: "FB", format: "Static 1200×628", visual: "ad-free-trial.jpg", headline: "Your Free Trial Is Waiting", body: "7 days. Full access. No credit card required. See why traders are switching to AI-powered recommendations." },
              { day: "Tue", platform: "X", format: "Image + Poll", visual: "ad-free-trial.jpg", headline: "How do you pick stocks? 👇", body: "Poll: 1) Gut feeling 2) News 3) Technical analysis 4) AI. Follow-up: If you picked 1–3, try StocksRadars free." },
              { day: "Wed", platform: "FB", format: "Story 1080×1920", visual: "ad-story-trade-smarter.jpg", headline: "Join 500+ traders using AI", body: "Swipe Up → stocksradars.com" },
              { day: "Thu", platform: "X", format: "Static 1200×628", visual: "ad-pricing-value.jpg", headline: "$9/month = 25 AI checks/day", body: "That's less than your morning coffee. Trade smarter, not harder." },
              { day: "Fri", platform: "FB", format: "Carousel (4 cards)", visual: "—", headline: "Pricing Breakdown", body: "Novice: FREE trial → Day Trader: $9/mo → Pro: $19/mo → Bull: $29/mo (Unlimited + Crypto)" },
              { day: "Sat", platform: "Both", format: "Urgency", visual: "ad-free-trial.jpg", headline: "Weekend special", body: "Start your free trial this weekend and get a head start on Monday's market." },
              { day: "Sun", platform: "Both", format: "Recap", visual: "—", headline: "Social proof recap", body: "This week, users checked 10,000+ stocks. Most popular signal? 🟢 Strong Buy on tech. Join them." },
            ]} />
          </Section>

          {/* Ad Assets */}
          <Section title="Ad Creative Assets">
            <Table headers={["File", "Format", "Size", "Use Case"]} rows={[
              ["ad-stop-guessing.jpg", "Horizontal", "1200×628", "FB feed, X feed"],
              ["ad-one-glance.jpg", "Horizontal", "1200×628", "FB feed, X feed"],
              ["ad-story-trade-smarter.jpg", "Vertical", "1080×1920", "FB/IG Stories"],
              ["ad-pricing-value.jpg", "Horizontal", "1200×628", "FB feed, X feed"],
              ["ad-square-traffic-light.jpg", "Square", "1080×1080", "X feed, IG feed"],
              ["ad-free-trial.jpg", "Horizontal", "1200×628", "FB feed, X feed"],
            ]} />
          </Section>

          {/* Budget */}
          <Section title="Budget Recommendations">
            <Table headers={["Item", "Weekly (per market)", "3-Week Total"]} rows={[
              ["Facebook Ads (AU)", "$150–250", "$450–750"],
              ["Facebook Ads (CA)", "$150–250", "$450–750"],
              ["X Ads (AU)", "$100–150", "$300–450"],
              ["X Ads (CA)", "$100–150", "$300–450"],
              ["Total", "$500–800/week", "$1,500–2,400"],
            ]} />
          </Section>

          {/* KPIs */}
          <Section title="Key Metrics to Track">
            <Table headers={["Metric", "Target"]} rows={[
              ["CPL (Cost Per Lead)", "< $5 AUD / $4 CAD"],
              ["CTR (Click-Through Rate)", "> 1.5% (FB), > 0.8% (X)"],
              ["Trial → Paid Conversion", "> 15%"],
              ["ROAS (Return on Ad Spend)", "> 3x by Week 3"],
            ]} />
          </Section>

          {/* Compliance */}
          <Section title="Compliance Notes">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="font-semibold text-destructive text-sm">⚠️ MANDATORY DISCLAIMER — All posts must include:</p>
              <blockquote className="border-l-2 border-muted-foreground/30 pl-4 text-sm text-muted-foreground italic">
                "StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice. Past performance does not guarantee future results. Always do your own research."
              </blockquote>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Australia: Comply with ASIC advertising guidelines</li>
                <li>Canada: Comply with CSA/OSC advertising guidelines</li>
                <li>Both markets: No guaranteed return claims</li>
              </ul>
            </div>
          </Section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 print:mt-6">© {new Date().getFullYear()} StocksRadars. All rights reserved.</p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="font-display text-xl font-bold text-foreground mb-4 border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-muted-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ScheduleItem = {
  day: string;
  platform: string;
  format: string;
  visual: string;
  headline: string;
  body: string;
};

function WeekSchedule({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 break-inside-avoid">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{item.day}</span>
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">{item.platform}</span>
            <span className="text-xs text-muted-foreground">{item.format}</span>
          </div>
          <p className="font-semibold text-foreground text-sm">{item.headline}</p>
          <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
          {item.visual !== "—" && item.visual !== "Top performer" && (
            <p className="text-xs text-primary/70 mt-1">📎 {item.visual}</p>
          )}
        </div>
      ))}
    </div>
  );
}
