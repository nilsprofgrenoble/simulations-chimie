// ====================================================
//  MODÈLE « FORMULES TOPOLOGIQUES ET ISOMÉRIE DE CONSTITUTION » (TG spé PC, « Élaborer des stratégies en synthèse organique »)
//  Une molécule est un graphe { at: ['C', 'C', 'O', ...], bo: [[a, b, ordre], ...] } (hydrogènes implicites : un carbone fait 4 liaisons, un oxygène 2).
//  Famille traitée (volontairement limitée) : squelettes carbonés saturés, avec UNE double liaison C=C, ou cycliques ;
//  groupe hydroxyle –OH (alcools) ; ramifications méthyle (et éthyle reconnu au nom). Hors modèle : stéréoisomérie (Z/E, énantiomères),
//  éthers, autres familles, polymères.
//  Tout est calculé à partir du graphe : formule brute, semi-développée, nom, forme canonique (test d'isomorphisme), disposition du dessin.
// ====================================================

export const PREF = ['méth', 'éth', 'prop', 'but', 'pent', 'hex', 'hept'];
const SUBS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
export const indice = k => String(k).split('').map(c => SUBS[+c]).join('');

// ---------- graphe : lecture d'une chaîne de type SMILES (C, O, =, parenthèses, fermetures de cycle) ----------
export function lire(smi) {
  const at = [], bo = [], pile = [], ouv = {};
  let cur = -1, ordre = 1;
  for (const c of smi) {
    if (c === 'C' || c === 'O') {
      at.push(c);
      const i = at.length - 1;
      if (cur >= 0) bo.push([cur, i, ordre]);
      cur = i; ordre = 1;
    } else if (c === '=') ordre = 2;
    else if (c === '(') pile.push(cur);
    else if (c === ')') cur = pile.pop();
    else if (/[0-9]/.test(c)) {
      if (ouv[c] !== undefined) { bo.push([cur, ouv[c], ordre]); delete ouv[c]; ordre = 1; } else ouv[c] = cur;
    } else throw new Error(`caractère inconnu : ${c}`);
  }
  return { at, bo };
}
export const voisins = g => { const v = g.at.map(() => []); g.bo.forEach(([a, b, o]) => { v[a].push([b, o]); v[b].push([a, o]); }); return v; };
export const valence = (g, i) => g.bo.reduce((s, [a, b, o]) => s + (a === i || b === i ? o : 0), 0);
export const nbH = (g, i) => (g.at[i] === 'C' ? 4 : 2) - valence(g, i);
export const estValide = g => g.at.every((_, i) => nbH(g, i) >= 0);
export function brute(g) {
  const r = { C: 0, H: 0, O: 0 };
  g.at.forEach((e, i) => { r[e]++; r.H += nbH(g, i); });
  return r;
}
export const bruteTexte = g => { const r = brute(g); return 'C' + (r.C > 1 ? indice(r.C) : '') + 'H' + (r.H > 1 ? indice(r.H) : '') + (r.O ? 'O' + (r.O > 1 ? indice(r.O) : '') : ''); };
export const cleBrute = g => { const r = brute(g); return `C${r.C}H${r.H}${r.O ? 'O' + (r.O > 1 ? r.O : '') : ''}`; };
// formule brute écrite sous forme de clé « C4H10O » vers texte à indices
export const cleVersTexte = k => k.replace(/(\d+)/g, (m) => indice(m));

