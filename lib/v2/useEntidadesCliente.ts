"use client";

import useSWR from "swr";
import { listUsuariosV2 } from "@/lib/api/v2/usuarios";
import { listCuentasV2 } from "@/lib/api/v2/cuentas";
import { listBeneficiariosV2 } from "@/lib/api/v2/beneficiarios";

/**
 * Datos para los selects de los formularios del curso 2: en vez de tipear
 * ids, el cliente elige entre SUS cuentas y beneficiarios, como en un home
 * banking. Un `usuarioId` vacío o inválido no dispara request.
 */

function idValido(usuarioId: string | number | undefined): number | null {
  const n = Number(usuarioId);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function useClientesV2() {
  const { data, error, isLoading } = useSWR(["v2-clientes-select"], () => listUsuariosV2());
  return { clientes: data ?? [], error: (error as Error | undefined) ?? null, isLoading };
}

export function useCuentasCliente(usuarioId: string | number | undefined) {
  const id = idValido(usuarioId);
  const { data, error, isLoading, mutate } = useSWR(id ? ["v2-cuentas-cliente", id] : null, () =>
    listCuentasV2({ usuarioId: id as number }),
  );
  return { cuentas: data ?? [], error: (error as Error | undefined) ?? null, isLoading, mutate };
}

export function useBeneficiariosCliente(usuarioId: string | number | undefined) {
  const id = idValido(usuarioId);
  const { data, error, isLoading } = useSWR(id ? ["v2-beneficiarios-cliente", id] : null, () =>
    listBeneficiariosV2(id as number),
  );
  return { beneficiarios: data ?? [], error: (error as Error | undefined) ?? null, isLoading };
}
