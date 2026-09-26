export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  BROKER: "Corredor/ejecutivo",
  CUSTOMER_SERVICE: "Servicio al cliente",
  ACCOUNTING: "Contabilidad",
  READ_ONLY: "Solo lectura",
};

export const LOB_LABELS: Record<string, string> = {
  AUTO: "Auto",
  LIFE: "Vida",
  HEALTH: "Salud",
  PROPERTY: "Incendio/Hogar",
  LIABILITY: "Responsabilidad civil",
  OTHER: "Otro",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  IN_REVIEW: "En revisión",
  COMPARED: "Comparada",
  CONVERTED: "Convertida",
  CANCELLED: "Cancelada",
};

export const QUOTE_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  RESPONDED: "Respondida",
  DECLINED: "Rechazada",
  EXPIRED: "Expirada",
};

export const POLICY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  PENDING: "Pendiente",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
  RENEWED: "Renovada",
};

export const PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  SINGLE: "Pago único",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_REVIEW: "En revisión",
  WITH_INSURER: "Con aseguradora",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  PAID: "Pagada",
  CLOSED: "Cerrada",
};

export const CLAIM_EVENT_TYPE_LABELS: Record<string, string> = {
  COMMENT: "Comentario",
  STATUS_CHANGE: "Cambio de estado",
  INSURER_FOLLOWUP: "Seguimiento con aseguradora",
  DOCUMENT_ADDED: "Documento agregado",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
};

export const RENEWAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  OFFERED: "Con oferta",
  RENEWED: "Renovada",
  LAPSED: "No renovada",
  DECLINED: "Rechazada",
};

export const THIRD_PARTY_TYPE_LABELS: Record<string, string> = {
  TOMADOR: "Tomador",
  ASEGURADO: "Asegurado",
  BENEFICIARIO: "Beneficiario",
  AFIANZADO: "Afianzado",
  PROVEEDOR: "Proveedor",
  EMPLEADO: "Empleado",
  APODERADO: "Apoderado",
};

export const ID_TYPE_LABELS: Record<string, string> = {
  CEDULA: "Cédula",
  PASAPORTE: "Pasaporte",
  ID_RESIDENCIA: "ID residencia",
};

export const SEX_LABELS: Record<string, string> = {
  F: "Femenino",
  M: "Masculino",
};

export const CORRESPONDENCE_ADDRESS_LABELS: Record<string, string> = {
  TRABAJO: "Trabajo",
  CORREO_ELECTRONICO: "Correo electrónico",
  RESIDENCIA: "Residencia",
};

export const ECONOMIC_ACTIVITY_LABELS: Record<string, string> = {
  EMPLEADO_ASALARIADO: "Empleado/Asalariado",
  PROPIETARIO_SOCIO: "Propietario/Socio",
  JUBILADO_PENSIONADO: "Jubilado/Pensionado",
  INVERSIONISTA_PRESTAMISTA: "Inversionista/Prestamista",
  INDEPENDIENTE: "Independiente",
  ESTUDIANTE: "Estudiante",
  AMA_DE_CASA: "Ama de casa",
  OTRO: "Otro",
};

export const MONTHLY_INCOME_RANGE_LABELS: Record<string, string> = {
  UNDER_20K: "Menos de RD$20 mil",
  FROM_20K_TO_50K: "RD$20 mil a RD$50 mil",
  FROM_50K_TO_100K: "RD$50 mil a RD$100 mil",
  OVER_100K: "Más de RD$100 mil",
};

export const INSURANCE_BRANCH_LABELS: Record<string, string> = {
  PERSONAS: "Personas",
  GENERALES: "Generales",
  FIANZAS: "Fianzas",
  OTRO: "Otro",
};
