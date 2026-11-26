// Modèle du jeu « Pompiers : de la lance à la pression » (transport des fluides, TSTL).
// Scénario : un camion-pompe refoule l'eau (pression P_pompe fixée) dans des tuyaux de diamètre DN et de longueur choisis ; au bout, la lance
// doit travailler dans une plage de pression, avoir assez de débit pour absorber la puissance du feu et être assez près pour que le jet atteigne le foyer.
//
// Hypothèses (rappelées dans le jeu) — mêmes lois que la simulation « Circuits hydrauliques » du site :
//  • eau (ρ = 1000 kg·m⁻³, μ = 1,0 × 10⁻³ Pa·s), incompressible, écoulement permanent ;
//  • pertes linéiques ΔP = λ·(L/D)·½ρv² avec λ = 64/Re (laminaire) ou 0,316·Re⁻⁰·²⁵ (Blasius, turbulent) ; coudes K = 0,9 ;
//  • théorème de Bernoulli entre la sortie de pompe et l'entrée de la lance : P_pompe = P_lance + ρ·g·z + ΔP_charge (même diamètre : même vitesse) ;
//  • lance à section réglable : Bernoulli entre l'entrée de la lance et la sortie (pression atmosphérique) : ½ρv_j² = P_lance + ½ρv² ;
//  • jet : seule la fraction FACTEUR_AIR de l'énergie cinétique du jet sert à atteindre le foyer (frottement de l'air, dispersion en gouttes) ;
//    à l'angle optimal, le foyer à (dx ; Δh) est atteint si FACTEUR_AIR·v_j² ≥ g·(Δh + √(dx² + Δh²)) ;
//  • feu : l'eau absorbe Q·(c·Δθ + L_v) ; seule la fraction ABSORPTION de cette énergie refroidit réellement le foyer (le reste ruisselle ou s'évapore ailleurs).

export const RHO = 1000, G = 9.81, MU = 1.0e-3;
export const K_COUDE = 0.9;
export const LONG_TUYAU = 20;                    // m : longueur d'un tuyau d'incendie
export const DIAMETRES = [45, 70, 110];          // mm : DN 45, DN 70, DN 110
export const N_MAX = 8;                          // nombre maximal de tuyaux mis bout à bout
export const DEBIT_MIN = 100, DEBIT_MAX = 1000, DEBIT_PAS = 50;   // L/min
export const FACTEUR_AIR = 0.25;
export const CHALEUR_MASSIQUE = 4180, ECART_T = 80, CHALEUR_LATENTE = 2.26e6;   // J·kg⁻¹·K⁻¹, K (20 → 100 °C), J·kg⁻¹
export const ABSORPTION = 0.25;
export const DIST_SECU = 8;                      // m : distance minimale lance-foyer (rayonnement)
export const BAR = 1e5;

// Énergie réellement utile par litre d'eau (J·L⁻¹) et débit minimal pour un feu de puissance P (MW)
export const energieUtileParLitre = () => ABSORPTION * RHO * 1e-3 * (CHALEUR_MASSIQUE * ECART_T + CHALEUR_LATENTE);
export const debitMini = puissanceMW => Math.ceil((puissanceMW * 1e6 / energieUtileParLitre()) * 60);   // L/min (arrondi au supérieur)

