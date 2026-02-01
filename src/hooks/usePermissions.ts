import { useDoctorAuth } from './useDoctorAuth';
import { useAuth } from './useAuth';

export type Permission = 'view' | 'edit';

interface PermissionConfig {
  treatment: Permission;
  labs: Permission;
  medications: Permission;
  events: Permission;
  profile: Permission;
  health: Permission;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const { isDoctor, loading: doctorLoading } = useDoctorAuth();

  // Define permissions based on role
  const getPermissions = (): PermissionConfig => {
    if (isDoctor) {
      // Doctors can EDIT treatment and labs, VIEW everything else
      return {
        treatment: 'edit',
        labs: 'edit',
        medications: 'view',
        events: 'view',
        profile: 'view',
        health: 'view',
      };
    }

    // Patients can EDIT everything EXCEPT treatment (view only)
    return {
      treatment: 'view',
      labs: 'edit',
      medications: 'edit',
      events: 'edit',
      profile: 'edit',
      health: 'edit',
    };
  };

  const permissions = getPermissions();

  const canEdit = (feature: keyof PermissionConfig): boolean => {
    return permissions[feature] === 'edit';
  };

  const canView = (feature: keyof PermissionConfig): boolean => {
    return permissions[feature] === 'view' || permissions[feature] === 'edit';
  };

  return {
    isDoctor,
    permissions,
    canEdit,
    canView,
    loading: doctorLoading,
    user,
  };
};
