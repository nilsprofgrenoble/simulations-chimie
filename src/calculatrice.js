// ═════════════════════════════════════════════════════════════════
//  CALCULATRICE SCIENTIFIQUE : moteur de calcul (sans eval) et mise en forme à la française.
//  Syntaxe : + − × ÷ (aussi * /), ^ pour les puissances (10^(−3), ×10^23), parenthèses (fermées automatiquement),
//  multiplication implicite (2π, 3(4+1), 2sin(30)), fonctions sin cos tan asin acos atan ln log exp sqrt (√) cbrt abs, n!,
//  constantes π e, Ans (dernier résultat). Virgule ou point décimal. Angles en degrés ou en radians.
// ═════════════════════════════════════════════════════════════════
const FONCTIONS = {
  sin: (x, a) => Math.sin(a(x)), cos: (x, a) => Math.cos(a(x)), tan: (x, a) => Math.tan(a(x)),
  asin: (x, a) => a.inv(Math.asin(x)), acos: (x, a) => a.inv(Math.acos(x)), atan: (x, a) => a.inv(Math.atan(x)),
  ln: x => Math.log(x), log: x => Math.log10(x), exp: x => Math.exp(x), sqrt: x => Math.sqrt(x), cbrt: x => Math.cbrt(x), abs: x => Math.abs(x),
};
const ALIAS = { '√': 'sqrt', racine: 'sqrt', arcsin: 'asin', arccos: 'acos', arctan: 'atan', lg: 'log' };
export const CONSTANTES = {
  c:  { nom: 'Célérité de la lumière', val: 2.99792458e8, unite: 'm·s⁻¹', txt: '2,998×10^8' },
  h:  { nom: 'Constante de Planck', val: 6.62607015e-34, unite: 'J·s', txt: '6,626×10^(−34)' },
  e:  { nom: 'Charge élémentaire', val: 1.602176634e-19, unite: 'C', txt: '1,602×10^(−19)' },
  NA: { nom: 'Constante d’Avogadro', val: 6.02214076e23, unite: 'mol⁻¹', txt: '6,022×10^23' },
  kB: { nom: 'Constante de Boltzmann', val: 1.380649e-23, unite: 'J·K⁻¹', txt: '1,381×10^(−23)' },
  R:  { nom: 'Constante des gaz parfaits', val: 8.314462618, unite: 'J·K⁻¹·mol⁻¹', txt: '8,314' },
  G:  { nom: 'Constante de gravitation', val: 6.6743e-11, unite: 'm³·kg⁻¹·s⁻²', txt: '6,674×10^(−11)' },
  F:  { nom: 'Constante de Faraday', val: 96485.33212, unite: 'C·mol⁻¹', txt: '9,649×10^4' },
};

// ── Découpage en jetons ──
function jetons(src) {
  const t = [], s = src.replace(/\s+/g, '').replace(/−|–|—/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁻¹/g, '^(-1)');
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const num = /^(\d+([.,]\d*)?|[.,]\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
    if (num) { t.push({ k: 'n', v: parseFloat(num[0].replace(',', '.')) }); i += num[0].length; continue; }
    if (c === 'π') { t.push({ k: 'n', v: Math.PI }); i++; continue; }
    if (c === '√') { t.push({ k: 'f', v: 'sqrt' }); i++; continue; }
    const mot = /^[A-Za-zÀ-ÿ]+/.exec(s.slice(i));
    if (mot) {
      const w = mot[0];
      if (w === 'Ans' || w === 'ans') { t.push({ k: 'ans' }); i += w.length; continue; }
      if (w === 'pi') { t.push({ k: 'n', v: Math.PI }); i += 2; continue; }
      // un mot peut être collé à un autre (2sinx, πr) : on cherche le plus long nom de fonction ou constante en tête
      const noms = [...Object.keys(FONCTIONS), ...Object.keys(ALIAS), 'e', ...Object.keys(CONSTANTES)].sort((a, b) => b.length - a.length);
      const nom = noms.find(n => w.startsWith(n));
      if (!nom) throw new Error(`Je ne comprends pas « ${w} ».`);
      i += nom.length;
      if (FONCTIONS[nom] || ALIAS[nom]) t.push({ k: 'f', v: ALIAS[nom] || nom });
      else t.push({ k: 'n', v: nom === 'e' ? Math.E : CONSTANTES[nom].val });
      continue;
    }
    if ('+-*/^()!'.includes(c)) { t.push({ k: c }); i++; continue; }
    throw new Error(`Caractère « ${c} » non reconnu.`);
  }
  return t;
}

