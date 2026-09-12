/**
 * Convención de data-testid kebab-case: {modulo}-{elemento}[-{id}][-{accion}].
 * Cada testid va siempre junto a HTML semántico real (table/form/label/button),
 * nunca reemplazándolo — ver sección 5 del plan.
 */
export function testIds(modulo: string) {
  return {
    loading: `${modulo}-loading`,
    error: `${modulo}-error`,
    empty: `${modulo}-empty`,
    count: `${modulo}-count`,
    success: `${modulo}-success`,
    list: `${modulo}-list`,
    row: (id: string | number) => `${modulo}-row-${id}`,
    rowAction: (id: string | number, accion: string) => `${modulo}-row-${id}-${accion}`,
    form: `${modulo}-form`,
    field: (name: string) => `${modulo}-field-${name}`,
    fieldError: (name: string) => `${modulo}-field-${name}-error`,
    submit: `${modulo}-submit`,
    detail: `${modulo}-detail`,
  } as const;
}
