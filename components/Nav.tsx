"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Nav.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useRosterEntry } from "@/lib/roster/useRosterEntry";
import { logout as logoutRequest } from "@/lib/api/auth";
import { ModuleIcon } from "@/components/icons/ModuleIcons";
import { moduleTheme, type ModuleKey } from "@/lib/theme/moduleThemes";

export const MODULES: { href: string; label: string; key: ModuleKey }[] = [
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
// aiquaa-sandbox-api). Sección aparte en el nav, nunca mezclada visualmente
// con los módulos del curso 1 con el mismo nombre (cuentas/tarjetas/etc. son
// recursos distintos en cada curso).
export const MODULES_V2: { href: string; label: string; key: ModuleKey }[] = [
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
// además de ser el módulo del Grupo 4 en sí). Grupo 1 (Autenticación) suma
// ahora "sesiones" (CRUD genérico de auditoría, ver README de la API).
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
const GROUP_TO_MODULE_HREFS_V2: Record<number, string[]> = {
  1: ["/v2/cuentas"],
  2: ["/v2/tarjetas"],
  3: ["/v2/prestamos"],
  4: ["/v2/beneficiarios", "/v2/transferencias"],
  5: ["/v2/ahorros", "/v2/depositos"],
};
const GENERAL_HREFS_V2 = ["/v2/usuarios"];

export interface VisibleModules {
  v1: typeof MODULES;
  v2: typeof MODULES_V2;
}

/**
 * Sin roster (no está en el roster, todavía cargando, o error) cae a
 * mostrar los módulos completos de ambos cursos — no rompe la key demo ni a
 * usuarios de sandbox que no son alumnos reales. Con roster, `curso` decide
 * qué cohorte ve (1 o 2, nunca las dos), y dentro de esa cohorte `grupo`
 * filtra a sus módulos asignados.
 */
export function getVisibleModules(rosterEntry: { grupo: number; curso: number } | null | undefined): VisibleModules {
  if (rosterEntry == null) return { v1: MODULES, v2: MODULES_V2 };
  if (rosterEntry.curso === 2) {
    const hrefs = new Set([...GENERAL_HREFS_V2, ...(GROUP_TO_MODULE_HREFS_V2[rosterEntry.grupo] ?? [])]);
    return { v1: [], v2: MODULES_V2.filter((m) => hrefs.has(m.href)) };
  }
  const hrefs = new Set([...GENERAL_HREFS, ...(GROUP_TO_MODULE_HREFS[rosterEntry.grupo] ?? [])]);
  return { v1: MODULES.filter((m) => hrefs.has(m.href)), v2: [] };
}

function ModuleLinkRow({ label, modules }: { label?: string; modules: VisibleModules["v1"] }) {
  if (modules.length === 0) return null;
  return (
    <div className={styles.linkRow}>
      {label && <span className={styles.rowLabel}>{label}</span>}
      {modules.map((m) => (
        <Link key={m.href} href={m.href} className={styles.link}>
          <ModuleIcon name={moduleTheme(m.key).icon} className={styles.linkIcon} style={{ color: moduleTheme(m.key).accent }} />
          {m.label}
        </Link>
      ))}
    </div>
  );
}

export function Nav() {
  const { clearApiKey } = useApiKey();
  const { usuario, clearUsuario } = useUsuario();
  const { rosterEntry } = useRosterEntry(usuario?.email);
  const router = useRouter();

  const visibleModules = getVisibleModules(rosterEntry);
  const showBothCursos = visibleModules.v1.length > 0 && visibleModules.v2.length > 0;
  const nombre = rosterEntry?.nombre ?? usuario?.nombre;

  async function handleLogout() {
    if (usuario) {
      try {
        await logoutRequest(usuario.id);
      } catch {
        // best-effort: igual cerramos sesión local aunque el logout remoto falle
      }
    }
    clearUsuario();
    clearApiKey();
    router.replace("/login");
  }

  return (
    <nav className={styles.nav} data-testid="nav">
      <Link href="/" className={styles.brand}>
        <Image src="/aiquaa-logo.png" alt="" width={28} height={28} className={styles.logo} priority />
        aiquaa Sandbox
      </Link>
      <div className={styles.links}>
        <ModuleLinkRow label={showBothCursos ? "Curso 1" : undefined} modules={visibleModules.v1} />
        <ModuleLinkRow label={showBothCursos ? "Curso 2 · Banca" : undefined} modules={visibleModules.v2} />
      </div>
      <div className={styles.session}>
        {nombre && <span className={styles.usuario}>{nombre}</span>}
        <button type="button" className={styles.logout} onClick={handleLogout} data-testid="nav-logout">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
