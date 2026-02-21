export const STRIPE_PLANS = {
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

export type PaidTier = keyof typeof STRIPE_PLANS;
