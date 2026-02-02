import { useMemo } from 'react';
import { useDoctorAuth } from './useDoctorAuth';
import { useAuth } from './useAuth';

export interface TreatmentPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReleaseCycle: boolean;
  canViewOnly: boolean;
  isDoctor: boolean;
  isPatientContext: boolean;
}

/**
 * Hook centralizado para permissões de tratamento.
 * Médico pode criar/editar/excluir tratamentos de seus pacientes conectados.
 * Paciente pode apenas visualizar seus próprios tratamentos.
 * 
 * @param targetPatientId - ID do paciente sendo visualizado (se diferente do usuário logado)
 */
export const useTreatmentPermissions = (targetPatientId?: string): TreatmentPermissions => {
  const { user } = useAuth();
  const { isDoctor, loading: doctorLoading } = useDoctorAuth();

  return useMemo(() => {
    // Se está visualizando um paciente específico (contexto médico)
    const isPatientContext = !!targetPatientId && targetPatientId !== user?.id;

    // Médico visualizando paciente: pode editar
    if (isDoctor && isPatientContext) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canReleaseCycle: true,
        canViewOnly: false,
        isDoctor: true,
        isPatientContext: true,
      };
    }

    // Médico visualizando seus próprios dados (caso seja também paciente)
    if (isDoctor && !isPatientContext) {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canReleaseCycle: false,
        canViewOnly: true,
        isDoctor: true,
        isPatientContext: false,
      };
    }

    // Paciente: somente visualização
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canReleaseCycle: false,
      canViewOnly: true,
      isDoctor: false,
      isPatientContext: false,
    };
  }, [user?.id, isDoctor, targetPatientId]);
};
