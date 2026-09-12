import type { NextRequest } from "next/server";
import { buildMenu, GRUPOS_POR_CURSO, type CursoMenu } from "@/lib/menu/modules";

export const dynamic = "force-dynamic";

function validationError(message: string): Response {
  return Response.json({ error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
}

/**
 * `GET /api/menu?curso=1|2&grupo=n` — menú de módulos para la sesión. Mismo
 * envelope `{ data }` / `{ error }` que la API del sandbox, así el cliente lo
 * desempaqueta igual. No lleva API key: es configuración del front, no datos
 * del backend.
 */
export function GET(request: NextRequest): Response {
  const params = request.nextUrl.searchParams;

  const cursoParam = params.get("curso");
  if (cursoParam !== "1" && cursoParam !== "2") {
    return validationError("El parámetro curso es obligatorio y debe ser 1 o 2.");
  }
  const curso = Number(cursoParam) as CursoMenu;

  const grupoParam = params.get("grupo");
  let grupo: number | null = null;
  if (grupoParam !== null && grupoParam !== "") {
    const max = GRUPOS_POR_CURSO[curso];
    if (!/^\d+$/.test(grupoParam) || Number(grupoParam) < 1 || Number(grupoParam) > max) {
      return validationError(`El parámetro grupo debe ser un entero entre 1 y ${max} para el curso ${curso}.`);
    }
    grupo = Number(grupoParam);
  }

  return Response.json({ data: buildMenu(curso, grupo) }, { headers: { "cache-control": "no-store" } });
}
