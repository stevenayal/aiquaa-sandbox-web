"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useRosterEntry } from "@/lib/roster/useRosterEntry";
import { getVisibleModules } from "@/components/Nav";

export default function Home() {
  const { usuario } = useUsuario();
  const { rosterEntry } = useRosterEntry(usuario?.email);

  const visibleModules = getVisibleModules(rosterEntry?.grupo);
  const nombre = rosterEntry?.nombre ?? usuario?.nombre;

  return (
    <div className={styles.page}>
      <h1>Bienvenido{nombre ? `, ${nombre}` : ""}</h1>
      <p>Elegí un módulo para empezar.</p>
      <nav className={styles.grid} aria-label="Módulos">
        {visibleModules.map((m) => (
          <Link key={m.href} href={m.href} className={styles.tile}>
            {m.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
