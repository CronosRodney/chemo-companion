import { Home, Pill, Activity, Beaker, Calendar, User, Syringe } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  labelKey?: string; // for i18n support
}

// Core navigation items - shared across all viewports
export const coreNavItems: NavItem[] = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/medications", icon: Pill, label: "Medicamentos" },
  { path: "/treatment", icon: Activity, label: "Tratamento" },
  { path: "/labs", icon: Beaker, label: "Exames" },
  { path: "/vaccination", icon: Syringe, label: "Vacinação" },
];

// Secondary navigation items
export const secondaryNavItems: NavItem[] = [
  { path: "/timeline", icon: Calendar, label: "Timeline" },
  { path: "/profile", icon: User, label: "Perfil" },
];

// All navigation items combined
export const allNavItems: NavItem[] = [...coreNavItems, ...secondaryNavItems];

// Mobile bottom bar shows first 4 core items + "More" button
export const mobileBottomBarItems: NavItem[] = coreNavItems.slice(0, 4);

// Items shown in mobile "More" menu (remaining core + all secondary)
export const mobileMoreMenuItems: NavItem[] = [
  ...coreNavItems.slice(4), // Vacinação
  ...secondaryNavItems,     // Timeline, Perfil
];

// Desktop shows all items
export const desktopNavItems: NavItem[] = allNavItems;
