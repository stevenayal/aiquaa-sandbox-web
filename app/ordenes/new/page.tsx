"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import styles from "./page.module.css";
import { crearOrden, type ItemOrdenInput } from "@/lib/api/ordenes";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("ordenes");

interface ItemRow {
  producto: string;
  cantidad: string;
  precioUnitario: string;
}

function emptyRow(): ItemRow {
  return { producto: "", cantidad: "1", precioUnitario: "" };
}

export default function NuevaOrdenPage() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalEstimado = items.reduce((sum, row) => {
    const cantidad = Number(row.cantidad) || 0;
    const precio = Number(row.precioUnitario) || 0;
    return sum + cantidad * precio;
  }, 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payloadItems: ItemOrdenInput[] = items.map((row) => ({
        producto: row.producto,
        cantidad: Number(row.cantidad),
        precioUnitario: Number(row.precioUnitario),
      }));
      const orden = await crearOrden(Number(usuarioId), payloadItems);
      router.push(`/ordenes/${orden.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la orden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Nueva orden</h1>
      </div>

      <form className={`${shared.formGrid} ${styles.form}`} onSubmit={handleSubmit} data-testid={ids.form}>
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            required
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            data-testid={ids.field("usuarioId")}
          />
        </div>

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
              <tr key={index} data-testid={ids.row(index)}>
                <td>
                  <input
                    required
                    value={row.producto}
                    onChange={(e) => updateItem(index, { producto: e.target.value })}
                    data-testid={ids.field(`items-${index}-producto`)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    required
                    value={row.cantidad}
                    onChange={(e) => updateItem(index, { cantidad: e.target.value })}
                    data-testid={ids.field(`items-${index}-cantidad`)}
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
                    data-testid={ids.field(`items-${index}-precioUnitario`)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    data-testid={ids.rowAction(index, "quitar")}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" className={shared.buttonSecondary} onClick={addItem} data-testid="ordenes-agregar-item">
          + Agregar item
        </button>

        <p>
          Total estimado: <strong>{totalEstimado.toFixed(2)}</strong> (el monto real lo calcula el servidor)
        </p>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear orden"}
        </button>
      </form>
    </div>
  );
}
