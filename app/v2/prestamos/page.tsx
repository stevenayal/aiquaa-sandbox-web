"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listPrestamosV2, type EstadoPrestamoV2 } from "@/lib/api/v2/prestamos";
import { useDefaultUsuarioId } from "@/lib/auth/useDefaultUsuarioId";
import { testIds } from "@/lib/testids";
import { Monto, Porcentaje } from "@/components/Valores";

const ids = testIds("v2-prestamos");
const ESTADOS: EstadoPrestamoV2[] = ["solicitado", "aprobado", "rechazado", "pagado"];

function badgeClass(estado: EstadoPrestamoV2): string {
  if (estado === "aprobado") return shared.badgeSuccess;
  if (estado === "rechazado") return shared.badgeDanger;
  if (estado === "pagado") return shared.badge;
  return shared.badgeWarning;
}

export default function PrestamosV2Page() {
  const [usuarioId, setUsuarioId] = useDefaultUsuarioId();
  const [estado, setEstado] = useState<EstadoPrestamoV2 | "">("");

  const parsedUsuarioId = usuarioId.trim() ? Number(usuarioId) : undefined;
  const { data: prestamos, error, isLoading } = useSWR(["v2-prestamos", parsedUsuarioId, estado], () =>
    listPrestamosV2({ usuarioId: parsedUsuarioId, estado: estado || undefined }),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-prestamos" title="Préstamos">
        <div className={shared.field}>
          <label htmlFor="usuarioId">Filtrar por usuarioId</label>
          <input
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            placeholder="Todos"
            data-testid={ids.field("usuarioId")}
          />
        </div>
        <div className={shared.field}>
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoPrestamoV2 | "")}
            data-testid={ids.field("estado")}
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <Link href="/v2/prestamos/new" className={shared.button}>
          Solicitar préstamo
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(prestamos?.length ?? 0) === 0}
        count={prestamos?.length ?? 0}
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
              <th>Monto solicitado</th>
              <th>Tasa interés</th>
              <th>Plazo (meses)</th>
              <th>Saldo pendiente</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {prestamos?.map((prestamo) => (
              <tr key={prestamo.id} data-testid={ids.row(prestamo.id)}>
                <td>
                  <Link href={`/v2/prestamos/${prestamo.id}`}>{prestamo.id}</Link>
                </td>
                <td>
                  <Link href={`/v2/usuarios/${prestamo.usuario_id}`}>{prestamo.usuario_id}</Link>
                </td>
                <td>
                  <Monto value={prestamo.monto_solicitado} />
                </td>
                <td>
                  <Porcentaje value={prestamo.tasa_interes} />
                </td>
                <td>{prestamo.plazo_meses}</td>
                <td>
                  <Monto value={prestamo.saldo_pendiente} />
                </td>
                <td>
                  <span className={badgeClass(prestamo.estado)}>{prestamo.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
