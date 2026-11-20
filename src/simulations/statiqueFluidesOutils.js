// Outils partagés des scènes et schémas de la simulation 163 (constantes et fonctions sans JSX).
export const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0', encre: '#0f172a', verre: '#64748b', violet: '#6d28d9' };
export const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
export const NB = '\u00a0';
export const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
export const milliers = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
// Géométrie des récipients : bord du récipient, surface libre, fond, axe
export const Y_RIM = 84, Y_SURF = 112, Y_BOT = 304, XC = 235;
export const FORMES = {
  large:  { nom: 'Cuve large',          xl: () => 140, xr: () => 330 },
  etroit: { nom: 'Éprouvette étroite',  xl: () => 205, xr: () => 265 },
  evase:  { nom: 'Vase évasé',          xl: y => 140 + (y - Y_RIM) / (Y_BOT - Y_RIM) * 55, xr: y => 330 - (y - Y_RIM) / (Y_BOT - Y_RIM) * 55 },
};
