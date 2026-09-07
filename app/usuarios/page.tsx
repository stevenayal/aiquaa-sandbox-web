"use client";

import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listUsuarios } from "@/lib/api/usuarios";
import { testIds } from "@/lib/testids";

const ids = testIds("usuarios");

function kycBadgeClass(estado: string): string {
  if (estado === "verificado") return shared.badgeSuccess;
  if (estado === "rechazado") return shared.badgeDanger;
  return shared.badgeWarning;
}

export default function UsuariosPage() {
  const { data: usuarios, error, isLoading } = useSWR(["usuarios"], () => listUsuarios());

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="usuarios" title="Usuarios">
        <Link href="/usuarios/new" className={shared.button}>
          Nuevo usuario
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(usuarios?.length ?? 0) === 0}
        loadingTestId={ids.loading}
        errorTestId={ids.error}
        emptyTestId={ids.empty}
      >
        <table className={shared.table} data-testid={ids.list}>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Documento</th>
              <th>KYC</th>
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((usuario) => (
              <tr key={usuario.id} data-testid={ids.row(usuario.id)}>
                <td>
                  <Link href={`/usuarios/${usuario.id}`}>{usuario.id}</Link>
                </td>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>
                  {usuario.documento_tipo} {usuario.documento_numero}
                </td>
                <td>
                  <span className={kycBadgeClass(usuario.kyc_estado)}>{usuario.kyc_estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
