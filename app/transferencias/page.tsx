"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearTransferencia, listTransferencias } from "@/lib/api/transferencias";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

// La raíz del módulo nació como solo el form de creación (no había GET de
// lista); ahora que el backend expone GET /transferencias, se agrega la
// lista debajo reutilizando el mismo factory de testids.
const ids = testIds("transferencias");

function badgeClass(estado: string): string {
  if (estado === "completada") return shared.badgeSuccess;
  if (estado === "rechazada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function NuevaTransferenciaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ cuentaOrigenId: "", cuentaDestinoId: "", monto: "", descripcion: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtroCuentaOrigenId, setFiltroCuentaOrigenId] = useState("");
  const [filtroCuentaDestinoId, setFiltroCuentaDestinoId] = useState("");

  const parsedCuentaOrigenId = filtroCuentaOrigenId.trim() ? Number(filtroCuentaOrigenId) : undefined;
  const parsedCuentaDestinoId = filtroCuentaDestinoId.trim() ? Number(filtroCuentaDestinoId) : undefined;
  const {
    data: transferencias,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSWR(["transferencias", parsedCuentaOrigenId, parsedCuentaDestinoId], () =>
    listTransferencias({ cuentaOrigenId: parsedCuentaOrigenId, cuentaDestinoId: parsedCuentaDestinoId }),
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const transferencia = await crearTransferencia({
        cuentaOrigenId: Number(form.cuentaOrigenId),
        cuentaDestinoId: Number(form.cuentaDestinoId),
        monto: Number(form.monto),
        descripcion: form.descripcion || undefined,
      });
      await mutateList();
      router.push(`/transferencias/${transferencia.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la transferencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="transferencias" title="Nueva transferencia" />

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
          <label htmlFor="cuentaDestinoId">Cuenta destino (id)</label>
          <input
            id="cuentaDestinoId"
            type="number"
            required
            value={form.cuentaDestinoId}
            onChange={(e) => update("cuentaDestinoId", e.target.value)}
            data-testid={ids.field("cuentaDestinoId")}
          />
        </div>

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
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <input
            id="descripcion"
            value={form.descripcion}
            onChange={(e) => update("descripcion", e.target.value)}
            data-testid={ids.field("descripcion")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("cuentaOrigenId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Transfiriendo..." : "Transferir"}
        </button>
      </form>

      <div className={shared.header}>
        <h2>Transferencias</h2>
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
            <label htmlFor="filtroCuentaDestinoId">Cuenta destino (id)</label>
            <input
              id="filtroCuentaDestinoId"
              value={filtroCuentaDestinoId}
              onChange={(e) => setFiltroCuentaDestinoId(e.target.value)}
              placeholder="Todas"
              data-testid={ids.field("filtroCuentaDestinoId")}
            />
          </div>
        </div>
      </div>

      <DataState
        loading={listLoading}
        error={listError ?? null}
        empty={(transferencias?.length ?? 0) === 0}
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
              <th>Monto</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {transferencias?.map((transferencia) => (
              <tr key={transferencia.id} data-testid={ids.row(transferencia.id)}>
                <td>
                  <Link href={`/transferencias/${transferencia.id}`}>{transferencia.id}</Link>
                </td>
                <td>
                  <Link href={`/cuentas/${transferencia.cuenta_origen_id}`}>{transferencia.cuenta_origen_id}</Link>
                </td>
                <td>
                  <Link href={`/cuentas/${transferencia.cuenta_destino_id}`}>{transferencia.cuenta_destino_id}</Link>
                </td>
                <td>{transferencia.monto}</td>
                <td>{transferencia.descripcion ?? "—"}</td>
                <td>
                  <span className={badgeClass(transferencia.estado)}>{transferencia.estado}</span>
                </td>
                <td>{new Date(transferencia.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
