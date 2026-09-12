"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import shared from "@/components/shared.module.css";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Receipt } from "@/components/Receipt";
import { Stepper } from "@/components/Stepper";
import { Field, FormError } from "@/components/form/Field";
import { MontoInput } from "@/components/form/MontoInput";
import { RadioCards } from "@/components/form/RadioCards";
import { WizardActions } from "@/components/form/WizardActions";
import { useToast } from "@/components/Toast";
import { BeneficiarioSelect, ClienteSelect, CuentaSelect, describeCuenta } from "@/components/v2/EntitySelects";
import { Monto } from "@/components/Valores";
import { crearTransferenciaV2, listTransferenciasV2, type TransferenciaV2 } from "@/lib/api/v2/transferencias";
import type { MonedaV2 } from "@/lib/api/v2/cuentas";
import { useUsuario } from "@/lib/auth/UsuarioContext";
import { defaultUsuarioIdV2 } from "@/lib/v2/admin";
import { useFormState, mensajeContiene } from "@/lib/forms/useFormState";
import { formatMonto } from "@/lib/format";
import { testIds } from "@/lib/testids";
import { LIMITE_DIARIO_TRANSFERENCIA, round2, transferidoHoy } from "@/lib/v2/reglas";
import { useBeneficiariosCliente, useClientesV2, useCuentasCliente } from "@/lib/v2/useEntidadesCliente";
import { longitud, monto, opcional, parseMonto, requerido, validarCampos } from "@/lib/validation/v2";

const ids = testIds("v2-transferencias");
const PASOS = ["Destino", "Monto", "Confirmación", "Comprobante"];
const CAMPOS_POR_PASO = [["usuarioId", "tipo", "cuentaOrigenId", "cuentaDestinoId", "beneficiarioId"], ["monto", "concepto"], []] as const;

type Valores = {
  usuarioId: string;
  tipo: string;
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  beneficiarioId: string;
  monto: string;
  concepto: string;
};

