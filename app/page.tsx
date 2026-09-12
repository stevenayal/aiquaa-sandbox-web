"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import shared from "@/components/shared.module.css";
import { useCurso } from "@/lib/auth/CursoContext";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useMenu } from "@/lib/menu/useMenu";
import { defaultUsuarioId } from "@/lib/auth/admin";
import { ModuleIcon } from "@/components/icons/ModuleIcons";

export default function Home() {
  const router = useRouter();
  const { curso } = useCurso();
  const { usuario } = useUsuario();
  const { menu, rosterEntry, error, isLoading, retry } = useMenu();
  // El admin no tiene usuario/cliente propio: arranca sin id prellenado.
  const [buscarId, setBuscarId] = useState(defaultUsuarioId(usuario));

  const nombre = rosterEntry?.nombre ?? usuario?.nombre;
  const showSectionHeadings = (menu?.secciones.length ?? 0) > 1;

  // En el curso 2 "usuario" es un cliente del banco (/v2/usuarios/{id}): el
  // detalle de v1 solo podría dar 401/403 o mostrar otro registro con el mismo id.
  const usuarioBase = curso === 2 ? "/v2/usuarios" : "/usuarios";

  function handleBuscarUsuario(event: FormEvent) {
    event.preventDefault();
    if (buscarId.trim()) router.push(`${usuarioBase}/${buscarId.trim()}`);
  }

  return (
    <div className={styles.page}>
      <h1>Bienvenido{nombre ? `, ${nombre}` : ""}</h1>
      <p>Elegí un módulo para empezar.</p>

      <form className={styles.search} onSubmit={handleBuscarUsuario} data-testid="home-buscar-usuario">
        <div className={shared.field}>
          <label htmlFor="buscarId">{curso === 2 ? "Ir a cliente (id)" : "Ir a usuario (id)"}</label>
          <input
            id="buscarId"
            value={buscarId}
            onChange={(e) => setBuscarId(e.target.value)}
            placeholder="Ej. 12"
            data-testid="home-buscar-usuario-input"
          />
        </div>
        <button type="submit" className={shared.button} data-testid="home-buscar-usuario-submit">
          {curso === 2 ? "Ver cliente" : "Ver usuario"}
        </button>
      </form>

      {isLoading && (
        <div className={styles.grid} data-testid="home-modules-loading" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={styles.tileSkeleton} />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div role="alert" className={styles.menuError} data-testid="home-modules-error">
          <p>No se pudieron cargar los módulos: {error.message}</p>
          <button type="button" className={shared.buttonSecondary} onClick={retry} data-testid="home-modules-retry">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading &&
        menu?.secciones.map((seccion) => (
          <section key={seccion.id} aria-labelledby={`home-section-${seccion.id}`}>
            <h2
              id={`home-section-${seccion.id}`}
              className={showSectionHeadings ? styles.groupHeading : styles.visuallyHidden}
            >
              {seccion.titulo}
            </h2>
            <nav className={styles.grid} aria-label={seccion.titulo} data-testid={`home-section-${seccion.id}`}>
              {seccion.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.tile}
                  style={{ borderTopColor: item.accent }}
                  data-testid={`home-module-${item.key}`}
                >
                  <span className={styles.tileIconWrap} style={{ background: item.accent }}>
                    <ModuleIcon name={item.icon} className={styles.tileIcon} />
                  </span>
                  <span className={styles.tileProduct} style={{ color: item.accent }}>
                    {item.productName}
                  </span>
                  <span className={styles.tileLabel}>{item.label}</span>
                  <span className={styles.tileTagline}>{item.tagline}</span>
                </Link>
              ))}
            </nav>
          </section>
        ))}
    </div>
  );
}
