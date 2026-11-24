// Modèle de la simulation 164 « Lumière : domaines spectraux et énergie d'un photon » (1G spé PC, Ondes et signaux).
// Fichier sans React : testé par photonModele.test.mjs.
// HYPOTHÈSES DU MODÈLE (reprises dans le panneau d'hypothèses de la simulation) :
//  • propagation dans le VIDE, célérité c = 3,00×10⁸ m·s⁻¹ (dans l'air, c est la même à 0,03 % près) ;
//  • les bornes des domaines sont des REPÈRES CONVENTIONNELS : elles varient d'une source à l'autre, et un domaine ne s'arrête pas net ;
//  • la frontière entre rayons X et rayons gamma dépend surtout de l'ORIGINE du rayonnement (électronique pour les X, nucléaire pour les gamma) : les domaines peuvent se recouvrir ;
//  • le photon est un MODÈLE (un « grain » d'énergie), pas une petite bille ; on traite l'énergie d'UN photon, de fréquence ν unique ;
//  • constantes données au programme : h = 6,63×10⁻³⁴ J·s ; 1 eV = 1,60×10⁻¹⁹ J.

export const C = 3.00e8;          // m·s⁻¹
export const H = 6.63e-34;        // J·s
export const EV = 1.60e-19;       // J

// ───────────── Relations ─────────────
export const nuDeLambda = lam => C / lam;                 // Hz
export const lambdaDeNu = nu => C / nu;                   // m
export const energieDeNu = nu => H * nu;                  // J
export const energieDeLambda = lam => H * C / lam;        // J
export const jVersEv = e => e / EV;
export const lambdaDeEv = eEv => H * C / (eEv * EV);      // m
export const photonsParSeconde = (puissance, lam) => puissance / energieDeLambda(lam);   // s⁻¹ (au-delà du programme)

// ───────────── Domaines (repères conventionnels), du plus long au plus court ─────────────
// lmin ≤ λ < lmax ; couleur : teinte du schéma (l'information passe aussi par le NOM du domaine).
export const DOMAINES = [
  { id: 'radio', nom: 'ondes radio', court: 'radio', lmin: 0.30, lmax: Infinity, couleur: '#64748b', exemple: 'radio FM, télévision', borne: 'λ > 30 cm' },
  { id: 'micro', nom: 'micro-ondes', court: 'micro-ondes', lmin: 1e-3, lmax: 0.30, couleur: '#b45309', exemple: 'wifi, four à micro-ondes', borne: '1 mm à 30 cm' },
  { id: 'ir', nom: 'infrarouge', court: 'infrarouge', lmin: 780e-9, lmax: 1e-3, couleur: '#be123c', exemple: 'télécommande, caméra thermique', borne: '780 nm à 1 mm' },
  { id: 'vis', nom: 'lumière visible', court: 'visible', lmin: 400e-9, lmax: 780e-9, couleur: '#16a34a', exemple: 'lampe, écran, laser', borne: '400 à 780 nm' },
  { id: 'uv', nom: 'ultraviolet', court: 'ultraviolet', lmin: 10e-9, lmax: 400e-9, couleur: '#6d28d9', exemple: 'lampe à bronzer, stérilisation', borne: '10 à 400 nm' },
  { id: 'x', nom: 'rayons X', court: 'rayons X', lmin: 10e-12, lmax: 10e-9, couleur: '#0f766e', exemple: 'radiographie', borne: '10 pm à 10 nm' },
  { id: 'gamma', nom: 'rayons gamma', court: 'gamma', lmin: 0, lmax: 10e-12, couleur: '#1e293b', exemple: 'radiothérapie, imagerie médicale', borne: 'λ < 10 pm' },
];
export const domaine = id => DOMAINES.find(d => d.id === id);
export const domaineDeLambda = lam => DOMAINES.find(d => lam >= d.lmin && lam < d.lmax) || DOMAINES[0];

// Couleur approximative d'une radiation visible (repères indicatifs, en nm)
export function couleurVisible(lamNm) {
  if (lamNm < 400 || lamNm >= 780) return null;
  if (lamNm < 450) return 'violet';
  if (lamNm < 495) return 'bleu';
  if (lamNm < 570) return 'vert';
  if (lamNm < 590) return 'jaune';
  if (lamNm < 620) return 'orange';
  return 'rouge';
}

// ───────────── Échelle logarithmique du schéma ─────────────
export const LOG_MIN = -13, LOG_MAX = 3;           // log10 de λ en mètres : 0,1 pm à 1 km
export const clampLog = x => Math.min(LOG_MAX, Math.max(LOG_MIN, x));

