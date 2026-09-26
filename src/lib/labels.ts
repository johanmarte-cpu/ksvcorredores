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
