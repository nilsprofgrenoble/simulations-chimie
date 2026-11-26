// Modèle du jeu « Urgence au labo : dilutions » (sim 291).
// Scénario : un ballon de réaction s'emballe ; chaque commande = une solution à préparer pour le calmer. Une commande = préparer un volume Vt d'une solution de concentration Ct à partir d'une solution mère C0, avec de la verrerie jaugée.
// Hypothèses (rappelées dans le jeu) : verrerie jaugée parfaite (pas d'incertitude), prélèvement exact, volumes additifs (pas de contraction),
// solution parfaitement homogène après agitation, dilution idéale. Une étape = prélever p (pipette jaugée) et compléter jusqu'au trait dans une fiole jaugée f.
// Loi de dilution : C × p = C' × f (conservation de la quantité de matière), donc C' = C × p / f et le facteur de dilution est F = C / C' = f / p.

export const FIOLES = [50, 100, 200, 250];         // mL
export const PIPETTES = [1, 2, 5, 10, 20, 25];     // mL

const proche = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b), 1e-12);

// Graine → nombres pseudo-aléatoires reproductibles
export function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Résultat d'une suite d'étapes [{p, f}, …] à partir de la solution mère C0. Retourne { ok, C, V, erreur }.
export function realiser(C0, etapes) {
  let C = C0, volume = Infinity;
  for (let k = 0; k < etapes.length; k++) {
    const { p, f } = etapes[k];
    if (!(p > 0) || !(f > 0)) return { ok: false, erreur: 'incomplet' };
    if (p >= f) return { ok: false, erreur: 'pipette-trop-grande', etape: k };
    if (k > 0 && p > volume) return { ok: false, erreur: 'pas-assez', etape: k, volume };
    C = C * p / f; volume = f;
  }
  return { ok: true, C, V: volume };
}

// Une préparation répond-elle à la commande ?
export const conforme = (cmd, etapes) => { const r = realiser(cmd.C0, etapes); return r.ok && proche(r.C, cmd.Ct) && r.V === cmd.Vt; };

// Toutes les préparations en 1 ou 2 étapes qui répondent à la commande (pour les tests et pour la correction affichée)
export function solutions(cmd, etapesMax = 2) {
  const sols = [];
  for (const p1 of PIPETTES) for (const f1 of FIOLES) {
    const e1 = [{ p: p1, f: f1 }];
    if (conforme(cmd, e1)) sols.push(e1);
    if (etapesMax >= 2) for (const p2 of PIPETTES) for (const f2 of FIOLES) { const e2 = [...e1, { p: p2, f: f2 }]; if (conforme(cmd, e2)) sols.push(e2); }
  }
  return sols;
}

// Missions : 1 étape (concentration mère fixe), 1 étape (concentrations mères variées), 2 étapes obligatoires.
// « temps » : secondes avant l'explosion au départ ; chaque commande réussie fait gagner BONUS_REUSSITE secondes, chaque essai raté ou indice en fait perdre.
export const BONUS_REUSSITE = 10, PENALITE_ECHEC = 8, COUT_INDICE = 10;
export const SERVICES = [
  { id: 1, nom: 'Le ballon chauffe', icone: '🌡️', nb: 5, etapesMax: 1, temps: 210, etapesTxt: 'une étape',
    histoire: "Dans le labo, le ballon de synthèse sous la paillasse monte en température : la réaction s'emballe ! Le protocole d'urgence demande des solutions précises de l'inhibiteur, à partir de la solution mère S₀ (1,0 mol/L). Prépare-les avant que le ballon n'explose.",
    C0: [1], Ct: [0.5, 0.25, 0.2, 0.1, 0.05, 0.04, 0.02, 0.01] },
  { id: 2, nom: 'Stock en désordre', icone: '🧴', nb: 6, etapesMax: 1, temps: 200, etapesTxt: 'une étape',
    histoire: "Le ballon est reparti de plus belle. Dans l'armoire, plusieurs flacons de solution mère ont des concentrations différentes : lis bien l'étiquette de départ avant de choisir ta pipette !",
    C0: [0.2, 0.5, 1, 2], Ct: [0.5, 0.25, 0.2, 0.1, 0.05, 0.04, 0.02, 0.01, 0.2, 0.4, 0.08] },
  { id: 3, nom: 'Réaction critique', icone: '⚠️', nb: 4, etapesMax: 2, temps: 240, etapesTxt: 'deux étapes',
    histoire: "Alerte maximale : l'inhibiteur doit être extrêmement dilué, et aucune pipette ne permet de le faire en une seule étape. Prépare une solution intermédiaire, puis dilue-la encore. Chaque seconde compte !",
    C0: [0.5, 1, 2], Ct: [0.001, 0.002, 0.0005, 0.004, 0.005, 0.0004, 0.0002, 0.0025] },
];

