import styles from "./Stepper.module.css";

interface StepperProps {
  steps: string[];
  /** Paso actual, 0-based. */
  current: number;
  /** Prefijo del módulo: cada paso es `{testId}-step-{n}` (1-based). */
  testId: string;
}

/** Indicador de pasos de un wizard. El paso actual lleva `aria-current="step"`; todos, `data-state`. */
export function Stepper({ steps, current, testId }: StepperProps) {
  return (
    <ol className={styles.stepper} aria-label="Pasos" data-testid={`${testId}-stepper`}>
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "pending";
        return (
          <li
            key={label}
            className={`${styles.step} ${styles[state]}`}
            aria-current={state === "current" ? "step" : undefined}
            data-state={state}
            data-testid={`${testId}-step-${index + 1}`}
          >
            <span className={styles.number} aria-hidden="true">
              {state === "done" ? "✓" : index + 1}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
