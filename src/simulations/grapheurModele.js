// ====================================================
//  GRAPHEUR — calculs purs (sans React ni navigateur), testés par grapheurModele.test.mjs
//  Lecture des nombres français, import de texte (collage, CSV), moyenne / écart-type / incertitude de type A,
//  régression (proportionnelle, affine) avec incertitudes-types, résidus, lecture inverse, indicateurs d'hypothèses,
//  arrondi d'une incertitude, export CSV.
//  Toutes les sommes sont CENTRÉES (pas d'équations normales naïves) : stable même quand x est grand devant son étendue.
// ====================================================

const NBSP = '\u00a0';

// ── Nombres ─────────────────────────────────────────────────────────────────────────────────────
// « 3,4 », « 3.4 », « 2,5e-3 », « 2,5×10^-3 », « −0,5 », « 1 234,5 » → nombre ; tout le reste → NaN
export function lireNombre(s) {
  if (typeof s === 'number') return s;
  let t = String(s ?? '').trim();
  if (!t) return NaN;
  t = t.replace(/[\s\u00a0\u202f]/g, '').replace(/[−–]/g, '-')
    .replace(/(?:×|x|X|\*|·)10\^?([+-]?\d+)$/, 'e$1');
  t = t.replace(',', '.');
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i.test(t)) return NaN;
  return Number(t);
}

// Nombre → texte français (virgule), n chiffres significatifs, sans zéros inutiles ; notation scientifique pour les très grands ou très petits
export function ecrire(x, cs = 4) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) {
    const [m, e] = x.toExponential(Math.max(0, cs - 1)).split('e');
    const mant = String(Number(m)).replace('.', ',');
    return `${mant}${NBSP}×${NBSP}10${exposant(Number(e))}`;
  }
  return String(Number(x.toPrecision(cs))).replace('.', ',');
}
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const exposant = n => String(n).split('').map(c => SUP[c] || c).join('');

// ── Statistiques d'une série de mesures ─────────────────────────────────────────────────────────
export const moyenne = v => v.reduce((a, b) => a + b, 0) / v.length;
// écart-type expérimental s (diviseur n − 1)
export function ecartTypeExp(v) {
  if (v.length < 2) return NaN;
  const m = moyenne(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
}
// incertitude-type de type A sur la moyenne : u = s / √N
export const incertitudeTypeA = v => ecartTypeExp(v) / Math.sqrt(v.length);

// ── Régressions ────────────────────────────────────────────────────────────────────────────────
// Modèle affine y = a·x + b. s_r = √(Σ résidus² / (n − 2)) ; u(a) = s_r/√Sxx ; u(b) = s_r·√(1/n + x̄²/Sxx)
export function regressionAffine(x, y) {
  const n = x.length;
  if (n < 3) return null;
  const xb = moyenne(x), yb = moyenne(y);
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += (x[i] - xb) ** 2; sxy += (x[i] - xb) * (y[i] - yb); syy += (y[i] - yb) ** 2; }
  if (!(sxx > 0)) return null;
  const a = sxy / sxx, b = yb - a * xb;
  const residus = y.map((yi, i) => yi - (a * x[i] + b));
  const ssr = residus.reduce((s, r) => s + r * r, 0);
  const sr = Math.sqrt(ssr / (n - 2));
  return { type: 'affine', n, a, b, ua: sr / Math.sqrt(sxx), ub: sr * Math.sqrt(1 / n + xb * xb / sxx),
    sr, r2: syy > 0 ? 1 - ssr / syy : NaN, residus, xb, yb, sxx, ddl: n - 2 };
}

// Modèle proportionnel y = k·x (par l'origine). k = Σxy/Σx² ; s_r = √(Σ résidus² / (n − 1)) ; u(k) = s_r/√Σx²
// r2NonCentre : définition « sans ordonnée à l'origine » de NIST (1 − Σr²/Σy²), jamais négative ; l'écran ne l'affiche pas.
export function regressionProportionnelle(x, y) {
  const n = x.length;
  if (n < 2) return null;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += x[i] * x[i]; sxy += x[i] * y[i]; syy += y[i] * y[i]; }
  if (!(sxx > 0)) return null;
  const k = sxy / sxx;
  const residus = y.map((yi, i) => yi - k * x[i]);
  const ssr = residus.reduce((s, r) => s + r * r, 0);
  const sr = Math.sqrt(ssr / (n - 1));
  return { type: 'proportionnel', n, a: k, b: 0, ua: sr / Math.sqrt(sxx), ub: 0, sr, r2NonCentre: syy > 0 ? 1 - ssr / syy : NaN,
    residus, xb: moyenne(x), yb: moyenne(y), sxx, sx2: sxx, ddl: n - 1 };
}

