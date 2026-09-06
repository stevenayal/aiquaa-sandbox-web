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
  getTarjeta,
  actualizarTarjeta,
  eliminarTarjeta,
  type TarjetaTipo,
  type TarjetaMarca,
} from "@/lib/api/tarjetas";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("tarjetas");
const TIPOS: TarjetaTipo[] = ["credito", "debito"];
const MARCAS: TarjetaMarca[] = ["visa", "mastercard"];

function badgeClass(estado: string): string {
  if (estado === "activa") return shared.badgeSuccess;
  if (estado === "bloqueada") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function TarjetaDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: tarjeta, error, isLoading, mutate } = useSWR(["tarjeta", id], () => getTarjeta(id));

  const [tipo, setTipo] = useState<TarjetaTipo>("credito");
  const [marca, setMarca] = useState<TarjetaMarca>("visa");
  const [limiteCredito, setLimiteCredito] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (tarjeta && !initialized) {
    setTipo(tarjeta.tipo);
    setMarca(tarjeta.marca);
    setLimiteCredito(tarjeta.limite_credito !== null ? String(tarjeta.limite_credito) : "");
    setInitialized(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarTarjeta(id, {
        tipo,
        marca,
        limiteCredito: limiteCredito.trim() ? Number(limiteCredito) : undefined,
      });
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="tarjetas" title={`Tarjeta #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {tarjeta && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Usuario</dt>
                <dd>
                  <Link href={`/usuarios/${tarjeta.usuario_id}`}>{tarjeta.usuario_id}</Link>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Tipo</dt>
                <dd>{tarjeta.tipo}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Marca</dt>
                <dd>{tarjeta.marca}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Número</dt>
                <dd>{tarjeta.numero_enmascarado}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Límite de crédito</dt>
                <dd>{tarjeta.limite_credito ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Saldo actual</dt>
                <dd>{tarjeta.saldo_actual}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado</dt>
                <dd>
                  <span className={badgeClass(tarjeta.estado)}>{tarjeta.estado}</span>
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha</dt>
                <dd>{new Date(tarjeta.created_at).toLocaleString()}</dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleSubmit} data-testid={ids.rowAction(id, "edit-form")}>
              <h2>Editar tarjeta</h2>
              <div className={shared.field}>
                <label htmlFor="tipo">Tipo</label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TarjetaTipo)}
                  data-testid={ids.field("tipo")}
                >
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
              <div className={shared.field}>
                <label htmlFor="limiteCredito">Límite de crédito</label>
                <input
                  id="limiteCredito"
                  type="number"
                  step="0.01"
                  value={limiteCredito}
                  onChange={(e) => setLimiteCredito(e.target.value)}
                  data-testid={ids.field("limiteCredito")}
                />
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("tipo")}>
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
              title="¿Eliminar esta tarjeta?"
              description="Se marcará como inactiva y dejará de listarse."
              label="Eliminar tarjeta"
              onDelete={() => eliminarTarjeta(id)}
              onDeleted={() => router.push("/tarjetas")}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
