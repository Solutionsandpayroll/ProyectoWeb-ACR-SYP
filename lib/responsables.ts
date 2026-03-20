export const PROCESO_RESPONSABLES: Record<string, string[]> = {
  "Direccionamiento Estratégico": ["Eduard Forero", "Ricardo Arambulo", "William Romero"],
  "Gestión Comercial y de Mercadeo": ["Dayana Mejia"],
  "Administración de Nómina": ["William Romero"],
  "Administración de Personal": ["Jennifer Cervantes"],
  "Selección de Personal": ["Patricia Jimenez"],
  "Gestión de Servicio al Cliente": ["Ricardo Arambulo", "Dayana Mejia"],
  "Gestión Administrativa y Financiera": ["Yuly Peña"],
  "Gestión de Talento Humano": ["Patricia Jimenez"],
  "Employer of Record": ["German Hincapie"],
  "Employer of Record Sucursales": ["Tatiana Chavarro"],
  "Gestión Integral": ["Ingrid Pineda"],
  "Outsourcing de tesorería": ["Alfonso Fonseca"],
};

export const RESPONSABLES_SEGUIMIENTO: string[] = [
  "Eduard Forero",
  "Alejandro Echavarria",
  "Alfonso Fonseca",
  "Yenny Delgado",
  "Tatiana Cumbe",
  "Viviana Guzman",
  "Rocio Guacaneme",
  "Giovanna Guio",
  "Alba Luz Borja",
  "German Hincapie",
  "Deissy Preciado",
  "Kevin Gonzalez",
  "Lina Chinome",
  "Fabian Morales",
  "Marco Castiblanco",
  "Yadira Pineda",
  "Patricia Osorio",
  "Ricardo Arambulo Polo",
  "Patricia Jimenez",
  "Jennifer Cervantes",
  "Yina Vega",
  "William Romero",
  "Diana Hernandez",
  "Michael Pertuz",
  "Julieth Bonilla",
  "Alba Suarez",
  "Nathalie Vaquiro",
  "Yuly Peña",
  "Selección S&P",
  "Lorena Garcia Navarro",
  "Tatiana Chavarro",
  "Viviana Martinez",
  "Paola Velasquez",
  "Dayan Manjarres",
  "Carolina Morales",
  "Brayan Pardo",
  "Camila Herrera",
  "Paola Gonzalez",
  "Ana Maria Gutierrez",
  "Ingrid Pineda",
  "Erika Letrado",
  "Jhon Jairo Leon",
  "Stiven Narváez",
  "Yeferson Pineda",
  "Nicolas Ballesteros",
  "Sandra Bello",
  "Sharon Amaya",
  "Lina Guio",
  "Cristian Parada",
  "Diana Mendez",
  "Simon Tschannen",
  "Eduardo Castañeda",
  "Jose Sergio Veintemilla",
  "Juan David Urbina",
  "Dayana Mejia",
];

// Completa este mapeo con los correos reales de cada responsable.
// El cron de notificaciones usa este diccionario para enviar correos automáticamente
// a los responsables del proceso, sin necesidad de diligenciar manualmente en Control de Acciones.
export const RESPONSABLE_EMAILS: Record<string, string> = {
  "Eduard Forero": "",
  "Ricardo Arambulo": "cristianparada531@gmail.com",
  "William Romero": "cristianoronaldo8k@gmail.com",
  "Dayana Mejia": "",
  "Jennifer Cervantes": "",
  "Patricia Jimenez": "",
  "Yuly Peña": "",
  "German Hincapie": "",
  "Tatiana Chavarro": "",
  "Ingrid Pineda": "",
  "Alfonso Fonseca": "",
};

const normalize = (value: string) => value.trim().toLowerCase();

export const getResponsablesByProceso = (proceso: string): string[] => {
  return PROCESO_RESPONSABLES[proceso] ?? [];
};

export const getResponsableEmailsByProceso = (proceso: string): string[] => {
  const responsables = getResponsablesByProceso(proceso);
  const emails = responsables
    .map((nombre) => RESPONSABLE_EMAILS[nombre])
    .map((email) => email?.trim())
    .filter((email): email is string => Boolean(email));

  return [...new Set(emails.map(normalize))];
};
