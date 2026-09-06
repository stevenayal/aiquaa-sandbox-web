"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import {
  getFactura,
  pagarFactura,
  actualizarFactura,
  eliminarFactura,
  type MetodoPago,
  type Factura,
} from "@/lib/api/facturas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("facturas");
const METODOS: MetodoPago[] = ["tarjeta", "cuenta", "efectivo"];
const PROVEEDORES: Factura["proveedor"][] = ["ANDE", "ESSAP", "COPACO", "Tigo", "Personal"];

function badgeClass(estado: string): string {
  if (estado === "pagada") return shared.badgeSuccess;
  if (estado === "vencida") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function FacturaDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: factura, error, isLoading, mutate } = useSWR(["factura", id], () => getFactura(id));

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("tarjeta");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const [proveedor, setProveedor] = useState<Factura["proveedor"]>("ANDE");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editInitialized, setEditInitialized] = useState(false);

  if (factura && !editInitialized) {
    setProveedor(factura.proveedor);
    setNumeroFactura(factura.numero_factura);
    setMonto(String(factura.monto));
    setFechaVencimiento(factura.fecha_vencimiento);
    setEditInitialized(true);
  }

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

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    setEditSubmitting(true);
    setEditError(null);
    try {
      const updated = await actualizarFactura(id, {
        proveedor,
        numeroFactura,
        monto: Number(monto),
        fechaVencimiento,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "No se pudo actualizar la factura.");
    } finally {
      setEditSubmitting(false);
    }
  }

  const yaPagada = factura?.estado === "pagada";

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="facturas" title={`Factura #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {factura && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${factura.usuario_id}`}>{factura.usuario_id}</Link>
                </dd>
              </div>
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

            <form
              className={shared.formGrid}
              onSubmit={handleEditSubmit}
              data-testid={ids.rowAction(id, "edit-form")}
            >
              <h2>Editar factura</h2>
              <div className={shared.field}>
                <label htmlFor="proveedor">Proveedor</label>
                <select
                  id="proveedor"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value as Factura["proveedor"])}
                  data-testid={ids.field("proveedor")}
                >
                  {PROVEEDORES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className={shared.field}>
                <label htmlFor="numeroFactura">Número de factura</label>
                <input
                  id="numeroFactura"
                  required
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  data-testid={ids.field("numeroFactura")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="editMonto">Monto</label>
                <input
                  id="editMonto"
                  type="number"
                  step="0.01"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  data-testid={ids.field("monto")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="fechaVencimiento">Vencimiento</label>
                <input
                  id="fechaVencimiento"
                  type="date"
                  required
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  data-testid={ids.field("fechaVencimiento")}
                />
              </div>

              {editError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("numeroFactura")}>
                  {editError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={editSubmitting}
                data-testid={ids.rowAction(id, "edit-submit")}
              >
                {editSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar esta factura?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar factura"
              onDelete={() => eliminarFactura(id)}
              onDeleted={() => router.push("/facturas")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
