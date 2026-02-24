export const STRIPE_PLANS = {
  novice: {
    price_id: "price_1T3F3UQPNlHh1Fowq59xXBcC",
    product_id: "prod_U1HcTz9ZFmZ5AL",
    name: "Novice Trader",
    price: 0,
    emoji: "",
    trialDays: 7,
  },
  day_trader: {
    price_id: "price_1T4SD9KddcYfSbXSoP9u9r35",
    product_id: "prod_U2XHyN6odOzbBI",
    name: "Day Trader",
    price: 9,
    emoji: "⚡",
  },
  pro_day_trader: {
    price_id: "price_1T4SDLKddcYfSbXSRQ8K1CLq",
    product_id: "prod_U2XHJQpdFxEER6",
    name: "Pro Day Trader",
    price: 19,
    emoji: "🚀",
  },
  bull_trader: {
    price_id: "price_1T4SDhKddcYfSbXSZwu60BbD",
    product_id: "prod_U2XINXVl9dLCJv",
    name: "Bull Trader",
    price: 29,
    emoji: "💵",
  },
} as const;

export type PlanTier = keyof typeof STRIPE_PLANS;
export type PaidTier = Exclude<PlanTier, "novice">;