export const valeurModele = (m, x) => m.a * x + m.b;

// Lecture inverse : valeur de x pour laquelle le modèle donne y0 (y0 mesuré p fois ; p = 1 par défaut), avec son incertitude-type.
//  affine : u(x0) = (s_r/|a|)·√(1/p + 1/n + (y0 − ȳ)²/(a²·Sxx))
//  proportionnel : u(x0) = √( (s_r²/p)/k² + (x0·u(k)/k)² )
export function lectureInverse(m, y0, p = 1) {
  if (!m || !(Math.abs(m.a) > 0)) return null;
  const x0 = (y0 - m.b) / m.a;
  let u;
  if (m.type === 'proportionnel') u = Math.sqrt((m.sr * m.sr / p) / (m.a * m.a) + (x0 * m.ua / m.a) ** 2);
  else u = (m.sr / Math.abs(m.a)) * Math.sqrt(1 / p + 1 / m.n + (y0 - m.yb) ** 2 / (m.a * m.a * m.sxx));
  return { x0, u };
}

// Quotient z = |m_mes − m_ref| / u (u combine les deux incertitudes si la référence en a une) : compatible si z < seuil (2 par convention)
export function quotientZ(mesure, u, reference, uRef = 0) {
  return Math.abs(mesure - reference) / Math.sqrt(u * u + uRef * uRef);
}

// ── Arrondi d'une incertitude (eduscol) : 2 chiffres significatifs au plus ; la valeur est arrondie à la même décimale ─────────────
export function arrondirResultat(valeur, u) {
  if (!isFinite(valeur) || !isFinite(u) || !(u > 0)) return { valeur: ecrire(valeur), u: '—', decimales: null };
  const dec = 1 - Math.floor(Math.log10(u));          // nombre de décimales conservées (peut être négatif)
  const pas = 10 ** (-dec);
  const uArr = Math.round(u / pas) * pas;
  const vArr = Math.round(valeur / pas) * pas;
  const f = z => dec >= 0 ? z.toFixed(dec).replace('.', ',') : String(Math.round(z)).replace('.', ',');
  return { valeur: f(vArr), u: f(uArr), decimales: dec };
}
export const ecrireAvecIncertitude = (valeur, u, unite = '') => {
  const r = arrondirResultat(valeur, u);
  return `(${r.valeur}${NBSP}±${NBSP}${r.u})${unite ? NBSP + unite : ''}`;
};

// Unité d'un coefficient directeur : unité de y divisée par unité de x. A sans unité et c en mmol/L → L·mmol⁻¹
export function uniteQuotient(uy, ux) {
  if (!ux) return uy || '';
  if (!uy) { const m = ux.match(/^([a-zµμ]*mol)\/L$/); return m ? `L·${m[1]}⁻¹` : `(${ux})⁻¹`; }
  return `${uy}/${ux}`;
}

// ── Indicateurs sur les hypothèses (ce sont des indicateurs, pas des preuves : l'élève discute le verdict) ─────────────────────────
const T975 = [NaN, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120,
  2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
export const student975 = ddl => (ddl >= 1 && ddl < T975.length ? T975[ddl] : 1.96);

// Courbure : on ajoute un terme c·x² à la droite ; s'il est significativement non nul (|c| > t·u(c)), le modèle linéaire est douteux.
// Moindres carrés à 3 paramètres sur x centré/réduit (système 3×3 résolu par élimination de Gauss avec pivot).
export function testCourbure(x, y) {
  const n = x.length;
  if (n < 5) return null;
  const xb = moyenne(x);
  const e = Math.sqrt(x.reduce((s, v) => s + (v - xb) ** 2, 0) / n);
  if (!(e > 0)) return null;
  const z = x.map(v => (v - xb) / e);
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], V = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const f = [1, z[i], z[i] * z[i]];
    for (let r = 0; r < 3; r++) { V[r] += f[r] * y[i]; for (let c = 0; c < 3; c++) M[r][c] += f[r] * f[c]; }
  }
  const inv = inverse3(M);
  if (!inv) return null;
  const coef = inv.map(l => l[0] * V[0] + l[1] * V[1] + l[2] * V[2]);
  let ssr = 0;
  for (let i = 0; i < n; i++) ssr += (y[i] - (coef[0] + coef[1] * z[i] + coef[2] * z[i] * z[i])) ** 2;
  const ddl = n - 3;
  const s = Math.sqrt(ssr / ddl);
  const uc = s * Math.sqrt(inv[2][2]);
  const t = uc > 0 ? Math.abs(coef[2]) / uc : (coef[2] === 0 ? 0 : Infinity);
  return { t, seuil: student975(ddl), courbe: t > student975(ddl), ddl };
}
function inverse3(M) {
  const A = M.map((l, i) => [...l, i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-14) return null;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c];
    for (let k = 0; k < 6; k++) A[c][k] /= d;
    for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c]; for (let k = 0; k < 6; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map(l => l.slice(3));
}