export default function NuevaTransferenciaV2Page() {
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();
  const toast = useToast();
  const [paso, setPaso] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<TransferenciaV2 | null>(null);

  const inicial: Valores = {
    usuarioId: searchParams.get("usuarioId") ?? defaultUsuarioIdV2(usuario),
    tipo: searchParams.get("tipo") === "beneficiario" ? "beneficiario" : "propia",
    cuentaOrigenId: searchParams.get("cuentaOrigenId") ?? "",
    cuentaDestinoId: "",
    beneficiarioId: searchParams.get("beneficiarioId") ?? "",
    monto: "",
    concepto: "",
  };

  const { clientes, isLoading: clientesLoading } = useClientesV2();
  const [usuarioIdActual, setUsuarioIdActual] = useState(inicial.usuarioId);
  const { cuentas, isLoading: cuentasLoading, mutate: mutateCuentas } = useCuentasCliente(usuarioIdActual);
  const { beneficiarios, isLoading: beneficiariosLoading } = useBeneficiariosCliente(usuarioIdActual);

  const cuentasActivas = cuentas.filter((c) => c.estado === "activa");

  // Los valores del form dependen de datos que llegan después (saldo, tope
  // diario): se validan con lo que haya en cada render.
  const [origenIdActual, setOrigenIdActual] = useState(inicial.cuentaOrigenId);
  const origen = cuentasActivas.find((c) => String(c.id) === origenIdActual);
  const { data: transferenciasOrigen, mutate: mutateTransferencias } = useSWR(
    origen ? ["v2-transferencias-origen", origen.id] : null,
    () => listTransferenciasV2({ cuentaOrigenId: origen!.id }),
  );
  const usadoHoy = origen && transferenciasOrigen ? transferidoHoy(transferenciasOrigen, origen.id) : 0;
  const tope = origen ? LIMITE_DIARIO_TRANSFERENCIA[origen.moneda as MonedaV2] : 0;
  const disponibleHoy = origen ? Math.max(round2(tope - usadoHoy), 0) : 0;

  const form = useFormState<Valores>({
    initial: inicial,
    ids,
    validate: (v) => {
      const saldo = origen ? Number(origen.saldo) : null;
      const montoMax = saldo === null ? null : Math.min(saldo, disponibleHoy);
      const errors = validarCampos(v, {
        usuarioId: [requerido("Elegí el cliente que transfiere.")],
        cuentaOrigenId: [requerido("Elegí la cuenta de origen.")],
        cuentaDestinoId: v.tipo === "propia" ? [requerido("Elegí la cuenta destino.")] : [],
        beneficiarioId: v.tipo === "beneficiario" ? [requerido("Elegí el beneficiario.")] : [],
        monto: [
          monto({
            max: montoMax,
            maxMessage:
              saldo !== null && saldo <= disponibleHoy
                ? `Saldo insuficiente: el disponible es ${formatMonto(saldo, origen?.moneda)}.`
                : `Supera tu tope diario: podés transferir hasta ${formatMonto(disponibleHoy, origen?.moneda)} más hoy.`,
          }),
        ],
        concepto: [opcional(longitud({ max: 60, label: "El concepto" }))],
      });
      return errors;
    },
  });

  function set(name: keyof Valores, value: string) {
    form.setValue(name, value);
    if (name === "usuarioId") {
      setUsuarioIdActual(value);
      form.setValue("cuentaOrigenId", "");
      form.setValue("cuentaDestinoId", "");
      form.setValue("beneficiarioId", "");
      setOrigenIdActual("");
    }
    if (name === "cuentaOrigenId") {
      setOrigenIdActual(value);
      form.setValue("cuentaDestinoId", "");
    }
  }

  // Cuenta destino interna: otra cuenta activa del cliente, en la misma moneda (espejo de la API).
  const destinos = cuentasActivas.filter((c) => String(c.id) !== form.values.cuentaOrigenId && (!origen || c.moneda === origen.moneda));
  const destino = destinos.find((c) => String(c.id) === form.values.cuentaDestinoId);
  const beneficiario = beneficiarios.find((b) => String(b.id) === form.values.beneficiarioId);
  const montoNum = parseMonto(form.values.monto) ?? 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (paso < 2) {
      if (form.validateFields([...CAMPOS_POR_PASO[paso]])) setPaso(paso + 1);
      return;
    }

    setSubmitting(true);
    const { values } = form;
    try {
      const transferencia = await crearTransferenciaV2({
        cuentaOrigenId: Number(values.cuentaOrigenId),
        cuentaDestinoId: values.tipo === "propia" ? Number(values.cuentaDestinoId) : undefined,
        beneficiarioId: values.tipo === "beneficiario" ? Number(values.beneficiarioId) : undefined,
        monto: montoNum,
        concepto: values.concepto.trim() || undefined,
      });
      setResultado(transferencia);
      setPaso(3);
      toast.success(`Transferencia ${transferencia.referencia} realizada.`);
      await Promise.all([mutateCuentas(), mutateTransferencias()]);
    } catch (err) {
      const campo = form.applyApiError(
        err,
        [
          { field: "monto", when: mensajeContiene("saldo insuficiente") },
          { field: "cuentaDestinoId", when: mensajeContiene("misma moneda", "cuenta destino") },
          { field: "cuentaOrigenId", when: mensajeContiene("cuenta origen") },
          { field: "beneficiarioId", when: mensajeContiene("beneficiario") },
        ],
        "No se pudo realizar la transferencia.",
      );
      if (campo === "monto") setPaso(1);
      else if (campo) setPaso(0);
    } finally {
      setSubmitting(false);
    }
  }

  function nuevaTransferencia() {
    form.reset({ ...inicial, usuarioId: form.values.usuarioId, cuentaOrigenId: form.values.cuentaOrigenId, beneficiarioId: "" });
    setResultado(null);
    setPaso(0);
  }

  return (
    <div className={shared.page}>
      <Link href="/v2/transferencias" className={shared.backLink}>
        ← Transferencias
      </Link>
      <ModuleHeader moduleKey="v2-transferencias" title="Nueva transferencia" />
      <Stepper steps={PASOS} current={paso} testId="v2-transferencias" />

      {paso === 3 && resultado ? (
        <Receipt
          testId="v2-transferencias"
          title="Transferencia realizada"
          operacion={resultado.referencia}
          fecha={resultado.created_at}
          items={[
            { name: "monto", label: "Monto", value: <Monto value={resultado.monto} moneda={resultado.moneda} /> },
            { name: "origen", label: "Desde", value: origen ? describeCuenta(origen) : `Cuenta #${resultado.cuenta_origen_id}` },
            {
              name: "destino",
              label: "Hacia",
              value: resultado.beneficiario_id
                ? beneficiario
                  ? `${beneficiario.nombre} · ${beneficiario.banco} N° ${beneficiario.numero_cuenta}`
                  : `Beneficiario #${resultado.beneficiario_id}`
                : destino
                  ? describeCuenta(destino)
                  : `Cuenta #${resultado.cuenta_destino_id}`,
            },
            { name: "concepto", label: "Concepto", value: resultado.concepto ?? "—" },
            { name: "estado", label: "Estado", value: resultado.estado },
          ]}
        >
          <button type="button" className={shared.button} onClick={nuevaTransferencia} data-testid="v2-transferencias-otra">
            Hacer otra transferencia
          </button>
          <Link href={`/v2/transferencias/${resultado.id}`} className={shared.buttonSecondary} data-testid="v2-transferencias-ver-detalle">
            Ver detalle
          </Link>
        </Receipt>
      ) : (
        <form className={shared.formGrid} onSubmit={handleSubmit} noValidate data-testid={ids.form}>
          {paso === 0 && (
            <>
              <Field form={form} name="usuarioId" label="Cliente">
                <ClienteSelect
                  {...form.fieldProps("usuarioId")}
                  onChange={(e) => set("usuarioId", e.target.value)}
                  items={clientes}
                  isLoading={clientesLoading}
                />
              </Field>
              <RadioCards
                form={form}
                name="tipo"
                legend="¿A dónde transferís?"
                options={[
                  { value: "propia", label: "Entre mis cuentas", description: "Se acredita al instante." },
                  { value: "beneficiario", label: "A un beneficiario", description: "Cuenta de otro banco agendada." },
                ]}
              />
              <Field form={form} name="cuentaOrigenId" label="Desde la cuenta" hint="Solo cuentas activas.">
                <CuentaSelect
                  {...form.fieldProps("cuentaOrigenId", { hint: true })}
                  onChange={(e) => set("cuentaOrigenId", e.target.value)}
                  items={cuentasActivas}
                  isLoading={cuentasLoading}
                  emptyLabel="El cliente no tiene cuentas activas"
                />
              </Field>
              {form.values.tipo === "propia" ? (
                <Field
                  form={form}
                  name="cuentaDestinoId"
                  label="Hacia la cuenta"
                  hint={origen ? `Otra cuenta activa en ${origen.moneda}.` : "Elegí primero la cuenta de origen."}
                >
                  <CuentaSelect
                    {...form.fieldProps("cuentaDestinoId", { hint: true })}
                    items={destinos}
                    disabled={!origen}
                    emptyLabel={origen ? `No hay otra cuenta activa en ${origen.moneda}` : "Elegí primero el origen"}
                  />
                </Field>
              ) : (
                <Field form={form} name="beneficiarioId" label="Beneficiario">
                  <BeneficiarioSelect {...form.fieldProps("beneficiarioId")} items={beneficiarios} isLoading={beneficiariosLoading} />
                </Field>
              )}
              {form.values.tipo === "beneficiario" && !beneficiariosLoading && beneficiarios.length === 0 && (
                <p className={shared.info}>
                  <Link href={`/v2/beneficiarios/new?usuarioId=${form.values.usuarioId}`}>Agregá un beneficiario</Link> para
                  transferir a otro banco.
                </p>
              )}
            </>
          )}

          {paso === 1 && origen && (
            <>
              <div className={shared.stats}>
                <div className={shared.stat}>
                  <span className={shared.statLabel}>Saldo disponible</span>
                  <Monto value={origen.saldo} moneda={origen.moneda} testId="v2-transferencias-saldo" />
                </div>
                <div className={shared.stat}>
                  <span className={shared.statLabel}>
                    Tope diario restante (de {formatMonto(tope, origen.moneda)})
                  </span>
                  <Monto value={disponibleHoy.toFixed(2)} moneda={origen.moneda} testId="v2-transferencias-tope-restante" />
                </div>
              </div>
              <Field form={form} name="monto" label="Monto">
                <MontoInput {...form.controlProps("monto")} moneda={origen.moneda} />
              </Field>
              <Field form={form} name="concepto" label="Concepto (opcional)" hint="Hasta 60 caracteres. Lo ve quien recibe.">
                <input {...form.fieldProps("concepto", { hint: true })} maxLength={80} />
              </Field>
            </>
          )}

          {paso === 2 && origen && (
            <>
              <dl className={shared.summary} data-testid="v2-transferencias-resumen">
                <dt>Desde</dt>
                <dd data-testid="v2-transferencias-resumen-origen">{describeCuenta(origen)}</dd>
                <dt>Hacia</dt>
                <dd data-testid="v2-transferencias-resumen-destino">
                  {form.values.tipo === "propia"
                    ? destino
                      ? describeCuenta(destino)
                      : "—"
                    : beneficiario
                      ? `${beneficiario.alias ? `${beneficiario.alias} — ` : ""}${beneficiario.nombre} · ${beneficiario.banco} N° ${beneficiario.numero_cuenta}`
                      : "—"}
                </dd>
                <dt>Monto</dt>
                <dd>
                  <Monto value={montoNum.toFixed(2)} moneda={origen.moneda} testId="v2-transferencias-resumen-monto" />
                </dd>
                <dt>Concepto</dt>
                <dd data-testid="v2-transferencias-resumen-concepto">{form.values.concepto.trim() || "—"}</dd>
                <dt>Saldo después</dt>
                <dd>
                  <Monto value={round2(Number(origen.saldo) - montoNum).toFixed(2)} moneda={origen.moneda} testId="v2-transferencias-resumen-saldo-final" />
                </dd>
              </dl>
              <p className={shared.hint}>Revisá los datos: una transferencia solo se puede revertir anulándola.</p>
            </>
          )}

          <FormError form={form} />

          <WizardActions
            ids={ids}
            onBack={paso > 0 ? () => setPaso(paso - 1) : undefined}
            nextLabel={paso === 2 ? "Confirmar transferencia" : "Continuar"}
            submitting={submitting}
            submittingLabel="Transfiriendo..."
            isLast={paso === 2}
          />
        </form>
      )}
    </div>
  );
}
