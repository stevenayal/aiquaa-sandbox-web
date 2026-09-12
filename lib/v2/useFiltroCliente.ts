"use client";

import { useUsuario } from "@/lib/auth/UsuarioContext";
import { useQueryParam } from "@/lib/list/useListControls";
import { esAdminV2 } from "./admin";

export const TODOS_LOS_CLIENTES = "todos";

/**
 * Filtro "titular" de las listas del curso 2, guardado en `?usuarioId=` de la
 * URL. Sin parámetro, la lista arranca con los productos del cliente logueado
 * (como un home banking); `?usuarioId=todos` muestra los de todos los clientes.
 * El admin (ver lib/v2/admin.ts) no tiene productos propios: arranca siempre
 * en "todos". `usuarioId` es lo que va a la API (`undefined` = todos).
 */
export function useFiltroCliente() {
  const { usuario } = useUsuario();
  const [raw, setValue] = useQueryParam("usuarioId");
  const isAdmin = esAdminV2(usuario?.email);
  const value = raw || (usuario && !isAdmin ? String(usuario.id) : TODOS_LOS_CLIENTES);
  const usuarioId = value === TODOS_LOS_CLIENTES ? undefined : Number(value) || undefined;
  return { value, usuarioId, setValue, isAdmin };
}
