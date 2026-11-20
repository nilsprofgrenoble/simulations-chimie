// ====================================================
//  Modèle de la simulation « Niveau sonore et dangers de l'exposition » (2GT, thème « Ondes et signaux », partie « Émission et perception d'un son »).
//  Modèle pur (sans React), testé par niveauSonore2gtModele.test.mjs.
//  Chaîne : amplitude de la vibration → intensité sonore → niveau d'intensité sonore L (en dB, lu sur un sonomètre).
//  PAS de formule du niveau sonore en 2GT : l'élève ne voit que des règles d'usage balisées « repères » :
//    +10 dB ≈ intensité × 10 ; +3 dB ≈ intensité × 2 ; deux sources identiques = intensité × 2 donc ≈ +3 dB.
//  Le logarithme n'est utilisé qu'ici, pour fabriquer les valeurs du « sonomètre fictif » de l'exploration (jamais affiché).
//  Hypothèses (affichées dans le panneau d'hypothèses) :
//    • l'échelle des dB est un repère : la perception réelle dépend de la fréquence du son et de la personne ;
//    • niveaux typiques = ordres de grandeur (à ± 10 dB selon les sources et les situations) ;
//    • durées d'exposition = repères indicatifs de prévention (INRS, OMS), pas des seuils médicaux garantis ;
//    • sonomètre fictif : sources identiques, placées au même endroit, en plein air (pas de mur ni de sol réfléchissant).
// ====================================================

const NB = ' ';
export const nbf = (x, d = 0) => Number(x).toFixed(d).replace('.', ',');

// ---------- niveaux typiques (ordres de grandeur, en dB) ----------
export const SONS = [
  { id: 'seuil', nom: 'Seuil d’audition', db: 0, court: 'seuil d’audition' },
  { id: 'chuchote', nom: 'Chuchotement', db: 30, court: 'chuchotement' },
  { id: 'biblio', nom: 'Bibliothèque calme', db: 40, court: 'bibliothèque' },
  { id: 'conv', nom: 'Conversation', db: 60, court: 'conversation' },
  { id: 'aspi', nom: 'Aspirateur', db: 70, court: 'aspirateur' },
  { id: 'rue', nom: 'Rue à fort trafic', db: 80, court: 'rue à fort trafic' },
  { id: 'tondeuse', nom: 'Tondeuse à moteur', db: 90, court: 'tondeuse' },
  { id: 'casque', nom: 'Casque à fort volume, concert', db: 100, court: 'casque fort, concert' },
  { id: 'douleur', nom: 'Seuil de douleur', db: 120, court: 'seuil de douleur' },
  { id: 'avion', nom: 'Avion au décollage', db: 130, court: 'avion au décollage' },
];
export const marqueursSons = (ids, cacher = []) => ids.map(id => { const s = SONS.find(x => x.id === id); return { db: s.db, nom: s.court, cache: cacher.includes(id) }; });
export const son = id => SONS.find(s => s.id === id);

// ---------- repères de durée d'exposition (niveau en dB → durée repère en minutes) ----------
// 85 dB : 8 h (valeur d'action supérieure de l'INRS, exposition sur 8 h) ; 100 dB : 15 min (OMS, « Écouter sans risque »).
// Entre les deux, chaque fois que le niveau monte de 3 dB, la durée repère est divisée par 2 (même quantité d'énergie sonore reçue).
export const DUREES = [[85, 480], [88, 240], [91, 120], [94, 60], [97, 30], [100, 15]];
export const SEUIL_RISQUE = 85;        // dB : au-delà, la durée d'exposition devient un facteur important
export const SEUIL_DANGER = 120;       // dB : seuil de douleur (ordre de grandeur)
export const dureeRepere = L => (L < SEUIL_RISQUE ? Infinity : 480 / 2 ** ((L - SEUIL_RISQUE) / 3));   // minutes
export function formatDuree(min) {
  if (!isFinite(min)) return 'sans limite';
  if (min >= 60) { const h = Math.floor(min / 60 + 1e-9), m = Math.round(min - h * 60); return m === 0 ? `${h}${NB}h` : `${h}${NB}h${NB}${m}`; }
  return min >= 10 || Number.isInteger(min) ? `${Math.round(min)}${NB}min` : `${nbf(min, 1)}${NB}min`;
}
// Verdict d'une exposition (niveau en dB, durée en minutes), d'après les repères.
//   'sous'       : niveau < 85 dB, sous le repère d'exposition prolongée (pas une garantie d'absence de risque) ;
//   'dans'       : niveau ≥ 85 dB et durée ≤ durée repère : dans la limite, à ne pas répéter sans pause ni protection ;
//   'au-dessus'  : niveau ≥ 85 dB et durée > durée repère : au-dessus des repères, risque pour l'audition ;
//   'hors'       : 100 dB < niveau < 120 dB : au-delà des repères cités (qui s'arrêtent à 100 dB) : à éviter, se protéger, sans durée « sûre » ;
//   'danger'     : niveau ≥ 120 dB : seuil de douleur, danger même pour une exposition très courte.
export const NIVEAU_MAX_REPERES = 100;
export function verdict(L, minutes) {
  if (L >= SEUIL_DANGER) return 'danger';
  if (L > NIVEAU_MAX_REPERES) return 'hors';
  if (L < SEUIL_RISQUE) return 'sous';
  return minutes <= dureeRepere(L) + 1e-9 ? 'dans' : 'au-dessus';
}
export const TEXTE_VERDICT = {
  sous: 'Sous le repère de 85 dB pour cette durée (cumulée sur la journée) : moins fort, c’est toujours mieux.',
  dans: 'Dans la limite des repères : à ne pas répéter sans pause, et mieux vaut baisser le volume ou se protéger.',
  'au-dessus': 'Au-dessus des repères : risque pour l’audition. Il faut baisser le niveau, raccourcir ou se protéger.',
  hors: 'les repères cités s’arrêtent à 100 dB ; à éviter, il faut se protéger ou s’éloigner.',
  danger: 'À partir de 120 dB, le son est douloureux : danger même très court. Il faut s’éloigner ou se protéger tout de suite.',
};

