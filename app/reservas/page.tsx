"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { listReservas, confirmarReserva, cancelarReserva } from "@/lib/api/reservas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

// No existe GET /reservas/{id} en el backend (solo list + confirmar/cancelar
// por id) — mismo patrón que tarjetas/notificaciones: sin página de detail,
// acciones inline en la fila.
const ids = testIds("reservas");

function badgeClass(estado: string): string {
  if (estado === "confirmada" || estado === "completada") return shared.badgeSuccess;
  if (estado === "cancelada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function ReservasPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmCancelarId, setConfirmCancelarId] = useState<number | null>(null);

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: reservas, error, isLoading, mutate } = useSWR(["reservas", parsedUsuarioId], () =>
    listReservas(parsedUsuarioId),
  );

  async function handleAction(id: number, action: "confirmar" | "cancelar") {
    setActionError(null);
    setActionSuccess(null);
    setPendingId(id);
    try {
      await (action === "confirmar" ? confirmarReserva(id) : cancelarReserva(id));
      await mutate();
      setActionSuccess(action === "confirmar" ? "Reserva confirmada." : "Reserva cancelada.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar la reserva.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="reservas" title="Reservas">
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todas"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <Link href="/reservas/new" className={shared.button}>
          Nueva reserva
        </Link>
      </ModuleHeader>

      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      {actionSuccess && (
        <p role="status" className={shared.success} data-testid={ids.success}>
          {actionSuccess}
        </p>
      )}

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(reservas?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Servicio</th>
              <th>Fecha/hora</th>
              <th>Notas</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reservas?.map((reserva) => (
              <tr key={reserva.id} data-testid={ids.row(reserva.id)}>
                <td>{reserva.id}</td>
                <td>
                  <Link href={`/usuarios/${reserva.usuario_id}`}>{reserva.usuario_id}</Link>
                </td>
                <td>{reserva.servicio}</td>
                <td>{reserva.fecha_hora}</td>
                <td>{reserva.notas ?? "—"}</td>
                <td>
                  <span className={badgeClass(reserva.estado)}>{reserva.estado}</span>
                </td>
                <td className={shared.rowActions}>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={reserva.estado !== "pendiente" || pendingId === reserva.id}
                    onClick={() => handleAction(reserva.id, "confirmar")}
                    data-testid={ids.rowAction(reserva.id, "confirmar")}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={
                      reserva.estado === "cancelada" ||
                      reserva.estado === "completada" ||
                      pendingId === reserva.id
                    }
                    onClick={() => setConfirmCancelarId(reserva.id)}
                    data-testid={ids.rowAction(reserva.id, "cancelar")}
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>

      <ConfirmDialog
        open={confirmCancelarId !== null}
        title="¿Cancelar esta reserva?"
        description="No se puede deshacer: la reserva quedará marcada como cancelada."
        confirmLabel="Cancelar reserva"
        danger
        testId={ids.rowAction(confirmCancelarId ?? 0, "cancelar")}
        onCancel={() => setConfirmCancelarId(null)}
        onConfirm={() => {
          const id = confirmCancelarId;
          setConfirmCancelarId(null);
          if (id !== null) handleAction(id, "cancelar");
        }}
      />
    </div>
  );
}
