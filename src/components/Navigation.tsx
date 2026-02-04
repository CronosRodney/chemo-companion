import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/use-mobile";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { mobileBottomBarItems, desktopNavItems } from "@/config/navigation";

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

  const navItems = isMobile ? mobileBottomBarItems : desktopNavItems;

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
