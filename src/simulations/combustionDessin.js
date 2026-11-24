// Dessin des molécules de la simulation 159 : formules développées planes (schémas simplifiés), sans React (valence vérifiée par le test).
// Atome : { e, x, y } ; liaison : { a, b, o (ordre 1 ou 2), t (type d'énergie de liaison : CH, CC, CO, OH, OO, CdO) }.
export const COL = { encre: '#0f172a', gris: '#64748b', bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', violet: '#6d28d9', fond: '#f8fafc' };
// couleur de chaque type de liaison, dans la scène de comptage
export const COL_LIAISON = { CH: '#0369a1', CC: '#6d28d9', CO: '#b45309', OH: '#0f766e', OO: '#b91c1c', CdO: '#15803d' };
export const COL_ATOME = { C: '#475569', H: '#e2e8f0', O: '#fca5a5' };
const PAS = 36;

const mk = () => { const atomes = [], liaisons = []; return { atomes, liaisons,
  at(e, x, y) { atomes.push({ e, x, y }); return atomes.length - 1; },
  li(a, b, t, o = 1) { liaisons.push({ a, b, t, o }); } }; };

export const bornes = m => {
  const xs = m.atomes.map(a => a.x), ys = m.atomes.map(a => a.y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

export function dioxygene() { const m = mk(); const a = m.at('O', 0, 0), b = m.at('O', PAS, 0); m.li(a, b, 'OO', 2); return m; }
export function dioxydeCarbone() { const m = mk(); const o1 = m.at('O', 0, 0), c = m.at('C', PAS, 0), o2 = m.at('O', 2 * PAS, 0); m.li(o1, c, 'CdO', 2); m.li(c, o2, 'CdO', 2); return m; }
export function eau() { const m = mk(); const o = m.at('O', 0, 0), h1 = m.at('H', -PAS * 0.78, PAS * 0.62), h2 = m.at('H', PAS * 0.78, PAS * 0.62); m.li(o, h1, 'OH'); m.li(o, h2, 'OH'); return m; }

// Alcane ou alcool linéaire de n carbones (n ≤ 4) : chaîne horizontale, deux H au-dessus et au-dessous de chaque C, bouts complétés
export function chaine(n, alcool) {
  const m = mk(); const cs = [];
  for (let i = 0; i < n; i++) cs.push(m.at('C', i * PAS, 0));
  for (let i = 0; i < n - 1; i++) m.li(cs[i], cs[i + 1], 'CC');
  cs.forEach(c => { m.li(c, m.at('H', m.atomes[c].x, -PAS * 0.95), 'CH'); m.li(c, m.at('H', m.atomes[c].x, PAS * 0.95), 'CH'); });
  m.li(cs[0], m.at('H', -PAS * 0.95, 0), 'CH');
  const fin = cs[n - 1];
  if (alcool) { const o = m.at('O', (n - 1) * PAS + PAS, 0); m.li(fin, o, 'CO'); m.li(o, m.at('H', (n - 1) * PAS + PAS * 1.95, 0), 'OH'); }
  else m.li(fin, m.at('H', (n - 1) * PAS + PAS * 0.95, 0), 'CH');
  return m;
}
export function moleculeDe(c) { return c.nC <= 4 ? chaine(c.nC, c.type === 'alcool') : null; }
export const ESPECES = { O2: dioxygene, CO2: dioxydeCarbone, H2O: eau };

// Valence : C = 4, O = 2, H = 1 (somme des ordres de liaison)
export function valences(m) {
  const v = m.atomes.map(() => 0);
  m.liaisons.forEach(l => { v[l.a] += l.o; v[l.b] += l.o; });
  return v;
}
export const valenceOK = m => valences(m).every((v, i) => v === { C: 4, O: 2, H: 1 }[m.atomes[i].e]);
export const compteLiaisons = m => m.liaisons.reduce((s, l) => { s[l.t] = (s[l.t] || 0) + 1; return s; }, {});

// Nombre entier de kJ/mol écrit à la française, avec un vrai signe moins
export const nbm = v => Number(v).toFixed(0).replace('-', '−');
