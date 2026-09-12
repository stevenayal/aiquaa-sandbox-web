"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listSesiones } from "@/lib/api/sesiones";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";
import { Fecha } from "@/components/Valores";

const ids = testIds("sesiones");

export default function SesionesPage() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: sesiones, error, isLoading } = useSWR(["sesiones", parsedUsuarioId], () =>
    listSesiones(parsedUsuarioId),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="sesiones" title="Sesiones">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todas"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <Link href="/sesiones/new" className={shared.button}>
          Nuevo evento
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(sesiones?.length ?? 0) === 0}
        count={sesiones?.length ?? 0}
        countTestId={ids.count}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Tipo de evento</th>
              <th>Exitoso</th>
              <th>IP</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {sesiones?.map((sesion) => (
              <tr key={sesion.id} data-testid={ids.row(sesion.id)}>
                <td>
                  <Link href={`/sesiones/${sesion.id}`}>{sesion.id}</Link>
                </td>
                <td>
                  <Link href={`/usuarios/${sesion.usuario_id}`}>{sesion.usuario_id}</Link>
                </td>
                <td>{sesion.tipo_evento}</td>
                <td>
                  <span className={sesion.exitoso ? shared.badgeSuccess : shared.badgeDanger}>
                    {sesion.exitoso ? "Sí" : "No"}
                  </span>
                </td>
                <td>{sesion.ip ?? "—"}</td>
                <td>
                  <Fecha value={sesion.created_at} conHora />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
