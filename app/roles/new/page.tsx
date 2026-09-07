"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { crearRol, type Rol } from "@/lib/api/roles";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("roles");
const NOMBRES: Rol["nombre"][] = ["admin", "soporte", "auditor", "operador"];

export default function NuevoRolPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState<Rol["nombre"]>("admin");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const rol = await crearRol({ nombre, descripcion: descripcion.trim() || undefined });
      router.push(`/roles/${rol.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el rol.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="roles" title="Nuevo rol" />

      <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.form}>
        <div className={shared.field}>
          <label htmlFor="nombre">Nombre</label>
          <select
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value as Rol["nombre"])}
            data-testid={ids.field("nombre")}
          >
            {NOMBRES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <input
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            data-testid={ids.field("descripcion")}
          />
        </div>

        {error && (
          <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("nombre")}>
            {error}
          </p>
        )}

        <button type="submit" className={shared.button} disabled={submitting} data-testid={ids.submit}>
          {submitting ? "Creando..." : "Crear rol"}
        </button>
      </form>
    </div>
  );
}
