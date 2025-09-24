import { Button } from "@/components/ui/button";
import { Home, QrCode, Calendar, User, Share2, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Don't show navigation if user is not authenticated
  if (!user) {
    return null;
  }

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/scanner", icon: QrCode, label: "Scanner" },
    { path: "/timeline", icon: Calendar, label: "Timeline" },
    { path: "/share", icon: Share2, label: "Compartilhar" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];
  return (
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="flex-col gap-1 h-16 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Sair</span>
        </Button>
      </div>
    </div>
  );
};

export default Navigation;