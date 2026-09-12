"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { DataState } from "@/components/DataState";
import { ModuleHeader } from "@/components/ModuleHeader";
import { listUsuariosV2 } from "@/lib/api/v2/usuarios";
import { testIds } from "@/lib/testids";

const ids = testIds("v2-usuarios");

export default function UsuariosV2Page() {
  const [email, setEmail] = useState("");

  const { data: usuarios, error, isLoading } = useSWR(["v2-usuarios", email], () =>
    listUsuariosV2(email.trim() || undefined),
  );

  return (
    <div className={shared.page}>
      <ModuleHeader moduleKey="v2-usuarios" title="Clientes">
        <div className={shared.field}>
          <label htmlFor="email">Filtrar por email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Todos"
            data-testid={ids.field("email")}
          />
        </div>
        <Link href="/v2/usuarios/new" className={shared.button}>
          Nuevo cliente
        </Link>
      </ModuleHeader>

      <DataState
        loading={isLoading}
        error={error ?? null}
        empty={(usuarios?.length ?? 0) === 0}
        count={usuarios?.length ?? 0}
        countTestId={ids.count}
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
              <th>Teléfono</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((usuario) => (
              <tr key={usuario.id} data-testid={ids.row(usuario.id)}>
                <td>
                  <Link href={`/v2/usuarios/${usuario.id}`}>{usuario.id}</Link>
                </td>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>
                  {usuario.documento_tipo} {usuario.documento_numero}
                </td>
                <td>{usuario.telefono ?? "—"}</td>
                <td>{usuario.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