// ───────────── Applications (ordres de grandeur) ─────────────
export const APPLICATIONS = [
  { id: 'fm', nom: 'Radio FM', nu: 1.00e8, texte: 'émetteur radio FM (≈ 100 MHz)' },
  { id: 'wifi', nom: 'Wifi', nu: 2.4e9, texte: 'wifi (2,4 GHz)' },
  { id: 'four', nom: 'Four à micro-ondes', nu: 2.45e9, texte: 'four à micro-ondes (2,45 GHz)' },
  { id: 'tele', nom: 'Télécommande infrarouge', lam: 940e-9, texte: 'télécommande (≈ 940 nm)' },
  { id: 'laser', nom: 'Pointeur laser vert', lam: 532e-9, texte: 'pointeur laser vert (532 nm)' },
  { id: 'bronz', nom: 'Lampe à bronzer (UV-A)', lam: 350e-9, texte: 'lampe à bronzer (UV-A, ≈ 350 nm)' },
  { id: 'xray', nom: 'Radiographie (rayons X)', lam: 0.10e-9, texte: 'radiographie (≈ 0,1 nm)' },
  { id: 'gamma', nom: 'Radiothérapie (rayons γ)', lam: 1.0e-12, texte: 'radiothérapie (≈ 1 pm)' },
].map(a => {
  const lam = a.lam ?? lambdaDeNu(a.nu), nu = a.nu ?? nuDeLambda(a.lam);
  return { ...a, lam, nu };
});

