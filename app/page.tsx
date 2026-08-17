"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { MODULES } from "@/components/Nav";

export default function Home() {
  const { usuario } = useUsuario();

  return (
    <div className={styles.page}>
      <h1>Bienvenido{usuario ? `, ${usuario.nombre}` : ""}</h1>
      <p>Elegí un módulo para empezar.</p>
      <nav className={styles.grid} aria-label="Módulos">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className={styles.tile}>
            {m.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
