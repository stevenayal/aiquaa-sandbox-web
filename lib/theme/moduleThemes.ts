import type { ModuleIconName } from "@/components/icons/ModuleIcons";

export type ModuleKey =
  | "usuarios"
  | "cuentas"
  | "transferencias"
  | "facturas"
  | "ordenes"
  | "tarjetas"
  | "notificaciones"
  | "reservas"
  | "roles"
  | "reportes"
  | "sesiones"
  | "movimientos"
  | "v2-usuarios"
  | "v2-cuentas"
  | "v2-tarjetas"
  | "v2-prestamos"
  | "v2-beneficiarios"
  | "v2-transferencias"
  | "v2-ahorros"
  | "v2-depositos";

export interface ModuleTheme {
  key: ModuleKey;
  productName: string;
  tagline: string;
  accent: string;
  icon: ModuleIconName;
}

// Cada módulo simula un producto de un negocio real distinto — le da
// identidad visual propia en vez de una tabla genérica más.
export const MODULE_THEMES: Record<ModuleKey, ModuleTheme> = {
  usuarios: {
    key: "usuarios",
    productName: "aiquaa People",
    tagline: "Alta y gestión de clientes",
    accent: "#4f46e5",
    icon: "person",
  },
  cuentas: {
    key: "cuentas",
    productName: "aiquaa Bank",
    tagline: "Cuentas y saldos",
    accent: "#1c4ed8",
    icon: "bank",
  },
  transferencias: {
    key: "transferencias",
    productName: "aiquaa Bank",
    tagline: "Transferencias entre cuentas",
    accent: "#1c4ed8",
    icon: "bank",
  },
  facturas: {
    key: "facturas",
    productName: "aiquaa Utilities",
    tagline: "Facturación de servicios",
    accent: "#0f9488",
    icon: "utility",
  },
  ordenes: {
    key: "ordenes",
    productName: "aiquaa Market",
    tagline: "Pedidos y compras online",
    accent: "#c2410c",
    icon: "market",
  },
  tarjetas: {
    key: "tarjetas",
    productName: "aiquaa Cards",
    tagline: "Tarjetas de crédito y débito",
    accent: "#7c3aed",
    icon: "card",
  },
  notificaciones: {
    key: "notificaciones",
    productName: "aiquaa Notify",
    tagline: "Mensajería a clientes",
    accent: "#0284c7",
    icon: "bell",
  },
  reservas: {
    key: "reservas",
    productName: "aiquaa Stays",
    tagline: "Reservas de hotel y restaurante",
    accent: "#b45309",
    icon: "stay",
  },
  roles: {
    key: "roles",
    productName: "aiquaa Admin",
    tagline: "Roles y permisos internos",
    accent: "#475569",
    icon: "shield",
  },
  reportes: {
    key: "reportes",
    productName: "aiquaa Insights",
    tagline: "Analítica y reportes",
    accent: "#059669",
    icon: "chart",
  },
  sesiones: {
    key: "sesiones",
    productName: "aiquaa People",
    tagline: "Auditoría de sesiones",
    accent: "#6366f1",
    icon: "history",
  },
  movimientos: {
    key: "movimientos",
    productName: "aiquaa Insights",
    tagline: "Movimientos y transacciones",
    accent: "#10b981",
    icon: "chart",
  },
  "v2-usuarios": {
    key: "v2-usuarios",
    productName: "aiquaa Banking",
    tagline: "Clientes del banco",
    accent: "#334155",
    icon: "person",
  },
  "v2-cuentas": {
    key: "v2-cuentas",
    productName: "aiquaa Banking",
    tagline: "Cuentas, saldos y movimientos",
    accent: "#0e7490",
    icon: "bank",
  },
  "v2-tarjetas": {
    key: "v2-tarjetas",
    productName: "aiquaa Banking",
    tagline: "Tarjetas de crédito y débito",
    accent: "#be185d",
    icon: "card",
  },
  "v2-prestamos": {
    key: "v2-prestamos",
    productName: "aiquaa Banking",
    tagline: "Préstamos y cuotas",
    accent: "#92400e",
    icon: "loan",
  },
  "v2-beneficiarios": {
    key: "v2-beneficiarios",
    productName: "aiquaa Banking",
    tagline: "Beneficiarios",
    accent: "#4d7c0f",
    icon: "contact",
  },
  "v2-transferencias": {
    key: "v2-transferencias",
    productName: "aiquaa Banking",
    tagline: "Transferencias y pagos",
    accent: "#0369a1",
    icon: "bank",
  },
  "v2-ahorros": {
    key: "v2-ahorros",
    productName: "aiquaa Banking",
    tagline: "Ahorro programado",
    accent: "#15803d",
    icon: "piggybank",
  },
  "v2-depositos": {
    key: "v2-depositos",
    productName: "aiquaa Banking",
    tagline: "Depósitos a plazo",
    accent: "#6d28d9",
    icon: "vault",
  },
};

export function moduleTheme(key: ModuleKey): ModuleTheme {
  return MODULE_THEMES[key];
}
