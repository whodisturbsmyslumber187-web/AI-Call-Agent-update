import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Building2, Mic, MessageSquare, Calendar, Settings, Activity, BarChart3, Users, LayoutDashboard, Phone, Search } from "lucide-react";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: businesses = [] } = useQuery({
    queryKey: ["businesses-cmd"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, name, industry").order("name").limit(20);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search businesses, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/")}><Building2 className="mr-2 h-4 w-4" /> Businesses</CommandItem>
          <CommandItem onSelect={() => go("/command-center")}><LayoutDashboard className="mr-2 h-4 w-4" /> Command Center</CommandItem>
          <CommandItem onSelect={() => go("/monitoring")}><Activity className="mr-2 h-4 w-4" /> Live Monitor</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="mr-2 h-4 w-4" /> Analytics</CommandItem>
          <CommandItem onSelect={() => go("/conversations")}><MessageSquare className="mr-2 h-4 w-4" /> Conversations</CommandItem>
          <CommandItem onSelect={() => go("/reservations")}><Calendar className="mr-2 h-4 w-4" /> Reservations</CommandItem>
          <CommandItem onSelect={() => go("/agent-hub")}><Users className="mr-2 h-4 w-4" /> Agent Hub</CommandItem>
          <CommandItem onSelect={() => go("/live-demo")}><Mic className="mr-2 h-4 w-4" /> Live Demo</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" /> Settings</CommandItem>
        </CommandGroup>
        {businesses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Businesses">
              {businesses.map((biz) => (
                <CommandItem key={biz.id} onSelect={() => go(`/business/${biz.id}`)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {biz.name}
                  <span className="ml-2 text-xs text-muted-foreground capitalize">{biz.industry?.replace("_", " ")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
