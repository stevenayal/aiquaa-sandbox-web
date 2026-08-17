"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { listNotificaciones, marcarLeida } from "@/lib/api/notificaciones";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("notificaciones");

export default function NotificacionesPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [leido, setLeido] = useState<"" | "true" | "false">("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: notificaciones, error, isLoading, mutate } = useSWR(
    ["notificaciones", parsedUsuarioId, leido],
    () => listNotificaciones({ usuarioId: parsedUsuarioId, leido: leido === "" ? undefined : leido === "true" }),
  );

  async function handleMarcarLeida(id: number) {
    setActionError(null);
    setPendingId(id);
    try {
      await marcarLeida(id);
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo marcar como leída.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Notificaciones</h1>
        <div className={shared.headerActions}>
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
          <div className={shared.field}>
            <label htmlFor="leido">Leído</label>
            <select
              id="leido"
              value={leido}
              onChange={(e) => setLeido(e.target.value as "" | "true" | "false")}
              data-testid={ids.field("leido")}
            >
              <option value="">Todas</option>
              <option value="true">Leídas</option>
              <option value="false">No leídas</option>
            </select>
          </div>
          <Link href="/notificaciones/new" className={shared.button}>
            Nueva notificación
          </Link>
        </div>
      </div>

      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(notificaciones?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Canal</th>
              <th>Asunto</th>
              <th>Mensaje</th>
              <th>Leído</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {notificaciones?.map((n) => (
              <tr key={n.id} data-testid={ids.row(n.id)}>
                <td>{n.id}</td>
                <td>{n.canal}</td>
                <td>{n.asunto}</td>
                <td>{n.mensaje}</td>
                <td>{n.leido ? "Sí" : "No"}</td>
                <td>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={n.leido || pendingId === n.id}
                    onClick={() => handleMarcarLeida(n.id)}
                    data-testid={ids.rowAction(n.id, "leer")}
                  >
                    Marcar leída
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
