import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS, type PaidTier } from "@/lib/stripe-plans";
import { toast } from "@/hooks/use-toast";

export async function startCheckout(tier: PaidTier) {
  const plan = STRIPE_PLANS[tier];
  
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId: plan.price_id },
  });

  if (error || !data?.url) {
    toast({
      title: "Checkout error",
      description: error?.message || "Could not start checkout. Please try again.",
      variant: "destructive",
    });
    return;
  }

  window.open(data.url, "_blank");
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");

  if (error || !data?.url) {
    toast({
      title: "Error",
      description: error?.message || "Could not open subscription management.",
      variant: "destructive",
    });
    return;
  }

  window.open(data.url, "_blank");
}