// Dispersion : les écarts au modèle sont-ils plus grands d'un côté de l'étendue de x que de l'autre ? (indicateur grossier, n ≥ 6)
export function testDispersion(x, residus) {
  const n = x.length;
  if (n < 6) return null;
  const ordre = x.map((v, i) => i).sort((i, j) => x[i] - x[j]);
  const h = Math.floor(n / 2);
  const m = idx => idx.reduce((s, i) => s + Math.abs(residus[i]), 0) / idx.length;
  const bas = m(ordre.slice(0, h)), haut = m(ordre.slice(n - h));
  if (!(bas > 0) && !(haut > 0)) return { rapport: 1, inegale: false };
  const rapport = haut / (bas || 1e-300);
  return { rapport, inegale: rapport > 2.5 || rapport < 0.4 };
}

// Le modèle proportionnel est-il compatible avec une ordonnée à l'origine nulle ? (|b| < 2·u(b) sur l'ajustement affine)
export function testOrigine(x, y) {
  const m = regressionAffine(x, y);
  if (!m) return null;
  const q = m.ub > 0 ? Math.abs(m.b) / m.ub : Infinity;
  return { b: m.b, ub: m.ub, quotient: q, compatible: q < 2 };
}

// Rassemble les verdicts. statut : 'ok' (testé, compatible) · 'doute' (testé, douteux) · 'info' (non testable ici : à discuter)
export function diagnostics(x, y, modele) {
  if (!modele) return [];
  const L = [];
  const prop = modele.type === 'proportionnel';
  L.push({ id: 'independance', statut: 'info', titre: 'Mesures indépendantes',
    texte: 'Chaque mesure est supposée ne pas dépendre des précédentes. Le grapheur ne peut pas le vérifier : c’est une question de manipulation (même solution mesurée plusieurs fois ? cuve rincée ?).' });
  const c = testCourbure(x, y);
  if (!c) L.push({ id: 'modele', statut: 'info', titre: 'Le modèle est le bon',
    texte: 'Avec moins de 5 points, on ne peut pas tester la courbure. Regardez les écarts au modèle : forment-ils un motif (une courbe) ?' });
  else if (c.courbe) L.push({ id: 'modele', statut: 'doute', titre: 'Le modèle est le bon',
    texte: 'Les points s’écartent de la droite en dessinant une courbe (test de courbure : t = ' + ecrire(c.t, 3) + ' pour un seuil de ' + ecrire(c.seuil, 3) + '). Un modèle linéaire est douteux ici, même si R² est proche de 1.' });
  else L.push({ id: 'modele', statut: 'ok', titre: 'Le modèle est le bon',
    texte: 'Aucune courbure nette n’apparaît dans les écarts au modèle (test de courbure : t = ' + ecrire(c.t, 3) + ' pour un seuil de ' + ecrire(c.seuil, 3) + '). Cela ne prouve pas que le modèle est exact : le test est peu sensible avec peu de points.' });
  if (prop) {
    const o = testOrigine(x, y);
    if (o) L.push({ id: 'origine', statut: o.compatible ? 'ok' : 'doute', titre: 'La droite passe par l’origine',
      texte: o.compatible
        ? 'Sans contrainte, l’ordonnée à l’origine vaut b = ' + ecrire(o.b, 3) + ' avec u(b) = ' + ecrire(o.ub, 2) + ' : elle est compatible avec 0 (|b| < 2·u(b)).'
        : 'Sans contrainte, l’ordonnée à l’origine vaut b = ' + ecrire(o.b, 3) + ' avec u(b) = ' + ecrire(o.ub, 2) + ' : elle n’est pas compatible avec 0 (|b| ≥ 2·u(b)). Un modèle affine conviendrait mieux.' });
  }
  const d = testDispersion(x, modele.residus);
  if (!d) L.push({ id: 'dispersion', statut: 'info', titre: 'Même dispersion pour tous les points',
    texte: 'Tous les points sont supposés également précis. Avec moins de 6 points, on ne peut pas le tester.' });
  else L.push({ id: 'dispersion', statut: d.inegale ? 'doute' : 'ok', titre: 'Même dispersion pour tous les points',
    texte: d.inegale
      ? 'Les écarts au modèle semblent plus grands d’un côté de la gamme que de l’autre (rapport ≈ ' + ecrire(d.rapport, 2) + '). Les incertitudes ci-dessous sont à prendre avec prudence.'
      : 'Les écarts au modèle ont des tailles comparables sur toute la gamme (rapport ≈ ' + ecrire(d.rapport, 2) + ').' });
  L.push({ id: 'abscisse', statut: 'info', titre: 'L’incertitude sur x est négligeable',
    texte: 'Seules les incertitudes sur y sont prises en compte. C’est raisonnable si les valeurs de x sont connues bien plus précisément que celles de y (fioles jaugées, dilutions soignées).' });
  L.push({ id: 'loi', statut: 'info', titre: 'Les écarts suivent une loi normale',
    texte: 'Les incertitudes u(a)' + (prop ? '' : ' et u(b)') + ' sont des écarts-types. Les lire comme « environ 68 % de confiance » suppose des écarts normaux ; avec ' + modele.n + ' points, cela reste approximatif.' });
  return L;
}

