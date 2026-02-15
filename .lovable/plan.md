

# StockRadar.com — MVP Plan

## Overview
A clean, friendly web app for amateur stock traders providing simplified traffic-light recommendations (Buy, Hold, Don't Buy, Sell) for Nasdaq, Dow, and S&P 500 stocks. Starts with mock data, €7/month subscription via Stripe.

---

## Pages & Features

### 1. Landing Page
- Hero section with StockRadar branding — clear value proposition: "Simple stock recommendations for everyday investors"
- How it works section (3 steps: Sign up → Subscribe → Get recommendations)
- Pricing card (€7/month) with CTA to sign up
- Traffic light visual preview showing Buy/Hold/Sell concept

### 2. Authentication
- Google social login + email/password signup
- Free users see a teaser dashboard with blurred/locked recommendations
- Paywall prompt to subscribe for full access

### 3. Dashboard (Main Screen — Paid Users)
- Three tabs: **Nasdaq**, **Dow Jones**, **S&P 500**
- Stock list with each stock showing:
  - Ticker & company name
  - Current price & daily change %
  - **Traffic light indicator**: 🟢 Buy, 🟡 Hold, 🟠 Don't Buy, 🔴 Sell
  - Confidence level (e.g., "Strong" / "Moderate")
- Sort/filter by recommendation type
- Clean card-based layout, easy to scan

### 4. Stock Detail Page
- Summary of the recommendation with plain-English explanation
- Key technical indicators used (RSI, MACD, Moving Averages — displayed simply)
- Key fundamental factors (P/E ratio, earnings trend — simplified)
- Overall recommendation with traffic light

### 5. Subscription & Payment
- Stripe integration for €7/month subscription
- Manage subscription page (cancel/update)
- Free trial or freemium teaser to drive conversions

---

## Recommendation Algorithm (Mock v1)
- Built as a scoring engine using mock data
- Considers technical signals: RSI, MACD crossover, 50/200-day MA, volume trends
- Considers fundamental signals: P/E ratio, earnings growth, debt-to-equity
- Outputs a composite score mapped to 4 categories: Buy, Hold, Don't Buy, Sell
- Later: replace mock data with real API (Alpha Vantage, Finnhub, etc.)

---

## Backend (Lovable Cloud)
- User authentication (Google + email)
- User profiles table
- Subscription status tracking
- Edge function for recommendation logic

---

## Design Direction
- Light, clean, approachable — not intimidating
- Card-based layout with generous whitespace
- Traffic light colors as accent (green, yellow, orange, red)
- Mobile-responsive from the start

