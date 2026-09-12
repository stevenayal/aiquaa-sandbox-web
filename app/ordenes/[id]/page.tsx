"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import Link from "next/link";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getOrden, actualizarOrden, eliminarOrden, type ItemOrdenInput } from "@/lib/api/ordenes";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Monto } from "@/components/Valores";

const ids = testIds("ordenes");

interface ItemRow {
  producto: string;
  cantidad: string;
  precioUnitario: string;
}

function emptyRow(): ItemRow {
  return { producto: "", cantidad: "1", precioUnitario: "" };
}

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: orden, error, isLoading, mutate } = useSWR(["orden", id], () => getOrden(id));

  const [items, setItems] = useState<ItemRow[]>([]);
  const [itemsInitialized, setItemsInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (orden && !itemsInitialized) {
    setItems(
      orden.items && orden.items.length > 0
        ? orden.items.map((item) => ({
            producto: item.producto,
            cantidad: String(item.cantidad),
            precioUnitario: String(item.precio_unitario),
          }))
        : [emptyRow()],
    );
    setItemsInitialized(true);
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payloadItems: ItemOrdenInput[] = items.map((row) => ({
        producto: row.producto,
        cantidad: Number(row.cantidad),
        precioUnitario: Number(row.precioUnitario),
      }));
      const updated = await actualizarOrden(id, payloadItems);
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la orden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="ordenes" title={`Orden #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {orden && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${orden.usuario_id}`}>{orden.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Producto principal</dt>
                <dd>{orden.producto}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto</dt>
                <dd>
                  <Monto value={orden.monto} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>{orden.estado}</dd>
              </div>
            </dl>

            <table className={shared.table} data-testid={ids.rowAction(id, "items")}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.producto}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.precio_unitario}</td>
                    <td>
                      <Monto value={item.subtotal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <form className={shared.formGrid} onSubmit={handleEditSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar orden</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
                Recalcula el producto/monto principal de la orden a partir de estos items. La tabla de arriba es
                historial: no se reemplaza (el servidor no borra items_orden).
              </p>

              <table className={shared.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          required
                          value={row.producto}
                          onChange={(e) => updateItem(index, { producto: e.target.value })}
                          data-testid={ids.field(`edit-items-${index}-producto`)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          required
                          value={row.cantidad}
                          onChange={(e) => updateItem(index, { cantidad: e.target.value })}
                          data-testid={ids.field(`edit-items-${index}-cantidad`)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={row.precioUnitario}
                          onChange={(e) => updateItem(index, { precioUnitario: e.target.value })}
                          data-testid={ids.field(`edit-items-${index}-precioUnitario`)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={shared.buttonSecondary}
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          data-testid={ids.rowAction(id, `edit-quitar-${index}`)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                className={shared.buttonSecondary}
                onClick={addItem}
                data-testid={ids.rowAction(id, "edit-agregar-item")}
              >
                + Agregar item
              </button>

              {formError && (
                <p role="alert" className={shared.fieldError}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting}
                data-testid={ids.rowAction(id, "edit-submit")}
              >
                {submitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar esta orden?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar orden"
              onDelete={() => eliminarOrden(id)}
              onDeleted={() => router.push("/ordenes")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
