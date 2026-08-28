"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { emitirTarjeta, type TarjetaTipo, type TarjetaMarca } from "@/lib/api/tarjetas";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("tarjetas");
const TIPOS: TarjetaTipo[] = ["credito", "debito"];
const MARCAS: TarjetaMarca[] = ["visa", "mastercard"];

export default function NuevaTarjetaPage() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [tipo, setTipo] = useState<TarjetaTipo>("debito");
  const [marca, setMarca] = useState<TarjetaMarca>("visa");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await emitirTarjeta(Number(usuarioId), tipo, marca);
      router.push("/tarjetas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo emitir la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="tarjetas" title="Emitir tarjeta" />

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.form}>
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

        <div className={shared.field}>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TarjetaTipo)} data-testid={ids.field("tipo")}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="marca">Marca</label>
          <select
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value as TarjetaMarca)}
            data-testid={ids.field("marca")}
          >
            {MARCAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Emitiendo..." : "Emitir"}
        </button>
      </form>
    </div>
  );
}
