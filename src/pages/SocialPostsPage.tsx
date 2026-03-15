import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Copy, Facebook, Twitter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const posts = [
  {
    id: 1,
    title: "Brand Introduction",
    image: "/social/post-01-meet-stocksradars.jpg",
    category: "awareness",
    fb: {
      headline: "Meet StocksRadars 🚀",
      body: "We're StocksRadars — an AI-powered platform that gives you clear Buy, Hold, or Sell signals for every stock on Nasdaq, S&P 500 & Dow Jones.\n\nNo more guessing. No more hours reading charts.\nJust open the app, check the traffic light, and trade smarter.\n\n🟢 Buy | 🟡 Hold | 🔴 Sell\n\nFollow us for daily market insights, trading tips, and AI-powered stock analysis.\n\n👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "🚀 Meet StocksRadars\n\nWe use AI to turn 15+ stock indicators into ONE clear signal:\n\n🟢 Buy\n🟡 Hold\n🔴 Sell\n\nNo jargon. No confusion. Just smarter trading.\n\nFollow us for daily insights 📊\n\n👉 stocksradars.com",
    },
  },
  {
    id: 2,
    title: "How It Works — Traffic Light",
    image: "/social/post-02-traffic-light-system.jpg",
    category: "education",
    fb: {
      headline: "Trading Made Simple 🚦",
      body: "What if picking stocks was as simple as reading a traffic light?\n\nThat's exactly what StocksRadars does:\n🟢 Green = Strong Buy opportunity\n🟡 Yellow = Hold your position\n🔴 Red = Time to sell\n\nOur AI analyzes RSI, MACD, P/E ratios, earnings, and news sentiment — then gives you ONE clear recommendation.\n\nTry it free for 7 days 👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "🚦 Trading shouldn't be complicated.\n\nStocksRadars simplifies it to 3 colors:\n\n🟢 Buy\n🟡 Hold\n🔴 Sell\n\nOne glance. One decision.\nAI does the heavy lifting.\n\nTry free → stocksradars.com",
    },
  },
  {
    id: 3,
    title: "Educational — What is RSI?",
    image: "/social/post-03-what-is-rsi.jpg",
    category: "education",
    fb: {
      headline: "📊 Trading 101: What is RSI?",
      body: "RSI (Relative Strength Index) is one of the most popular technical indicators traders use.\n\nHere's the simple version:\n📈 RSI above 70 = Stock may be OVERBOUGHT (potential sell signal)\n📉 RSI below 30 = Stock may be OVERSOLD (potential buy opportunity)\n\nAt StocksRadars, our AI factors in RSI along with 14 other indicators to give you one clear signal — so you don't have to calculate anything yourself.\n\n💡 Save this post for later!\n\n⚠️ This is educational content, not financial advice.",
    },
    x: {
      body: "📊 Trading 101: What is RSI?\n\n• RSI > 70 = Overbought (might drop)\n• RSI < 30 = Oversold (might rise)\n\nIt's one of 15+ indicators our AI analyzes for every stock.\n\nYou get the signal. We do the math.\n\n💡 Follow for more trading education",
    },
  },
  {
    id: 4,
    title: "Feature Spotlight — RadarScore™",
    image: "/social/post-04-radar-score.jpg",
    category: "product",
    fb: {
      headline: "AI RadarScore™ — Your Edge in the Market",
      body: "Every stock on StocksRadars gets a RadarScore™ — a single number from 0 to 100 that tells you exactly how strong a stock looks right now.\n\n🔍 What goes into it?\n• Technical analysis (RSI, MACD, moving averages)\n• Fundamental data (P/E ratio, earnings growth)\n• News sentiment analysis\n• Analyst consensus ratings\n\nAll distilled into ONE score. ONE signal.\n\nStop overthinking. Start trading with confidence.\n\n👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "🎯 Introducing AI RadarScore™\n\n15+ indicators → ONE score (0-100)\n\n✅ Technical analysis\n✅ Fundamentals\n✅ News sentiment\n✅ Analyst ratings\n\nNo spreadsheets. No guessing.\nJust clarity.\n\n→ stocksradars.com",
    },
  },
  {
    id: 5,
    title: "Community Building",
    image: "/social/post-05-join-community.jpg",
    category: "community",
    fb: {
      headline: "Join 500+ Traders Trading Smarter 👋",
      body: "We're building a community of traders who believe in smarter, data-driven decisions — not gut feelings.\n\nWhether you're a beginner just getting started or an experienced trader looking for an edge, StocksRadars is for you.\n\n🤝 What you get by following us:\n• Daily market insights\n• Trading tips & education\n• AI-powered stock recommendations\n• A community that trades smarter together\n\nHit Follow and join the movement 🚀\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "👋 Welcome to the StocksRadars community\n\n500+ traders already using AI to make smarter decisions.\n\nWhat you'll get here:\n📊 Daily market insights\n💡 Trading tips\n🎯 AI stock signals\n\nFollow us & trade smarter together 🚀",
    },
  },
  {
    id: 6,
    title: "Market Pulse Update",
    image: "/social/post-06-market-pulse.jpg",
    category: "engagement",
    fb: {
      headline: "📈 Today's Market Pulse",
      body: "Here's your quick daily market snapshot:\n\n🟢 Nasdaq — Trending bullish, tech stocks leading the charge\n🟡 S&P 500 — Mixed signals, holding steady\n🟢 Dow Jones — Industrial strength continues\n\nWant to know which specific stocks our AI flags as 🟢 Strong Buy today? Check StocksRadars.\n\n📱 stocksradars.com\n\n💬 What are you watching today? Drop a ticker in the comments! 👇\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "📈 Today's Market Pulse\n\n🟢 Nasdaq — Bullish\n🟡 S&P 500 — Neutral\n🟢 Dow Jones — Bullish\n\nWhich stocks are you watching? 👇\n\nSee which stocks our AI flags as Strong Buy → stocksradars.com",
    },
  },
  {
    id: 7,
    title: "Trading Mistakes — Education",
    image: "/social/post-07-trading-mistakes.jpg",
    category: "education",
    fb: {
      headline: "❌ 3 Mistakes New Traders Make (And How to Avoid Them)",
      body: "If you're new to trading, avoid these costly mistakes:\n\n❌ Emotional Trading\nBuying on hype, panic selling on dips. AI doesn't have emotions — that's why we built StocksRadars.\n\n❌ No Exit Strategy\nKnowing when to sell is just as important as when to buy. Our traffic light system tells you both.\n\n❌ Ignoring Fundamentals\nPrice action alone isn't enough. Our AI analyzes P/E ratios, earnings, and 13 other indicators.\n\n💡 Trade smarter, not harder.\n\n👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "❌ 3 mistakes that cost new traders money:\n\n1. Emotional trading\n2. No exit strategy\n3. Ignoring fundamentals\n\nAI doesn't have emotions. That's the edge.\n\nStocksRadars analyzes 15+ indicators so you don't have to.\n\n→ stocksradars.com",
    },
  },
  {
    id: 8,
    title: "Social Proof / Testimonial",
    image: "/social/post-08-testimonial.jpg",
    category: "social-proof",
    fb: {
      headline: "⭐ What Our Users Are Saying",
      body: '"Best $9 I spend each month. The AI signals saved me from two bad trades last week."\n— David R., Day Trader ⭐⭐⭐⭐⭐\n\nReal users. Real results. StocksRadars gives you the clarity to trade with confidence.\n\nStart your free 7-day trial and see for yourself.\n\n👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice. Past performance does not guarantee future results.',
    },
    x: {
      body: '⭐⭐⭐⭐⭐\n\n"Best $9 I spend each month. The AI signals saved me from two bad trades last week."\n\n— David R., Day Trader\n\nTry it free for 7 days → stocksradars.com',
    },
  },
  {
    id: 9,
    title: "Free Trial Promotion",
    image: "/social/post-09-free-trial.jpg",
    category: "conversion",
    fb: {
      headline: "🎉 7 Days FREE — Full Access",
      body: "Want to try AI-powered stock signals before you commit?\n\nHere's what you get with your free trial:\n✅ Full access to all Nasdaq, S&P 500 & Dow Jones stocks\n✅ AI Buy/Hold/Sell signals\n✅ RadarScore™ for every stock\n✅ News sentiment analysis\n✅ Technical & fundamental indicators\n\n💳 No credit card required to start.\n\nJoin hundreds of traders already using StocksRadars.\n\n👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "🎉 7 Days FREE\n\n✅ AI stock signals\n✅ RadarScore™\n✅ News sentiment\n✅ 1,500+ stocks covered\n\n💳 No credit card needed\n\nStart trading smarter today → stocksradars.com",
    },
  },
  {
    id: 10,
    title: "Mission & Vision",
    image: "/social/post-10-mission.jpg",
    category: "brand",
    fb: {
      headline: "Trading Should Be Simple 🎯",
      body: "We believe everyone deserves access to smart trading tools — not just Wall Street professionals.\n\nThat's why we built StocksRadars:\n🎯 One clear signal for every stock\n🤖 AI that analyzes what takes humans hours\n📱 An app anyone can understand\n\nOur mission: Make stock trading accessible, transparent, and data-driven for everyone.\n\nFollow our journey and join us.\n\n👉 stocksradars.com\n\n⚠️ StocksRadars provides AI-generated stock analysis for informational purposes only. This is not financial advice.",
    },
    x: {
      body: "🎯 Trading should be simple.\n\nWe built StocksRadars so anyone — beginner or pro — can trade with confidence.\n\nOne app. One signal. One clear decision.\n\nThis is just the beginning. Follow our journey.\n\n→ stocksradars.com",
    },
  },
];

