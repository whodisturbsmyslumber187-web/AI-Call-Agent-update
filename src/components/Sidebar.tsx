import { NavLink } from "react-router-dom";
import { Building2, Mic, MessageSquare, Calendar, Settings, LogOut, Activity, BarChart3, Users, ShieldCheck, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { to: "/", icon: Building2, label: "Businesses" },
  { to: "/command-center", icon: LayoutDashboard, label: "Command Center" },
  { to: "/agent-hub", icon: Users, label: "Agent Hub" },
  { to: "/live-demo", icon: Mic, label: "Live Demo" },
  { to: "/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/reservations", icon: Calendar, label: "Reservations" },
  { to: "/monitoring", icon: Activity, label: "Live Monitor" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/approvals", icon: ShieldCheck, label: "Approvals", badge: true },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  const { user, signOut } = useAuth();

  const { data: pendingApprovals } = useQuery({
    queryKey: ["pending-approvals-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("approval_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 15000,
  });

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-primary">AgentHub</h1>
        <p className="text-sm text-muted-foreground mt-1">AI Call Center Platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label}</span>
            {badge && pendingApprovals ? (
              <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center text-[10px] px-1">
                {pendingApprovals}
              </Badge>
            ) : null}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {user && (
          <div className="text-xs text-muted-foreground truncate px-2">
            {user.email}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
        <div className="flex items-center gap-2 px-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">System Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
