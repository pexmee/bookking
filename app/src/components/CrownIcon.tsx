/** Small editorial crown — used as the tittle on the “i” in BookKing. */
export function CrownIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M2 14h20v2H2V14zm1.2-2.2 2.6-6.4 3.2 3.8L12 4.8l3 4.4 3.2-3.8 2.6 6.4H3.2z"
      />
    </svg>
  );
}
