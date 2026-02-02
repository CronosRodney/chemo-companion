import { useMemo } from 'react';
import { useDoctorAuth } from './useDoctorAuth';
import { useAuth } from './useAuth';

export interface LabPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewOnly: boolean;
  isDoctor: boolean;
  userRole: 'doctor' | 'patient';
}

/**
 * Hook centralizado para permissões de exames laboratoriais.
 * Tanto médico quanto paciente podem criar/editar/excluir exames (colaborativo).
 * 
 * @param targetPatientId - ID do paciente sendo visualizado (se diferente do usuário logado)
 */
export const useLabPermissions = (targetPatientId?: string): LabPermissions => {
  const { user } = useAuth();
  const { isDoctor } = useDoctorAuth();

  return useMemo(() => {
    const isPatientContext = !!targetPatientId && targetPatientId !== user?.id;
    const userRole = isDoctor ? 'doctor' : 'patient';

    // Ambos podem criar/editar/excluir exames (módulo colaborativo)
    return {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewOnly: false,
      isDoctor,
      userRole,
    };
  }, [user?.id, isDoctor, targetPatientId]);
};
