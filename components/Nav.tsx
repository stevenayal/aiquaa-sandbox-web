"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Nav.module.css";
import { useApiKey } from "@/lib/auth/ApiKeyContext";
import { CURSO_LABELS, useCurso } from "@/lib/auth/CursoContext";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useMenu } from "@/lib/menu/useMenu";
import { logout as logoutRequest } from "@/lib/api/auth";
import { esAdmin } from "@/lib/auth/admin";
import { ModuleIcon } from "@/components/icons/ModuleIcons";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const { clearApiKey } = useApiKey();
  const { curso, clearCurso } = useCurso();
  const { usuario, clearUsuario } = useUsuario();
  const { menu, rosterEntry, error, isLoading, retry } = useMenu();
  const pathname = usePathname();
  const router = useRouter();

  const nombre = rosterEntry?.nombre ?? usuario?.nombre;
  const showSectionLabels = (menu?.secciones.length ?? 0) > 1;

  async function handleLogout() {
    // El logout remoto es un endpoint de v1: en el curso 2 no hay sesión que
    // cerrar del lado del backend, y el admin (id sentinela) tampoco existe ahí.
    if (usuario && curso === 1 && !esAdmin(usuario.email)) {
      try {
        await logoutRequest(usuario.id);
      } catch {
        // best-effort: igual cerramos sesión local aunque el logout remoto falle
      }
    }
    clearUsuario();
    clearApiKey(); // sin versión: se van las dos keys
    clearCurso();
    router.replace("/curso");
  }

  return (
    <nav className={styles.nav} data-testid="nav" aria-label="Principal">
      <Link href="/" className={styles.brand}>
        <Image src="/aiquaa-logo.png" alt="" width={28} height={28} className={styles.logo} priority />
        <span className={styles.brandText}>
          aiquaa Sandbox
          {curso && (
            <span className={styles.cursoLabel} data-testid="nav-curso">
              {CURSO_LABELS[curso]}
            </span>
          )}
        </span>
      </Link>

      <div className={styles.links}>
        {isLoading && (
          <div className={styles.skeletonRow} data-testid="nav-loading" aria-busy="true" aria-label="Cargando menú">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={styles.skeleton} />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className={styles.menuError} role="alert" data-testid="nav-error">
            <span>No se pudo cargar el menú: {error.message}</span>
            <button type="button" className={styles.retry} onClick={retry} data-testid="nav-retry">
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && menu && (
          <div className={styles.linkRow} data-testid="nav-menu">
            {menu.secciones.map((seccion) => (
              <div
                key={seccion.id}
                className={styles.section}
                role="group"
                aria-label={seccion.titulo}
                data-testid={`nav-section-${seccion.id}`}
              >
                {showSectionLabels && <span className={styles.rowLabel}>{seccion.titulo}</span>}
                {seccion.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.link} ${active ? styles.linkActive : ""}`}
                      aria-current={active ? "page" : undefined}
                      data-testid={`nav-item-${item.key}`}
                    >
                      <ModuleIcon name={item.icon} className={styles.linkIcon} style={{ color: item.accent }} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.session}>
        {nombre && (
          <span className={styles.usuario} data-testid="nav-usuario">
            {nombre}
          </span>
        )}
        <button type="button" className={styles.logout} onClick={handleLogout} data-testid="nav-logout">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
