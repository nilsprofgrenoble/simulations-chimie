import { CODES } from "./codes";

// Code court d'un exercice (ex. « ANA23 », « SAPP4 », « VAL12 ») ou d'une simulation (« SIM41 »), imprimé sur les fiches de remédiation.
// Tolère les minuscules, les espaces, les tirets et l'apostrophe de « S'APP 4 ».
export function resoudreCode(saisie, simulationsExistantes) {
  const c = String(saisie || '').toUpperCase().replace(/[\s\-_.'’]/g, '');
  const m = c.match(/^(SAPP|ANA|REA|VAL|SIM)0*(\d+)$/);
  if (!m) return null;
  const code = m[1] + m[2];
  if (m[1] === 'SIM') { const id = +m[2]; return !simulationsExistantes || simulationsExistantes.some(s => s.id === id) ? { sim: id, ex: null, code } : null; }
  const t = CODES[code];
  return t ? { sim: t[0], ex: t[1], code } : null;
}
