"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { getFactura, pagarFactura, type MetodoPago } from "@/lib/api/facturas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("facturas");
const METODOS: MetodoPago[] = ["tarjeta", "cuenta", "efectivo"];

function badgeClass(estado: string): string {
  if (estado === "pagada") return shared.badgeSuccess;
  if (estado === "vencida") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function FacturaDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: factura, error, isLoading, mutate } = useSWR(["factura", id], () => getFactura(id));

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("tarjeta");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  async function handlePagar(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await pagarFactura(id, metodoPago);
      await mutate(result.factura, { revalidate: false });
      setPaid(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo pagar la factura.");
    } finally {
      setSubmitting(false);
    }
  }

  const yaPagada = factura?.estado === "pagada";

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Factura #{id}</h1>
      </div>

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {factura && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Proveedor</dt>
                <dd>{factura.proveedor}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número</dt>
                <dd>{factura.numero_factura}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>{factura.monto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Vencimiento</dt>
                <dd>{factura.fecha_vencimiento}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(factura.estado)}>{factura.estado}</span>
                </dd>
              </div>
            </dl>

            <form
              className={shared.formGrid}
              onSubmit={handlePagar}
              data-testid={ids.rowAction(id, "pagar-form")}
            >
              <h2>Pagar factura</h2>
              <div className={shared.field}>
                <label htmlFor="metodoPago">Método de pago</label>
                <select
                  id="metodoPago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  disabled={yaPagada}
                  data-testid={ids.field("metodoPago")}
                >
                  {METODOS.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("metodoPago")}>
                  {formError}
                </p>
              )}

              {paid && (
                <p role="status" className={shared.success} data-testid={ids.success}>
                  Factura pagada.
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting || yaPagada}
                data-testid={ids.rowAction(id, "pagar-submit")}
              >
                {yaPagada ? "Ya pagada" : submitting ? "Pagando..." : "Pagar"}
              </button>
            </form>
          </>
        )}
      </DataState>
    </div>
  );
}
