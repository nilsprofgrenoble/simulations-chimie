// Constantes et petits outils de la simulation 168 (séparés des composants pour le rafraîchissement à chaud).
export const COL = { P: '#b91c1c', R: '#15803d', T: '#0369a1', f: '#b45309', S: '#0f172a', a: '#6d28d9', v: '#475569', gris: '#64748b', txt: '#0f172a' };
const NB = '\u00a0';
export const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
// nombre avec séparateur de milliers insécable (8 480)
export const nbm = (v, d = 0) => { const s = nbf(Math.abs(v), d), [e, f] = s.split(','), ee = e.replace(/\B(?=(\d{3})+(?!\d))/g, NB); return (v < 0 ? '−' : '') + ee + (f ? ',' + f : ''); };
// Échelles (pixels par newton) des flèches de forces dans la scène, et pour la flèche de Σ F du bandeau
export const K = { rail: 7, fil: 10, cabine: 0.008, chute: 0.1 };
export const KS = { rail: 8, fil: 6, cabine: 0.025, chute: 0.04 };
export const COUL_F = { P: COL.P, R: COL.R, T: COL.T, f: COL.f };
export const CENTRE = { rail: [200, 150], fil: [200, 130], cabine: [200, 135], chute: [200, 140] };
const NOM_F = { rail: { P: 'poids', R: 'réaction du rail', T: 'tension du fil', f: 'frottements' }, fil: { P: 'poids', T: 'tension du fil' }, cabine: { P: 'poids', T: 'tension du câble' }, chute: { P: 'poids', f: 'frottement de l’air' } };
export const nomForce = (kind, id) => (NOM_F[kind] || {})[id] || id;

// Nombre à 3 chiffres significatifs (par défaut), sans zéros inutiles, séparateur de milliers insécable ; zéro si la valeur est négligeable (évite « −0,00 », « 640,00 »)
export const nbs = (v, k = 3) => {
  if (!isFinite(v) || Math.abs(v) < 1e-9) return '0';
  const r = Number(Number(v).toPrecision(k)), dec = (String(r).split('.')[1] || '').length;
  return nbm(r, dec);
};
