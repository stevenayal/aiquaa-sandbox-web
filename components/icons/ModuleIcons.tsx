import type { SVGProps } from "react";

export type ModuleIconName =
  | "bank"
  | "card"
  | "utility"
  | "market"
  | "stay"
  | "bell"
  | "person"
  | "shield"
  | "chart"
  | "history"
  | "loan"
  | "contact"
  | "piggybank"
  | "vault";

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
  history: (props) => (
    <Svg {...props}>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8.5v4.3l3 1.8" />
      <path d="M8.5 3.5 6 5.7M15.5 3.5 18 5.7" />
    </Svg>
  ),
  loan: (props) => (
    <Svg {...props}>
      <path d="M3 12.5 8 8l3 2 4-3.5 6 4.3" />
      <path d="M8 8v11M16.5 6.5V17" />
      <path d="M4.5 19.5h15" />
    </Svg>
  ),
  contact: (props) => (
    <Svg {...props}>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <circle cx="10.5" cy="10" r="2.1" />
      <path d="M7.3 15.6c.6-1.7 1.9-2.5 3.2-2.5s2.6.8 3.2 2.5" />
      <path d="M15.5 8.5h2.2M15.5 11.5h2.2" />
    </Svg>
  ),
  piggybank: (props) => (
    <Svg {...props}>
      <path d="M5 12.8a6.3 6.3 0 0 1 6.3-6.3h3.4a4.8 4.8 0 0 1 4.3 2.7l1.5.5-.5 2-1.5-.2a6.3 6.3 0 0 1-1 2.8v2.7h-2.3v-1.4h-5v1.4H7.9v-2a5 5 0 0 1-1.7-1.3H5Z" />
      <circle cx="15" cy="11" r=".6" fill="currentColor" stroke="none" />
      <path d="M9.5 6.5V4.8M7 7.3 5.8 6" />
    </Svg>
  ),
  vault: (props) => (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r=".6" fill="currentColor" stroke="none" />
      <path d="M12 8v1M12 15v1M8 12h1M15 12h1" />
      <path d="M17.5 6.5h1.8M17.5 17.5h1.8" />
    </Svg>
  ),
};

export function ModuleIcon({ name, ...props }: { name: ModuleIconName } & IconProps) {
  return ICONS[name](props);
}
