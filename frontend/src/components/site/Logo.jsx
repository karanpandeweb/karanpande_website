/**
 * A focus-frame monogram for Karan Pande: KP drawn as one continuous camera
 * signature, with an aperture point and frame counter details.
 */
export default function Logo({ variant = "full", className = "" }) {
  const mark = (
    <g>
      <path d="M6 20V6h14M58 6h14v14M72 58v14H58M20 72H6V58" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 58V20m0 20 20-20M25 37l18 21M44 58V20h9c10 0 15 5 15 12s-5 12-15 12h-9" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="32" r="3.4" fill="var(--copper)" />
      <text x="7" y="48" fill="currentColor" fontFamily="'DM Mono', monospace" fontSize="5" letterSpacing="1">01</text>
      <text x="61" y="48" fill="currentColor" fontFamily="'DM Mono', monospace" fontSize="5" letterSpacing="1">KP</text>
    </g>
  );

  if (variant === "icon") {
    return <svg viewBox="0 0 78 78" className={className} role="img" aria-label="Karan Pande Photography">{mark}</svg>;
  }

  return (
    <svg viewBox="0 0 390 80" className={className} role="img" aria-label="Karan Pande Photography">
      {mark}
      <line x1="94" y1="10" x2="94" y2="70" stroke="currentColor" opacity=".2" />
      <text x="112" y="42" fill="currentColor" fontFamily="'Italiana', serif" fontSize="31" letterSpacing="1.2">KARAN PANDE</text>
      <text x="114" y="62" fill="currentColor" fontFamily="'DM Mono', monospace" fontSize="7.5" letterSpacing="2.4">WEDDINGS  /  FILMS  /  STORIES</text>
    </svg>
  );
}
