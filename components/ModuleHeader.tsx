import type { ReactNode } from "react";
import { ModuleIcon } from "@/components/icons/ModuleIcons";
import { moduleTheme, type ModuleKey } from "@/lib/theme/moduleThemes";
import styles from "./ModuleHeader.module.css";

interface ModuleHeaderProps {
  moduleKey: ModuleKey;
  title: string;
  children?: ReactNode;
}

/** Header temático de módulo: ícono + nombre de producto + título real, con acciones opcionales a la derecha. */
export function ModuleHeader({ moduleKey, title, children }: ModuleHeaderProps) {
  const theme = moduleTheme(moduleKey);

  return (
    <div className={styles.header}>
      <div className={styles.identity}>
        <span className={styles.iconWrap} style={{ background: theme.accent }}>
          <ModuleIcon name={theme.icon} className={styles.icon} />
        </span>
        <div>
          <p className={styles.eyebrow} style={{ color: theme.accent }}>
            {theme.productName}
          </p>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
