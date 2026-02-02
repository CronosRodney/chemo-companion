import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Pill, Calendar, User, LogOut, Activity, Beaker, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/use-mobile";
import { MobileMoreMenu } from "./MobileMoreMenu";

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Don't show navigation if user is not authenticated
  if (!user) {
    return null;
  }

  // Mobile navigation items (4 items + "More" button)
  const mobileNavItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/medications", icon: Pill, label: "Meds" },
    { path: "/treatment", icon: Activity, label: "Tratamento" },
    { path: "/labs", icon: Beaker, label: "Exames" },
  ];

  // Desktop navigation items (original 6 items + logout)
  const desktopNavItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/medications", icon: Pill, label: "Medicamentos" },
    { path: "/treatment", icon: Activity, label: "Tratamento" },
    { path: "/labs", icon: Beaker, label: "Exames" },
    { path: "/timeline", icon: Calendar, label: "Timeline" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const navItems = isMobile ? mobileNavItems : desktopNavItems;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex-col gap-1 h-16 px-3 ${
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
          
          {/* Mobile: "More" button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMoreMenuOpen(true)}
              className="flex-col gap-1 h-16 px-3 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">Mais</span>
            </Button>
          )}
          
          {/* Desktop: Logout button */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex-col gap-1 h-16 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs">Sair</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile More Menu Sheet */}
      {isMobile && (
        <MobileMoreMenu 
          open={moreMenuOpen} 
          onOpenChange={setMoreMenuOpen} 
        />
      )}
    </>
  );
};

export default Navigation;
