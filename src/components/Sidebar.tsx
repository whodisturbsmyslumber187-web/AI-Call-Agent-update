import { NavLink } from "react-router-dom";
import { Building2, Mic, MessageSquare, Calendar, Settings, LogOut, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: Building2, label: "Businesses" },
  { to: "/live-demo", icon: Mic, label: "Live Demo" },
  { to: "/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/reservations", icon: Calendar, label: "Reservations" },
  { to: "/monitoring", icon: Activity, label: "Live Monitor" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-primary">AgentHub</h1>
        <p className="text-sm text-muted-foreground mt-1">Multi-Agent Call Center</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
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
