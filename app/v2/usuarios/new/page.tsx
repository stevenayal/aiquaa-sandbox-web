"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearUsuarioV2, type DocumentoTipo } from "@/lib/api/v2/usuarios";
import { normalizeEmail } from "@/lib/format";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-usuarios");
const DOCUMENTO_TIPOS: DocumentoTipo[] = ["CI", "pasaporte", "RUC"];

export default function NuevoUsuarioV2Page() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    documentoTipo: "CI" as DocumentoTipo,
    documentoNumero: "",
    telefono: "",
  });
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
      const usuario = await crearUsuarioV2({
        nombre: form.nombre,
        email: normalizeEmail(form.email),
        documentoTipo: form.documentoTipo,
        documentoNumero: form.documentoNumero,
        telefono: form.telefono.trim() || undefined,
      });
      router.push(`/v2/usuarios/${usuario.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-usuarios" title="Nuevo cliente" />

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.form}>
        <div className={shared.field}>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            required
            value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            data-testid={ids.field("nombre")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            data-testid={ids.field("email")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="documentoTipo">Tipo de documento</label>
          <select
            id="documentoTipo"
            value={form.documentoTipo}
            onChange={(e) => update("documentoTipo", e.target.value as DocumentoTipo)}
            data-testid={ids.field("documentoTipo")}
          >
            {DOCUMENTO_TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="documentoNumero">Número de documento</label>
          <input
            id="documentoNumero"
            required
            value={form.documentoNumero}
            onChange={(e) => update("documentoNumero", e.target.value)}
            data-testid={ids.field("documentoNumero")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="telefono">Teléfono (opcional)</label>
          <input
            id="telefono"
            value={form.telefono}
            onChange={(e) => update("telefono", e.target.value)}
            data-testid={ids.field("telefono")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("nombre")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear cliente"}
        </button>
      </form>
    </div>
  );
}
