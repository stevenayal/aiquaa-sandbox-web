import styles from "./ProgressBar.module.css";
import { formatPorcentaje } from "@/lib/format";

interface ProgressBarProps {
  /** Porcentaje 0-100 (se acota). */
  value: number;
  label: string;
  testId?: string;
  tone?: "default" | "success" | "warning" | "danger";
}

/** Barra de progreso accesible; el porcentaje crudo (2 decimales) va en `data-value`. */
export function ProgressBar({ value, label, testId, tone = "default" }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className={styles.wrap}>
      <div className={styles.labels}>
        <span>{label}</span>
        <span>{formatPorcentaje(pct)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        data-value={pct.toFixed(2)}
        data-testid={testId}
        className={styles.track}
      >
        <div className={`${styles.bar} ${styles[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
