import { useLocation, useNavigate } from "react-router-dom";
import { Home, Activity, Beaker, Pill, Syringe, Calendar, Heart, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/treatment", icon: Activity, label: "Tratamento" },
  { path: "/labs", icon: Beaker, label: "Exames" },
  { path: "/medications", icon: Pill, label: "Medicamentos" },
  { path: "/vaccination", icon: Syringe, label: "Vacinação" },
  { path: "/health", icon: Heart, label: "Saúde" },
  { path: "/timeline", icon: Calendar, label: "Timeline" },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = () => supabase.auth.signOut();

  return (
    <aside className="hidden lg:flex flex-col bg-card border-r border-border w-[240px] min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Onco<span className="text-primary">Track</span>
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Painel do Paciente</p>
      </div>

      <Separator className="mx-4 w-auto" />

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {sidebarNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: Profile + Logout */}
      <div className="px-3 pb-6 space-y-1">
        <Separator className="mx-1 w-auto mb-3" />
        <button
          onClick={() => navigate("/profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            location.pathname === "/profile"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <User className="h-[18px] w-[18px]" strokeWidth={location.pathname === "/profile" ? 2 : 1.5} />
          <span>Perfil</span>
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
