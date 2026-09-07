"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearBeneficiarioV2 } from "@/lib/api/v2/beneficiarios";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-beneficiarios");

export default function NuevoBeneficiarioV2Page() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [nombre, setNombre] = useState("");
  const [banco, setBanco] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [alias, setAlias] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const beneficiario = await crearBeneficiarioV2({
        usuarioId: Number(usuarioId),
        nombre,
        banco,
        numeroCuenta,
        alias: alias.trim() || undefined,
      });
      router.push(`/v2/beneficiarios/${beneficiario.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el beneficiario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-beneficiarios" title="Nuevo beneficiario" />

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
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            data-testid={ids.field("nombre")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="banco">Banco</label>
          <input
            id="banco"
            required
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            data-testid={ids.field("banco")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="numeroCuenta">Número de cuenta</label>
          <input
            id="numeroCuenta"
            required
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value)}
            data-testid={ids.field("numeroCuenta")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="alias">Alias (opcional)</label>
          <input
            id="alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            data-testid={ids.field("alias")}
          />
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9em" }}>
          El par (usuarioId, número de cuenta) debe ser único por usuario.
        </p>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("usuarioId")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear beneficiario"}
        </button>
      </form>
    </div>
  );
}
