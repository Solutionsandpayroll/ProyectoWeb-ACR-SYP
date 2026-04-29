export type CargoSalario = {
  cargo: string;
  salario: number;
};

export const CARGOS_OLD_SCALE: CargoSalario[] = [
  { cargo: "Director General", salario: 19217000 },
  { cargo: "Director de operaciones", salario: 19217000 },
  { cargo: "Gerente de Nomina y ADP", salario: 8000000 },
  { cargo: "Gerente Comercial", salario: 8000000 },
  { cargo: "Lider de Administración de personal", salario: 6158000 },
  { cargo: "Lider de Gestión Humana", salario: 6158000 },
  { cargo: "Lider de Employer of Record Colombia", salario: 6158000 },
  { cargo: "Lider Outsourcing de Tesoreria", salario: 6158000 },
  { cargo: "Profesional SGI", salario: 5119000 },
  { cargo: "Profesional de Nomina", salario: 5119000 },
  { cargo: "Profesional de Backoffice Sucursales", salario: 4183000 },
  { cargo: "Analista Administrativo y financiero", salario: 4183000 },
  { cargo: "Analista de Nómina", salario: 4183000 },
  { cargo: "Analista Administración de personal", salario: 4183000 },
  { cargo: "Analista de EoR", salario: 4183000 },
  { cargo: "Analista de Nómina Perú", salario: 4183000 },
  { cargo: "Tecnico de Automatización", salario: 4183000 },
  { cargo: "Asistente Administrativo y Financiero", salario: 3335000 },
  { cargo: "Asistente Comercial", salario: 3335000 },
  { cargo: "Asistente de Comunicación y Marketing", salario: 3335000 },
  { cargo: "Asistente de Nómina", salario: 3335000 },
  { cargo: "Asistente Administración de Personal", salario: 3335000 },
  { cargo: "Asistente de EoR", salario: 3335000 },
  { cargo: "Asistente de tesorería", salario: 3335000 },
  { cargo: "Auxiliar de nomina", salario: 2627000 },
  { cargo: "Otro/Externo", salario: 0 },
];

export const CARGOS_NEW_SCALE: CargoSalario[] = [
  { cargo: "Director General", salario: 20217000 },
  { cargo: "Director de operaciones", salario: 20217000 },
  { cargo: "Gerente de Nomina y ADP", salario: 8320000 },
  { cargo: "Gerente Comercial", salario: 11078000 },
  { cargo: "Lider de Administración de personal", salario: 6710000 },
  { cargo: "Lider de Gestión Humana", salario: 6710000 },
  { cargo: "Lider de Employer of Record Colombia", salario: 6710000 },
  { cargo: "Lider Outsourcing de Tesoreria", salario: 6710000 },
  { cargo: "Profesional SGI", salario: 5700000 },
  { cargo: "Profesional de Nomina", salario: 5700000 },
  { cargo: "Profesional de Backoffice Sucursales", salario: 4600000 },
  { cargo: "Analista Administrativo y financiero", salario: 4600000 },
  { cargo: "Analista de Nómina", salario: 4600000 },
  { cargo: "Analista Administración de personal", salario: 4600000 },
  { cargo: "Analista de EoR", salario: 4600000 },
  { cargo: "Analista de Nómina Perú", salario: 4600000 },
  { cargo: "Tecnico de Automatización", salario: 4600000 },
  { cargo: "Asistente Administrativo y Financiero", salario: 3650000 },
  { cargo: "Asistente Comercial", salario: 3650000 },
  { cargo: "Asistente de Comunicación y Marketing", salario: 3650000 },
  { cargo: "Asistente de Nómina", salario: 3650000 },
  { cargo: "Asistente Administración de Personal", salario: 3650000 },
  { cargo: "Asistente de EoR", salario: 3650000 },
  { cargo: "Asistente de tesorería", salario: 3650000 },
  { cargo: "Auxiliar de nomina", salario: 3650000 },
  { cargo: "Aprendiz", salario: 2770000 },
  { cargo: "Practicante", salario: 2770000 },
  { cargo: "Otro/Externo", salario: 0 },
];

const isLegacyJanuary2026 = (fechaRegistro: string | null | undefined): boolean => {
  if (!fechaRegistro) return false;
  const normalized = fechaRegistro.slice(0, 10);
  return normalized >= "2026-01-01" && normalized <= "2026-01-31";
};

export const getCargosForFechaRegistro = (fechaRegistro: string | null | undefined): CargoSalario[] => {
  return isLegacyJanuary2026(fechaRegistro) ? CARGOS_OLD_SCALE : CARGOS_NEW_SCALE;
};

export const getSalarioPorCargo = (
  cargo: string,
  fechaRegistro: string | null | undefined
): number => {
  if (!cargo) return 0;

  const activeScale = getCargosForFechaRegistro(fechaRegistro);
  const foundActive = activeScale.find((c) => c.cargo === cargo);
  if (foundActive) return foundActive.salario;

  // Backward compatibility if an old/new cargo appears out of its original scale.
  const foundFallback = [...CARGOS_NEW_SCALE, ...CARGOS_OLD_SCALE].find((c) => c.cargo === cargo);
  return foundFallback?.salario ?? 0;
};
