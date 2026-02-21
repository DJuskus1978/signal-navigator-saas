import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Stripe product IDs to our subscription tiers
const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_U1HYWVLuzM8xNa": "day_trader",
  "prod_U1HZGZ35UWEXyX": "pro_day_trader",
  "prod_U1HZpXDsHgEAb1": "bull_trader",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking trial");

      // Check trial expiry from profiles
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("trial_started_at")
        .eq("user_id", user.id)
        .single();

      const trialStartedAt = profile?.trial_started_at;
      let isTrialExpired = false;
      let trialDaysLeft = 7;

      if (trialStartedAt) {
        const trialEnd = new Date(trialStartedAt);
        trialEnd.setDate(trialEnd.getDate() + 7);
        isTrialExpired = new Date() > trialEnd;
        trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      return new Response(JSON.stringify({
        subscribed: false,
        tier: "novice",
        is_trial_expired: isTrialExpired,
        trial_days_left: trialDaysLeft,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions (trialing = upgraded during free trial)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5,
    });

    const activeSub = subscriptions.data.find(s => s.status === "active" || s.status === "trialing");
    const hasActiveSub = !!activeSub;
    let tier = "novice";
    let subscriptionEnd: string | null = null;

    logStep("Subscriptions listed", { count: subscriptions.data.length, statuses: subscriptions.data.map(s => s.status), hasActiveSub });

    if (hasActiveSub && activeSub) {
      if (activeSub.current_period_end) {
        subscriptionEnd = new Date(activeSub.current_period_end * 1000).toISOString();
      }
      const productId = activeSub.items.data[0]?.price?.product as string;
      tier = PRODUCT_TO_TIER[productId] || "novice";
      logStep("Active/trialing subscription", { tier, status: activeSub.status, subscriptionEnd });
    } else {
      logStep("No active subscription");
    }

    // Sync tier to profiles table
    await supabaseClient.from("profiles").update({
      subscription_tier: tier,
      is_subscribed: hasActiveSub,
      stripe_customer_id: customerId,
    }).eq("user_id", user.id);

    logStep("Profile updated", { tier, subscribed: hasActiveSub });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
