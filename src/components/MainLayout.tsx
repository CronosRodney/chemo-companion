import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import DesktopSidebar from "@/components/DesktopSidebar";

const hiddenRoutes = ['/auth', '/privacy-policy', '/terms-of-use', '/choose-role', '/doctor', '/accept-invite'];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  const showSidebar = !!user && !hiddenRoutes.some(r => location.pathname.startsWith(r));

  return (
    <>
      {showSidebar && <DesktopSidebar />}
      <div className={`relative ${showSidebar ? 'lg:ml-[240px]' : ''}`}>
        {children}
      </div>
    </>
  );
};

export default MainLayout;
