"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import { getReserva, actualizarReserva, eliminarReserva } from "@/lib/api/reservas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("reservas");

function badgeClass(estado: string): string {
  if (estado === "confirmada" || estado === "completada") return shared.badgeSuccess;
  if (estado === "cancelada") return shared.badgeDanger;
  return shared.badgeWarning;
}

// Convierte un ISO 8601 del backend al formato "YYYY-MM-DDTHH:mm" que espera
// un input type="datetime-local" (mismo criterio inverso que en /reservas/new).
function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReservaDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: reserva, error, isLoading, mutate } = useSWR(["reserva", id], () => getReserva(id));

  const [servicio, setServicio] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (reserva && !initialized) {
    setServicio(reserva.servicio);
    setFechaHora(toDatetimeLocal(reserva.fecha_hora));
    setNotas(reserva.notas ?? "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarReserva(id, {
        servicio,
        fechaHora: fechaHora ? new Date(fechaHora).toISOString() : "",
        notas: notas.trim() || undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="reservas" title={`Reserva #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {reserva && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${reserva.usuario_id}`}>{reserva.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Servicio</dt>
                <dd>{reserva.servicio}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha/hora</dt>
                <dd>{reserva.fecha_hora}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(reserva.estado)}>{reserva.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Notas</dt>
                <dd>{reserva.notas ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha de creación</dt>
                <dd>{new Date(reserva.created_at).toLocaleString()}</dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar reserva</h2>
              <div className={shared.field}>
                <label htmlFor="servicio">Servicio</label>
                <input
                  id="servicio"
                  required
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  data-testid={ids.field("servicio")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="fechaHora">Fecha y hora</label>
                <input
                  id="fechaHora"
                  type="datetime-local"
                  required
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  data-testid={ids.field("fechaHora")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="notas">Notas (opcional)</label>
                <input
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  data-testid={ids.field("notas")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("servicio")}>
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
              title="¿Eliminar esta reserva?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar reserva"
              onDelete={() => eliminarReserva(id)}
              onDeleted={() => router.push("/reservas")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
