"use client";

import shared from "@/components/shared.module.css";
import { Monto } from "@/components/Valores";
import type { SimulacionPrestamo as Simulacion } from "@/lib/v2/reglas";

/** Plazos que ofrece el banco (la API acepta cualquier entero de 1 a 120). */
export const PLAZOS_PRESTAMO = [6, 12, 18, 24, 36, 48, 60] as const;

/** UI: monto de un préstamo personal nuevo, en guaraníes. */
export const MONTO_PRESTAMO = { min: 500_000, max: 500_000_000 } as const;

/**
 * Resultado de la simulación con la misma fórmula que usa la API al aprobar:
 * cada monto lleva el valor exacto en `data-value` para comparar contra las
 * cuotas reales después de aprobar.
 */
export function SimulacionPrestamo({ simulacion, testId = "v2-prestamos-simulacion" }: { simulacion: Simulacion | null; testId?: string }) {
  if (!simulacion) {
    return (
      <p className={shared.info} data-testid={`${testId}-vacia`}>
        Completá monto, interés y plazo para ver la simulación.
      </p>
    );
  }

  return (
    <section className={shared.section} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <h2 id={`${testId}-title`}>Simulación</h2>
      <div className={shared.stats}>
        <div className={shared.stat}>
          <span className={shared.statLabel}>Cuota mensual</span>
          <span className={shared.statValue}>
            <Monto value={simulacion.cuota.toFixed(2)} moneda="PYG" testId={`${testId}-cuota`} />
          </span>
        </div>
        <div className={shared.stat}>
          <span className={shared.statLabel}>Total a pagar</span>
          <Monto value={simulacion.total.toFixed(2)} moneda="PYG" testId={`${testId}-total`} />
          <span className={shared.statLabel}>Intereses</span>
          <Monto value={simulacion.interes.toFixed(2)} moneda="PYG" testId={`${testId}-interes`} />
        </div>
      </div>
      <div className={shared.tableWrap} style={{ maxHeight: 280, overflowY: "auto" }}>
        <table className={shared.table} data-testid={`${testId}-cronograma`}>
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Vence</th>
              <th className={shared.numeric}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {simulacion.cuotas.map((c) => (
              <tr key={c.numero} data-testid={`${testId}-cuota-${c.numero}`}>
                <td>{c.numero}</td>
                <td>
                  {/* Fecha de calendario: se formatea del string, sin pasar por Date/UTC. */}
                  <span data-value={c.fechaVencimiento}>{c.fechaVencimiento.split("-").reverse().join("/")}</span>
                </td>
                <td className={shared.numeric}>
                  <Monto value={c.monto.toFixed(2)} moneda="PYG" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={shared.hint}>Interés simple sobre el total; la última cuota ajusta el redondeo.</p>
    </section>
  );
}