// Partie hydraulique : tuyau de diamètre dMm, nTuyaux tuyaux de 20 m, débit qLmin, `coudes` coudes à 90°, lance à zLance m au-dessus du camion
export function hydraulique({ dMm, nTuyaux, qLmin, pPompeBar, coudes = 0, zLance = 0 }) {
  const Q = qLmin / 1000 / 60;                       // m³/s
  const D = dMm / 1000, S = Math.PI * D * D / 4, v = Q / S;
  const Re = RHO * v * D / MU;
  const lambda = Re <= 0 ? 0 : (Re < 2000 ? 64 / Re : 0.316 * Math.pow(Re, -0.25));
  const regime = Re < 2000 ? 'laminaire' : (Re < 4000 ? 'transitoire' : 'turbulent');
  const qdyn = 0.5 * RHO * v * v;                    // Pa
  const L = nTuyaux * LONG_TUYAU;
  const dpLin = lambda * (L / D) * qdyn;
  const dpSing = coudes * K_COUDE * qdyn;
  const dpGrav = RHO * G * zLance;
  const dpCharge = dpLin + dpSing;
  const pPompe = pPompeBar * BAR;
  const pLance = pPompe - dpGrav - dpCharge;         // Pa (pression relative à l'entrée de la lance)
  const vJet = pLance > 0 ? Math.sqrt(2 * pLance / RHO + v * v) : 0;
  const dJet = vJet > 0 ? Math.sqrt(4 * Q / (Math.PI * vJet)) * 1000 : 0;   // mm
  return { Q, D, S, v, Re, lambda, regime, qdyn, L, dpLin, dpSing, dpGrav, dpCharge, pPompe, pLance, pLanceBar: pLance / BAR, vJet, dJet };
}

// Une attaque = hydraulique + position de la lance + verdict sur la mission m
export function attaque(m, reg) {
  const h = hydraulique({ ...reg, pPompeBar: m.pPompe, coudes: m.coudes, zLance: m.zLance });
  const xLance = h.L - m.zLance;                     // le tuyau monte d'abord à la hauteur de la lance : une partie de sa longueur sert à la hauteur
  const dx = m.distFeu - xLance;                     // distance horizontale lance-foyer
  const dh = m.hFeu - m.zLance;                      // dénivelé lance-foyer
  const requis = dx > 0 ? G * (dh + Math.hypot(dx, dh)) : 0;           // m²·s⁻² : v_j² × FACTEUR_AIR minimal
  const utile = FACTEUR_AIR * h.vJet * h.vJet;
  const qMin = debitMini(m.puissanceMW);
  const ok = {
    securite: dx >= DIST_SECU,
    pressionHaute: h.pLanceBar <= m.pMax + 1e-9,
    pressionBasse: h.pLanceBar >= m.pMin - 1e-9,
    portee: dx < 0 ? false : utile + 1e-9 >= requis,
    debit: reg.qLmin >= qMin,
  };
  let verdict = 'ok';
  if (!ok.securite) verdict = 'brule';
  else if (!ok.pressionHaute) verdict = 'haute';
  else if (!ok.pressionBasse) verdict = 'basse';
  else if (!ok.portee) verdict = 'court';
  else if (!ok.debit) verdict = 'debit';
  // portée utile maximale à la même hauteur (pour l'affichage) : dx tel que FACTEUR_AIR·v_j² = g·(dh + √(dx² + dh²))
  const r = Math.max(0, utile / G - dh), porteeMax = r * r - dh * dh > 0 ? Math.sqrt(r * r - dh * dh) : 0;
  const actifs = m.actifs || CONDITIONS;
  const reussi = actifs.every(c => (c === 'pression' ? ok.pressionHaute && ok.pressionBasse : ok[c === 'secu' ? 'securite' : c]));
  return { ...h, xLance, dx, dh, qMin, requis, utile, porteeMax, ok, verdict, reussi };
}

