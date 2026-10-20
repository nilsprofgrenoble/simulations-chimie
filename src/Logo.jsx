// Logo de la Paillasse virtuelle : un erlenmeyer à moitié plein, avec des bulles.
// Le même dessin sert de favicon (public/favicon.svg).
import { ACCENT } from "./theme";

export function LogoPaillasse({ taille = 36, avecTexte = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <svg width={taille} height={taille} viewBox="0 0 48 48" role="img" aria-label="Paillasse virtuelle" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="46" height="46" rx="11" fill={ACCENT}/>
        <path d="M19 9h10v2h-1.6v9.2L36.6 36c1.2 2-.2 4.3-2.5 4.3H13.9c-2.300 0-3.700-2.300-2.500-4.300l9.200-15.800V11H19z" fill="#ffffff"/>
        <path d="M15.200 31.500h17.600l3.100 5.100c.6 1-.1 2.200-1.300 2.200H13.400c-1.200 0-1.900-1.200-1.300-2.200z" fill="#f59e0b"/>
        <circle cx="22" cy="27" r="1.700" fill={ACCENT}/>
        <circle cx="27" cy="23" r="1.200" fill={ACCENT}/>
        <circle cx="25.500" cy="28.500" r="1" fill="#ffffff"/>
      </svg>
      {avecTexte && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, textAlign: 'left' }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: taille * 0.5, color: '#0f172a', letterSpacing: '-0.3px' }}>Paillasse</span>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: taille * 0.5, color: ACCENT, letterSpacing: '-0.3px' }}>virtuelle</span>
        </span>
      )}
    </span>
  );
}
