import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft, Send, Mail, MessageCircle, Phone, LogIn } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", {
        body: result.data,
      });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-display font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          Have a question or feedback? Reach out and we'll get back to you as soon as possible.
        </p>

        {/* Live support title */}
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Support Numbers</h2>
        </div>

        {/* Support channels */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <a href="tel:+37060039999" className="block">
            <Card className="bg-card border-border cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                <Phone className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">WhatsApp / Call</span>
                <span className="text-sm font-semibold">+370 600 39999</span>
              </CardContent>
            </Card>
          </a>
          <a href="tel:+34671880069" className="block">
            <Card className="bg-card border-border cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                <Phone className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">WhatsApp / Call</span>
                <span className="text-sm font-semibold">+34 671 880069</span>
              </CardContent>
            </Card>
          </a>
          <a href="mailto:donatasjuskus@icloud.com" className="block">
            <Card className="bg-card border-border cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                <Mail className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Email</span>
                <span className="text-sm font-semibold break-all">donatasjuskus@icloud.com</span>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Contact form */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            {user ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                  {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                </div>
                <Button type="submit" disabled={sending} className="gap-2 self-start">
                  {sending ? "Sending…" : <><Send className="w-4 h-4" /> Send Message</>}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <LogIn className="w-8 h-8 text-muted-foreground" />
                <p className="text-muted-foreground">Please log in to send us a message.</p>
                <Link to="/auth">
                  <Button className="gap-2">
                    <LogIn className="w-4 h-4" /> Log In
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
