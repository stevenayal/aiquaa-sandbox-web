"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { crearTransferencia } from "@/lib/api/transferencias";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

// No hay GET de lista para transferencias: la raíz del módulo ES el form de
// creación (desviación documentada en la sección 4 del plan).
const ids = testIds("transferencias");

export default function NuevaTransferenciaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ cuentaOrigenId: "", cuentaDestinoId: "", monto: "", descripcion: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/transferencias/${transferencia.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la transferencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Nueva transferencia</h1>
      </div>

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
    </div>
  );
}