// Niveaux. pPompe en bar ; plage de pression à la lance [pMin ; pMax] en bar ; foyer à distFeu m du camion et hFeu m au-dessus ; puissance du feu en MW.
//  fixe : réglages imposés (verrouillés) dans les niveaux d'apprentissage ; depart : réglage initial des autres ; actifs : conditions affichées (les autres sont toujours
//  satisfaites par construction, vérifié par le test) ; astuce : l'explication physique de l'indice ; qcm : « question du capitaine » (étoile bonus).
export const MISSIONS = [
  { id: 1, nom: 'Où poser la lance ?', icone: '📏', temps: 'Jour', appren: true, pPompe: 8, pMin: 4, pMax: 8, distFeu: 70, hFeu: 0, zLance: 0, coudes: 0, puissanceMW: 1.2,
    fixe: { dMm: 70, qLmin: 300 }, depart: { nTuyaux: 1 }, actifs: ['portee', 'secu'],
    objectif: "Pose la lance dans la bande verte : assez près pour que le jet atteigne le feu, assez loin pour ne pas être brûlé.",
    histoire: "Une benne à ordures brûle au bout de la rue. Tu choisis combien de tuyaux dérouler : chaque tuyau fait 20 m.",
    astuce: "Le jet part avec la vitesse v donnée par la pression : ½·ρ·v² = P. Plus la pression est grande, plus il porte loin. Ici la pression ne change presque pas : seule la position de la lance compte.",
    qcm: { q: "Pour que le jet porte plus loin, il faut surtout…", options: ["une pression plus grande à la lance", "un tuyau plus long", "un tuyau plus étroit"], bonne: 0, expl: "La vitesse du jet vient de la pression à la lance : ½·ρ·v² = P." },
    retenir: "Le jet sort à la vitesse donnée par la pression à la lance : ½·ρ·v² = P. Il porte d'autant plus loin que la pression est grande." },
  { id: 2, nom: 'Quel diamètre ?', icone: '⭕', temps: 'Jour', appren: true, pPompe: 8, pMin: 4.5, pMax: 6.5, distFeu: 70, hFeu: 0, zLance: 0, coudes: 0, puissanceMW: 1.2,
    fixe: { nTuyaux: 3, qLmin: 500 }, depart: { dMm: 70 }, actifs: ['pression'],
    objectif: "Choisis le diamètre pour que la pression à la lance soit dans la zone verte du manomètre (4,5 à 6,5 bar).",
    histoire: "Même incendie. Cette fois la longueur (60 m) et le débit (500 L/min) sont imposés : seul le diamètre est libre.",
    astuce: "À débit constant, l'eau va d'autant plus vite que le tuyau est étroit : v = Q/S. Et les pertes de charge grandissent avec v². Un tuyau étroit « mange » beaucoup de pression, un tuyau large presque aucune.",
    qcm: { q: "À débit constant, quand le diamètre du tuyau diminue, la vitesse de l'eau…", options: ["augmente", "diminue", "ne change pas"], bonne: 0, expl: "v = Q/S : la section S diminue, donc v augmente (comme 1/D²)." },
    retenir: "À débit fixé, v = Q/S varie comme 1/D². Les pertes de charge dépendent de v² : un tuyau étroit perd beaucoup de pression, un tuyau large presque rien." },
  { id: 3, nom: 'Quel débit ?', icone: '💧', temps: 'Soir', appren: true, pPompe: 9, pMin: 5, pMax: 8, distFeu: 70, hFeu: 0, zLance: 0, coudes: 0, puissanceMW: 4.5,
    fixe: { dMm: 45, nTuyaux: 3 }, depart: { qLmin: 100 }, actifs: ['pression', 'debit'],
    objectif: "Règle le débit : il faut assez d'eau pour le feu (voyant « eau ») sans faire chuter la pression sous la zone verte.",
    histoire: "Un feu plus gros : 4,5 MW. Tuyau et longueur sont imposés (DN 45, 60 m). Plus d'eau éteint mieux, mais…",
    astuce: "Plus le débit est grand, plus l'eau va vite, et les pertes de charge augmentent bien plus vite que le débit (environ comme Q^1,75) : la pression à la lance s'effondre.",
    qcm: { q: "Si on double le débit dans le même tuyau, les pertes de charge sont multipliées par environ…", options: ["2", "3 à 4", "elles ne changent pas"], bonne: 1, expl: "Les pertes dépendent de v² (et de λ), donc d'environ Q^1,75 : doubler le débit les multiplie par 3 à 4." },
    retenir: "Les pertes de charge augmentent plus vite que le débit (≈ Q^1,75) : il faut trouver un compromis entre assez d'eau et assez de pression." },
  { id: 4, nom: 'Voiture dans le virage', icone: '🚗', temps: 'Soir', pPompe: 8, pMin: 5, pMax: 8, distFeu: 60, hFeu: 0, zLance: 0, coudes: 2, puissanceMW: 2.5,
    actifs: ['pression', 'portee', 'debit', 'secu'],
    objectif: "Règle les trois curseurs pour mettre tous les voyants au vert.",
    histoire: "Une voiture brûle derrière deux virages. Chaque coude du tuyau coûte de la pression.",
    astuce: "Chaque coude ajoute une perte de charge n·K·½ρv² avec K = 0,9. Les coudes pèsent d'autant plus que l'eau va vite.",
    qcm: { q: "La perte de charge due à un coude est proportionnelle à…", options: ["½·ρ·v²", "la longueur du tuyau", "la vitesse v seule"], bonne: 0, expl: "ΔP = K·½·ρ·v² : une perte singulière suit l'énergie cinétique de l'eau." },
    retenir: "Pertes de charge totales : ΔP = (λ·L/D + n·K) × ½ρv². Les coudes ajoutent des pertes singulières." },
  { id: 5, nom: 'Foyer au 4ᵉ étage', icone: '🏢', temps: 'Nuit', pPompe: 8, pMin: 6, pMax: 9, distFeu: 50, hFeu: 12, zLance: 0, coudes: 0, puissanceMW: 3,
    actifs: ['pression', 'portee', 'debit', 'secu'],
    objectif: "Les flammes sortent à 12 m de haut : le jet doit monter jusqu'à la fenêtre.",
    histoire: "Les flammes sortent par une fenêtre, 12 m au-dessus de la rue. Plus il faut monter, plus il faut de vitesse au jet.",
    astuce: "Pour monter à 12 m, le jet doit être plus rapide : il lui faut plus de pression à la lance, donc moins de pertes dans le tuyau, et une lance plus proche du mur.",
    qcm: { q: "Pour que le jet monte plus haut, il faut…", options: ["plus de pression à la lance", "moins de pression à la lance", "un tuyau plus long"], bonne: 0, expl: "½·ρ·v² = P : la vitesse du jet, donc sa hauteur, vient de la pression à la lance." },
    retenir: "Au bout de la lance, ½ρv_j² = P_lance : plus la pression est grande, plus le jet est rapide, donc plus il monte et porte loin." },
  { id: 6, nom: 'Grande échelle', icone: '🪜', temps: 'Aube', pPompe: 10, pMin: 5, pMax: 8, distFeu: 45, hFeu: 22, zLance: 18, coudes: 1, puissanceMW: 6,
    actifs: ['pression', 'portee', 'debit', 'secu'],
    objectif: "La lance est sur l'échelle, à 18 m du sol : monter l'eau coûte de la pression.",
    histoire: "La lance est montée sur l'échelle aérienne, 18 m au-dessus du camion. Monter l'eau coûte de la pression : ρ·g·z.",
    astuce: "Monter l'eau de z mètres coûte ρ·g·z : environ 1 bar tous les 10 m. Cette perte ne dépend ni du diamètre ni du débit.",
    qcm: { q: "Monter la lance de 18 m coûte à peu près…", options: ["1,8 bar", "0,18 bar", "18 bar"], bonne: 0, expl: "ρ·g·z = 1000 × 9,81 × 18 ≈ 1,8 × 10⁵ Pa = 1,8 bar." },
    retenir: "Bernoulli avec dénivelé : P_pompe = P_lance + ρ·g·z + ΔP_charge. 10 m de hauteur d'eau coûtent environ 1 bar." },
  { id: 7, nom: 'Entrepôt', icone: '🏭', temps: 'Nuit', pPompe: 9, pMin: 5, pMax: 8, distFeu: 90, hFeu: 0, zLance: 0, coudes: 2, puissanceMW: 4.5,
    actifs: ['pression', 'portee', 'debit', 'secu'],
    objectif: "Beaucoup d'eau, un foyer loin : attention, un tuyau trop large donne une pression trop forte.",
    histoire: "Un entrepôt de palettes flambe : il faut beaucoup d'eau, et le foyer est loin. Un tuyau trop large ne perd presque rien et la lance devient incontrôlable.",
    astuce: "Si le tuyau ne perd presque rien, la pression à la lance reste proche de celle de la pompe : trop forte. Il faut un compromis entre diamètre, longueur et débit.",
    qcm: { q: "Pourquoi un tuyau très large peut-il donner une pression trop forte à la lance ?", options: ["il perd très peu de pression par frottement", "il fait monter la pression de la pompe", "il augmente le débit tout seul"], bonne: 0, expl: "Les pertes de charge diminuent avec le diamètre : presque toute la pression de la pompe arrive à la lance." },
    retenir: "Un tuyau très large perd très peu (pression à la lance trop forte), un tuyau très étroit perd trop (jet mou). Diamètre, longueur et débit se règlent ensemble." },
  { id: 8, nom: 'Raffinerie', icone: '🛢️', temps: 'Nuit', pPompe: 8, pMin: 5, pMax: 8, distFeu: 110, hFeu: 4, zLance: 0, coudes: 3, puissanceMW: 9,
    actifs: ['pression', 'portee', 'debit', 'secu'],
    objectif: "Un énorme débit à amener très loin : tout se joue sur le diamètre.",
    histoire: "Un réservoir d'hydrocarbures brûle, très loin. Il faut un énorme débit : tout se joue sur le diamètre et la longueur.",
    astuce: "À très grand débit, un petit tuyau perd toute la pression. Seul un tuyau large laisse arriver assez de pression à la lance.",
    qcm: { q: "À très grand débit, quel tuyau limite le mieux les pertes de charge ?", options: ["le plus large (DN 110)", "le plus étroit (DN 45)", "ça ne dépend pas du diamètre"], bonne: 0, expl: "Pour un même débit, v = Q/S est la plus petite dans le tuyau le plus large : très peu de pertes." },
    retenir: "À grand débit, les pertes de charge explosent (≈ Q^1,75) : seul un tuyau large permet d'amener assez d'eau, et de la pression, jusqu'à la lance." },
];

