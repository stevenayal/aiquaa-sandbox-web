"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUsuario } from "./UsuarioContext";

/**
 * Input de usuarioId que arranca con ?usuarioId= de la URL si vino de un
 * link cruzado (ej. desde el hub de un usuario), o si no, con el id del
 * usuario logueado. En un hard reload, UsuarioContext todavía no terminó de
 * hidratarse desde localStorage en el primer render — un useState lazy-init
 * común quedaría vacío para siempre. Este hook lo corrige apenas el contexto
 * carga (una sola vez, y solo si el campo sigue vacío para no pisar lo que
 * el usuario ya escribió).
 */
export function useDefaultUsuarioId(): [string, (value: string) => void] {
  const { usuario } = useUsuario();
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("usuarioId");
  const [usuarioId, setUsuarioId] = useState(fromQuery ?? (usuario ? String(usuario.id) : ""));

  useEffect(() => {
    if (fromQuery || !usuario) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync único desde contexto client-only hidratado async, ver comentario del hook
    setUsuarioId((prev) => (prev === "" ? String(usuario.id) : prev));
  }, [usuario, fromQuery]);

  return [usuarioId, setUsuarioId];
}
