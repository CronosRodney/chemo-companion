/**
 * Cálculo de Body Surface Area (BSA) e doses de medicamentos
 */

/**
 * Calcula BSA usando a fórmula de DuBois
 * BSA (m²) = 0.007184 × weight^0.425 × height^0.725
 */
export const calculateBSA = (weightKg: number, heightCm: number): number => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return 0;
  }
  
  const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
  return parseFloat(bsa.toFixed(2));
};

/**
 * Calcula a dose de medicamento baseada na unidade
 */
export const calculateDose = (
  referenceDose: number,
  doseUnit: string,
  bsa: number,
  weightKg?: number
): number => {
  if (!referenceDose || referenceDose <= 0) {
    return 0;
  }

  switch (doseUnit) {
    case 'mg/m2':
      return referenceDose * (bsa || 0);
    case 'mg/kg':
      return referenceDose * (weightKg || 0);
    case 'mg':
    default:
      return referenceDose;
  }
};

/**
 * Gera cronograma de datas de ciclos
 */
export const generateCycleSchedule = (
  startDate: Date,
  totalCycles: number,
  periodicityDays: number
): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < totalCycles; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + periodicityDays);
  }
  
  return dates;
};
