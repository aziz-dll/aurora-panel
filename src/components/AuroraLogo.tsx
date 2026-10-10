/* Aurora logosu — public/aurora.svg birebir inline gömülü.
   <img> yerine inline SVG: repaint maliyeti düşük, tema rengine uyumlu. */

export function AuroraLogo({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Aurora logosu"
    >
      <rect width="400" height="400" rx="88" fill="#0a0a0a" />
      <rect width="398" height="398" x="1" y="1" rx="87" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="2" />
      <g transform="translate(90.7 306.7) scale(0.327221 -0.327221)">
        <path
          d="M383 709 625 84Q640 49 656.5 35.0Q673 21 686 20V0Q654 2 609.5 2.5Q565 3 519 3Q471 3 428.0 2.5Q385 2 359 0V20Q410 22 424.0 37.5Q438 53 418 104L252 558L272 588L126 211Q103 151 98.0 114.0Q93 77 103.0 57.0Q113 37 134.5 29.0Q156 21 186 20V0Q151 2 121.5 2.5Q92 3 58 3Q38 3 17.5 2.5Q-3 2 -18 0V20Q4 24 26.5 48.0Q49 72 71 131L296 709Q316 707 339.5 707.0Q363 707 383 709ZM435 288V268H137L147 288Z"
          fill="#f5f5f5"
        />
      </g>
    </svg>
  );
}