// ---------- forme canonique (isomorphisme exact ; graphes de 7 atomes lourds au plus) ----------
export function canon(g) {
  const n = g.at.length, M = Array.from({ length: n }, () => new Array(n).fill(0));
  g.bo.forEach(([a, b, o]) => { M[a][b] = o; M[b][a] = o; });
  let col = g.at.map(e => e);
  for (let r = 0; r < n; r++) {
    const brut = col.map((c, i) => c + '|' + col.map((_, j) => (M[i][j] ? col[j] + ':' + M[i][j] : null)).filter(Boolean).sort().join(','));
    const rangs = [...new Set(brut)].sort();
    col = brut.map(s => String(rangs.indexOf(s)).padStart(3, '0'));
  }
  const cles = [...new Set(col)].sort(), cellules = cles.map(c => col.map((x, i) => (x === c ? i : -1)).filter(i => i >= 0));
  let meilleur = null;
  const ordre = [];
  const rec = k => {
    if (k === cellules.length) {
      let s = '';
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) s += M[ordre[a]][ordre[b]];
      if (meilleur === null || s < meilleur) meilleur = s;
      return;
    }
    const cel = cellules[k], utilise = new Array(cel.length).fill(false);
    const perm = d => {
      if (d === cel.length) { rec(k + 1); return; }
      for (let i = 0; i < cel.length; i++) if (!utilise[i]) { utilise[i] = true; ordre.push(cel[i]); perm(d + 1); ordre.pop(); utilise[i] = false; }
    };
    perm(0);
  };
  rec(0);
  return g.at.length + '#' + cellules.map(c => c.length + g.at[c[0]]).join('') + '#' + col.slice().sort().join('') + '#' + meilleur;
}
export const memeMolecule = (a, b) => canon(a) === canon(b);
export const sontIsomeres = (a, b) => cleBrute(a) === cleBrute(b) && !memeMolecule(a, b);
// squelette carboné : seuls les carbones, toutes liaisons simples
export function squelette(g) {
  const idx = {}; let k = 0;
  g.at.forEach((e, i) => { if (e === 'C') idx[i] = k++; });
  return { at: new Array(k).fill('C'), bo: g.bo.filter(([a, b]) => g.at[a] === 'C' && g.at[b] === 'C').map(([a, b]) => [idx[a], idx[b], 1]) };
}
export const caracteres = g => ({ oh: g.at.filter(e => e === 'O').length, db: g.bo.filter(([, , o]) => o === 2).length, cycle: anneau(g).length > 0 });

// ---------- cycle : atomes du cycle, dans l'ordre (unicyclique) ----------
export function anneau(g) {
  const v = voisins(g), reste = new Set(g.at.map((_, i) => i));
  let change = true;
  while (change) {
    change = false;
    for (const i of [...reste]) if ([...v[i]].filter(([j]) => reste.has(j)).length <= 1) { reste.delete(i); change = true; }
  }
  if (!reste.size) return [];
  const k = reste.size, dep = [...reste][0], ordre = [dep];
  let prec = -1, cur = dep;
  while (ordre.length < k) {
    const nxt = v[cur].map(([j]) => j).find(j => reste.has(j) && j !== prec && !ordre.includes(j));
    ordre.push(nxt); prec = cur; cur = nxt;
  }
  return ordre;
}

