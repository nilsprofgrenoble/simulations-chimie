// ═════════════════════════════════════════════════════════════════
//  LECTURE SONORE DES PARCOURS GUIDÉS : couche pure (aucune dépendance au navigateur, testable avec node).
//  Voix = voix LOCALE du navigateur (Web Speech API) : rien ne quitte l'appareil, aucune requête réseau, fonctionne hors ligne.
//  • prononcer(texte)       : transforme le texte AFFICHÉ en texte à PRONONCER (le texte affiché n'est jamais modifié)
//  • decouperPhrases(texte) : phrases courtes (voix d'iOS qui coupe sur les textes longs) avec leur position dans le texte affiché
//  • choisirVoix(voix)      : meilleure voix française LOCALE (jamais une voix « en ligne » : elle enverrait le texte à un tiers)
//  • creerLecteur(...)      : file d'attente phrase par phrase (pause, reprise, arrêt, vitesse)
//  • lectureActivee(simId)  : la lecture n'est proposée que sur les simulations des niveaux de NIVEAUX_LECTURE
// ═════════════════════════════════════════════════════════════════

export const NIVEAUX_LECTURE = ['TSTL', 'BTS'];
// Phase de test : liste des simulations où la lecture est proposée. Mettre null pour l'ouvrir à tous les parcours des niveaux ci-dessus.
export const SIMS_TEST_LECTURE = [141];
export const niveauxSim = {};      // id → niveau, rempli par App (comme nomsSim dans suivi.js)

export function lectureActivee(simId, niveaux = niveauxSim, test = SIMS_TEST_LECTURE) {
  if (!Number.isFinite(simId)) return false;
  if (!NIVEAUX_LECTURE.includes(String(niveaux[simId] || '').trim())) return false;
  return test == null || test.includes(simId);
}

export const VITESSES = { lent: 0.85, normal: 1.05, rapide: 1.2 };

// ─────────────────────────────────────────────────────────────────
//  Prononciation
// ─────────────────────────────────────────────────────────────────
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const sup = s => s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => SUP[c]);
const sub = s => s.replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 0x2080));
const motsExposant = (signe, chiffres) => `${signe === '⁻' ? 'moins ' : ''}${sup(chiffres)}`;

// Unités : [singulier, pluriel]
const UNITES = {
  mol: ['mole', 'moles'], mmol: ['millimole', 'millimoles'], µmol: ['micromole', 'micromoles'], kmol: ['kilomole', 'kilomoles'],
  L: ['litre', 'litres'], mL: ['millilitre', 'millilitres'], dL: ['décilitre', 'décilitres'], cL: ['centilitre', 'centilitres'], µL: ['microlitre', 'microlitres'],
  g: ['gramme', 'grammes'], mg: ['milligramme', 'milligrammes'], kg: ['kilogramme', 'kilogrammes'], µg: ['microgramme', 'microgrammes'],
  J: ['joule', 'joules'], kJ: ['kilojoule', 'kilojoules'], W: ['watt', 'watts'], kW: ['kilowatt', 'kilowatts'],
  V: ['volt', 'volts'], mV: ['millivolt', 'millivolts'], mA: ['milliampère', 'milliampères'],
  Hz: ['hertz', 'hertz'], kHz: ['kilohertz', 'kilohertz'], MHz: ['mégahertz', 'mégahertz'],
  Pa: ['pascal', 'pascals'], hPa: ['hectopascal', 'hectopascals'], kPa: ['kilopascal', 'kilopascals'], MPa: ['mégapascal', 'mégapascals'],
  m: ['mètre', 'mètres'], cm: ['centimètre', 'centimètres'], mm: ['millimètre', 'millimètres'], nm: ['nanomètre', 'nanomètres'], µm: ['micromètre', 'micromètres'], km: ['kilomètre', 'kilomètres'],
  s: ['seconde', 'secondes'], ms: ['milliseconde', 'millisecondes'], min: ['minute', 'minutes'], h: ['heure', 'heures'],
  K: ['kelvin', 'kelvins'], '°C': ['degré Celsius', 'degrés Celsius'],
};
const NOMS_UNITES = Object.keys(UNITES).sort((a, b) => b.length - a.length);
const ATOME = `(?:${NOMS_UNITES.join('|')})`;
const EXPO = '(?:[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)';
const SANS_LETTRE_AVANT = '(?<![\\p{L}\\d_])';
const SANS_LETTRE_APRES = '(?![\\p{L}₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻_])';

