"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DeleteButton } from "@/components/DeleteButton";
import {
  getAhorroV2,
  actualizarAhorroV2,
  eliminarAhorroV2,
  aportarAhorroV2,
  type EstadoAhorroV2,
} from "@/lib/api/v2/ahorros";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";
import { Fecha, Monto, Porcentaje } from "@/components/Valores";

const ids = testIds("v2-ahorros");

function badgeClass(estado: EstadoAhorroV2): string {
  if (estado === "completado") return shared.badgeSuccess;
  if (estado === "cancelado") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function AhorroV2DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: ahorro, error, isLoading, mutate } = useSWR(["v2-ahorro", id], () => getAhorroV2(id));

  const [nombreMeta, setNombreMeta] = useState("");
  const [metaMonto, setMetaMonto] = useState("");
  const [aporteMensual, setAporteMensual] = useState("");
  const [tasaAnual, setTasaAnual] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [monto, setMonto] = useState("");
  const [aportando, setAportando] = useState(false);
  const [aporteError, setAporteError] = useState<string | null>(null);
  const [aporteSuccess, setAporteSuccess] = useState<string | null>(null);

  if (ahorro && !initialized) {
    setNombreMeta(ahorro.nombre_meta);
    setMetaMonto(ahorro.meta_monto);
    setAporteMensual(ahorro.aporte_mensual);
    setTasaAnual(ahorro.tasa_anual);
    setInitialized(true);
  }

  async function handleAportar(event: FormEvent) {
    event.preventDefault();
    setAportando(true);
    setAporteError(null);
    setAporteSuccess(null);
    try {
      const updated = await aportarAhorroV2(id, monto.trim() ? Number(monto) : undefined);
      await mutate(updated, { revalidate: false });
      setMonto("");
      setAporteSuccess("Aporte registrado.");
    } catch (err) {
      setAporteError(err instanceof ApiError ? err.message : "No se pudo registrar el aporte.");
    } finally {
      setAportando(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarAhorroV2(id, {
        nombreMeta,
        metaMonto: Number(metaMonto),
        aporteMensual: Number(aporteMensual),
        tasaAnual: tasaAnual.trim() ? Number(tasaAnual) : undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el plan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-ahorros" title={`Plan de ahorro #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {ahorro && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/v2/usuarios/${ahorro.usuario_id}`}>{ahorro.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Cuenta</dt>
                <dd>{ahorro.cuenta_id}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Meta</dt>
                <dd>{ahorro.nombre_meta}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Monto meta</dt>
                <dd>
                  <Monto value={ahorro.meta_monto} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Aporte mensual</dt>
                <dd>
                  <Monto value={ahorro.aporte_mensual} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Acumulado</dt>
                <dd>
                  <Monto value={ahorro.saldo_acumulado} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Falta para meta</dt>
                <dd>
                  <Monto value={ahorro.falta_para_meta} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tasa anual</dt>
                <dd>
                  <Porcentaje value={ahorro.tasa_anual} />
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(ahorro.estado)}>{ahorro.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Creado</dt>
                <dd>
                  <Fecha value={ahorro.created_at} conHora />
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleAportar} data-testid={ids.rowAction(id, "aportar-form")}>
              <h2>Aportar</h2>
              <div className={shared.field}>
                <label htmlFor="monto">Monto (opcional)</label>
                <input
                  id="monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="vacío = usa el aporte mensual del plan"
                  data-testid={ids.field("monto")}
                />
              </div>

              {aporteError && (
                <p role="alert" className={shared.fieldError}>
                  {aporteError}
                </p>
              )}
              {aporteSuccess && (
                <p role="status" className={shared.success} data-testid={ids.success}>
                  {aporteSuccess}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={aportando || ahorro.estado !== "activo"}
                data-testid={ids.rowAction(id, "aportar-submit")}
              >
                {aportando ? "Aportando..." : "Aportar"}
              </button>
            </form>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar plan</h2>
              <div className={shared.field}>
                <label htmlFor="nombreMeta">Nombre de la meta</label>
                <input
                  id="nombreMeta"
                  required
                  value={nombreMeta}
                  onChange={(e) => setNombreMeta(e.target.value)}
                  data-testid={ids.field("edit-nombreMeta")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="metaMonto">Monto meta</label>
                <input
                  id="metaMonto"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={metaMonto}
                  onChange={(e) => setMetaMonto(e.target.value)}
                  data-testid={ids.field("edit-metaMonto")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="aporteMensual">Aporte mensual</label>
                <input
                  id="aporteMensual"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={aporteMensual}
                  onChange={(e) => setAporteMensual(e.target.value)}
                  data-testid={ids.field("edit-aporteMensual")}
                />
              </div>
              <div className={shared.field}>
                <label htmlFor="tasaAnual">Tasa anual (opcional)</label>
                <input
                  id="tasaAnual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tasaAnual}
                  onChange={(e) => setTasaAnual(e.target.value)}
                  data-testid={ids.field("edit-tasaAnual")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting}
                data-testid={ids.rowAction(id, "edit-submit")}
              >
                {submitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>

            <DeleteButton
              testId={ids.rowAction(id, "eliminar")}
              title="¿Eliminar este plan de ahorro?"
              description="Se eliminará el plan de ahorro programado."
              label="Eliminar plan"
              onDelete={() => eliminarAhorroV2(id)}
              onDeleted={() => router.push("/v2/ahorros")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
