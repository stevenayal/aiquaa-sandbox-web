"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { CURSO_LABELS, useCurso, type Curso } from "@/lib/auth/CursoContext";
import { testIds } from "@/lib/testids";

const ids = testIds("curso");

const OPCIONES: { curso: Curso; descripcion: string }[] = [
  { curso: 1, descripcion: "Los 10 grupos del curso: usuarios, cuentas, facturas, órdenes, reservas, roles y más." },
  { curso: 2, descripcion: "Banca: clientes, cuentas, tarjetas, préstamos, transferencias, ahorros y depósitos." },
];

export default function CursoPage() {
  const { curso, setCurso } = useCurso();
  const [seleccion, setSeleccion] = useState<Curso | null>(curso);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // AuthGuard toma el control de la navegación en cuanto cambia el curso.
    if (seleccion) setCurso(seleccion);
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} data-testid={ids.form}>
        <Image src="/aiquaa-logo.png" alt="aiquaa" width={96} height={96} className={styles.logo} priority />
        <h1>aiquaa Sandbox</h1>

        <fieldset className={styles.options}>
          <legend className={styles.hint}>¿De qué curso sos? Elegilo para iniciar sesión.</legend>
          {OPCIONES.map(({ curso: opcion, descripcion }) => (
            <label
              key={opcion}
              className={`${styles.option} ${seleccion === opcion ? styles.optionSelected : ""}`}
              data-testid={ids.row(opcion)}
            >
              <input
                type="radio"
                name="curso"
                value={opcion}
                checked={seleccion === opcion}
                onChange={() => setSeleccion(opcion)}
                data-testid={`curso-option-${opcion}`}
              />
              <span className={styles.optionText}>
                <span className={styles.optionTitle}>{CURSO_LABELS[opcion]}</span>
                <span className={styles.optionDescription}>{descripcion}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button type="submit" className={styles.submit} disabled={!seleccion} data-testid={ids.submit}>
          Continuar
        </button>
      </form>
    </main>
  );
}
