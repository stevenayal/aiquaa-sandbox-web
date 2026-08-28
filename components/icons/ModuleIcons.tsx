import type { SVGProps } from "react";

export type ModuleIconName = "bank" | "card" | "utility" | "market" | "stay" | "bell" | "person" | "shield" | "chart";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const ICONS: Record<ModuleIconName, (props: IconProps) => React.ReactElement> = {
  bank: (props) => (
    <Svg {...props}>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 10.5V19M9.5 10.5V19M14.5 10.5V19M19 10.5V19" />
      <path d="M3 19h18" />
    </Svg>
  ),
  card: (props) => (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2.2" />
      <path d="M3 10.5h18" />
      <path d="M6.5 15h4" />
    </Svg>
  ),
  utility: (props) => (
    <Svg {...props}>
      <path d="M8 3.5h8v6h2.5L10 20.5l1.8-7.5H8z" />
    </Svg>
  ),
  market: (props) => (
    <Svg {...props}>
      <path d="M7 8 8.3 4h7.4L17 8" />
      <path d="M4.7 8h14.6l-1.2 11.1a2 2 0 0 1-2 1.9H7.9a2 2 0 0 1-2-1.9Z" />
      <path d="M9 11.2v2M15 11.2v2" />
    </Svg>
  ),
  stay: (props) => (
    <Svg {...props}>
      <path d="M3 19v-7a2 2 0 0 1 2-2h5.5a2 2 0 0 1 2 2v7" />
      <path d="M12.5 12.5h6a2 2 0 0 1 2 2V19" />
      <path d="M3 19h18" />
      <circle cx="7" cy="9.2" r="1.3" />
    </Svg>
  ),
  bell: (props) => (
    <Svg {...props}>
      <path d="M6 10.2a6 6 0 1 1 12 0c0 3.9 1.4 5.3 1.4 5.3H4.6S6 14.1 6 10.2Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  ),
  person: (props) => (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2.1" />
      <path d="M5.8 16.6c.6-1.8 2-2.7 3.2-2.7s2.6.9 3.2 2.7" />
      <path d="M14.5 10h4M14.5 13h4" />
    </Svg>
  ),
  shield: (props) => (
    <Svg {...props}>
      <path d="M12 3.5 19 6v6c0 4.5-3 7.3-7 8.5-4-1.2-7-4-7-8.5V6Z" />
      <path d="M9 12l2 2 4-4.2" />
    </Svg>
  ),
  chart: (props) => (
    <Svg {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 19v-5M12.5 19V9M17 19v-8" />
    </Svg>
  ),
};

export function ModuleIcon({ name, ...props }: { name: ModuleIconName } & IconProps) {
  return ICONS[name](props);
}
