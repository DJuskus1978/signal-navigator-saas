

# StockRadar.com — MVP Plan

## Overview
A clean, friendly web app for amateur stock traders providing simplified traffic-light recommendations (Buy, Hold, Don't Buy, Sell) for Nasdaq, Dow, and S&P 500 stocks. Powered by live FMP data with server-side caching, multi-tier subscription via Stripe.

---

## Pages & Features

### 1. Landing Page
- Hero section with StockRadar branding — clear value proposition: "Simple stock recommendations for everyday investors"
- How it works section (3 steps: Sign up → Subscribe → Get recommendations)
- Tiered pricing cards with CTA to sign up
- Traffic light visual preview showing Buy/Hold/Sell concept
- FMP official partner attribution block

### 2. Authentication
- Google + Apple social login, email/password signup
- Free 7-day trial (Novice tier) with limited access
- Paywall prompt to subscribe for full access

### 3. Dashboard (Main Screen)
- Three tabs: **Nasdaq**, **Dow Jones**, **S&P 500**
- Stock list with each stock showing:
  - Ticker & company name
  - Current price & daily change %
  - **Traffic light indicator**: 🟢 Buy, 🟡 Hold, 🟠 Don't Buy, 🔴 Sell
  - Confidence level (e.g., "Strong" / "Moderate")
- Sort/filter by recommendation type
- Clean card-based layout, easy to scan

### 4. Stock Detail Page (Radar View)
- Summary of the recommendation with plain-English explanation
- Key technical indicators (RSI, MACD, Moving Averages — displayed simply)
- Key fundamental factors (P/E ratio, earnings trend — simplified)
- News sentiment and analyst grades
- Overall recommendation with traffic light

### 5. Subscription & Payment
- Stripe integration with 4 tiers (see Monetization below)
- Manage subscription page (cancel/update via Stripe Customer Portal)
- 7-day free trial for Novice tier

---

## Monetization — Subscription Tiers

| Tier | Price | Daily Checks | Features |
|------|-------|-------------|----------|
| **Novice Trader** | Free (7-day trial) | 2 | Balanced profile, Simple mode only |
| **Day Trader** | $9/month | 25 | Balanced profile, Simple mode |
| **Pro Day Trader** | $19/month | 50 | All profiles, Simple + Advanced modes |
| **Bull Trader** | $29/month | Unlimited | All profiles/modes + Crypto radars |

- Usage tracked via `subscription_tier` and `trial_started_at` on profiles
- Upgrade during trial charges full amount immediately; next billing anchored to trial end

---

## Data Source — FMP Commercial Agreement ✅

### Contract Details
- **Provider**: Financial Modeling Prep (FMP)
- **Plan**: Fundamentals + Technical Indicators + Market News
- **Cost**: $350/month ($4,200/year)
- **API Capacity**: 3,000 calls/minute, 1TB/month
- **User Tier**: Supports up to 1,000 end-users (Tier 1)
- **Tier 2 threshold**: >1,000 users → ~$7,050/year

### API Usage Per Feature
| Action | FMP Calls | Notes |
|--------|-----------|-------|
| Dashboard load (1 tab) | ~8 | Batch quotes for 8 stocks |
| Full Radar view | ~8 | Quote + RSI + SMA50 + SMA200 + EMA20 + EMA12 + EMA26 + News + Grades |
| Search | ~2 | Symbol search + name search + quotes |

### Capacity Estimates
- **Max daily Radar views**: ~540,000 (at 3,000 calls/min)
- **Peak concurrent load (1,000 users)**: ~800 calls/min — well within limit
- **Note**: Social sentiment data unavailable on current FMP plan (neutral baselines used)

---

## Server-Side Caching ✅ (Implemented)

### Architecture
- **`stock_cache` table** in database with `cache_key`, `data` (JSONB), `fetched_at`, `expires_at`
- **Cache-aside pattern**: edge function checks cache before calling FMP
- **Service role access only** (RLS enabled, no public policies)
- **Probabilistic cleanup**: ~10% of requests prune expired entries

### Cache TTLs
| Request Type | TTL | Sharing |
|-------------|-----|---------|
| Dashboard batch quotes | 5 min | Shared across ALL users per exchange tab |
| Stock detail (Radar) | 2 min | Shared per symbol |
| Search results | 3 min | Shared per query |

### Impact on FMP Usage
- Dashboard loads for multiple users within 5 min window → **1 FMP call set** instead of N
- Dramatically reduces calls for trial users browsing the same popular stocks
- Estimated **80-90% reduction** in redundant API calls during peak hours

---

## Breakeven Analysis 💰

### Fixed Costs
| Item | Monthly | Annual |
|------|---------|--------|
| FMP Data License | $350 | $4,200 |
| Lovable Cloud | TBD | TBD |
| Stripe fees (~2.9% + $0.30/txn) | Variable | Variable |

### Revenue Per Tier (Monthly)
| Tier | Price | Net after Stripe (~2.9%+$0.30) |
|------|-------|---------------------------------|
| Novice | $0 | $0 |
| Day Trader | $9 | ~$8.44 |
| Pro Day Trader | $19 | ~$18.15 |
| Bull Trader | $29 | ~$27.86 |

### Breakeven Scenarios (FMP cost only: $350/mo)
| Scenario | Users Needed |
|----------|-------------|
| All Day Trader ($9) | ~42 paid users |
| All Pro Day Trader ($19) | ~20 paid users |
| All Bull Trader ($29) | ~13 paid users |
| Mixed (50% Day / 30% Pro / 20% Bull) | ~27 paid users |

### Growth Milestones
- **Break-even**: ~27-42 paid users (depending on tier mix)
- **Tier 1 limit**: 1,000 end-users → triggers Tier 2 FMP pricing (~$7,050/yr)
- **Tier 2 breakeven**: ~70 paid users at mixed tier rates

---

## Recommendation Algorithm (RadarScore™)
- Scoring engine using live FMP data
- Technical signals: RSI, MACD (computed from EMA12/26), SMA50/200, EMA20, volume trends
- Fundamental signals: P/E ratio, earnings growth, debt-to-equity, profit margin, ROE
- Sentiment signals: News count, analyst grades, grade actions (upgrade/downgrade)
- Outputs composite score mapped to 4 categories: Buy, Hold, Don't Buy, Sell
- Investor profiles: Balanced (default), Conservative, Active

---

## Backend (Lovable Cloud)
- User authentication (Google + Apple + email)
- User profiles table with subscription tracking
- `stock_cache` table for server-side API response caching
- `api_usage` table for daily usage limit enforcement
- Edge functions:
  - `fetch-stocks` — FMP data proxy with caching layer
  - `check-subscription` — Stripe subscription sync
  - `create-checkout` — Stripe checkout session creation
  - `customer-portal` — Stripe billing management

---

## Design Direction
- Light, clean, approachable — not intimidating
- Card-based layout with generous whitespace
- Traffic light colors as accent (green, yellow, orange, red)
- Mobile-responsive from the start
