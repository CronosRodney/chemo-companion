import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useDoctorAuth } from '@/hooks/useDoctorAuth';

interface DoctorProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export const DoctorProtectedRoute = ({ children, requireVerified = false }: DoctorProtectedRouteProps) => {
  const { user, isDoctor, doctorProfile, loading } = useDoctorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Not a doctor - redirect to registration
  if (!isDoctor || !doctorProfile) {
    return <Navigate to="/doctor/register" replace />;
  }

  // Requires verified status but not verified
  if (requireVerified && !doctorProfile.is_verified) {
    return <Navigate to="/doctor/pending-verification" replace />;
  }

  return <>{children}</>;
};
