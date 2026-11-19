// Couleurs d'interface et style commun des schémas de la simulation 160 (Couleurs).
export const C = { encre: '#0f172a', gris: '#475569', clair: '#cbd5e1', nuit: '#111827', texteNuit: '#e2e8f0', vert: '#15803d', rouge: '#b91c1c', bleu: '#1d4ed8', orange: '#c2410c',
  bandes: ['#dc2626', '#16a34a', '#2563eb'] };
export const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8 };

// Couleur de texte lisible sur une pastille de couleur c = [r, v, b] (0 à 1) : on prend du texte foncé ou blanc, selon le meilleur contraste
const lin = x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
export function texteSur(c) {
  const L = 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return (L + 0.05) / 0.058 > 1.05 / (L + 0.05) ? '#0f172a' : 'white';
}
