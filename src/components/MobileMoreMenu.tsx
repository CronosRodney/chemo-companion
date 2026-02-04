import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mobileMoreMenuItems } from "@/config/navigation";

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileMoreMenu = ({ open, onOpenChange }: MobileMoreMenuProps) => {
  const navigate = useNavigate();
  
  // Health monitoring is a special item not in core navigation
  const menuItems = [
    { path: "/health", icon: Activity, label: "Monitoramento de Saúde" },
    ...mobileMoreMenuItems,
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Mais opções</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start h-12"
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Button>
          ))}
          <div className="border-t border-border pt-2 mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
