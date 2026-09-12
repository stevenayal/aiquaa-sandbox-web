import type { ModuleIconName } from "@/components/icons/ModuleIcons";
import { moduleTheme, type ModuleKey } from "@/lib/theme/moduleThemes";

/**
 * Catálogo de módulos y armado del menú. Sin "use client": lo usa el route
 * handler `GET /api/menu`, que es de donde el Nav y el home cargan el menú.
 */

export type CursoMenu = 1 | 2;

interface ModuleDef {
  href: string;
  label: string;
  key: ModuleKey;
}

const MODULES: ModuleDef[] = [
  { href: "/usuarios", label: "Usuarios", key: "usuarios" },
  { href: "/cuentas", label: "Cuentas", key: "cuentas" },
  { href: "/transferencias", label: "Transferencias", key: "transferencias" },
  { href: "/facturas", label: "Facturas", key: "facturas" },
  { href: "/ordenes", label: "Órdenes", key: "ordenes" },
  { href: "/tarjetas", label: "Tarjetas", key: "tarjetas" },
  { href: "/notificaciones", label: "Notificaciones", key: "notificaciones" },
  { href: "/reservas", label: "Reservas", key: "reservas" },
  { href: "/roles", label: "Roles", key: "roles" },
  { href: "/reportes", label: "Reportes", key: "reportes" },
  { href: "/sesiones", label: "Sesiones", key: "sesiones" },
  { href: "/movimientos", label: "Movimientos", key: "movimientos" },
];

// Curso 2 — Productos Bancarios (schema/API keys separados, ver README de
// aiquaa-sandbox-api). Los nombres se repiten con el curso 1 pero son
// recursos distintos.
const MODULES_V2: ModuleDef[] = [
  { href: "/v2/usuarios", label: "Clientes", key: "v2-usuarios" },
  { href: "/v2/cuentas", label: "Cuentas", key: "v2-cuentas" },
  { href: "/v2/tarjetas", label: "Tarjetas", key: "v2-tarjetas" },
  { href: "/v2/prestamos", label: "Préstamos", key: "v2-prestamos" },
  { href: "/v2/beneficiarios", label: "Beneficiarios", key: "v2-beneficiarios" },
  { href: "/v2/transferencias", label: "Transferencias", key: "v2-transferencias" },
  { href: "/v2/ahorros", label: "Ahorros", key: "v2-ahorros" },
  { href: "/v2/depositos", label: "Depósitos", key: "v2-depositos" },
];

// "Usuarios" queda siempre visible (bootstrap para conseguir un usuarioId,
// además de ser el módulo del Grupo 4 en sí).
const GENERAL_HREFS = ["/usuarios"];
const GROUP_TO_MODULE_HREFS: Record<number, string[]> = {
  1: ["/sesiones"],
  2: ["/cuentas", "/transferencias"],
  3: ["/facturas"],
  4: ["/usuarios"],
  5: ["/tarjetas"],
  6: ["/notificaciones"],
  7: ["/ordenes"],
  8: ["/reservas"],
  9: ["/reportes", "/movimientos"],
  10: ["/roles"],
};

// Curso 2: 5 grupos propios, sin relación con los grupos 1-10 de arriba.
const GENERAL_HREFS_V2 = ["/v2/usuarios"];
const GROUP_TO_MODULE_HREFS_V2: Record<number, string[]> = {
  1: ["/v2/cuentas"],
  2: ["/v2/tarjetas"],
  3: ["/v2/prestamos"],
  4: ["/v2/beneficiarios", "/v2/transferencias"],
  5: ["/v2/ahorros", "/v2/depositos"],
};

/** Cantidad de grupos por curso: valida el `grupo` que llega al endpoint. */
export const GRUPOS_POR_CURSO: Record<CursoMenu, number> = { 1: 10, 2: 5 };

// Curso 2 se agrupa por línea de producto, como el menú de un home banking.
const SECCIONES_V2: { id: string; titulo: string; hrefs: string[] }[] = [
  { id: "clientes", titulo: "Clientes", hrefs: ["/v2/usuarios"] },
  { id: "cuentas-tarjetas", titulo: "Cuentas y tarjetas", hrefs: ["/v2/cuentas", "/v2/tarjetas"] },
  { id: "credito", titulo: "Crédito", hrefs: ["/v2/prestamos"] },
  { id: "pagos", titulo: "Pagos", hrefs: ["/v2/beneficiarios", "/v2/transferencias"] },
  { id: "inversion", titulo: "Inversión", hrefs: ["/v2/ahorros", "/v2/depositos"] },
];

export interface MenuItem {
  key: ModuleKey;
  href: string;
  label: string;
  productName: string;
  tagline: string;
  accent: string;
  icon: ModuleIconName;
}

export interface MenuSeccion {
  id: string;
  titulo: string;
  items: MenuItem[];
}

export interface Menu {
  curso: CursoMenu;
  grupo: number | null;
  secciones: MenuSeccion[];
}

function toItem(module: ModuleDef): MenuItem {
  const { productName, tagline, accent, icon } = moduleTheme(module.key);
  return { key: module.key, href: module.href, label: module.label, productName, tagline, accent, icon };
}

/**
 * Menú de un curso. Sin grupo (no está en el roster, o es la key demo) van
 * todos los módulos del curso; con grupo, solo los generales más los
 * asignados a ese grupo.
 */
export function buildMenu(curso: CursoMenu, grupo: number | null = null): Menu {
  const modules = curso === 2 ? MODULES_V2 : MODULES;
  const general = curso === 2 ? GENERAL_HREFS_V2 : GENERAL_HREFS;
  const porGrupo = curso === 2 ? GROUP_TO_MODULE_HREFS_V2 : GROUP_TO_MODULE_HREFS;

  const visibles =
    grupo === null ? modules : modules.filter((m) => new Set([...general, ...(porGrupo[grupo] ?? [])]).has(m.href));

  if (curso === 1) {
    return { curso, grupo, secciones: [{ id: "curso-1", titulo: "Módulos", items: visibles.map(toItem) }] };
  }

  const secciones = SECCIONES_V2.map(({ id, titulo, hrefs }) => ({
    id,
    titulo,
    items: visibles.filter((m) => hrefs.includes(m.href)).map(toItem),
  })).filter((seccion) => seccion.items.length > 0);

  return { curso, grupo, secciones };
}