// Unité composée (mol·L⁻¹, g/mol, J·g⁻¹·°C⁻¹, m/s) ou unité seule avec exposant (s⁻¹, m²)
const RE_COMPOSEE = new RegExp(`${SANS_LETTRE_AVANT}${ATOME}${EXPO}?(?:[·/]${ATOME}${EXPO}?)+${SANS_LETTRE_APRES}`, 'gu');
const RE_SEULE_EXPO = new RegExp(`${SANS_LETTRE_AVANT}${ATOME}${EXPO}${SANS_LETTRE_APRES}`, 'gu');
// Unité après un nombre (5,0 mmol ; 100 mL ; 25 °C ; 10⁻³ mol)
const RE_APRES_NOMBRE = new RegExp(`(\\d+(?:[.,]\\d+)?)(${EXPO}?)(\\s*)(${ATOME})${SANS_LETTRE_APRES}`, 'gu');

function lireUnite(jeton) {
  const m = new RegExp(`^(${ATOME})(${EXPO})?$`, 'u').exec(jeton);
  if (!m) return null;
  const [, nom, e] = m;
  const mot = UNITES[nom][0];
  if (!e) return { mot, dessous: false };
  const signe = e[0] === '⁻' ? '⁻' : '';
  const n = sup(e.replace(/[⁻⁺]/, ''));
  if (signe) return { mot: n === '1' ? mot : `${mot} ${n === '2' ? 'carré' : n === '3' ? 'cube' : n}`, dessous: true };
  return { mot: n === '1' ? mot : n === '2' ? `${mot} carré` : n === '3' ? `${mot} cube` : `${mot} puissance ${n}`, dessous: false };
}

function unitesComposees(expr) {
  const morceaux = expr.split(/([·/])/);
  const dessus = [], dessous = [];
  let apresBarre = false;
  for (let k = 0; k < morceaux.length; k += 2) {
    const u = lireUnite(morceaux[k]);
    if (!u) return expr;
    if (k > 0 && morceaux[k - 1] === '/') apresBarre = true;
    (u.dessous || apresBarre ? dessous : dessus).push(u.mot);
  }
  const haut = dessus.length ? dessus.join(' ') : 'un';
  return dessous.length ? `${haut} par ${dessous.join(' et par ')}` : haut;
}

// Éléments chimiques usuels (pour ne lire comme une formule que ce qui en est une)
const ELEMENTS = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'As', 'Se', 'Br', 'Rb', 'Sr', 'Ag', 'Cd', 'Sn', 'I', 'Ba', 'Pt', 'Au', 'Hg', 'Pb']
  .sort((a, b) => b.length - a.length);
const EL = `(?:${ELEMENTS.join('|')})`;
const MOTIF_FORMULE = new RegExp(`^(?:(?:${EL}|\\((?:${EL}(?:[₀-₉]+|\\d+)?)+\\))(?:[₀-₉]+|\\d+)?)+([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])?$`);
const FORMULES_SANS_CHIFFRE = new Set(['HCl', 'NaOH', 'NaCl', 'KOH', 'KCl', 'HF', 'HBr', 'HI', 'AgCl', 'CaCl']);
const FORMULES_UN_ELEMENT = /^(?:H|O|N|Cl|F|Br|I)(?:2|₂)$/;
const RE_CANDIDAT_FORMULE = /(?<![\p{L}\d_])[A-Z][A-Za-z0-9()₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]*/gu;

function lireFormule(jeton) {
  const m = MOTIF_FORMULE.exec(jeton);
  if (!m) return null;
  const charge = m[1] || '';
  const corps = charge ? jeton.slice(0, jeton.length - charge.length) : jeton;
  const nbElements = (corps.match(/[A-Z]/g) || []).length;
  const ok = charge || /[₀-₉]/.test(corps) || (/\d/.test(corps) && (nbElements >= 2 || FORMULES_UN_ELEMENT.test(corps))) || FORMULES_SANS_CHIFFRE.has(corps);
  if (!ok) return null;
  // chaque symbole d'élément est épelé (« C₂H₅COOH » → « C 2 H 5 C O O H »), les indices deviennent des nombres
  let sortie = sub(corps).replace(/([A-Z][a-z]?)/g, ' $1 ').replace(/\(/g, ' ').replace(/\)/g, ' ').replace(/([A-Za-z])/g, ' $1 ');
  sortie = sortie.replace(/\s+/g, ' ').trim();
  if (charge) {
    const signe = charge.endsWith('⁺') ? 'plus' : 'moins';
    const n = sup(charge.slice(0, -1));
    sortie += ` ${n ? `${n} ` : ''}${signe}`;
  }
  return sortie;
}

