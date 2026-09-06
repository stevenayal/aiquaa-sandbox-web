"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearUsuario, type CrearUsuarioInput } from "@/lib/api/usuarios";
import { ApiError } from "@/lib/api/http";
import { normalizeEmail } from "@/lib/format";
import { testIds } from "@/lib/testids";

const ids = testIds("usuarios");

const DOCUMENTO_TIPOS: CrearUsuarioInput["documentoTipo"][] = ["CI", "pasaporte", "RUC"];

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    documentoTipo: "CI" as CrearUsuarioInput["documentoTipo"],
    documentoNumero: "",
    fechaNacimiento: "",
    direccion: "",
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
      const usuario = await crearUsuario({
        nombre: form.nombre,
        email: normalizeEmail(form.email),
        documentoTipo: form.documentoTipo,
        documentoNumero: form.documentoNumero,
        fechaNacimiento: form.fechaNacimiento || undefined,
        direccion: form.direccion || undefined,
      });
      router.push(`/usuarios/${usuario.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="usuarios" title="Nuevo usuario" />

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
            onChange={(e) => update("documentoTipo", e.target.value as CrearUsuarioInput["documentoTipo"])}
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
          <label htmlFor="fechaNacimiento">Fecha de nacimiento (opcional)</label>
          <input
            id="fechaNacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => update("fechaNacimiento", e.target.value)}
            data-testid={ids.field("fechaNacimiento")}
          />
        </div>

        <div className={shared.field}>
          <label htmlFor="direccion">Dirección (opcional)</label>
          <input
            id="direccion"
            value={form.direccion}
            onChange={(e) => update("direccion", e.target.value)}
            data-testid={ids.field("direccion")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("nombre")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear usuario"}
        </button>
      </form>
    </div>
  );
}
