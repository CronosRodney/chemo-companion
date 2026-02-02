import { useMemo } from 'react';
import { useDoctorAuth } from './useDoctorAuth';
import { useAuth } from './useAuth';

export interface NotesPermissions {
  canCreate: boolean;
  canEdit: boolean; // Notas clínicas são imutáveis após criação
  canDelete: boolean;
  canView: boolean;
  isDoctor: boolean;
}

/**
 * Hook centralizado para permissões de notas clínicas.
 * Somente médicos podem criar notas.
 * Notas são IMUTÁVEIS após criação (compliance clínico).
 * 
 * @param targetPatientId - ID do paciente sendo visualizado
 */
export const useNotesPermissions = (targetPatientId?: string): NotesPermissions => {
  const { user } = useAuth();
  const { isDoctor } = useDoctorAuth();

  return useMemo(() => {
    const isPatientContext = !!targetPatientId && targetPatientId !== user?.id;

    // Somente médicos podem gerenciar notas
    if (isDoctor && isPatientContext) {
      return {
        canCreate: true,
        canEdit: false, // Notas são IMUTÁVEIS
        canDelete: true, // Permite exclusão completa, mas não edição
        canView: true,
        isDoctor: true,
      };
    }

    // Pacientes podem visualizar notas não-privadas
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: true,
      isDoctor: false,
    };
  }, [user?.id, isDoctor, targetPatientId]);
};