export const REMPLACEMENT_FORMULE = " formule affichée à l'écran ";

export function prononcer(texteAffiche) {
  let t = String(texteAffiche ?? '');
  t = t.replace(/[\u00a0\u202f]/g, ' ').replace(/μ/g, 'µ').replace(/[’‘]/g, "'").replace(/[«»“”]/g, '');
  t = t.replace(/\uE000/g, REMPLACEMENT_FORMULE);

  // 1. Unités composées, puis unités après un nombre
  t = t.replace(RE_COMPOSEE, m => unitesComposees(m));
  t = t.replace(RE_SEULE_EXPO, m => unitesComposees(m));
  t = t.replace(RE_APRES_NOMBRE, (_, nombre, expo, esp, unite) => {
    const x = parseFloat(nombre.replace(',', '.'));
    const pluriel = !expo && Number.isFinite(x) && x >= 2;
    return `${nombre}${expo}${esp || ' '}${UNITES[unite][pluriel ? 1 : 0]}`;
  });
  t = t.replace(/°C/g, ' degrés Celsius ').replace(/\s*%/g, ' pour cent');

  // 2. Formules chimiques (avant les exposants : « SO₄²⁻ » contient un exposant qui est une charge)
  t = t.replace(RE_CANDIDAT_FORMULE, m => {
    let corps = m, queue = '';
    // la parenthèse fermante qui suit la formule (« n(C₂H₅COOH) ») ne lui appartient pas
    while (corps.endsWith(')') && (corps.match(/\(/g) || []).length < (corps.match(/\)/g) || []).length) { queue = ')' + queue; corps = corps.slice(0, -1); }
    const f = lireFormule(corps);
    return f == null ? m : f + queue;
  });

  // 3. Puissances de dix et exposants restants
  t = t.replace(/(\d)\s*[×x]\s*10([⁻⁺]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, a, s, e) => `${a} fois dix puissance ${motsExposant(s, e)}`);
  t = t.replace(/10([⁻⁺]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, s, e) => `dix puissance ${motsExposant(s, e)}`);
  t = t.replace(/([⁻⁺]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, s, e) => {
    if (!s && e === '²') return ' au carré ';
    if (!s && e === '³') return ' au cube ';
    return ` puissance ${motsExposant(s, e)} `;
  });
  t = t.replace(/⁺/g, ' plus ').replace(/⁻/g, ' moins ');
  t = t.replace(/[₀-₉]+/g, m => ` ${sub(m)} `);

  // 4. Sigles et symboles
  t = t.replace(/(?<![\p{L}\d])([pP]?)K([abse])(?![\p{L}\d])/gu, (_, p, l) => `${p ? 'p ' : ''}K ${l}`);
  t = t.replace(/(?<![\p{L}\d])pH(?![\p{L}\d])/g, 'p H');
  t = t.replace(/⟶|→|⟹/g, ' donne ').replace(/⇌|⇄|↔/g, ' en équilibre avec ');
  t = t.replace(/≈/g, ' environ ').replace(/≥/g, ' supérieur ou égal à ').replace(/≤/g, ' inférieur ou égal à ').replace(/≠/g, ' différent de ');
  t = t.replace(/Δ/g, 'delta ').replace(/×/g, ' fois ').replace(/·/g, ' ');
  t = t.replace(/\s=\s/g, ' égale ').replace(/\s\+\s/g, ' plus ').replace(/\s−\s/g, ' moins ').replace(/\s<\s/g, ' inférieur à ').replace(/\s>\s/g, ' supérieur à ');
  t = t.replace(/(^|[\s(=])[−-](?=\d)/g, '$1moins ');
  t = t.replace(/−/g, ' moins ');

  // 5. Parenthèses → courtes pauses ; nettoyage
  t = t.replace(/\s*\(\s*/g, ', ').replace(/\s*\)\s*/g, ', ');
  t = t.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/(,\s*){2,}/g, ', ').replace(/,\s*([.;:!?])/g, '$1').replace(/^[,\s]+/, '').trim();
  return t;
}

