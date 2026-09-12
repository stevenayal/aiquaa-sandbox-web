"use client";

import type { ReactNode } from "react";
import shared from "@/components/shared.module.css";
import styles from "./Receipt.module.css";
import { Fecha } from "@/components/Valores";

export interface ReceiptItem {
  /** Sufijo del testid: `{testId}-receipt-{name}`. */
  name: string;
  label: string;
  value: ReactNode;
}

interface ReceiptProps {
  testId: string;
  title: string;
  /** Número de operación / referencia que devuelve el backend. */
  operacion: string;
  fecha: string;
  items: ReceiptItem[];
  /** Acciones extra al pie (ej. "Nueva transferencia"). */
  children?: ReactNode;
}

/** Comprobante de una operación terminada, con número de operación y opción de imprimir. */
export function Receipt({ testId, title, operacion, fecha, items, children }: ReceiptProps) {
  return (
    <section className={styles.receipt} data-testid={`${testId}-receipt`} aria-labelledby={`${testId}-receipt-title`}>
      <div className={styles.header}>
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
        <div role="status">
          <h2 id={`${testId}-receipt-title`}>{title}</h2>
          <p className={styles.operacion}>
            N° de operación{" "}
            <strong data-testid={`${testId}-receipt-operacion`} data-value={operacion}>
              {operacion}
            </strong>
          </p>
        </div>
      </div>

      <dl className={shared.summary}>
        <dt>Fecha</dt>
        <dd data-testid={`${testId}-receipt-fecha`}>
          <Fecha value={fecha} conHora />
        </dd>
        {items.map((item) => (
          <div key={item.name} className={styles.row}>
            <dt>{item.label}</dt>
            <dd data-testid={`${testId}-receipt-${item.name}`}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className={shared.formActions}>
        <button
          type="button"
          className={shared.buttonSecondary}
          onClick={() => window.print()}
          data-testid={`${testId}-receipt-print`}
        >
          Imprimir comprobante
        </button>
        {children}
      </div>
    </section>
  );
}
