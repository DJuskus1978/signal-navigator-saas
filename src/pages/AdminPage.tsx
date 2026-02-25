import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RadarLogo } from "@/components/RadarLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, LogOut, ArrowUpDown, Users, CreditCard, TrendingUp, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface AdminUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_subscribed: boolean;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  subscription_tier: string | null;
  is_subscription_exempt: boolean;
}

type SortField = "email" | "created_at" | "subscription_tier";
type SortDir = "asc" | "desc";

const TIER_LABELS: Record<string, string> = {
  novice: "Novice",
  day_trader: "Day Trader",
  pro_day_trader: "Pro Day Trader",
  bull_trader: "Bull Trader",
};

const TIER_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  novice: "secondary",
  day_trader: "outline",
  pro_day_trader: "default",
  bull_trader: "default",
};

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [fetching, setFetching] = useState(true);
  const [togglingExempt, setTogglingExempt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const fetchUsers = async () => {
    setFetching(true);
    const { data, error } = await supabase.rpc("get_admin_users");
    if (!error && data) setUsers(data as AdminUser[]);
    setFetching(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const handleToggleExempt = async (userId: string, newValue: boolean) => {
    setTogglingExempt(userId);
    const { error } = await supabase.rpc("set_subscription_exempt", {
      _target_user_id: userId,
      _exempt: newValue,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newValue ? "User exempted" : "Exemption removed", description: newValue ? "User now has full access without paying." : "User will need a subscription." });
      await fetchUsers();
    }
    setTogglingExempt(null);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (isAdmin === null) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const totalUsers = users.length;
  const paidUsers = users.filter((u) => u.subscription_tier && u.subscription_tier !== "novice").length;
  const exemptUsers = users.filter((u) => u.is_subscription_exempt).length;
  const tierCounts: Record<string, number> = { novice: 0, day_trader: 0, pro_day_trader: 0, bull_trader: 0 };
  users.forEach((u) => {
    const t = u.subscription_tier || "novice";
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  let filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.email?.toLowerCase().includes(q) ?? false) ||
      (u.display_name?.toLowerCase().includes(q) ?? false);
    const tier = u.subscription_tier || "novice";
    const matchTier = tierFilter === "all" || tierFilter === tier ||
      (tierFilter === "paid" && tier !== "novice") ||
      (tierFilter === "free" && tier === "novice") ||
      (tierFilter === "exempt" && u.is_subscription_exempt);
    return matchSearch && matchTier;
  });

  filtered.sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "email") return ((a.email ?? "") > (b.email ?? "") ? 1 : -1) * dir;
    if (sortField === "subscription_tier") {
      const order = ["novice", "day_trader", "pro_day_trader", "bull_trader"];
      return (order.indexOf(a.subscription_tier || "novice") - order.indexOf(b.subscription_tier || "novice")) * dir;
    }
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">StocksRadars</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Admin — Users</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="font-display text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CreditCard className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-display text-2xl font-bold">{paidUsers}</p>
              <p className="text-xs text-muted-foreground">Paid Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldCheck className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="font-display text-2xl font-bold">{exemptUsers}</p>
              <p className="text-xs text-muted-foreground">Exempt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-display text-2xl font-bold">{tierCounts.novice}</p>
              <p className="text-xs text-muted-foreground">Novice (Free)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-display text-2xl font-bold">{tierCounts.day_trader}</p>
              <p className="text-xs text-muted-foreground">Day Trader</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="font-display text-2xl font-bold">{tierCounts.pro_day_trader}</p>
              <p className="text-xs text-muted-foreground">Pro Day Trader</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-display text-2xl font-bold">{tierCounts.bull_trader}</p>
              <p className="text-xs text-muted-foreground">Bull Trader</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="paid">All Paid</SelectItem>
              <SelectItem value="free">Free Only</SelectItem>
              <SelectItem value="exempt">Exempt Only</SelectItem>
              <SelectItem value="novice">Novice Trader</SelectItem>
              <SelectItem value="day_trader">Day Trader</SelectItem>
              <SelectItem value="pro_day_trader">Pro Day Trader</SelectItem>
              <SelectItem value="bull_trader">Bull Trader</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("email")}>
                    Email <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("subscription_tier")}>
                    Plan <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Exempt</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("created_at")}>
                    Joined <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const tier = u.subscription_tier || "novice";
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.email ?? "—"}</TableCell>
                      <TableCell>{u.display_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={TIER_VARIANTS[tier] ?? "secondary"}>
                            {TIER_LABELS[tier] ?? tier}
                          </Badge>
                          {u.is_subscription_exempt && (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">
                              EXEMPT
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.is_subscription_exempt}
                          disabled={togglingExempt === u.user_id}
                          onCheckedChange={(checked) => handleToggleExempt(u.user_id, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