// ---------- nomenclature ----------
const MULT = ['', '', 'di', 'tri', 'tétra'];
const NOM_SUB = { 1: 'méthyl', 2: 'éthyl' };
// chemins simples entre carbones (liste de sommets)
function chemins(g) {
  const v = voisins(g), C = g.at.map((e, i) => (e === 'C' ? i : -1)).filter(i => i >= 0), out = [];
  const dfs = (p) => {
    out.push(p.slice());
    for (const [j] of v[p[p.length - 1]]) if (g.at[j] === 'C' && !p.includes(j)) { p.push(j); dfs(p); p.pop(); }
  };
  C.forEach(i => dfs([i]));
  return out;
}
// meilleure chaîne principale et sa numérotation : { chemin, oh, db, subs: [{loc, L}] }
export function chainePrincipale(g) {
  const v = voisins(g);
  const carboneOH = g.at.map((e, i) => (e === 'O' ? v[i][0][0] : -1)).filter(i => i >= 0);
  const dbs = g.bo.filter(([a, b, o]) => o === 2 && g.at[a] === 'C' && g.at[b] === 'C');
  if (carboneOH.length > 1 || dbs.length > 1) throw new Error('hors famille : plusieurs –OH ou C=C');
  const cands = [];
  for (const p of chemins(g)) {
    if (carboneOH.length && !p.includes(carboneOH[0])) continue;
    let dbLoc = 0;
    if (dbs.length) {
      const [a, b] = dbs[0], ia = p.indexOf(a), ib = p.indexOf(b);
      if (ia < 0 || ib < 0 || Math.abs(ia - ib) !== 1) continue;
      dbLoc = Math.min(ia, ib) + 1;
    }
    const subs = [];
    const dehors = new Set(g.at.map((e, i) => (e === 'C' && !p.includes(i) ? i : -1)).filter(i => i >= 0));
    let ok = true;
    const vus = new Set();
    for (const [k, atome] of p.entries()) {
      for (const [j] of v[atome]) {
        if (!dehors.has(j) || vus.has(j)) continue;
        // branche : composante des carbones hors chaîne contenant j (doit être linéaire, 1 ou 2 carbones)
        const compo = [j]; vus.add(j);
        for (let q = 0; q < compo.length; q++) for (const [x] of v[compo[q]]) if (dehors.has(x) && !vus.has(x)) { vus.add(x); compo.push(x); }
        const L = compo.length;
        if (L > 2 || compo.some(c => v[c].filter(([x]) => g.at[x] === 'C').length > 2)) ok = false;
        subs.push({ loc: k + 1, L });
      }
    }
    if (!ok) continue;
    cands.push({ chemin: p, oh: carboneOH.length ? p.indexOf(carboneOH[0]) + 1 : 0, db: dbLoc, subs });
  }
  if (!cands.length) throw new Error('aucune chaîne principale');
  const maxL = Math.max(...cands.map(c => c.chemin.length));
  const cle = c => [-c.subs.length, c.oh, c.db, ...c.subs.map(s => s.loc).sort((a, b) => a - b)];
  const cmp = (a, b) => { const x = cle(a), y = cle(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] ?? 0) - (y[i] ?? 0); if (d) return d; } return 0; };
  return cands.filter(c => c.chemin.length === maxL).sort(cmp)[0];
}
export function nom(g) {
  const cyc = anneau(g);
  const v = voisins(g);
  if (cyc.length) {
    const racine = PREF[cyc.length - 1], aOH = g.at.includes('O'), nbC = g.at.filter(e => e === 'C').length;
    if (nbC === cyc.length && !aOH) return 'cyclo' + racine + 'ane';
    if (aOH && nbC === cyc.length) return 'cyclo' + racine + 'anol';
    if (!aOH && nbC === cyc.length + 1) return 'méthylcyclo' + racine + 'ane';
    throw new Error('cycle : hors famille');
  }
  const c = chainePrincipale(g), L = c.chemin.length, tige = PREF[L - 1];
  const ordreNoms = [2, 1];   // éthyl avant méthyl (ordre alphabétique)
  const prefixes = ordreNoms.map(l => {
    const locs = c.subs.filter(s => s.L === l).map(s => s.loc).sort((a, b) => a - b);
    return locs.length ? `${locs.join(',')}-${MULT[locs.length]}${NOM_SUB[l]}` : null;
  }).filter(Boolean).join('-');
  const sansLocEne = L <= 3 && c.subs.length === 0 && !c.oh;
  let cor;
  if (c.db && c.oh) cor = `${tige}-${c.db}-én-${c.oh}-ol`;
  else if (c.db) cor = sansLocEne ? `${tige}ène` : `${tige}-${c.db}-ène`;
  else if (c.oh) cor = L <= 2 ? `${tige}anol` : `${tige}an-${c.oh}-ol`;
  else cor = `${tige}ane`;
  void v;
  return prefixes + cor;
}