// ── Analyse récursive : somme > produit > puissance > postfixe (!) > unaire ──
export function calculer(texte, { angle = 'deg', ans = 0 } = {}) {
  const t = jetons(texte);
  if (!t.length) throw new Error('Tapez un calcul.');
  const rad = x => (angle === 'deg' ? x * Math.PI / 180 : x);
  rad.inv = x => (angle === 'deg' ? x * 180 / Math.PI : x);
  let p = 0;
  const pk = () => t[p]?.k;
  const debutFacteur = k => k === 'n' || k === 'ans' || k === 'f' || k === '(';
  function somme() {
    let v = produit();
    while (pk() === '+' || pk() === '-') { const o = t[p++].k; const w = produit(); v = o === '+' ? v + w : v - w; }
    return v;
  }
  function produit() {
    let v = unaire();
    for (;;) {
      const k = pk();
      if (k === '*' || k === '/') {
        p++; const w = unaire();
        if (k === '/' && w === 0) throw new Error('Division par zéro impossible.');
        v = k === '*' ? v * w : v / w;
      } else if (debutFacteur(k)) v *= unaire();                 // multiplication implicite : 2π, 3(4+1), 2sin(30)
      else return v;
    }
  }
  function unaire() {
    if (pk() === '-') { p++; return -unaire(); }
    if (pk() === '+') { p++; return unaire(); }
    return puissance();
  }
  function puissance() {
    const base = postfixe();
    if (pk() === '^') {
      p++;
      const neg = pk() === '-'; if (neg || pk() === '+') p++;
      const e = puissance();                                      // associativité à droite : 2^3^2 = 2^9
      const x = Math.pow(base, neg ? -e : e);
      if (Number.isNaN(x)) throw new Error('Puissance impossible (base négative et exposant non entier ?).');
      return x;
    }
    return base;
  }
  function postfixe() {
    let v = primaire();
    while (pk() === '!') {
      p++;
      if (!Number.isInteger(v) || v < 0 || v > 170) throw new Error('La factorielle demande un entier entre 0 et 170.');
      let r = 1; for (let i = 2; i <= v; i++) r *= i; v = r;
    }
    return v;
  }
  function primaire() {
    const x = t[p];
    if (!x) throw new Error('Calcul incomplet : il manque un nombre.');
    if (x.k === 'n') { p++; return x.v; }
    if (x.k === 'ans') { p++; return ans; }
    if (x.k === '(') {
      p++; const v = somme();
      if (pk() === ')') p++;                                      // parenthèse fermante manquante en fin de calcul : fermée automatiquement
      return v;
    }
    if (x.k === 'f') {
      p++;
      let arg;
      if (pk() === '(') { p++; arg = somme(); if (pk() === ')') p++; } else arg = puissance();      // sin30, √4
      const r = FONCTIONS[x.v](arg, rad);
      if (!Number.isFinite(r)) throw new Error(x.v === 'ln' || x.v === 'log' ? 'Le logarithme demande un nombre strictement positif.' : x.v === 'sqrt' ? 'Racine carrée d’un nombre négatif impossible.' : 'Calcul impossible pour cette valeur.');
      return r;
    }
    throw new Error(x.k === ')' ? 'Parenthèse fermante en trop.' : 'Calcul incomplet : vérifiez les signes.');
  }
  const v = somme();
  if (p < t.length) throw new Error(t[p].k === ')' ? 'Parenthèse fermante en trop.' : 'Calcul incomplet : vérifiez les signes.');
  if (!Number.isFinite(v)) throw new Error('Résultat trop grand pour la calculatrice.');
  return v === 0 ? 0 : v;
}

// ── Mise en forme ──
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
// cs : nombre de chiffres significatifs (0 ou absent = automatique, 10 au plus). Renvoie { texte, brut } : texte pour l'affichage (6,02×10²³), brut pour réutiliser dans un calcul.
export function formater(x, cs = 0) {
  if (x === 0) return { texte: '0', brut: '0' };
  const n = cs > 0 ? cs : 10;
  const [m0, e0] = x.toExponential(n - 1).split('e');
  const exp = parseInt(e0, 10);
  const garde = cs > 0 ? m0 : m0.includes('.') ? m0.replace(/0+$/, '').replace(/\.$/, '') : m0;
  const sci = Math.abs(x) >= 1e6 || Math.abs(x) < 1e-3;
  if (sci) {
    const sup = String(exp).split('').map(c => SUP[c]).join('');
    return { texte: `${garde.replace('.', ',')}×10${sup}`, brut: `${garde.replace('.', ',')}×10^(${exp})` };
  }
  const dec = Math.max(0, (cs > 0 ? n : 0) - 1 - exp);
  let s = cs > 0 ? (exp >= n - 1 ? String(Number(`${m0}e${exp}`)) : x.toFixed(dec)) : String(parseFloat(x.toPrecision(n)));
  if (s.includes('e')) s = x.toFixed(0);
  return { texte: s.replace('.', ','), brut: s.replace('.', ',') };
}
