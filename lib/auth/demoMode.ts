/**
 * Flags públicos (sin secreto) derivados en build time desde las keys demo del
 * servidor — ver next.config.ts. Si un curso tiene key demo, el proxy la
 * inyecta server-side y ese curso no necesita que el alumno cargue nada en
 * /login. La key misma nunca llega al bundle del cliente.
 */
export const DEMO_CURSO_1 = process.env.NEXT_PUBLIC_DEMO_MODE_V1 === "true";
export const DEMO_CURSO_2 = process.env.NEXT_PUBLIC_DEMO_MODE_V2 === "true";
export const DEMO_MODE = DEMO_CURSO_1 || DEMO_CURSO_2;