// ───────────── Mise en forme (notation française) ─────────────
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');
const NBSP = ' ';
// Nombre décimal à cs chiffres significatifs, virgule française
export function dec(x, cs = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(cs)), e = Math.floor(Math.log10(Math.abs(r)));
  const d = Math.max(0, cs - 1 - e);
  return r.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
}
// Notation scientifique « 5,32 × 10⁻⁷ » (mantisse à cs chiffres significatifs)
export function sci(x, cs = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  let e = Math.floor(Math.log10(Math.abs(x))), m = Number((x / 10 ** e).toPrecision(cs));
  if (m >= 10) { m /= 10; e += 1; }
  return `${m.toFixed(cs - 1).replace('.', ',')}${NBSP}×${NBSP}10${sup(e)}`;
}
const PREFIXES_LONG = [[1e3, 'km'], [1, 'm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm']];
// Longueur d'onde avec le préfixe qui donne un nombre entre 1 et 1 000 (3 chiffres significatifs)
export function lambdaTexte(lam, cs = 3) {
  const [k, u] = PREFIXES_LONG.find(([k]) => lam >= k * 0.9995) || PREFIXES_LONG[PREFIXES_LONG.length - 1];
  return `${dec(lam / k, cs)}${NBSP}${u}`;
}
const PREFIXES_HZ = [[1e21, 'ZHz'], [1e18, 'EHz'], [1e15, 'PHz'], [1e12, 'THz'], [1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz'], [1, 'Hz']];
export function nuTexte(nu, cs = 3) {
  const [k, u] = PREFIXES_HZ.find(([k]) => nu >= k * 0.9995) || PREFIXES_HZ[PREFIXES_HZ.length - 1];
  return `${dec(nu / k, cs)}${NBSP}${u}`;
}
const PREFIXES_EV = [[1e6, 'MeV'], [1e3, 'keV'], [1, 'eV'], [1e-3, 'meV'], [1e-6, 'µeV'], [1e-9, 'neV']];
export function evTexte(eEv, cs = 3) {
  const [k, u] = PREFIXES_EV.find(([k]) => eEv >= k * 0.9995) || PREFIXES_EV[PREFIXES_EV.length - 1];
  return `${dec(eEv / k, cs)}${NBSP}${u}`;
}

// ───────────── Tirages des défis (fonctions pures : rng() renvoie un nombre dans [0 ; 1[, testées sur des milliers de graines) ─────────────
const pioche = (rng, t) => t[Math.min(t.length - 1, Math.floor(rng() * t.length))];
// Défi 1 : identifier le domaine. Valeurs rondes, écartées d'au moins 10 % de toute borne (aucune ambiguïté de convention).
export const ITEMS_DOMAINE = [
  ['radio', 'ν = 1,0 MHz', 'nu', 1.0e6], ['radio', 'ν = 10 MHz', 'nu', 1.0e7], ['radio', 'ν = 100 MHz', 'nu', 1.0e8], ['radio', 'λ = 2,0 m', 'lam', 2.0], ['radio', 'λ = 50 m', 'lam', 50], ['radio', 'λ = 1,5 km', 'lam', 1500],
  ['micro', 'ν = 2,4 GHz', 'nu', 2.4e9], ['micro', 'ν = 5,0 GHz', 'nu', 5.0e9], ['micro', 'ν = 30 GHz', 'nu', 3.0e10], ['micro', 'ν = 100 GHz', 'nu', 1.0e11], ['micro', 'λ = 5,0 cm', 'lam', 0.05], ['micro', 'λ = 12 cm', 'lam', 0.12],
  ['ir', 'λ = 10 µm', 'lam', 10e-6], ['ir', 'λ = 2,0 µm', 'lam', 2.0e-6], ['ir', 'λ = 1 550 nm', 'lam', 1550e-9], ['ir', 'λ = 100 µm', 'lam', 100e-6], ['ir', 'ν = 1,0×10¹³ Hz', 'nu', 1.0e13], ['ir', 'ν = 3,0×10¹² Hz', 'nu', 3.0e12],
  ['vis', 'λ = 450 nm', 'lam', 450e-9], ['vis', 'λ = 532 nm', 'lam', 532e-9], ['vis', 'λ = 600 nm', 'lam', 600e-9], ['vis', 'λ = 650 nm', 'lam', 650e-9], ['vis', 'ν = 5,0×10¹⁴ Hz', 'nu', 5.0e14], ['vis', 'ν = 6,0×10¹⁴ Hz', 'nu', 6.0e14],
  ['uv', 'λ = 100 nm', 'lam', 100e-9], ['uv', 'λ = 250 nm', 'lam', 250e-9], ['uv', 'λ = 350 nm', 'lam', 350e-9], ['uv', 'ν = 2,0×10¹⁵ Hz', 'nu', 2.0e15], ['uv', 'ν = 1,0×10¹⁶ Hz', 'nu', 1.0e16],
  ['x', 'λ = 0,10 nm', 'lam', 0.10e-9], ['x', 'λ = 1,0 nm', 'lam', 1.0e-9], ['x', 'λ = 0,50 nm', 'lam', 0.50e-9], ['x', 'ν = 3,0×10¹⁷ Hz', 'nu', 3.0e17], ['x', 'ν = 3,0×10¹⁸ Hz', 'nu', 3.0e18],
  ['gamma', 'λ = 1,0 pm', 'lam', 1.0e-12], ['gamma', 'λ = 0,10 pm', 'lam', 0.10e-12], ['gamma', 'ν = 3,0×10²⁰ Hz', 'nu', 3.0e20], ['gamma', 'ν = 3,0×10²¹ Hz', 'nu', 3.0e21], ['gamma', 'λ = 2,0 pm', 'lam', 2.0e-12],
].map(([dom, txt, grandeur, val]) => ({ dom, txt, grandeur, val, lam: grandeur === 'lam' ? val : lambdaDeNu(val) }));
export function tirerDomaine(rng, exclu) {
  for (let k = 0; k < 40; k++) { const it = pioche(rng, ITEMS_DOMAINE); if (!exclu || it.txt !== exclu) return it; }
  return ITEMS_DOMAINE[0];
}
// Défi 2 : énergie en eV d'un photon de longueur d'onde donnée (nm, 3 chiffres significatifs). La valeur attendue est calculée avec la donnée AFFICHÉE.
export const LAMBDA_ENERGIE_NM = [254, 365, 450, 532, 590, 633, 650, 850, 980, 1310, 1550];
export function tirerEnergie(rng, exclu) {
  let nm = pioche(rng, LAMBDA_ENERGIE_NM); if (nm === exclu) nm = pioche(rng, LAMBDA_ENERGIE_NM.filter(x => x !== exclu));
  const lam = nm * 1e-9, ej = energieDeLambda(lam);
  return { nm, lam, ej, vrai: jVersEv(ej) };
}
// Défi 3 (au-delà du programme) : photons émis par seconde par un pointeur laser de puissance P (mW) et de longueur d'onde λ (nm)
export const LASERS_NM = [450, 532, 633, 650], PUISSANCES_MW = [1.0, 2.0, 5.0];
export function tirerPhotons(rng, exclu) {
  let nm = pioche(rng, LASERS_NM), mw = pioche(rng, PUISSANCES_MW);
  if (exclu && exclu.nm === nm && exclu.mw === mw) { nm = pioche(rng, LASERS_NM.filter(x => x !== exclu.nm)); }
  const lam = nm * 1e-9, ej = energieDeLambda(lam);
  return { nm, mw, lam, ej, vrai: photonsParSeconde(mw * 1e-3, lam) };
}
