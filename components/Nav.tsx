"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Nav.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useRosterEntry } from "@/lib/roster/useRosterEntry";
import { logout as logoutRequest } from "@/lib/api/auth";

// Se completa a medida que cada módulo se construye (sección 8 del plan).
export const MODULES: { href: string; label: string }[] = [
  { href: "/usuarios/new", label: "Usuarios" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/transferencias", label: "Transferencias" },
  { href: "/facturas", label: "Facturas" },
  { href: "/ordenes", label: "Órdenes" },
  { href: "/tarjetas", label: "Tarjetas" },
  { href: "/notificaciones", label: "Notificaciones" },
  { href: "/reservas", label: "Reservas" },
  { href: "/roles", label: "Roles" },
  { href: "/reportes", label: "Reportes" },
];

// "Usuarios" queda siempre visible (bootstrap para conseguir un usuarioId,
// además de ser el módulo del Grupo 4 en sí). Grupo 1 (Autenticación) no
// mapea a ningún módulo propio: login/logout/forgot/reset ya son las
// pantallas generales que usa cualquier alumno, con o sin roster.
const GENERAL_HREFS = ["/usuarios/new"];
const GROUP_TO_MODULE_HREFS: Record<number, string[]> = {
  1: [],
  2: ["/cuentas", "/transferencias"],
  3: ["/facturas"],
  4: ["/usuarios/new"],
  5: ["/tarjetas"],
  6: ["/notificaciones"],
  7: ["/ordenes"],
  8: ["/reservas"],
  9: ["/reportes"],
  10: ["/roles"],
};

/**
 * Sin grupo (no está en el roster, todavía cargando, o error) cae a
 * mostrar los 10 módulos completos — no rompe la key demo ni a usuarios de
 * sandbox que no son alumnos reales.
 */
export function getVisibleModules(grupo: number | null | undefined): typeof MODULES {
  if (grupo == null) return MODULES;
  const hrefs = new Set([...GENERAL_HREFS, ...(GROUP_TO_MODULE_HREFS[grupo] ?? [])]);
  return MODULES.filter((m) => hrefs.has(m.href));
}

export function Nav() {
  const { clearApiKey } = useApiKey();
  const { usuario, clearUsuario } = useUsuario();
  const { rosterEntry } = useRosterEntry(usuario?.email);
  const router = useRouter();

  const visibleModules = getVisibleModules(rosterEntry?.grupo);
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
        {visibleModules.map((m) => (
          <Link key={m.href} href={m.href} className={styles.link}>
            {m.label}
          </Link>
        ))}
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
