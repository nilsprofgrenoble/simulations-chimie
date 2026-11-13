// Adresses propres des simulations : /sim/2-titrage-direct/
// Module pur (aucune dépendance au navigateur) : utilisé par l'application (App.jsx), par la génération des pages statiques au build
// (vite.config.js) et par le test src/slugs.test.mjs. Le numéro de la simulation fait foi ; le texte qui le suit n'est là que pour
// le référencement et la lecture : une simulation renommée garde son numéro, donc son adresse reste valable (elle est réécrite vers le nouveau texte).

// Simulations SANS adresse propre : elles restent sur « ?sim=N » (pages de compte, du professeur, ou qui ne montrent rien sans paramètre).
// 39 Mon compte, 40 Suivi professeur, 82 Page d'un chapitre (&chap=…), 103 Mes fiches. Toutes sont en « noindex ».
export const SANS_ADRESSE_PROPRE = new Set([39, 40, 82, 103]);

export const aAdressePropre = id => Number.isInteger(id) && id > 0 && !SANS_ADRESSE_PROPRE.has(id);

const LONGUEUR_MAX = 60;

// « Régulation TOR, P et PI » → « regulation-tor-p-et-pi » (accents retirés, apostrophes et ponctuation en tirets, coupé à un mot entier)
export function slugDeLabel(label) {
  const s = String(label || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')      // é → e ; ¹³C → 13C ; ₂ → 2
    .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length <= LONGUEUR_MAX) return s;
  const coupe = s.slice(0, LONGUEUR_MAX + 1);
  const p = coupe.lastIndexOf('-');
  return (p > 20 ? coupe.slice(0, p) : s.slice(0, LONGUEUR_MAX)).replace(/-+$/, '');
}

export const slugSimulation = (id, label) => {
  const t = slugDeLabel(label);
  return t ? `${id}-${t}` : String(id);
};

// Chemin d'une simulation, base comprise : « /sim/2-titrage-direct/ »
export const cheminSimulation = (id, label, base = '/') => `${base}sim/${slugSimulation(id, label)}/`;

// Numéro de simulation lu dans un chemin : « /sim/2-titrage-direct/ », « /sim/2/ » ou « /sim/2-n-importe-quoi » → 2 ; sinon null
export function idDepuisChemin(chemin, base = '/') {
  const reste = String(chemin || '');
  if (!reste.startsWith(base)) return null;
  const m = reste.slice(base.length).match(/^sim\/(\d+)(?:-[^/]*)?\/?$/);
  return m ? Number(m[1]) : null;
}

// Numéro de la simulation affichée, lu dans l'adresse du navigateur : « ?sim=N » d'abord (anciennes adresses, QR codes, cadres de récolte),
// sinon l'adresse propre. NaN si aucune (comme l'ancien parseInt(…get('sim')) que cette fonction remplace).
export function simDeLUrl(loc = (typeof window !== 'undefined' ? window.location : null), base = import.meta.env?.BASE_URL ?? '/') {
  if (!loc) return NaN;
  try {
    const q = parseInt(new URLSearchParams(loc.search).get('sim'));
    if (Number.isFinite(q)) return q;
    const c = idDepuisChemin(loc.pathname, base);
    return c === null ? NaN : c;
  } catch { return NaN; }
}