// Commandes d'un service, reproductibles (même graine = mêmes commandes). Chaque commande est réalisable avec la verrerie du plateau
// avec au plus « etapesMax » étapes, et — au service 3 — jamais en une seule étape.
export function commandesDuService(service, graine) {
  const rnd = alea(graine * 7919 + service.id * 104729), pool = [];
  for (const C0 of service.C0) for (const Ct of service.Ct) for (const Vt of FIOLES) {
    if (Ct >= C0) continue;
    const cmd = { C0, Ct, Vt };
    const un = solutions(cmd, 1).length, deux = solutions(cmd, 2).length;
    if (service.etapesMax === 1 ? un > 0 : (un === 0 && deux > 0)) pool.push(cmd);
  }
  const choisies = [], facteurs = new Set();
  const melange = pool.map(c => [rnd(), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  for (const c of melange) {
    const F = Math.round(c.C0 / c.Ct * 1000) / 1000;
    if (choisies.length < service.nb && (!facteurs.has(F) || melange.length < 3 * service.nb)) { facteurs.add(F); choisies.push({ ...c, table: choisies.length + 1 }); }
  }
  return choisies;
}

// Retour d'une tentative : message pédagogique (sans donner directement la réponse)
export function retour(cmd, etapes) {
  const r = realiser(cmd.C0, etapes);
  if (!r.ok) {
    if (r.erreur === 'pas-assez') return { juste: false, texte: `Pas assez de solution intermédiaire : elle fait ${r.volume} mL et tu veux en prélever ${etapes[r.etape].p} mL.` };
    if (r.erreur === 'pipette-trop-grande') return { juste: false, texte: `On ne peut pas prélever ${etapes[r.etape].p} mL pour compléter une fiole de ${etapes[r.etape].f} mL : la solution ne serait pas diluée.` };
    return { juste: false, texte: 'Choisis une pipette et une fiole pour chaque étape.' };
  }
  if (r.V !== cmd.Vt) return { juste: false, texte: `Le client veut ${cmd.Vt} mL : ta dernière fiole en contient ${r.V} mL.`, C: r.C };
  if (proche(r.C, cmd.Ct)) return { juste: true, texte: 'Commande conforme !', C: r.C };
  return { juste: false, C: r.C, texte: r.C > cmd.Ct ? 'Ta solution est trop concentrée : il faut la diluer davantage (prélever moins, ou compléter dans une fiole plus grande).' : 'Ta solution est trop diluée : il faut prélever plus de solution mère.' };
}

// Correction : une préparation correcte (la plus courte) et son explication
export function correction(cmd, etapesMax) {
  const s = solutions(cmd, etapesMax).sort((a, b) => a.length - b.length || a[0].p - b[0].p)[0];
  return s || null;
}

// Mise en forme avec chiffres significatifs (2 à 3), à la française
export const fmtC = x => x.toLocaleString('fr-FR', { minimumSignificantDigits: 2, maximumSignificantDigits: 3 });
export const fmtF = x => x.toLocaleString('fr-FR', { maximumSignificantDigits: 4 });

// Intensité de la teinte d'un colorant (illustration : plus la solution est concentrée, plus elle est foncée)
export const teinte = C => Math.max(0.04, Math.min(0.95, 1 - Math.pow(10, -C * 1.2)));

// Température du ballon (illustration) : 35 °C au calme, 180 °C à l'explosion ; elle suit le temps restant.
export const TEMP_MIN = 35, TEMP_MAX = 180;
export const urgence = (reste, temps0) => 1 - Math.max(0, Math.min(1, reste / temps0));
export const temperature = (reste, temps0) => Math.round(TEMP_MIN + (TEMP_MAX - TEMP_MIN) * urgence(reste, temps0));

// Étoiles d'une mission réussie, selon la part du temps initial qui reste : ≥ 50 % → 3, ≥ 20 % → 2, sinon 1
export const etoilesMission = (reste, temps0) => (reste / temps0 >= 0.5 ? 3 : reste / temps0 >= 0.2 ? 2 : 1);
