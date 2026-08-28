"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import styles from "./page.module.css";
import { getUsuario, actualizarKyc, type KycEstado } from "@/lib/api/usuarios";
import { listCuentas } from "@/lib/api/cuentas";
import { listTarjetas, bloquearTarjeta, activarTarjeta } from "@/lib/api/tarjetas";
import { listFacturas } from "@/lib/api/facturas";
import { listOrdenes } from "@/lib/api/ordenes";
import { listReservas, confirmarReserva, cancelarReserva } from "@/lib/api/reservas";
import { listNotificaciones, marcarLeida } from "@/lib/api/notificaciones";
import { listRoles, listUsuarioRoles, asignarRol, revocarRol } from "@/lib/api/roles";
import { getResumen } from "@/lib/api/reportes";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

const ids = testIds("usuarios");
const KYC_ESTADOS: KycEstado[] = ["pendiente", "verificado", "rechazado"];

function kycBadgeClass(estado: KycEstado): string {
  if (estado === "verificado") return shared.badgeSuccess;
  if (estado === "rechazado") return shared.badgeDanger;
  return shared.badgeWarning;
}

interface SectionProps {
  title: string;
  viewAllHref: string;
  loading: boolean;
  error: Error | null | undefined;
  empty: boolean;
  testId: string;
  children: ReactNode;
}

function Section({ title, viewAllHref, loading, error, empty, testId, children }: SectionProps) {
  return (
    <div className={`${shared.card} ${styles.section}`}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <Link href={viewAllHref} className={styles.viewAll}>
          Ver todas →
        </Link>
      </div>
      <DataState
        loading={loading}
        error={error ?? null}
        empty={empty}
        loadingTestId={`${testId}-loading`}
        errorTestId={`${testId}-error`}
        emptyTestId={`${testId}-empty`}
      >
        {children}
      </DataState>
    </div>
  );
}

function CuentasSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading } = useSWR(["usuario360-cuentas", usuarioId], () => listCuentas(usuarioId));
  const rows = (data ?? []).slice(0, 5);
  return (
    <Section
      title="Cuentas"
      viewAllHref={`/cuentas?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={(data?.length ?? 0) === 0}
      testId="usuarios-cuentas"
    >
      <table className={shared.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Número</th>
            <th>Tipo</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/cuentas/${c.id}`}>{c.id}</Link>
              </td>
              <td>{c.numero_cuenta}</td>
              <td>{c.tipo_cuenta}</td>
              <td>{c.saldo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function TarjetasSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading, mutate } = useSWR(["usuario360-tarjetas", usuarioId], () => listTarjetas(usuarioId));
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const rows = (data ?? []).slice(0, 5);

  async function handleToggle(id: number, action: "bloquear" | "activar") {
    setActionError(null);
    setPendingId(id);
    try {
      await (action === "bloquear" ? bloquearTarjeta(id) : activarTarjeta(id));
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar la tarjeta.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Section
      title="Tarjetas"
      viewAllHref={`/tarjetas?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={(data?.length ?? 0) === 0}
      testId="usuarios-tarjetas"
    >
      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Número</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{t.numero_enmascarado}</td>
              <td>
                <span className={t.estado === "activa" ? shared.badgeSuccess : t.estado === "bloqueada" ? shared.badgeDanger : shared.badgeWarning}>
                  {t.estado}
                </span>
              </td>
              <td className={shared.rowActions}>
                <button
                  type="button"
                  className={shared.buttonSecondary}
                  disabled={t.estado === "bloqueada" || pendingId === t.id}
                  onClick={() => handleToggle(t.id, "bloquear")}
                >
                  Bloquear
                </button>
                <button
                  type="button"
                  className={shared.buttonSecondary}
                  disabled={t.estado === "activa" || pendingId === t.id}
                  onClick={() => handleToggle(t.id, "activar")}
                >
                  Activar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function FacturasSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading } = useSWR(["usuario360-facturas", usuarioId], () =>
    listFacturas({ usuarioId }),
  );
  const rows = (data ?? []).slice(0, 5);
  return (
    <Section
      title="Facturas"
      viewAllHref={`/facturas?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={(data?.length ?? 0) === 0}
      testId="usuarios-facturas"
    >
      <table className={shared.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Proveedor</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td>
                <Link href={`/facturas/${f.id}`}>{f.id}</Link>
              </td>
              <td>{f.proveedor}</td>
              <td>{f.monto}</td>
              <td>
                <span className={f.estado === "pagada" ? shared.badgeSuccess : f.estado === "vencida" ? shared.badgeDanger : shared.badgeWarning}>
                  {f.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function OrdenesSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading } = useSWR(["usuario360-ordenes", usuarioId], () => listOrdenes(usuarioId));
  const rows = (data ?? []).slice(0, 5);
  return (
    <Section
      title="Órdenes"
      viewAllHref={`/ordenes?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={(data?.length ?? 0) === 0}
      testId="usuarios-ordenes"
    >
      <table className={shared.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Producto</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/ordenes/${o.id}`}>{o.id}</Link>
              </td>
              <td>{o.producto}</td>
              <td>{o.monto}</td>
              <td>{o.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function ReservasSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading, mutate } = useSWR(["usuario360-reservas", usuarioId], () => listReservas(usuarioId));
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const rows = (data ?? []).slice(0, 5);

  async function handleAction(id: number, action: "confirmar" | "cancelar") {
    setActionError(null);
    setPendingId(id);
    try {
      await (action === "confirmar" ? confirmarReserva(id) : cancelarReserva(id));
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar la reserva.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Section
      title="Reservas"
      viewAllHref={`/reservas?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={(data?.length ?? 0) === 0}
      testId="usuarios-reservas"
    >
      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.servicio}</td>
              <td>
                <span
                  className={
                    r.estado === "confirmada" || r.estado === "completada"
                      ? shared.badgeSuccess
                      : r.estado === "cancelada"
                        ? shared.badgeDanger
                        : shared.badgeWarning
                  }
                >
                  {r.estado}
                </span>
              </td>
              <td className={shared.rowActions}>
                <button
                  type="button"
                  className={shared.buttonSecondary}
                  disabled={r.estado !== "pendiente" || pendingId === r.id}
                  onClick={() => handleAction(r.id, "confirmar")}
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  className={shared.buttonSecondary}
                  disabled={r.estado === "cancelada" || r.estado === "completada" || pendingId === r.id}
                  onClick={() => handleAction(r.id, "cancelar")}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function NotificacionesSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading, mutate } = useSWR(["usuario360-notificaciones", usuarioId], () =>
    listNotificaciones({ usuarioId }),
  );
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const rows = (data ?? []).slice(0, 5);

  async function handleMarcarLeida(id: number) {
    setActionError(null);
    setPendingId(id);
    try {
      await marcarLeida(id);
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo marcar como leída.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Section
      title="Notificaciones"
      viewAllHref={`/notificaciones?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={(data?.length ?? 0) === 0}
      testId="usuarios-notificaciones"
    >
      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Asunto</th>
            <th>Leído</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.id}>
              <td>{n.asunto}</td>
              <td>{n.leido ? "Sí" : "No"}</td>
              <td>
                <button
                  type="button"
                  className={shared.buttonSecondary}
                  disabled={n.leido || pendingId === n.id}
                  onClick={() => handleMarcarLeida(n.id)}
                >
                  Marcar leída
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function RolesSection({ usuarioId }: { usuarioId: number }) {
  const { data: roles, error: rolesError, isLoading: rolesLoading } = useSWR(["roles"], listRoles);
  const {
    data: usuarioRoles,
    error: usuarioRolesError,
    isLoading: usuarioRolesLoading,
    mutate,
  } = useSWR(["usuario360-roles", usuarioId], () => listUsuarioRoles(usuarioId));
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const activeRoleIds = new Set((usuarioRoles ?? []).filter((ur) => ur.activo).map((ur) => ur.role_id));

  async function handleToggle(roleId: number, active: boolean) {
    setActionError(null);
    setPendingId(roleId);
    try {
      await (active ? revocarRol(usuarioId, roleId) : asignarRol(usuarioId, roleId));
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar el rol.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Section
      title="Roles"
      viewAllHref={`/roles?usuarioId=${usuarioId}`}
      loading={rolesLoading || usuarioRolesLoading}
      error={rolesError ?? usuarioRolesError}
      empty={false}
      testId="usuarios-roles"
    >
      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Rol</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {roles?.map((rol) => {
            const active = activeRoleIds.has(rol.id);
            return (
              <tr key={rol.id}>
                <td>{rol.nombre}</td>
                <td>
                  <span className={active ? shared.badgeSuccess : shared.badge}>{active ? "Asignado" : "Sin asignar"}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className={active ? shared.buttonDanger : shared.button}
                    disabled={pendingId === rol.id}
                    onClick={() => handleToggle(rol.id, active)}
                  >
                    {active ? "Revocar" : "Asignar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}

function ResumenSection({ usuarioId }: { usuarioId: number }) {
  const { data, error, isLoading } = useSWR(["usuario360-resumen", usuarioId], () => getResumen(usuarioId));
  return (
    <Section
      title="Resumen de movimientos"
      viewAllHref={`/reportes?usuarioId=${usuarioId}`}
      loading={isLoading}
      error={error}
      empty={false}
      testId="usuarios-resumen"
    >
      {data && (
        <dl className={styles.resumenGrid}>
          <div className={styles.resumenStat}>
            <dt>Movimientos</dt>
            <dd>{data.cantidad_movimientos}</dd>
          </div>
          <div className={styles.resumenStat}>
            <dt>Total</dt>
            <dd>{data.total}</dd>
          </div>
          <div className={styles.resumenStat}>
            <dt>Primero</dt>
            <dd>{data.primero ?? "—"}</dd>
          </div>
          <div className={styles.resumenStat}>
            <dt>Último</dt>
            <dd>{data.ultimo ?? "—"}</dd>
          </div>
        </dl>
      )}
    </Section>
  );
}

export default function UsuarioDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: usuario, error, isLoading, mutate } = useSWR(["usuario", id], () => getUsuario(id));

  const [kycEstado, setKycEstado] = useState<KycEstado>("pendiente");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleKycSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await actualizarKyc(id, kycEstado);
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo actualizar el KYC.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="usuarios" title={`Usuario #${id}`} />

      <DataState loading={isLoading} error={error ?? null} loadingTestId={ids.loading} errorTestId={ids.error}>
        {usuario && (
          <>
            <dl className={`${shared.card} ${shared.detailGrid}`} data-testid={ids.detail}>
              <div className={shared.detailField}>
                <dt>Nombre</dt>
                <dd>{usuario.nombre}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Email</dt>
                <dd>{usuario.email}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Activo</dt>
                <dd>{usuario.activo ? "Sí" : "No"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Documento</dt>
                <dd>
                  {usuario.documento_tipo} {usuario.documento_numero}
                </dd>
              </div>
              <div className={shared.detailField}>
                <dt>Fecha de nacimiento</dt>
                <dd>{usuario.fecha_nacimiento ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Dirección</dt>
                <dd>{usuario.direccion ?? "—"}</dd>
              </div>
              <div className={shared.detailField}>
                <dt>Estado KYC</dt>
                <dd>
                  <span className={kycBadgeClass(usuario.kyc_estado)}>{usuario.kyc_estado}</span>
                </dd>
              </div>
            </dl>

            <form className={shared.formGrid} onSubmit={handleKycSubmit} data-testid={ids.rowAction(id, "kyc-form")}>
              <h2>Actualizar KYC</h2>
              <div className={shared.field}>
                <label htmlFor="kycEstado">Nuevo estado</label>
                <select
                  id="kycEstado"
                  value={kycEstado}
                  onChange={(e) => setKycEstado(e.target.value as KycEstado)}
                  data-testid={ids.field("kycEstado")}
                >
                  {KYC_ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p role="alert" className={shared.fieldError} data-testid={ids.fieldError("kycEstado")}>
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className={shared.button}
                disabled={submitting}
                data-testid={ids.rowAction(id, "kyc-submit")}
              >
                {submitting ? "Actualizando..." : "Actualizar KYC"}
              </button>
            </form>

            <div className={styles.sections}>
              <CuentasSection usuarioId={id} />
              <TarjetasSection usuarioId={id} />
              <FacturasSection usuarioId={id} />
              <OrdenesSection usuarioId={id} />
              <ReservasSection usuarioId={id} />
              <NotificacionesSection usuarioId={id} />
              <RolesSection usuarioId={id} />
              <ResumenSection usuarioId={id} />
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