// ---------- règles d'usage (ordres de grandeur) ----------
export const facteurIntensite = deltaDb => 10 ** (deltaDb / 10);          // pour un écart multiple de 10 dB : +10 dB → × 10, +20 dB → × 100…
export const niveauApresDoublement = (L, k = 1) => L + 3 * k;              // k doublements de l'intensité (deux sources identiques : k = 1)

// ---------- sonomètre fictif (exploration) ----------
// Référence : amplitude a = 1 (unité arbitraire), 1 source, à r = 1 m → 50 dB.
//   intensité relative I/I_réf = n a² / r² ; L = 50 + 10 log₁₀(I/I_réf)   (jamais affiché sous cette forme à l'élève)
export const L_REF = 50;
export const intensiteRelative = (a, r, n) => (n * a * a) / (r * r);
export const niveauSonometre = (a, r, n) => L_REF + 10 * Math.log10(intensiteRelative(a, r, n));
export const DISTANCES = [1, 2, 4, 8, 16];                                 // m
export const NB_SOURCES = [1, 2, 4, 8];

// ---------- défis ----------
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const tire = (L, alea = Math.random) => L[Math.floor(alea() * L.length)];
const melange = (L, alea = Math.random) => { const t = [...L]; for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; };

// Défi « classer » : 4 sons de niveaux tous différents d'au moins 10 dB ; on demande l'ordre du plus faible au plus fort,
// puis combien de fois le son le plus fort est plus intense que le plus faible (écart multiple de 10 dB : facteur exact 10, 100, 1000…).
const POOL_CLASSER = ['chuchote', 'biblio', 'conv', 'aspi', 'rue', 'tondeuse', 'casque', 'avion'];
export function tirerDefiClasser(prec = null, alea = Math.random) {
  for (let essai = 0; essai < 50; essai++) {
    const ids = melange(POOL_CLASSER, alea).slice(0, 4), s = ids.map(son);
    const niveaux = s.map(x => x.db).sort((a, b) => a - b);
    if (niveaux[3] - niveaux[0] > 60) continue;                       // facteur d'intensité au plus 10⁶
    const cle = [...ids].sort().join(',');
    if (prec && prec.cle === cle && essai < 49) continue;
    const ordre = [...s].sort((a, b) => a.db - b.db).map(x => x.id);
    return { cle, sons: ids, ordre, facteur: facteurIntensite(niveaux[3] - niveaux[0]), ecart: niveaux[3] - niveaux[0] };
  }
  return null;
}

// Défi « exposition » : un niveau et une durée ; trois verdicts possibles. On évite les cas limites :
//   • 'sous' : niveau tiré parmi 60, 65, 70, 75 dB (durée quelconque) ;
//   • 'dans' : durée ≤ 60 % de la durée repère ; • 'au-dessus' : durée ≥ 2 fois la durée repère.
const NIVEAUX_SOUS = [60, 65, 70, 75], NIVEAUX_RISQUE = [85, 88, 91, 94, 97, 100];
const DUREES_POSSIBLES = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 600];
export function tirerDefiExposition(prec = null, alea = Math.random) {
  for (let essai = 0; essai < 100; essai++) {
    const cas = tire(['sous', 'dans', 'au-dessus'], alea);
    let L, t;
    if (cas === 'sous') { L = tire(NIVEAUX_SOUS, alea); t = tire([60, 120, 240, 480], alea); }
    else {
      L = tire(NIVEAUX_RISQUE, alea); const D = dureeRepere(L);
      const ok = DUREES_POSSIBLES.filter(x => (cas === 'dans' ? x <= 0.6 * D : x >= 2 * D));
      if (!ok.length) continue;
      t = tire(ok, alea);
    }
    if (prec && prec.L === L && prec.t === t) continue;
    return { L, t, cas, D: dureeRepere(L), contexte: tire(['concert', 'casque', 'atelier', 'salle'], alea) };
  }
  return null;
}
export { mulberry, tire, melange };