// Réglage de départ commun : diamètre 70, un tuyau, débit minimal (jamais gagnant : il faut agir) ; les réglages verrouillés d'un niveau s'y ajoutent
export const REGLAGE_DEPART = { dMm: 70, nTuyaux: 1, qLmin: 100 };
export const reglageDepart = m => ({ ...REGLAGE_DEPART, ...(m.depart || {}), ...(m.fixe || {}) });
export const estLibre = (m, cle) => !(m.fixe && cle in m.fixe);
export const CONDITIONS = ['pression', 'portee', 'debit', 'secu'];
// Un niveau est gagné quand toutes ses conditions affichées sont remplies (a = résultat de attaque())
export const conditionsRemplies = (m, a) => (m.actifs || CONDITIONS).every(c => (c === 'pression' ? a.ok.pressionHaute && a.ok.pressionBasse : a.ok[c === 'secu' ? 'securite' : c]));

export const mission = id => MISSIONS.find(m => m.id === id);

// Toutes les attaques réussies d'un niveau (grille DN × nombre de tuyaux × débit, en respectant les réglages verrouillés) : pour les tests et la correction
export function solutions(m) {
  const res = [];
  const ds = m.fixe && 'dMm' in m.fixe ? [m.fixe.dMm] : DIAMETRES;
  const ns = m.fixe && 'nTuyaux' in m.fixe ? [m.fixe.nTuyaux] : Array.from({ length: N_MAX }, (_, i) => i + 1);
  const qs = []; for (let q = DEBIT_MIN; q <= DEBIT_MAX; q += DEBIT_PAS) qs.push(m.fixe && 'qLmin' in m.fixe ? m.fixe.qLmin : q);
  for (const dMm of ds) for (const nTuyaux of ns) for (const qLmin of [...new Set(qs)]) {
    const a = attaque(m, { dMm, nTuyaux, qLmin });
    if (a.reussi) res.push({ dMm, nTuyaux, qLmin, pLanceBar: a.pLanceBar });
  }
  return res;
}

// Étoiles d'un niveau : 1 pour avoir gagné, +1 sans avoir demandé l'indice, +1 si la question du capitaine est juste du premier coup
export const etoilesNiveau = ({ indice, qcmJuste }) => 1 + (indice ? 0 : 1) + (qcmJuste ? 1 : 0);