// ---------- formule semi-développée ----------
const groupe = h => (h === 0 ? 'C' : h === 1 ? 'CH' : 'CH' + indice(h));
export function semiDev(g) {
  const v = voisins(g), cyc = anneau(g);
  const ecrireBranche = (j, depuis) => {
    // branche partant de depuis vers j (méthyle, éthyle, hydroxyle)
    if (g.at[j] === 'O') return 'OH';
    const suite = v[j].filter(([x]) => x !== depuis);
    return groupe(nbH(g, j)) + suite.map(([x]) => '–' + ecrireBranche(x, j)).join('');
  };
  const ecrireAtome = (a, chemin) => {
    const br = v[a].filter(([j]) => !chemin.includes(j)).map(([j]) => ecrireBranche(j, a));
    const cpt = {};
    br.forEach(b => { cpt[b] = (cpt[b] || 0) + 1; });
    const txt = Object.entries(cpt).map(([b, n]) => `(${b})${n > 1 ? indice(n) : ''}`).join('');
    return groupe(nbH(g, a)) + txt;
  };
  if (cyc.length) {
    const ref = cyc.findIndex(a => v[a].some(([j]) => !cyc.includes(j)));
    const ord = ref > 0 ? [...cyc.slice(ref), ...cyc.slice(0, ref)] : cyc;
    // groupes identiques consécutifs regroupés : (CH₂)₄ ; CH(CH₃)–(CH₂)₂ (les deux extrémités sont liées : cycle)
    const gr = ord.map(a => ecrireAtome(a, cyc)), runs = [];
    gr.forEach(x => { if (runs.length && runs[runs.length - 1][0] === x) runs[runs.length - 1][1]++; else runs.push([x, 1]); });
    return { texte: runs.map(([x, k]) => (k > 1 ? `(${x})${indice(k)}` : x)).join('–'), cycle: true };
  }
  const c = chainePrincipale(g);
  let ch = c.chemin.slice();
  // un –OH en bout de chaîne s'écrit à droite : CH₃–CH₂–OH
  const carboneOH = g.at.map((e, i) => (e === 'O' ? v[i][0][0] : -1)).filter(i => i >= 0)[0];
  if (carboneOH === ch[0] && ch.length > 1) ch = ch.reverse();
  const morceaux = ch.map((a, k) => {
    const atome = groupe(nbH(g, a)) + (() => {
      const br = v[a].filter(([j]) => !ch.includes(j));
      const finOH = k === ch.length - 1 && a === carboneOH && br.length === 1 && g.at[br[0][0]] === 'O';
      if (finOH) return '';
      const cpt = {};
      br.map(([j]) => ecrireBranche(j, a)).forEach(b => { cpt[b] = (cpt[b] || 0) + 1; });
      return Object.entries(cpt).map(([b, n]) => `(${b})${n > 1 ? indice(n) : ''}`).join('');
    })();
    return atome;
  });
  let s = '';
  morceaux.forEach((m, k) => {
    if (k > 0) {
      const ordre = g.bo.find(([x, y]) => (x === ch[k - 1] && y === ch[k]) || (y === ch[k - 1] && x === ch[k]))[2];
      s += ordre === 2 ? '=' : '–';
    }
    s += m;
  });
  const dernier = ch[ch.length - 1];
  if (dernier === carboneOH && v[dernier].filter(([j]) => !ch.includes(j)).length === 1 && g.at[v[dernier].find(([j]) => !ch.includes(j))[0]] === 'O') s += '–OH';
  return { texte: s, cycle: false };
}

