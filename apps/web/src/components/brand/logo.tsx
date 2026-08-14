interface LogoProps {
  className?: string;
}

/// A sheet with a turned corner, and a filled aperture where the reader's
/// attention lands. The mark has to survive 16px in a browser tab, so it is
/// built from four shapes and no gradients.
export const LogoMark = ({ className }: LogoProps) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M6.5 4.75A1.75 1.75 0 0 1 8.25 3h10.19c.46 0 .9.18 1.23.51l5.57 5.57c.33.33.51.77.51 1.23V27.25A1.75 1.75 0 0 1 24 29H8.25a1.75 1.75 0 0 1-1.75-1.75V4.75Z"
      fill="currentColor"
      opacity="0.12"
    />
    <path
      d="M6.5 4.75A1.75 1.75 0 0 1 8.25 3h10.19c.46 0 .9.18 1.23.51l5.57 5.57c.33.33.51.77.51 1.23V27.25A1.75 1.75 0 0 1 24 29H8.25a1.75 1.75 0 0 1-1.75-1.75V4.75Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M18.5 3.4v5.35c0 .69.56 1.25 1.25 1.25h5.35"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="16" cy="20" r="4.75" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16" cy="20" r="1.9" fill="var(--color-brand)" />
  </svg>
);

export const Logo = ({ className }: LogoProps) => (
  <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
    <LogoMark className="h-7 w-7 text-ink" />
    <span className="font-display text-[1.35rem] leading-none tracking-tight text-ink">
      Deal Room
    </span>
  </span>
);
