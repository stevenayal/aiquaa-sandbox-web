import shared from "@/components/shared.module.css";
import type { testIds } from "@/lib/testids";

interface WizardActionsProps {
  ids: ReturnType<typeof testIds>;
  /** Sin `onBack` (primer paso) no se muestra "Volver". */
  onBack?: () => void;
  nextLabel: string;
  submitting?: boolean;
  submittingLabel?: string;
  /** En el último paso el botón de avance es el submit real (`{modulo}-submit`). */
  isLast?: boolean;
  nextDisabled?: boolean;
}

/**
 * Botones de un wizard. El de avance es siempre `type="submit"` del form del
 * paso, así Enter avanza igual que el click y la validación corre en un solo lugar.
 */
export function WizardActions({
  ids,
  onBack,
  nextLabel,
  submitting = false,
  submittingLabel,
  isLast = false,
  nextDisabled = false,
}: WizardActionsProps) {
  return (
    <div className={shared.formActions}>
      {onBack && (
        <button
          type="button"
          className={shared.buttonSecondary}
          onClick={onBack}
          disabled={submitting}
          data-testid={ids.stepBack}
        >
          Volver
        </button>
      )}
      <button
        type="submit"
        className={shared.button}
        disabled={submitting || nextDisabled}
        data-testid={isLast ? ids.submit : ids.stepNext}
      >
        {submitting && submittingLabel ? submittingLabel : nextLabel}
      </button>
    </div>
  );
}
