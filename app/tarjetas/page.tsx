"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { listTarjetas, bloquearTarjeta, activarTarjeta } from "@/lib/api/tarjetas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("tarjetas");

function badgeClass(estado: string): string {
  if (estado === "activa") return shared.badgeSuccess;
  if (estado === "bloqueada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function TarjetasPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: tarjetas, error, isLoading, mutate } = useSWR(["tarjetas", parsedUsuarioId], () =>
    listTarjetas(parsedUsuarioId),
  );

  async function handleToggle(id: number, action: "bloquear" | "activar") {
    setActionError(null);
    setPendingId(id);
    try {
      await (action === "bloquear" ? bloquearTarjeta(id) : activarTarjeta(id));
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarjeta.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Tarjetas</h1>
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
          <Link href="/tarjetas/new" className={shared.button}>
            Emitir tarjeta
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
        empty={(tarjetas?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th>Número</th>
              <th>Saldo actual</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tarjetas?.map((tarjeta) => (
              <tr key={tarjeta.id} data-testid={ids.row(tarjeta.id)}>
                <td>{tarjeta.id}</td>
                <td>{tarjeta.tipo}</td>
                <td>{tarjeta.marca}</td>
                <td>{tarjeta.numero_enmascarado}</td>
                <td>{tarjeta.saldo_actual}</td>
                <td>
                  <span className={badgeClass(tarjeta.estado)}>{tarjeta.estado}</span>
                </td>
                <td className={shared.rowActions}>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={tarjeta.estado === "bloqueada" || pendingId === tarjeta.id}
                    onClick={() => handleToggle(tarjeta.id, "bloquear")}
                    data-testid={ids.rowAction(tarjeta.id, "bloquear")}
                  >
                    Bloquear
                  </button>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={tarjeta.estado === "activa" || pendingId === tarjeta.id}
                    onClick={() => handleToggle(tarjeta.id, "activar")}
                    data-testid={ids.rowAction(tarjeta.id, "activar")}
                  >
                    Activar
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