// ---------- disposition du dessin (formule topologique) : coordonnées en longueurs de liaison, y vers le haut ----------
const rad = d => d * Math.PI / 180;
export function disposition(g, { racine = null, plie = false, miroir = false, rot = 0 } = {}) {
  const v = voisins(g), n = g.at.length, pos = new Array(n).fill(null);
  const cyc = anneau(g);
  const taille = (i, interdit) => { // nombre d'atomes de la branche partant de i, sans repasser par interdit
    const vus = new Set([...interdit]); const pile = [i]; vus.add(i); let k = 0;
    while (pile.length) { const a = pile.pop(); k++; for (const [j] of v[a]) if (!vus.has(j)) { vus.add(j); pile.push(j); } }
    return k;
  };
  const poser = (i, x, y) => { pos[i] = { x, y }; };
  const etendre = (a, h, z, dejaPose) => {
    const enfants = v[a].map(([j]) => j).filter(j => !pos[j] && !dejaPose.has(j));
    if (!enfants.length) return;
    const tri = enfants.map(j => ({ j, t: taille(j, [a, ...dejaPose, ...enfants.filter(e => e !== j)]) })).sort((p, q) => q.t - p.t || p.j - q.j);
    let plan;
    if (tri.length === 1) plan = [{ j: tri[0].j, h: h + 60 * z, z: plie ? z : -z }];
    else if (tri.length === 2) plan = [{ j: tri[0].j, h: h + 60 * z, z: plie ? z : -z }, { j: tri[1].j, h: h - 60 * z, z }];
    else if (tri.length === 3) plan = [{ j: tri[0].j, h, z: plie ? z : -z }, { j: tri[1].j, h: h + 90, z: -1 }, { j: tri[2].j, h: h - 90, z: 1 }];
    else plan = tri.map((t, m) => ({ j: t.j, h: h + 45 + 360 * m / tri.length, z: m % 2 ? 1 : -1 }));
    plan.forEach(({ j, h: hj }) => { poser(j, pos[a].x + Math.cos(rad(hj)), pos[a].y + Math.sin(rad(hj))); });
    plan.forEach(({ j, h: hj, z: zj }) => etendre(j, hj, zj, dejaPose));
  };
  if (cyc.length) {
    const k = cyc.length, R = 1 / (2 * Math.sin(Math.PI / k));
    cyc.forEach((a, m) => { const t = rad(90 + 360 * m / k); poser(a, R * Math.cos(t), R * Math.sin(t)); });
    cyc.forEach((a, m) => { const t = 90 + 360 * m / k; const hors = v[a].map(([j]) => j).filter(j => !cyc.includes(j)); hors.forEach(j => { poser(j, pos[a].x + Math.cos(rad(t)), pos[a].y + Math.sin(rad(t))); etendre(j, t, 1, new Set(cyc)); }); });
  } else {
    let r = racine;
    if (r === null) {
      const dist = d0 => { const d = new Array(n).fill(-1); d[d0] = 0; const f = [d0]; for (let q = 0; q < f.length; q++) for (const [j] of v[f[q]]) if (d[j] < 0) { d[j] = d[f[q]] + 1; f.push(j); } return d; };
      const d1 = dist(0); r = d1.indexOf(Math.max(...d1));
    }
    poser(r, 0, 0);
    etendre(r, -30, 1, new Set());
  }
  let pts = pos.map(p => ({ ...p }));
  if (miroir) pts = pts.map(p => ({ x: p.x, y: -p.y }));
  if (rot) { const c = Math.cos(rad(rot)), s = Math.sin(rad(rot)); pts = pts.map(p => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c })); }
  return pts;
}
export function distMin(pts) { let m = Infinity; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)); return m; }

// ---------- constructeur : descripteur → graphe ----------
// chaîne : { type: 'ch', n, db (0 = aucune, k = entre Ck et Ck+1), oh (0 ou k), m1, m2 (0 ou k) }
// cycle : { type: 'cy', n, sub: 'aucun' | 'methyl' | 'oh' }
export const DESC_DEFAUT = { type: 'ch', n: 4, db: 0, oh: 0, m1: 0, m2: 0, sub: 'aucun' };
export function construire(d) {
  const at = [], bo = [];
  const n = d.n;
  for (let i = 0; i < n; i++) at.push('C');
  for (let i = 0; i < n - 1; i++) bo.push([i, i + 1, d.type === 'ch' && d.db === i + 1 ? 2 : 1]);
  if (d.type === 'cy') {
    bo.push([n - 1, 0, 1]);
    if (d.sub === 'methyl') { at.push('C'); bo.push([0, at.length - 1, 1]); }
    if (d.sub === 'oh') { at.push('O'); bo.push([0, at.length - 1, 1]); }
  } else {
    [d.m1, d.m2].forEach(k => { if (k) { at.push('C'); bo.push([k - 1, at.length - 1, 1]); } });
    if (d.oh) { at.push('O'); bo.push([d.oh - 1, at.length - 1, 1]); }
  }
  const g = { at, bo };
  for (let i = 0; i < n; i++) {
    if (valence(g, i) > 4) return { g: null, erreur: { atome: i + 1, msg: `Le carbone C${i + 1} aurait ${valence(g, i)} liaisons : un carbone en fait toujours 4. Changez ce réglage.` } };
  }
  if (d.type === 'ch' && d.oh && d.db && (d.oh === d.db || d.oh === d.db + 1)) return { g: null, erreur: { atome: d.oh, msg: 'Un –OH sur un carbone de la double liaison donne une espèce instable (énol), hors programme : placez le groupe –OH ailleurs.' } };
  return { g, erreur: null };
}
export const descriptions = () => {
  const out = [];
  for (let n = 2; n <= 5; n++) for (let db = 0; db < n; db++) for (let oh = 0; oh <= n; oh++) for (let m1 = 0; m1 <= n; m1++) for (let m2 = m1; m2 <= n; m2++) out.push({ type: 'ch', n, db, oh, m1, m2, sub: 'aucun' });
  for (let n = 3; n <= 5; n++) for (const sub of ['aucun', 'methyl', 'oh']) out.push({ type: 'cy', n, db: 0, oh: 0, m1: 0, m2: 0, sub });
  return out;
};

