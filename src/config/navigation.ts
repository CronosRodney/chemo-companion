import { Home, Pill, Activity, Beaker, Calendar, User, Syringe, Heart } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  labelKey?: string; // for i18n support
}

// Primary navigation items - core app functionality (left side on desktop)
export const primaryNavItems: NavItem[] = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/treatment", icon: Activity, label: "Tratamento" },
  { path: "/labs", icon: Beaker, label: "Exames" },
];

// User/personal menu items (right side dropdown on desktop)
export const userMenuItems: NavItem[] = [
  { path: "/medications", icon: Pill, label: "Medicamentos" },
  { path: "/vaccination", icon: Syringe, label: "Vacinação" },
  { path: "/timeline", icon: Calendar, label: "Timeline" },
  { path: "/profile", icon: User, label: "Perfil" },
];

// Health monitoring (special item, not in core navigation)
export const healthMenuItem: NavItem = { 
  path: "/health", 
  icon: Heart, 
  label: "Monitoramento de Saúde" 
};

// Mobile bottom bar shows condensed items + "More" button
export const mobileBottomBarItems: NavItem[] = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/medications", icon: Pill, label: "Meds" },
  { path: "/treatment", icon: Activity, label: "Tratamento" },
  { path: "/labs", icon: Beaker, label: "Exames" },
];

// Items shown in mobile "More" menu
export const mobileMoreMenuItems: NavItem[] = [
  healthMenuItem,
  { path: "/vaccination", icon: Syringe, label: "Vacinação" },
  { path: "/timeline", icon: Calendar, label: "Timeline" },
  { path: "/profile", icon: User, label: "Perfil" },
];
