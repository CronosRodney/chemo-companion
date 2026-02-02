import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  skipRoleCheck?: boolean;
}

export const ProtectedRoute = ({ children, skipRoleCheck = false }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não logado → tela de login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logado mas sem role definido → tela de escolha
  // (skipRoleCheck usado apenas em /choose-role para evitar loop)
  if (!skipRoleCheck && userRole === null) {
    return <Navigate to="/choose-role" replace />;
  }

  return <>{children}</>;
};