"use client";

import { useState } from "react";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { listRoles, listUsuarioRoles, asignarRol, revocarRol } from "@/lib/api/roles";
import { getUsuario } from "@/lib/api/usuarios";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

// No es list+detail: son los 4 roles fijos como toggles asignar/revocar
// contra el usuarioId buscado (igual patrón de filtro que tarjetas/facturas).
const ids = testIds("roles");

export default function RolesPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmRevocarId, setConfirmRevocarId] = useState<number | null>(null);

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;

  const { data: roles, error: rolesError, isLoading: rolesLoading } = useSWR(["roles"], listRoles);
  const { data: usuario, error: usuarioError } = useSWR(
    parsedUsuarioId ? ["usuario", parsedUsuarioId] : null,
    () => getUsuario(parsedUsuarioId!),
  );
  const {
    data: usuarioRoles,
    error: usuarioRolesError,
    isLoading: usuarioRolesLoading,
    mutate,
  } = useSWR(parsedUsuarioId ? ["usuarioRoles", parsedUsuarioId] : null, () => listUsuarioRoles(parsedUsuarioId!));

  async function handleToggle(roleId: number, active: boolean) {
    if (!parsedUsuarioId) return;
    setActionError(null);
    setActionSuccess(null);
    setPendingId(roleId);
    try {
      await (active ? revocarRol(parsedUsuarioId, roleId) : asignarRol(parsedUsuarioId, roleId));
      await mutate();
      setActionSuccess(active ? "Rol revocado." : "Rol asignado.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar el rol.");
    } finally {
      setPendingId(null);
    }
  }

  const activeRoleIds = new Set((usuarioRoles ?? []).filter((ur) => ur.activo).map((ur) => ur.role_id));

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="roles" title={`Roles${usuario ? ` de ${usuario.nombre}` : ""}`}>
        <div className={shared.field}>
          <label htmlFor="usuarioId">usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Requerido"
            data-testid={ids.field("usuarioId")}
          />
        </div>
      </ModuleHeader>

      {usuarioError && (
        <p role="alert" className={shared.fieldError}>
          No se encontró el usuario.
        </p>
      )}
      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}
      {actionSuccess && (
        <p role="status" className={shared.success} data-testid={ids.success}>
          {actionSuccess}
        </p>
      )}

      {!parsedUsuarioId && <p>Ingresá un usuarioId para ver y gestionar sus roles.</p>}

      {parsedUsuarioId && (
      <DataState
        loading={rolesLoading || usuarioRolesLoading}
        error={rolesError ?? usuarioRolesError ?? null}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {roles?.map((rol) => {
              const active = activeRoleIds.has(rol.id);
              return (
                <tr key={rol.id} data-testid={ids.row(rol.id)}>
                  <td>{rol.nombre}</td>
                  <td>{rol.descripcion ?? "—"}</td>
                  <td>
                    <span className={active ? shared.badgeSuccess : shared.badge}>
                      {active ? "Asignado" : "Sin asignar"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={active ? shared.buttonDanger : shared.button}
                      disabled={pendingId === rol.id}
                      onClick={() => (active ? setConfirmRevocarId(rol.id) : handleToggle(rol.id, false))}
                      data-testid={ids.rowAction(rol.id, active ? "revocar" : "asignar")}
                    >
                      {active ? "Revocar" : "Asignar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataState>
      )}

      <ConfirmDialog
        open={confirmRevocarId !== null}
        title="¿Revocar este rol?"
        description="El usuario perderá los permisos asociados de inmediato."
        confirmLabel="Revocar"
        danger
        testId={ids.rowAction(confirmRevocarId ?? 0, "revocar")}
        onCancel={() => setConfirmRevocarId(null)}
        onConfirm={() => {
          const roleId = confirmRevocarId;
          setConfirmRevocarId(null);
          if (roleId !== null) handleToggle(roleId, true);
        }}
      />
    </div>
  );
}
