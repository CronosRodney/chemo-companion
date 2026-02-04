import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/use-mobile";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { mobileBottomBarItems, primaryNavItems } from "@/config/navigation";

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Don't show navigation if user is not authenticated
  if (!user) {
    return null;
  }

  // Mobile: bottom bar with 4 items + More button
  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg z-50">
          <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
            {mobileBottomBarItems.map((item) => {
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
              onClick={() => setMoreMenuOpen(true)}
              className="flex-col gap-1 h-16 px-3 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">Mais</span>
            </Button>
          </div>
        </div>

        <MobileMoreMenu 
          open={moreMenuOpen} 
          onOpenChange={setMoreMenuOpen} 
        />
      </>
    );
  }

  // Desktop/Tablet: centered nav items
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg z-50">
      <div className="flex items-center justify-center py-2 px-4">
        {/* All Navigation Items - Centered */}
        <div className="flex items-center gap-1">
          {primaryNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex-col gap-1 h-16 px-4 ${
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
          
          {/* User Menu - Inline with other items */}
          <UserMenuDropdown />
        </div>
      </div>
    </div>
  );
};

export default Navigation;
