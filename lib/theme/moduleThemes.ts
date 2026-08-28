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
  | "reportes";

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
};

export function moduleTheme(key: ModuleKey): ModuleTheme {
  return MODULE_THEMES[key];
}
