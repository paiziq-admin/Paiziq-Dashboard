import type { SVGProps } from "react";

interface PaiziqLogoProps extends SVGProps<SVGSVGElement> {
  /** Render the "Paiziq" wordmark beside the bars. */
  wordmark?: boolean;
}

/**
 * Paiziq brand mark: three rising rounded bars (blue -> cyan) and an optional
 * wordmark. Bar colors are baked in so the mark stays on-brand on any surface;
 * the wordmark uses currentColor so it follows the theme foreground.
 */
export function PaiziqLogo({ wordmark = false, className, ...props }: PaiziqLogoProps) {
  const bars = (
    <svg
      aria-hidden={wordmark ? true : undefined}
      aria-label={wordmark ? undefined : "Paiziq"}
      className={wordmark ? "h-full w-auto shrink-0" : className}
      fill="none"
      role="img"
      viewBox="0 0 46 48"
      xmlns="http://www.w3.org/2000/svg"
      {...(wordmark ? {} : props)}
    >
      <rect fill="#1D4ED8" height="14" rx="4" width="10" x="1" y="30" />
      <rect fill="#0EA5E9" height="26" rx="5" width="11" x="15" y="18" />
      <rect fill="#14B8A6" height="38" rx="6" width="13" x="30" y="6" />
    </svg>
  );

  if (!wordmark) return bars;

  return (
    <span className={`inline-flex items-center gap-[8px] ${className ?? ""}`}>
      {bars}
      <span className="text-[1.05em] font-extrabold leading-none tracking-[-0.03em]">Paiziq</span>
    </span>
  );
}
