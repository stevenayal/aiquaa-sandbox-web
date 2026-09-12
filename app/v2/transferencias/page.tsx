"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearTransferenciaV2, listTransferenciasV2, type EstadoTransferenciaV2 } from "@/lib/api/v2/transferencias";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha, Monto } from "@/components/Valores";

const ids = testIds("v2-transferencias");
const ESTADOS: EstadoTransferenciaV2[] = ["pendiente", "completada", "rechazada", "anulada"];

function badgeClass(estado: EstadoTransferenciaV2): string {
  if (estado === "completada") return shared.badgeSuccess;
  if (estado === "rechazada") return shared.badgeDanger;
  if (estado === "anulada") return shared.badge;
  return shared.badgeWarning;
}

export default function TransferenciasV2Page() {
  const [form, setForm] = useState({ cuentaOrigenId: "", cuentaDestinoId: "", beneficiarioId: "", monto: "", concepto: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtroCuentaOrigenId, setFiltroCuentaOrigenId] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoTransferenciaV2 | "">("");

  const parsedFiltroCuentaOrigenId = filtroCuentaOrigenId.trim() ? Number(filtroCuentaOrigenId) : undefined;
  const {
    data: transferencias,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSWR(["v2-transferencias", parsedFiltroCuentaOrigenId, filtroEstado], () =>
    listTransferenciasV2({ cuentaOrigenId: parsedFiltroCuentaOrigenId, estado: filtroEstado || undefined }),
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const hasDestino = form.cuentaDestinoId.trim() !== "";
    const hasBeneficiario = form.beneficiarioId.trim() !== "";
    if (hasDestino === hasBeneficiario) {
      setError("Completá exactamente uno: cuenta destino o beneficiario, no ambos ni ninguno.");
      return;
    }

    setSubmitting(true);
    try {
      await crearTransferenciaV2({
        cuentaOrigenId: Number(form.cuentaOrigenId),
        cuentaDestinoId: hasDestino ? Number(form.cuentaDestinoId) : undefined,
        beneficiarioId: hasBeneficiario ? Number(form.beneficiarioId) : undefined,
        monto: Number(form.monto),
        concepto: form.concepto.trim() || undefined,
      });
      setForm((prev) => ({ ...prev, cuentaDestinoId: "", beneficiarioId: "", monto: "", concepto: "" }));
      await mutateList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la transferencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-transferencias" title="Transferencias" />

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.form}>
        <div className={shared.field}>
          <label htmlFor="cuentaOrigenId">Cuenta origen (id)</label>
          <input
            id="cuentaOrigenId"
            type="number"
            required
            value={form.cuentaOrigenId}
            onChange={(e) => update("cuentaOrigenId", e.target.value)}
            data-testid={ids.field("cuentaOrigenId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="cuentaDestinoId">Cuenta destino (id) — transferencia interna</label>
          <input
            id="cuentaDestinoId"
            type="number"
            value={form.cuentaDestinoId}
            onChange={(e) => update("cuentaDestinoId", e.target.value)}
            data-testid={ids.field("cuentaDestinoId")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="beneficiarioId">Beneficiario (id) — transferencia externa</label>
          <input
            id="beneficiarioId"
            type="number"
            value={form.beneficiarioId}
            onChange={(e) => update("beneficiarioId", e.target.value)}
            data-testid={ids.field("beneficiarioId")}
          />
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
          Completá cuenta destino (interna) o beneficiario (externa), exactamente una de las dos.
        </p>

        <div className={shared.field}>
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.monto}
            onChange={(e) => update("monto", e.target.value)}
            data-testid={ids.field("monto")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="concepto">Concepto (opcional)</label>
          <input
            id="concepto"
            value={form.concepto}
            onChange={(e) => update("concepto", e.target.value)}
            data-testid={ids.field("concepto")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("cuentaDestinoId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Transfiriendo..." : "Transferir"}
        </button>
      </form>

      <div className={shared.header}>
        <h2>Historial</h2>
        <div className={shared.headerActions}>
          <div className={shared.field}>
            <label htmlFor="filtroCuentaOrigenId">Cuenta origen (id)</label>
            <input
              id="filtroCuentaOrigenId"
              value={filtroCuentaOrigenId}
              onChange={(e) => setFiltroCuentaOrigenId(e.target.value)}
              placeholder="Todas"
              data-testid={ids.field("filtroCuentaOrigenId")}
            />
          </div>
          <div className={shared.field}>
            <label htmlFor="filtroEstado">Estado</label>
            <select
              id="filtroEstado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoTransferenciaV2 | "")}
              data-testid={ids.field("filtroEstado")}
            >
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataState
        loading={listLoading}
        error={listError ?? null}
        empty={(transferencias?.length ?? 0) === 0}
        count={transferencias?.length ?? 0}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Cuenta origen</th>
              <th>Cuenta destino</th>
              <th>Beneficiario</th>
              <th>Monto</th>
              <th>Moneda</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {transferencias?.map((transferencia) => (
              <tr key={transferencia.id} data-testid={ids.row(transferencia.id)}>
                <td>
                  <Link href={`/v2/transferencias/${transferencia.id}`}>{transferencia.id}</Link>
                </td>
                <td>{transferencia.cuenta_origen_id}</td>
                <td>{transferencia.cuenta_destino_id ?? "—"}</td>
                <td>{transferencia.beneficiario_id ?? "—"}</td>
                <td>
                  <Monto value={transferencia.monto} moneda={transferencia.moneda} />
                </td>
                <td>{transferencia.moneda}</td>
                <td>
                  <span className={badgeClass(transferencia.estado)}>{transferencia.estado}</span>
                </td>
                <td>
                  <Fecha value={transferencia.created_at} conHora />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
