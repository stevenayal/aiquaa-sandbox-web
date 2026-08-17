"use client";

import { useState } from "react";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { listRoles, listUsuarioRoles, asignarRol, revocarRol } from "@/lib/api/roles";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { ApiError } from "@/lib/api/http";
import { testIds } from "@/lib/testids";

// No es list+detail: son los 4 roles fijos como toggles asignar/revocar
// contra el usuario actual (desviación documentada en la sección 4 del plan).
const ids = testIds("roles");

export default function RolesPage() {
  const { usuario } = useUsuario();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data: roles, error: rolesError, isLoading: rolesLoading } = useSWR(["roles"], listRoles);
  const {
    data: usuarioRoles,
    error: usuarioRolesError,
    isLoading: usuarioRolesLoading,
    mutate,
  } = useSWR(usuario ? ["usuarioRoles", usuario.id] : null, () => listUsuarioRoles(usuario!.id));

  async function handleToggle(roleId: number, active: boolean) {
    if (!usuario) return;
    setActionError(null);
    setPendingId(roleId);
    try {
      await (active ? revocarRol(usuario.id, roleId) : asignarRol(usuario.id, roleId));
      await mutate();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "No se pudo actualizar el rol.");
    } finally {
      setPendingId(null);
    }
  }

  const activeRoleIds = new Set((usuarioRoles ?? []).filter((ur) => ur.activo).map((ur) => ur.role_id));

  return (
    <div className={shared.page}>
      <div className={shared.header}>
        <h1>Roles{usuario ? ` de ${usuario.nombre}` : ""}</h1>
      </div>

      {actionError && (
        <p role="alert" className={shared.fieldError}>
          {actionError}
        </p>
      )}

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
                      onClick={() => handleToggle(rol.id, active)}
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
    </div>
  );
}
