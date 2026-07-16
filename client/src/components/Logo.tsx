interface LogoProps {
  size?: number;
}

export function Logo({ size = 36 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo-mark">
      <circle cx="24" cy="24" r="22" fill="#2e7d32" />
      <path d="M24 14 L33 32 L15 32 Z" fill="#ffffff" />
      <path d="M24 22 L27.5 32 L20.5 32 Z" fill="#2e7d32" />
      <path
        d="M13 36 Q24 40 35 36"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeDasharray="1 3.5"
        fill="none"
        opacity="0.85"
        strokeLinecap="round"
      />
    </svg>
  );
}
