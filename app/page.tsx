"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import shared from "@/components/shared.module.css";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useRosterEntry } from "@/lib/roster/useRosterEntry";
import { useVisibleModules } from "@/components/Nav";
import { ModuleIcon } from "@/components/icons/ModuleIcons";
import { moduleTheme } from "@/lib/theme/moduleThemes";

export default function Home() {
  const router = useRouter();
  const { usuario } = useUsuario();
  const { rosterEntry } = useRosterEntry(usuario?.email);
  const [buscarId, setBuscarId] = useState(usuario ? String(usuario.id) : "");

  const visibleModules = useVisibleModules(rosterEntry);
  const showBothCursos = visibleModules.v1.length > 0 && visibleModules.v2.length > 0;
  const nombre = rosterEntry?.nombre ?? usuario?.nombre;

  function handleBuscarUsuario(event: FormEvent) {
    event.preventDefault();
    if (buscarId.trim()) router.push(`/usuarios/${buscarId.trim()}`);
  }

  return (
    <div className={styles.page}>
      <h1>Bienvenido{nombre ? `, ${nombre}` : ""}</h1>
      <p>Elegí un módulo para empezar.</p>

      <form className={styles.search} onSubmit={handleBuscarUsuario} data-testid="home-buscar-usuario">
        <div className={shared.field}>
          <label htmlFor="buscarId">Ir a usuario (id)</label>
          <input
            id="buscarId"
            value={buscarId}
            onChange={(e) => setBuscarId(e.target.value)}
            placeholder="Ej. 12"
            data-testid="home-buscar-usuario-input"
          />
        </div>
        <button type="submit" className={shared.button} data-testid="home-buscar-usuario-submit">
          Ver usuario
        </button>
      </form>

      {showBothCursos && <h2 className={styles.groupHeading}>Curso 1</h2>}
      {visibleModules.v1.length > 0 && (
        <nav className={styles.grid} aria-label="Módulos del curso 1">
          {visibleModules.v1.map((m) => {
            const theme = moduleTheme(m.key);
            return (
              <Link key={m.href} href={m.href} className={styles.tile} style={{ borderTopColor: theme.accent }}>
                <span className={styles.tileIconWrap} style={{ background: theme.accent }}>
                  <ModuleIcon name={theme.icon} className={styles.tileIcon} />
                </span>
                <span className={styles.tileProduct} style={{ color: theme.accent }}>
                  {theme.productName}
                </span>
                <span className={styles.tileLabel}>{m.label}</span>
                <span className={styles.tileTagline}>{theme.tagline}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {showBothCursos && <h2 className={styles.groupHeading}>Curso 2 · Productos Bancarios</h2>}
      {visibleModules.v2.length > 0 && (
        <nav className={styles.grid} aria-label="Módulos del curso 2">
          {visibleModules.v2.map((m) => {
            const theme = moduleTheme(m.key);
            return (
              <Link key={m.href} href={m.href} className={styles.tile} style={{ borderTopColor: theme.accent }}>
                <span className={styles.tileIconWrap} style={{ background: theme.accent }}>
                  <ModuleIcon name={theme.icon} className={styles.tileIcon} />
                </span>
                <span className={styles.tileProduct} style={{ color: theme.accent }}>
                  {theme.productName}
                </span>
                <span className={styles.tileLabel}>{m.label}</span>
                <span className={styles.tileTagline}>{theme.tagline}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