const categoryColors: Record<string, string> = {
  awareness: "bg-blue-500/20 text-blue-400",
  education: "bg-amber-500/20 text-amber-400",
  product: "bg-purple-500/20 text-purple-400",
  community: "bg-green-500/20 text-green-400",
  engagement: "bg-cyan-500/20 text-cyan-400",
  "social-proof": "bg-yellow-500/20 text-yellow-400",
  conversion: "bg-red-500/20 text-red-400",
  brand: "bg-indigo-500/20 text-indigo-400",
};

export default function SocialPostsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F2E" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1E3A7B" }}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", color: "#FFFFFF" }}>
              Stocks<span style={{ color: "#00D4FF" }}>Radars</span>
            </span>
          </Link>
          <Link to="/marketing-plan">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Marketing Plan
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-5xl">
        <h1 className="font-display text-3xl font-bold mb-2">
          Social Media Posts — FB & X
        </h1>
        <p className="text-muted-foreground mb-4">
          10 ready-to-post visuals with copy for Facebook and X (Twitter). Build credibility and grow the StocksRadars community.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-10 border border-border rounded-lg p-3 bg-muted/30">
          💡 <strong>Posting order:</strong> Start with Post 1 (Brand Intro), then alternate between education, product features, and community engagement. Save the testimonial (#8) and free trial (#9) for later when you have some followers.
        </p>

        <div className="space-y-12">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-foreground">
                    #{post.id}
                  </span>
                  <span className="font-semibold text-foreground">
                    {post.title}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${categoryColors[post.category] || ""}`}
                >
                  {post.category}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Visual */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="aspect-square rounded-xl overflow-hidden border border-border">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <a href={post.image} download>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Download className="w-4 h-4" /> Download Visual
                    </Button>
                  </a>
                </div>

                {/* Copy */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Facebook Copy */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Facebook className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-foreground">
                        Facebook
                      </span>
                    </div>
                    {post.fb.headline && (
                      <p className="text-sm font-bold text-foreground mb-1">
                        {post.fb.headline}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto pr-1">
                      {post.fb.body}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-1.5 text-xs h-7"
                      onClick={() =>
                        copyToClipboard(
                          `${post.fb.headline}\n\n${post.fb.body}`,
                          `fb-${post.id}`
                        )
                      }
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === `fb-${post.id}` ? "Copied!" : "Copy FB text"}
                    </Button>
                  </div>

                  {/* X Copy */}
                  <div className="flex-1 border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Twitter className="w-4 h-4 text-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        X (Twitter)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto pr-1">
                      {post.x.body}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-1.5 text-xs h-7"
                      onClick={() =>
                        copyToClipboard(post.x.body, `x-${post.id}`)
                      }
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === `x-${post.id}` ? "Copied!" : "Copy X text"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-10 border border-border rounded-lg p-3 bg-muted/30">
          ⚠️ <strong>Reminder:</strong> All posts must include the financial disclaimer. The copy above already includes it for Facebook posts. For X, add a reply thread with the disclaimer if character limit is tight.
        </p>
      </main>
    </div>
  );
}
