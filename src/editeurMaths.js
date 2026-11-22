// ═════════════════════════════════════════════════════════════════
//  ÉDITEUR MATHÉMATIQUE de la calculatrice (saisie « 2D » façon NumWorks : fractions, exposants, racines).
//  L'expression est une liste PLATE de jetons ; le curseur est un indice entre deux jetons. Un caractère = un jeton d'un caractère.
//  Structures : FO … FS … FC (fraction : numérateur FS dénominateur), PO … PC (exposant), RO … RC (racine carrée).
//  Fonctions pures : chaque opération renvoie un nouvel état { t, c }. Tout est testé dans editeurMaths.test.mjs.
// ═════════════════════════════════════════════════════════════════
export const OUVRANTS = { FO: 'FC', PO: 'PC', RO: 'RC' };
const FERMANTS = ['FC', 'PC', 'RC'], OUVERTS = ['FO', 'PO', 'RO'];
const estStructure = x => x.length === 2;
export const vide = () => ({ t: [], c: 0 });
const normaliser = ch => (ch === '*' ? '×' : ch === '-' ? '−' : ch);

export function insererTexte(s, jetons, curseurRelatif = jetons.length) {
  return { t: [...s.t.slice(0, s.c), ...jetons, ...s.t.slice(s.c)], c: s.c + curseurRelatif };
}

// indice du jeton ouvrant qui correspond au fermant situé en t[i]
function ouvrantDe(t, i) {
  let d = 0;
  for (let k = i; k >= 0; k--) {
    if (FERMANTS.includes(t[k])) d++;
    else if (OUVERTS.includes(t[k])) { d--; if (d === 0) return k; }
  }
  return -1;
}
// indice du jeton fermant qui correspond à l'ouvrant situé en t[i]
function fermantDe(t, i) {
  let d = 0;
  for (let k = i; k < t.length; k++) {
    if (OUVERTS.includes(t[k])) d++;
    else if (FERMANTS.includes(t[k])) { d--; if (d === 0) return k; }
  }
  return -1;
}
// début du « terme » qui précède l'indice c : ce que la fraction prend comme numérateur
function debutTerme(t, c) {
  const base = j => {
    if (j > 0 && t[j - 1] === ')') {
      let d = 0, k = j - 1;
      for (; k >= 0; k--) { if (t[k] === ')') d++; else if (t[k] === '(') { d--; if (d === 0) break; } }
      if (k < 0) return j;
      while (k > 0 && /^[A-Za-z]$/.test(t[k - 1])) k--;
      return k;
    }
    if (j > 0 && FERMANTS.includes(t[j - 1])) { const o = ouvrantDe(t, j - 1); return o < 0 ? j : o; }
    let k = j;
    while (k > 0 && /^[0-9,.A-Za-zπ]$/.test(t[k - 1])) k--;
    return k;
  };
  let j = c;
  if (j > 0 && t[j - 1] === 'PC') { const o = ouvrantDe(t, j - 1); if (o >= 0) j = o; }
  return base(j);
}

export function fraction(s) {
  const j = debutTerme(s.t, s.c);
  if (j < s.c) return { t: [...s.t.slice(0, j), 'FO', ...s.t.slice(j, s.c), 'FS', 'FC', ...s.t.slice(s.c)], c: s.c + 2 };   // curseur dans le dénominateur
  return { t: [...s.t.slice(0, s.c), 'FO', 'FS', 'FC', ...s.t.slice(s.c)], c: s.c + 1 };                                   // fraction vide : curseur dans le numérateur
}
// exposant : contenu éventuel, puis curseur dans la boîte (sortir = false) ou juste après (sortir = true)
export function puissance(s, contenu = [], sortir = false) {
  const r = insererTexte(s, ['PO', ...contenu, 'PC'], 1 + contenu.length);
  return sortir ? { ...r, c: r.c + 1 } : r;
}
export function racine(s) { return insererTexte(s, ['RO', 'RC'], 1); }