// ---------- formules brutes étudiées et leurs isomères (dans la famille du modèle) ----------
export const FORMULES = ['C3H6', 'C4H10', 'C5H12', 'C3H8O', 'C4H8', 'C4H10O'];
let _iso = null;
export function isomeres(cle) {
  if (!_iso) {
    _iso = {};
    const vus = new Set();
    for (const d of descriptions()) {
      const { g } = construire(d);
      if (!g) continue;
      const k = cleBrute(g);
      if (!FORMULES.includes(k)) continue;
      const c = canon(g);
      if (vus.has(c)) continue;
      vus.add(c);
      (_iso[k] = _iso[k] || []).push({ g, d, nom: nom(g) });
    }
    Object.values(_iso).forEach(l => l.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));
  }
  return _iso[cle] || [];
}
export const nbIsomeres = cle => isomeres(cle).length;

// ---------- molécules de référence du parcours (SMILES lisibles) ----------
export const MOL = {
  methylbutane: 'CC(C)CC', dimethylbutane: 'CC(C)C(C)C', pentene1: 'C=CCCC', cyclopentane: 'C1CCCC1', butan2ol: 'CCC(C)O',
  methylpentane: 'CC(C)CCC', butane: 'CCCC', methylpropane: 'CC(C)C', butene1: 'C=CCC', butan1ol: 'CCCCO', pent2ene: 'CC=CCC',
  pentane: 'CCCCC', methylbut1ene: 'C=C(C)CC', propan1ol: 'CCCO',
};
export const mol = cle => lire(MOL[cle] || cle);

// ---------- relations entre isomères (défi 2) ----------
export function relation(ref, essai) {
  if (!essai) return { ok: false, motif: 'aucune' };
  if (cleBrute(ref) !== cleBrute(essai)) return { ok: false, motif: 'formule' };
  if (memeMolecule(ref, essai)) return { ok: false, motif: 'meme' };
  const cr = caracteres(ref), ce = caracteres(essai);
  const memeCar = cr.oh === ce.oh && cr.db === ce.db && cr.cycle === ce.cycle;
  const memeSq = canon(squelette(ref)) === canon(squelette(essai));
  return { ok: true, position: memeCar && memeSq, chaine: memeCar && !memeSq, autre: !memeCar };
}

// bornes du dessin (px) d'une molécule posée avec l'échelle L, et positions (px) des atomes
export function boite(g, L, opts = {}, marge = 26) {
  const pts = disposition(g, opts);
  const xs = pts.map(p => p.x * L), ys = pts.map(p => -p.y * L);
  return { pts, x0: Math.min(...xs) - marge, x1: Math.max(...xs) + marge, y0: Math.min(...ys) - marge, y1: Math.max(...ys) + marge };
}
export const posAtomes = (g, L, ox, oy, opts = {}) => { const b = boite(g, L, opts); return b.pts.map(p => ({ x: ox - b.x0 + p.x * L, y: oy - b.y0 - p.y * L })); };

// ---------- tirages des défis ----------
export const POOL_RELATIONS = [['CCCCO', 'position'], ['CCCCO', 'chaine'], ['CCCC', 'chaine'], ['C=CCC', 'position'], ['C=CCC', 'chaine'], ['CCCO', 'position'], ['CC(C)CC', 'chaine'], ['C=CCCC', 'position'], ['CC(C)CO', 'position'], ['CCC(C)O', 'chaine']];
const tire = t => t[Math.floor(Math.random() * t.length)];
export const tirageDefiTous = () => ({ cle: tire(FORMULES) });
export const tirageDefiRelation = () => { const [smi, kind] = tire(POOL_RELATIONS); return { smi, kind }; };