// ── Import de texte (collage depuis un tableur, fichier CSV/TXT, Phyphox, Tracker, Arduino…) ────────────────────────────────────
const NOMS_SEP = { '\t': 'tabulation', ';': 'point-virgule', ',': 'virgule', ' ': 'espace' };

// Sépare un nom de colonne et son unité : « t (s) », « t [s] », « t / s », « Time (s) »
export function separerNomUnite(entete) {
  let t = String(entete ?? '').trim().replace(/^["']|["']$/g, '').trim();
  let m = t.match(/^(.*?)\s*[([]\s*([^)\]]*?)\s*[)\]]\s*$/);
  if (m) return { nom: m[1].trim() || t, unite: m[2].trim() };
  m = t.match(/^([^\s/]+)\s*\/\s*([^\s/].*)$/);
  if (m) return { nom: m[1].trim(), unite: m[2].trim() };
  return { nom: t, unite: '' };
}

function decouper(ligne, sep) {
  const t = sep === ' ' ? ligne.trim().split(/\s+/) : ligne.split(sep);
  return t.map(c => c.trim().replace(/^"(.*)"$/, '$1'));
}
const toutNumerique = cellules => cellules.length > 0 && cellules.every(c => isFinite(lireNombre(c)));

export function analyserTexte(texte) {
  const brut = String(texte ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const lignes = brut.map(l => l.replace(/\s+$/, '')).filter(l => l.trim() && !l.trim().startsWith('#'));
  if (lignes.length === 0) return { ok: false, raison: 'Aucune donnée à lire.' };
  // Séparateur : on prend le premier qui donne un tableau régulier (≥ 2 colonnes) dont les lignes de données sont numériques
  let choix = null;
  for (const sep of ['\t', ';', ' ', ',']) {
    const morceaux = lignes.map(l => decouper(l, sep));
    const k = morceaux[0].length;
    if (k < 2 || morceaux.some(m => m.length !== k)) continue;
    const debutDonnees = toutNumerique(morceaux[0]) ? 0 : 1;
    const donnees = morceaux.slice(debutDonnees);
    if (donnees.length === 0) continue;
    if (!donnees.every(toutNumerique)) continue;
    if (sep === ',' && donnees.some(m => m.some(c => /,/.test(c)))) continue;
    choix = { sep, morceaux, k, debutDonnees };
    break;
  }
  if (!choix) {
    // Dernier recours : colonnes régulières mais certaines lignes non numériques (texte intercalé) → on garde les lignes numériques
    for (const sep of ['\t', ';', ' ', ',']) {
      const morceaux = lignes.map(l => decouper(l, sep));
      const k = morceaux[0].length;
      if (k < 2) continue;
      const num = morceaux.filter(m => m.length === k && toutNumerique(m));
      if (num.length >= 2) {
        choix = { sep, morceaux: [morceaux[0], ...num.filter(m => m !== morceaux[0])], k, debutDonnees: toutNumerique(morceaux[0]) ? 0 : 1 };
        break;
      }
    }
  }
  if (!choix) return { ok: false, raison: 'Je ne reconnais pas un tableau de nombres. Vérifiez que les colonnes sont séparées par une tabulation, un point-virgule ou un espace.' };
  const { sep, morceaux, k, debutDonnees } = choix;
  const entete = debutDonnees ? morceaux[0] : null;
  const colonnes = Array.from({ length: k }, (_, j) => entete ? separerNomUnite(entete[j]) : { nom: j === 0 ? 'x' : j === 1 ? 'y' : `c${j + 1}`, unite: '' });
  const donnees = morceaux.slice(debutDonnees);
  const cellulesTexte = donnees.flat();
  const virgule = cellulesTexte.some(c => /,/.test(c)), point = cellulesTexte.some(c => /\./.test(c));
  const decimale = sep === ',' ? 'point' : virgule ? 'virgule' : point ? 'point' : 'aucune';
  const avertissements = [];
  if (virgule && point) avertissements.push('Le texte contient des virgules et des points : vérifiez les nombres.');
  if (lignes.length - debutDonnees - donnees.length > 0) avertissements.push(`${lignes.length - debutDonnees - donnees.length} ligne(s) non numérique(s) ignorée(s).`);
  return { ok: true, colonnes, lignes: donnees.map(m => m.map(lireNombre)), brutes: donnees, separateur: sep, nomSeparateur: NOMS_SEP[sep],
    decimale, entete: !!entete, avertissements };
}

// Colonnes (chaînes saisies) → deux séries de nombres, en ignorant les lignes incomplètes
export function serieXY(lignes, ix = 0, iy = 1) {
  const x = [], y = [];
  for (const l of lignes) { const a = lireNombre(l[ix]), b = lireNombre(l[iy]); if (isFinite(a) && isFinite(b)) { x.push(a); y.push(b); } }
  return { x, y };
}

// ── Export CSV ─────────────────────────────────────────────────────────────────────────────────
// francais : « ; » et virgule décimale (s'ouvre directement dans un tableur français) ; sinon « , » et point
export function versCSV(colonnes, lignes, francais = true) {
  const sep = francais ? ';' : ',';
  const nb = v => { const x = lireNombre(v); if (!isFinite(x)) return ''; const s = String(x); return francais ? s.replace('.', ',') : s; };
  const ent = colonnes.map(c => c.unite ? `${c.nom} (${c.unite})` : c.nom).join(sep);
  return [ent, ...lignes.map(l => l.map(nb).join(sep))].join('\r\n') + '\r\n';
}
// Texte à coller dans un tableur (tabulations, virgule décimale)
export function versTexteTableur(colonnes, lignes) {
  const nb = v => { const x = lireNombre(v); return isFinite(x) ? String(x).replace('.', ',') : ''; };
  return [colonnes.map(c => c.unite ? `${c.nom} (${c.unite})` : c.nom).join('\t'), ...lignes.map(l => l.map(nb).join('\t'))].join('\n');
}

// ── Échelle d'un axe : bornes et graduations « rondes » ───────────────────────────────────────────
export function echelle(lo, hi, cible = 5, partirDeZero = true) {
  if (!isFinite(lo) || !isFinite(hi)) return { min: 0, max: 1, graduations: [0, 1], pas: 1 };
  if (partirDeZero && lo >= 0 && lo < 0.5 * hi) lo = 0;
  if (hi === lo) { hi = lo + 1; }
  const brut = (hi - lo) / cible;
  const p = 10 ** Math.floor(Math.log10(brut));
  const r = brut / p;
  const pas = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * p;
  const min = Math.floor(lo / pas + 1e-9) * pas, max = Math.ceil(hi / pas - 1e-9) * pas;
  const graduations = [];
  for (let v = min; v <= max + pas * 1e-6; v += pas) graduations.push(Number(v.toPrecision(12)));
  return { min, max, graduations, pas };
}
