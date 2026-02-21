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
    price_id: "price_1T3EzOQPNlHh1FowZMmm67p4",
    product_id: "prod_U1HYWVLuzM8xNa",
    name: "Day Trader",
    price: 9,
    emoji: "⚡",
  },
  pro_day_trader: {
    price_id: "price_1T3EzvQPNlHh1FowAETjSlQN",
    product_id: "prod_U1HZGZ35UWEXyX",
    name: "Pro Day Trader",
    price: 19,
    emoji: "🚀",
  },
  bull_trader: {
    price_id: "price_1T3F08QPNlHh1Fowb8mxsDDW",
    product_id: "prod_U1HZpXDsHgEAb1",
    name: "Bull Trader",
    price: 29,
    emoji: "💵",
  },
} as const;

export type PlanTier = keyof typeof STRIPE_PLANS;
export type PaidTier = Exclude<PlanTier, "novice">;