export function inserer(s, ch) {
  if (ch === '/') return fraction(s);
  if (ch === '^') return puissance(s);
  return insererTexte(s, [normaliser(ch)]);
}

// la structure dont t[i] est l'ouvrant est-elle vide ?
const structureVide = (t, o) => { const f = fermantDe(t, o); return f >= 0 && t.slice(o + 1, f).every(x => x === 'FS'); };

export function supprimer(s) {
  const { t, c } = s;
  if (c === 0) return s;
  const x = t[c - 1];
  if (!estStructure(x)) return { t: [...t.slice(0, c - 1), ...t.slice(c)], c: c - 1 };          // un caractère
  const retirer = (o, f) => ({ t: [...t.slice(0, o), ...t.slice(f + 1)], c: o });
  if (FERMANTS.includes(x)) { const o = ouvrantDe(t, c - 1); return o >= 0 && structureVide(t, o) ? retirer(o, c - 1) : { t, c: c - 1 }; }
  if (OUVERTS.includes(x)) { const f = fermantDe(t, c - 1); return f >= 0 && structureVide(t, c - 1) ? retirer(c - 1, f) : { t, c: c - 1 }; }
  if (x === 'FS') {                                                                             // au début du dénominateur : sortir, ou supprimer si tout est vide
    let o = -1; for (let k = c - 2, d = 0; k >= 0; k--) { if (FERMANTS.includes(t[k])) d++; else if (OUVERTS.includes(t[k])) { if (d === 0) { o = k; break; } d--; } }
    return o >= 0 && structureVide(t, o) ? retirer(o, fermantDe(t, o)) : { t, c: c - 1 };
  }
  return { t, c: c - 1 };
}

export function deplacer(s, sens) {
  const { t, c } = s;
  if (sens === 'g') return { t, c: Math.max(0, c - 1) };
  if (sens === 'd') return { t, c: Math.min(t.length, c + 1) };
  // haut / bas : passer du numérateur au dénominateur de la fraction qui contient le curseur
  let d = 0, sep = false;
  for (let k = c - 1; k >= 0; k--) {
    if (FERMANTS.includes(t[k])) d++;
    else if (t[k] === 'FS' && d === 0) sep = true;
    else if (OUVERTS.includes(t[k])) {
      if (d > 0) d--;
      else if (t[k] === 'FO') {
        const f = fermantDe(t, k);
        let fs = -1; for (let m = k + 1, e = 0; m < f; m++) { if (OUVERTS.includes(t[m])) e++; else if (FERMANTS.includes(t[m])) e--; else if (t[m] === 'FS' && e === 0) { fs = m; break; } }
        if (sens === 'b' && !sep) return { t, c: fs + 1 };
        if (sens === 'h' && sep) return { t, c: k + 1 };
        return s;
      }
    }
  }
  return s;
}

// Texte → jetons : « ^( … ) » devient une boîte d'exposant (pour recopier un résultat ou un calcul de l'historique)
export function depuisTexte(texte) {
  const t = [], pile = [];
  for (let i = 0; i < texte.length; i++) {
    const ch = texte[i];
    if (ch === '^' && texte[i + 1] === '(') { t.push('PO'); pile.push('P'); i++; continue; }
    if (ch === '(') { t.push('('); pile.push('p'); continue; }
    if (ch === ')') { const o = pile.pop(); t.push(o === 'P' ? 'PC' : ')'); continue; }
    t.push(normaliser(ch));
  }
  while (pile.length) { const o = pile.pop(); if (o === 'P') t.push('PC'); }
  return t;
}

// Jetons → texte pour le moteur de calcul
export function serialiser(t) {
  return t.map(x => (x === 'FO' ? '((' : x === 'FS' ? ')/(' : x === 'FC' ? '))' : x === 'PO' ? '^(' : x === 'RO' ? '√(' : (x === 'PC' || x === 'RC') ? ')' : x)).join('');
}
