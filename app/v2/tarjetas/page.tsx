"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  listTarjetasV2,
  bloquearTarjetaV2,
  activarTarjetaV2,
  cambiarLimiteTarjetaV2,
  type EstadoTarjetaV2,
} from "@/lib/api/v2/tarjetas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Monto } from "@/components/Valores";

const ids = testIds("v2-tarjetas");
const ESTADOS: EstadoTarjetaV2[] = ["activa", "bloqueada", "vencida"];

function badgeClass(estado: EstadoTarjetaV2): string {
  if (estado === "activa") return shared.badgeSuccess;
  if (estado === "bloqueada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function TarjetasV2Page() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [estado, setEstado] = useState<EstadoTarjetaV2 | "">("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmBloquearId, setConfirmBloquearId] = useState<number | null>(null);
  const [limiteEdits, setLimiteEdits] = useState<Record<number, string>>({});

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: tarjetas, error, isLoading, mutate } = useSWR(
    ["v2-tarjetas", parsedUsuarioId, estado],
    () => listTarjetasV2({ usuarioId: parsedUsuarioId, estado: estado || undefined }),
  );

  async function handleToggle(id: number, action: "bloquear" | "activar") {
    setActionError(null);
    setActionSuccess(null);
    setPendingId(id);
    try {
      await (action === "bloquear" ? bloquearTarjetaV2(id) : activarTarjetaV2(id));
      await mutate();
      setActionSuccess(action === "bloquear" ? "Tarjeta bloqueada." : "Tarjeta activada.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarjeta.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleCambiarLimite(id: number, nuevoLimite: string) {
    setActionError(null);
    setActionSuccess(null);
    setPendingId(id);
    try {
      await cambiarLimiteTarjetaV2(id, Number(nuevoLimite));
      await mutate();
      setActionSuccess("Límite actualizado.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo cambiar el límite.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-tarjetas" title="Tarjetas">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todas"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoTarjetaV2 | "")}
            data-testid={ids.field("estado")}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <Link href="/v2/tarjetas/new" className={shared.button}>
          Emitir tarjeta
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
        empty={(tarjetas?.length ?? 0) === 0}
        count={tarjetas?.length ?? 0}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th>Número</th>
              <th>Límite</th>
              <th>Utilizado</th>
              <th>Disponible</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tarjetas?.map((tarjeta) => (
              <tr key={tarjeta.id} data-testid={ids.row(tarjeta.id)}>
                <td>
                  <Link href={`/v2/tarjetas/${tarjeta.id}`}>{tarjeta.id}</Link>
                </td>
                <td>
                  <Link href={`/v2/usuarios/${tarjeta.usuario_id}`}>{tarjeta.usuario_id}</Link>
                </td>
                <td>{tarjeta.tipo}</td>
                <td>{tarjeta.marca}</td>
                <td>{tarjeta.numero_enmascarado}</td>
                <td>
                  <Monto value={tarjeta.limite_credito} />
                </td>
                <td>
                  <Monto value={tarjeta.saldo_utilizado} />
                </td>
                <td>
                  <Monto value={tarjeta.disponible} />
                </td>
                <td>
                  <span className={badgeClass(tarjeta.estado)}>{tarjeta.estado}</span>
                </td>
                <td className={shared.rowActions}>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={tarjeta.estado !== "activa" || pendingId === tarjeta.id}
                    onClick={() => setConfirmBloquearId(tarjeta.id)}
                    data-testid={ids.rowAction(tarjeta.id, "bloquear")}
                  >
                    Bloquear
                  </button>
                  <button
                    type="button"
                    className={shared.buttonSecondary}
                    disabled={tarjeta.estado !== "bloqueada" || pendingId === tarjeta.id}
                    onClick={() => handleToggle(tarjeta.id, "activar")}
                    data-testid={ids.rowAction(tarjeta.id, "activar")}
                  >
                    Activar
                  </button>
                  {tarjeta.tipo === "credito" && (
                    <form
                      className={shared.rowActions}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = limiteEdits[tarjeta.id] ?? tarjeta.limite_credito;
                        handleCambiarLimite(tarjeta.id, value);
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        style={{ width: "8em" }}
                        value={limiteEdits[tarjeta.id] ?? tarjeta.limite_credito}
                        onChange={(e) =>
                          setLimiteEdits((prev) => ({ ...prev, [tarjeta.id]: e.target.value }))
                        }
                        disabled={pendingId === tarjeta.id}
                        data-testid={ids.field(`limite-${tarjeta.id}`)}
                        aria-label="Nuevo límite"
                      />
                      <button
                        type="submit"
                        className={shared.buttonSecondary}
                        disabled={pendingId === tarjeta.id}
                        data-testid={ids.rowAction(tarjeta.id, "limite")}
                      >
                        Cambiar límite
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>

      <ConfirmDialog
        open={confirmBloquearId !== null}
        title="¿Bloquear esta tarjeta?"
        description="La tarjeta dejará de poder usarse hasta que la actives de nuevo."
        confirmLabel="Bloquear"
        danger
        testId={ids.rowAction(confirmBloquearId ?? 0, "bloquear")}
        onCancel={() => setConfirmBloquearId(null)}
        onConfirm={() => {
          const id = confirmBloquearId;
          setConfirmBloquearId(null);
          if (id !== null) handleToggle(id, "bloquear");
        }}
      />
    </div>
  );
}