// ─────────────────────────────────────────────────────────────────
//  Découpage en phrases courtes (positions dans le texte affiché, pour la surbrillance)
// ─────────────────────────────────────────────────────────────────
export function decouperPhrases(texte, max = 200) {
  const sortie = [];
  const pousser = (d, f) => {
    let a = d, b = f;
    while (a < b && /\s/.test(texte[a])) a++;
    while (b > a && /\s/.test(texte[b - 1])) b--;
    if (b <= a) return;
    const seg = texte.slice(a, b);
    if (!/[\p{L}\d\uE000]/u.test(seg)) return;
    if (seg.length <= max) { sortie.push({ debut: a, fin: b, texte: seg }); return; }
    let coupe = -1;
    for (const sep of [/[;:]\s/g, /,\s/g, /\s/g]) {
      let meilleur = -1, k;
      while ((k = sep.exec(seg)) && k.index + (k[0].length > 1 ? 1 : 0) <= max) meilleur = k.index + (k[0].length > 1 ? 1 : 0);
      if (meilleur >= 20) { coupe = meilleur; break; }
    }
    if (coupe < 0) coupe = max;
    pousser(a, a + coupe);
    pousser(a + coupe, b);
  };
  const re = /[.!?…]+(?=\s|$)/g;
  let debut = 0, m;
  while ((m = re.exec(texte))) { pousser(debut, m.index + m[0].length); debut = m.index + m[0].length; }
  pousser(debut, texte.length);
  return sortie;
}

// ─────────────────────────────────────────────────────────────────
//  Choix de la voix : française et LOCALE uniquement (les voix « en ligne » envoient le texte à un tiers et ne marchent pas hors ligne)
// ─────────────────────────────────────────────────────────────────
const PREFEREES = ['Amélie', 'Thomas', 'Audrey', 'Aurélie', 'Hortense', 'Julie', 'Paul', 'Marie'];
export function choisirVoix(voix) {
  const liste = Array.from(voix || []).filter(v => v && v.localService && /^fr/i.test(String(v.lang || '').replace('_', '-')));
  if (!liste.length) return null;
  const rangPrefere = v => PREFEREES.findIndex(n => (v.name || '').includes(n));       // -1 si absente ; plus petit = préféré
  const note = v => (/^fr-FR$/i.test(String(v.lang).replace('_', '-')) ? 4 : 0)
    + (rangPrefere(v) >= 0 ? 2 + (PREFEREES.length - rangPrefere(v)) / 10 : 0)
    + (/enhanced|premium|améliorée/i.test(v.name || '') ? 1 : 0);
  return liste.slice().sort((a, b) => note(b) - note(a))[0];
}

// ─────────────────────────────────────────────────────────────────
//  File d'attente de lecture. synth = window.speechSynthesis, Utterance = SpeechSynthesisUtterance (injectables pour les tests).
//  cancel() déclenche aussi « end » sur les anciennes phrases : le jeton les neutralise (sinon la lecture repartirait toute seule).
//  La pause est un arrêt avec mémoire de la phrase en cours (synth.pause() est peu fiable, notamment sur Android).
// ─────────────────────────────────────────────────────────────────
export function creerLecteur({ synth, Utterance, voix = null, lang = 'fr-FR', vitesse = VITESSES.normal, phrases, onPhrase = () => {}, onFin = () => {}, onErreur = () => {}, attendre = fn => setTimeout(fn, 40) }) {
  let i = 0, jeton = 0, etat = 'arret';
  const dire = () => {
    if (etat !== 'lecture') return;
    if (i >= phrases.length) { etat = 'arret'; onPhrase(-1); onFin(); return; }
    const mien = ++jeton;
    const u = new Utterance(phrases[i].parle);
    u.lang = lang;
    if (voix) u.voice = voix;
    u.rate = vitesse;
    u.onend = () => { if (mien !== jeton || etat !== 'lecture') return; i++; dire(); };
    u.onerror = e => {
      if (mien !== jeton) return;
      if (e && (e.error === 'canceled' || e.error === 'interrupted')) return;
      etat = 'arret'; onPhrase(-1); onErreur(e);
    };
    onPhrase(i);
    synth.speak(u);
  };
  const relancer = () => { jeton++; synth.cancel(); attendre(dire); };
  return {
    demarrer(depuis = 0) { i = depuis; etat = 'lecture'; relancer(); },
    pause() { if (etat !== 'lecture') return; etat = 'pause'; jeton++; synth.cancel(); },
    reprendre() { if (etat !== 'pause') return; etat = 'lecture'; relancer(); },
    arreter() { if (etat === 'arret') return; etat = 'arret'; jeton++; synth.cancel(); onPhrase(-1); },
    regler(v) { vitesse = v; if (etat === 'lecture') relancer(); },
    etat: () => etat,
    phrase: () => i,
  };
}
