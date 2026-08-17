"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Nav.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { useUsuario } from "@/lib/auth/UsuarioContext";
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

export function Nav() {
  const { clearApiKey } = useApiKey();
  const { usuario, clearUsuario } = useUsuario();
  const router = useRouter();

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
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className={styles.link}>
            {m.label}
          </Link>
        ))}
      </div>
      <div className={styles.session}>
        {usuario && <span className={styles.usuario}>{usuario.nombre}</span>}
        <button type="button" className={styles.logout} onClick={handleLogout} data-testid="nav-logout">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
