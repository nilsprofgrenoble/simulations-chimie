// ====================================================
//  UNE JOURNÉE AU LABO : histoire à choix pour le BTS Métiers de la Chimie (sans React, testable seule).
//  Support : sujet de CCF4 (base de peinture blanche), lu à l'envers : la Vinnapas EP 3360 de la référence est en rupture, il faut la remplacer par l'Orgal PST 50A.
//  (Dans cette version, la référence se passe de coalescent ; l'Orgal, de MFFT 20 °C, en exige un : c'est tout l'intérêt du scénario.)
//  Le joueur est un technicien de R&D ; il délègue des analyses à des collègues fictifs (chacun ne fait qu'une chose à la fois),
//  la journée va de 8 h à 17 h 30 (appel client à 15 h, rapport avant 17 h) et les décisions ont des conséquences : dix fins possibles.
//  Les calculs de formulation reposent sur le modèle de la simulation « Peinture à l'eau » (proprietes), pour rester cohérent avec elle.
//  Les valeurs rendues par les analyses déléguées sont FICTIVES (elles servent le scénario).
//  Chaque scène de résultat porte un champ « visuel » (données) que l'interface dessine sous forme d'instrument.
// ====================================================
import { proprietes } from "./Peinture";
import { secretsAleatoires, lectureBanc, penteMesuree, DOSES_BANC, ESSAIS_MAX, DUREE_ESSAI, DOSES_COURBE, COURBE_MAX, COURBE_DUREE, HUILE_MAX_ESSAIS, HUILE_DUREE, M_POUDRE, etatPate, rapportPate, injection, cEchantillon, etalonnage, dosage, covDepuisC, T_PREP, T_INJ, ETAL_MAX, ECH_MAX, NIVEAUX_ETALON, BORNE_BASSE, BORNE_SEUIL, BORNE_HAUTE, masseCoadis, lectureVisco } from "./stationsModele";

export const ID_LABO = 81;
export const CLE_ETAT = 'labo-histoire-v3';
export const CLE_FINS = 'labo-histoire-fins-v3';
export const TMFF_MAX = 5;       // le film doit se former dès 5 °C (cahier des charges du scénario)
export const COV_MAX = 30;       // g/L
export const T_CLIENT = 420;     // 15 h 00 (minutes depuis 8 h 00)
export const T_RAPPORT = 540;    // 17 h 00
export const T_FIN = 570;        // 17 h 30

export const hhmm = t => { const m = 480 + Math.round(t); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; };
export const nf = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

export const PNJ = {
  moi: { nom: 'Toi', role: 'Technicien·ne de R&D', couleur: '#0f766e' },
  dubreuil: { nom: 'Mme Dubreuil', role: 'Responsable du laboratoire', couleur: '#7c3aed' },
  karim: { nom: 'Karim', role: 'Technicien de formulation', couleur: '#b45309' },
  ines: { nom: 'Inès', role: 'Technicienne en analyses physico-chimiques', couleur: '#0369a1' },
  lucas: { nom: 'Lucas', role: 'Technicien rhéologie et application', couleur: '#15803d' },
  perrin: { nom: 'M. Perrin', role: 'Service achats', couleur: '#475569' },
  aubry: { nom: 'Mme Aubry', role: 'Cliente (marque de peintures)', couleur: '#be185d' },
};

// ───────────── Formule, propriétés et coût (modèle de la simulation Peinture) ─────────────
// Référence (Vinnapas, sans coalescent) : 331,2 g au total. La nouvelle formule (Orgal) garde la même masse totale : l'eau compense.
export const FORMULE_REF = { resine: 'vinnapas', eau: 121.7, tio2: 60, caco3: 60, liant: 83.3, foamex: 1.5, coadis: 0.2, dpnb: 0, thixol: 1.5, coapur: 3 };
// Formule proposée par l'élève (e.f.fm), posée à l'étape « formule finale » ; sinon formule déduite de ses choix successifs
export const FM_CHAMPS = ['liant', 'eau', 'tio2', 'caco3', 'coadis', 'dpnb'];
export const formule = e => e.f.fm ? { resine: 'orgal', foamex: 1.5, thixol: 1.5, coapur: 3, ...e.f.fm } : formuleFlags(e);
export const fmDepuisFlags = e => { const f = formuleFlags(e); return Object.fromEntries(FM_CHAMPS.map(k => [k, f[k]])); };
const formuleFlags = e => {
  const naif = e.f.regle === 'naif', dpnb = e.f.dpnb ?? 0;
  return { resine: 'orgal', eau: (naif ? 121.7 : 105) - dpnb, tio2: 60, caco3: 60, liant: naif ? 83.3 : 100, foamex: 1.5,
    coadis: e.f.coadis ?? 0.2, dpnb, thixol: 1.5, coapur: 3 };
};
export const prop = (e, opts) => proprietes(formule(e), { efficacite: e.f.eff ?? 3, ...(opts?.ph === 'mesuree' && e.f.phMes ? { phPerso: e.f.phMes } : {}), ...opts });   // l'efficacité du coalescent est un paramètre caché (station banc TMFF)
export const tmffMesuree = e => Math.max(0, prop(e).tmff);          // le banc s'arrête à 0 °C
export const covDe = e => prop(e).COV;
export const tmffOk = e => prop(e).tmff <= TMFF_MAX;
export const covOk = e => covDe(e) < COV_MAX;
export const dpnbOk = (d, eff) => d != null && tmffOk({ f: { regle: 'ok', dpnb: d, eff } }) && covOk({ f: { regle: 'ok', dpnb: d, eff } });   // fenêtre : TMFF ≤ 5 °C (≥ 2,5 g) et COV < 30 g/L

// Prix (€/g). Orgal : 25 € / 5 L (Document 1) ; Vinnapas : 3,60 €/kg (référence) ; autres : Document 1
const PRIX = { eau: 3.7 / 1000 / 1000, tio2: 0.010, caco3: 0.003, orgal: 5 / 1.03 / 1000, vinnapas: 0.0036, foamex: 6 / 200, coadis: 7 / 1000 / 1.22, dpnb: 3 / 1000 / 0.91, thixol: 7 / 1000 / 1.06, coapur: 8 / 1000 / 1.04 };
export const coutKg = f => {
  const m = proprietes(f).mTot;
  const c = f.eau * PRIX.eau + f.tio2 * PRIX.tio2 + f.caco3 * PRIX.caco3 + f.liant * (f.resine === 'orgal' ? PRIX.orgal : PRIX.vinnapas)
    + f.foamex * PRIX.foamex + f.coadis * PRIX.coadis + f.dpnb * PRIX.dpnb + f.thixol * PRIX.thixol + f.coapur * PRIX.coapur;
  return c / (m / 1000);
};

// ───────────── Moteur ─────────────
export const etatInitial = () => ({ scene: 'intro', t: 0, f: secretsAleatoires(), carnet: [], cmd: {}, libre: { ines: 0, lucas: 0, perrin: 0 }, essais: 0, vus: ['cdc'] });
const nota = (e, texte) => texte ? { ...e, carnet: [...e.carnet, `${hhmm(e.t)} : ${texte}`] } : e;

export const SCENES = {};
const add = (id, o) => { SCENES[id] = { id, ...o }; };
export const estFin = id => !!SCENES[id]?.fin;

export function aller(e, id) {
  let cible = id;
  if (!SCENES[cible]) throw new Error(`Scène inconnue : ${cible}`);
  if (!SCENES[cible].fin) {
    if (e.t >= T_FIN) cible = 'fin_perdue';
    else if (cible === 'labo' && e.t >= T_CLIENT && !e.f.clientFait) cible = 'client';
  }
  const fiches = SCENES[cible].fiches || [];
  const n = { ...e, scene: cible, essais: 0, vus: [...new Set([...docsVus(e), ...fiches])] };
  return SCENES[cible].entree ? SCENES[cible].entree(n) : n;
}
// Documents déjà consultés (le cahier des charges est donné dès le départ) : accessibles à tout moment dans le Dossier
export const NOMS_DOCS = { cdc: 'Cahier des charges', formule: 'Document 1 · Formule de référence', fabrication: 'Document 2 · Fiche de fabrication', vinnapas: 'Fiche Vinnapas', orgal: 'Fiche Orgal', dpnb: 'Fiche DPnB', coadis: 'Fiche Coadis', durcal: 'Fiche Durcal (CaCO₃)' };
// Variation des formulations : choix déterministe (même partie = mêmes mots, parties différentes = formulations différentes)
const hash = c => [...c].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7);
export const vari = (e, cle, L) => L[Math.abs(((e.f?.graine ?? 1) | 0) + hash(cle)) % L.length];
// Explication d'une erreur : cause, effet, remède, avec plusieurs façons de les enchaîner
export const cer = (e, cle, cause, effet, remede) => vari(e, cle, [
  `Cause : ${cause} Effet : ${effet} Remède : ${remede}`,
  `${cause} Conséquence : ${effet} Pour corriger : ${remede}`,
  `Ce qui s'est passé : ${cause} Ce que ça change : ${effet} À faire : ${remede}`,
  `${effet} L'origine : ${cause} Pour rattraper : ${remede}`]);
export const docsVus = e => e.vus || ['cdc'];
export const texteDe = (e, sc = SCENES[e.scene]) => typeof sc.texte === 'function' ? sc.texte(e) : sc.texte;
// Les scènes marquées « melange » présentent leurs choix dans un ordre propre à la partie (la bonne réponse n'est pas toujours la première)
const brasser = c => { let h = hash(c) | 0; h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; };
const melanger = (e, cle, L) => L.map((c, i) => [brasser(`${e.f?.graine ?? 1}|${cle}|${i}`), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
export const choixDe = (e, sc = SCENES[e.scene]) => { const L = (typeof sc.choix === 'function' ? sc.choix(e) : sc.choix || []).filter(c => !c.si || c.si(e)); return sc.melange ? melanger(e, sc.id, L) : L; };
export const visuelDe = (e, sc = SCENES[e.scene]) => sc.visuel ? sc.visuel(e) : null;

// Applique un choix : durée, drapeaux, note de carnet, action particulière, puis changement de scène
export function choisir(e, c) {
  let n = { ...e, t: e.t + (c.duree || 0), f: { ...e.f, ...(c.f || {}) } };
  n = nota(n, c.note);
  if (c.run) n = c.run(n);
  return aller(n, typeof c.vers === 'function' ? c.vers(n) : c.vers);
}
// Calcul saisi par le joueur : { etat, juste, message }
export function valider(e, saisie) {
  const sc = SCENES[e.scene], k = sc.calcul;
  const v = parseFloat(String(saisie).replace(',', '.').replace(/\s/g, ''));
  const vrai = k.vrai(e);
  if (Number.isFinite(v) && Math.abs(v - vrai) <= Math.abs(vrai) * k.tol) return { etat: choisir(e, k.ok), juste: true, message: '' };
  const essais = e.essais + 1;
  if (essais >= 2) return { etat: choisir({ ...e, t: e.t + 5 }, k.ko), juste: false, message: '' };
  return { etat: { ...e, t: e.t + 5, essais }, juste: false, message: (k.retour && Number.isFinite(v) && k.retour(v, e)) || k.indice };
}

// Délégation d'une analyse à un technicien : il travaille en parallèle (une chose à la fois) ; seul·e en mode « solo », tout le temps est pour toi
function deleguer(e, A) {
  const solo = e.f.plan === 'solo';
  if (solo) { const t = e.t + A.duree; return nota({ ...e, t, cmd: { ...e.cmd, [A.cle]: { pret: t, lu: false } } }, `Je réalise moi-même : ${A.label}.`); }
  const debut = Math.max(e.t, e.libre[A.tech] || 0), pret = debut + A.duree;
  return nota({ ...e, t: e.t + A.perso, libre: { ...e.libre, [A.tech]: pret }, cmd: { ...e.cmd, [A.cle]: { pret, lu: false } } },
    `Demande à ${PNJ[A.tech].nom} : ${A.label} (résultat vers ${hhmm(pret)}).`);
}

// ───────────── Formule finale : l'élève pose sa propre formule, confrontée au cahier des charges ─────────────
export const MASSE_MIN = 250, MASSE_MAX = 400;   // capacité de la cuve de la défloculeuse (g)
const fmComplet = fm => ({ resine: 'orgal', foamex: 1.5, thixol: 1.5, coapur: 3, ...fm });
// Contrôles « sur papier » : seulement ce qui se calcule avec ce que l'élève sait (fiches, ou ses propres mesures)
export function controlesFormule(e, fm) {
  const f = fmComplet(fm), mes = e.f.phMes, p = proprietes(f, mes ? { phPerso: mes } : { ph: 'fiche' }), act = pctActif(f), cout = coutKg(f);
  return [
    { cle: 'es', ok: p.ES > 50, t: `Extrait sec ${nf(p.ES)} % (cahier des charges : > 50 %).` },
    { cle: 'lambda', ok: p.lambda >= 0.8, t: `λ = CPV / CPVC = ${nf(p.CPV)} / ${nf(p.CPVC)} = ${nf(p.lambda, 2)} (≥ 0,8 demandé), calculé avec les prises d'huile ${mes ? 'que tu as mesurées' : 'des fiches techniques (TiO₂ 20, CaCO₃ 14) : valables pour nos poudres ?'}.` },
    { cle: 'cov', ok: p.COV < COV_MAX, t: `COV calculé ${nf(p.COV, 0)} g/L (< ${COV_MAX} g/L demandé).` },
    { cle: 'cout', ok: cout < 4.5, t: `Coût matières premières ${nf(cout, 2)} €/kg (< 4,5 €/kg demandé).` },
    { cle: 'disp', ok: act >= 0.15 && act <= 0.30 ? true : null, t: `Dispersant : ${nf(act, 2)} % de matière active sur les poudres (la fiche annonce 0,15 à 0,20 %).` },
    { cle: 'coal', ok: p.pctCoalescent >= 4 && p.pctCoalescent <= 8 ? true : null, t: `Coalescent : ${nf(p.pctCoalescent, 1)} % du polymère sec (règle d'atelier : 4 à 8 %).` },
    { cle: 'mes', ok: null, t: 'TMFF, rhéologie, pouvoir masquant, brillance : ça ne se calcule pas, il faudra les mesurer sur la peinture fabriquée.' },
  ];
}
// Validation de la formule saisie (nombres en g) : { ok, message, choix } ; le choix est passé à `choisir`
export function validerFormule(e, fm) {
  const v = Object.fromEntries(FM_CHAMPS.map(k => [k, Math.round(Number(fm[k]) * 100) / 100]));
  if (FM_CHAMPS.some(k => !Number.isFinite(v[k]) || v[k] < 0)) return { ok: false, message: 'Chaque masse doit être un nombre positif ou nul.' };
  if (v.liant <= 0) return { ok: false, message: 'Il faut de la dispersion d\'Orgal dans la formule.' };
  const f = fmComplet(v), mTot = proprietes(f).mTot;
  if (mTot < MASSE_MIN || mTot > MASSE_MAX) return { ok: false, message: `La formule pèse ${nf(mTot)} g : la cuve de la défloculeuse prend entre ${MASSE_MIN} et ${MASSE_MAX} g. Ajuste les masses.` };
  const p = proprietes(f);
  return { ok: true, message: '', choix: { t: 'Valider ma formule', f: { fm: v, dpnb: v.dpnb, coadis: v.coadis, regle: p.ES > 50 ? 'ok' : 'naif', formuleLibre: true }, note: `Formule retenue (${nf(mTot)} g) : Orgal ${nf(v.liant, 1)} g, eau ${nf(v.eau, 1)} g, TiO₂ ${nf(v.tio2, 1)} g, CaCO₃ ${nf(v.caco3, 1)} g, Coadis BR3 ${nf(v.coadis, 2)} g, DPnB ${nf(v.dpnb, 1)} g.`, vers: 'fabrication' } };
}

// ───────────── Hub ouvert : l'élève décide de ce qu'il fait, par écrit ─────────────
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Ordre = priorité : le premier motif reconnu l'emporte
const MOTS = [
  ['huile', /prise d.?huile|huile|spatule|cpvc|absorption/], ['dpnb', /\bcov\b|dpnb|dosage|doser|cpg|chromato|volatil|solvant|coalescent/], ['tmff', /tmff|mfft|filmif|film|craquel|temperature minimale/],
  ['masq', /masqu|opacit|contraste|recouvr|couvrant/], ['brill', /brill|gloss|reflet|satin|aspect/], ['rheo', /rheo|viscos|thixo|cisaill|ecoulement/], ['cout', /cout|prix|devis|achat|perrin|budget|euro/],
  ['etuve', /etuve|vieilli|stabilit|30 mois|accelere/], ['es', /extrait sec|densit|residu|matiere seche|matieres seches/],
];
// { ok, etat, message } : ok = une action reconnue et possible a été lancée
export function agirLibre(e, texte) {
  const t = norm(texte).trim();
  if (t.length < 3) return { ok: false, etat: e, message: 'Écris ce que tu veux faire : une analyse, un contrôle, un appel…' };
  let cle = (MOTS.find(([, re]) => re.test(t)) || [])[0];
  if (cle === 'huile' && /moi.?meme|spatule|je mesure|je fais moi|seul/.test(t)) cle = 'huile-moi';
  if (!cle) return { ok: false, etat: e, message: 'Je ne vois pas quelle mesure ou quelle action ça recouvre. Reformule avec le nom de la mesure ou du contrôle (par exemple « mesurer la viscosité »), ou demande des idées.' };
  const c = choixDe(e).find(x => x.cle === cle);
  if (c) return { ok: true, etat: choisir(e, c) };
  const A = ANALYSES.find(a => a.cle === cle);
  if (e.cmd[cle === 'huile-moi' ? 'huile' : cle]) return { ok: false, etat: e, message: 'Tu l\'as déjà demandé : regarde « En cours » ou lis le résultat.' };
  if (cle === 'dpnb' && e.f.mes_dpnb) return { ok: false, etat: e, message: 'Le DPnB a déjà été dosé dans cette peinture.' };
  if (cle === 'etuve' && e.f.etuve) return { ok: false, etat: e, message: 'Un échantillon est déjà à l\'étuve.' };
  if (!e.f.fabrique && cle !== 'huile' && !A?.avant) return { ok: false, etat: e, message: 'Il n\'y a pas de peinture à analyser pour l\'instant : il faut d\'abord en fabriquer.' };
  return { ok: false, etat: e, message: 'Ça n\'est pas possible maintenant.' };
}
export const demanderIdees = e => e.f.idees ? e : nota({ ...e, t: e.t + 5, f: { ...e.f, idees: true } }, 'Je prends cinq minutes pour faire le point sur ce que je peux encore lancer.');

// ───────────── Les analyses déléguées ─────────────
// avant : possible avant la fabrication (matières premières)
export const ANALYSES = [
  { cle: 'huile', tech: 'lucas', label: 'Prises d\'huile des poudres (TiO₂, CaCO₃)', duree: 40, perso: 10, avant: true },
  { cle: 'es', tech: 'ines', label: 'Extrait sec et densité de la peinture', duree: 40, perso: 5 },
  { cle: 'rheo', tech: 'lucas', label: 'Profil rhéologique (viscosimètre)', duree: 45, perso: 10 },
  { cle: 'masq', tech: 'lucas', label: 'Pouvoir masquant (4 épaisseurs, contraste)', duree: 90, perso: 20 },
  { cle: 'brill', tech: 'lucas', label: 'Brillance du film (glossmètre 60° et 85°)', duree: 30, perso: 5 },
  { cle: 'tmff', tech: 'lucas', label: 'Température minimale de formation de film (TMFF)', duree: 60, perso: 10 },
  { cle: 'cout', tech: 'perrin', label: 'Devis de l\'Orgal et coût matières premières', duree: 20, perso: 5 },
];
const labelDe = cle => ANALYSES.find(a => a.cle === cle)?.label;
export const statutCmd = e => Object.entries(e.cmd).map(([k, c]) => ({ cle: k, label: labelDe(k) || k, tech: ANALYSES.find(a => a.cle === k)?.tech, pret: c.pret, etat: c.lu ? 'lu' : c.pret > e.t ? 'cours' : 'pret' }));
// Disponibilité de l'équipe à l'instant t : { karim, ines, lucas } → minute où la personne se libère (0 = libre)
export const equipe = e => ({ karim: 0, ines: Math.max(0, (e.libre.ines || 0) - e.t), lucas: Math.max(0, (e.libre.lucas || 0) - e.t), perrin: Math.max(0, (e.libre.perrin || 0) - e.t) });

// ═══════════════ LES SCÈNES ═══════════════
const retourLabo = { t: 'Retourner à la paillasse', vers: 'labo' };
// Recommencer la fabrication : on ne garde que les résultats qui ne dépendent pas de ce qui change (prises d'huile des poudres, etc.)
const MESURES = ['es', 'rheo', 'masq', 'tmff', 'cout', 'brill'];
const effacerMesures = (e, garder = []) => ({ ...e, libre: { ines: 0, lucas: 0, perrin: 0 },
  cmd: Object.fromEntries(Object.entries(e.cmd).filter(([k]) => k === 'huile' || garder.includes(k))),
  f: { ...e.f, fabrique: false, ...Object.fromEntries(MESURES.filter(k => !garder.includes(k)).map(k => ['mes_' + k, false])) } });
const refaireFormule = note => ({ t: 'Revoir ma formule et refaire la peinture', d: '15 min de calcul puis fabrication ; les autres mesures sont à refaire', duree: 15, f: { refaitForm: true }, note, run: e => effacerMesures(e), vers: 'formuleFinale' });
const refaireCoalescent = (note) => ({ t: 'Corriger la dose de coalescent et refaire la peinture', d: '15 min de calcul puis fabrication ; pouvoir masquant et brillance restent valables', duree: 15, f: { refaitCoal: true }, note, run: e => effacerMesures(e, ['masq', 'brill']), vers: 'coalescent' });
// Dispersant : % de matière active sur les 120 g de poudres de la formule ; la demande réelle du lot (paramètre caché dem) décale le seuil
export const pctActif = f => (f.coadis ?? 0.2) * 0.4 / 120 * 100;
export const dispOk = f => pctActif(f) / (f.dem ?? 1) >= BORNE_BASSE;
const mauvaisRheo = e => !dispOk(e.f);
// Pouvoir masquant (m²/L) : modèle de scénario, croît avec la concentration en TiO₂ (g/L de peinture) ; amas mal dispersés : −10 %
export const pouvoirMasquant = e => { const p = prop(e), c = formule(e).tio2 / (p.mTot / p.densite) * 1000; return 7.6 * Math.pow(c / 244.9, 0.6) * (mauvaisRheo(e) ? 6.8 / 7.6 : 1); };
// λ réel : avec les prises d'huile (cachées) du lot de poudres
export const lambdaVrai = e => prop(e, { phPerso: { tio2: phVrai(e, 'tio2'), caco3: phVrai(e, 'caco3') } }).lambda;
// Brillance à 60° (UB) : mate quand λ ≥ 0,85, de plus en plus brillante quand λ baisse (modèle de scénario)
export const brillance = e => { const l = lambdaVrai(e), g60 = 2.8 + 70 * Math.pow(Math.max(0, 0.85 - l), 1.3); return { g60, g85: g60 * 2.3, l }; };

add('intro', { lieu: 'Bureau de la responsable', pnj: 'dubreuil', titre: 'Lundi, 8 h 00',
  texte: `Mme Dubreuil t'accueille avec un café et un dossier.\n« Notre fournisseur est en rupture de Vinnapas EP 3360, la résine de notre base de peinture blanche intérieure. Il faut pouvoir la remplacer par l'Orgal PST 50A sans dégrader la base : mate (λ = CPV/CPVC ≥ 0,8), extrait sec supérieur à 50 %, pouvoir masquant supérieur à 7,0 m²/L, COV inférieurs à 30 g/L, matières premières à moins de 4,5 €/kg, et film qui se forme dès 5 °C. »\n« On en profite pour corriger un défaut : les opérateurs trouvent des gros amas de poudres à la dispersion. Je veux une formule, une peinture fabriquée et un dossier de contrôle qualité. »\n« Appel avec notre cliente, Mme Aubry, à 15 h. Rapport pour 17 h. Karim, Inès et Lucas t'aident, mais chacun ne fait qu'une chose à la fois. »`,
  choix: [{ t: 'Parcourir le dossier', vers: 'docs' }] });

add('docs', { lieu: 'Bureau', pnj: 'moi', titre: 'Étude du dossier',
  texte: e => `Tu étales les documents. Il est ${hhmm(e.t)}. Que lis-tu ?${e.f.docRef ? '' : '\n(Il te faut au moins la formule de référence pour avancer.)'}`,
  choix: () => [
    { t: 'Les fiches techniques des deux résines (Document 8)', si: e => !e.f.fiche, duree: 10, f: { fiche: true }, vers: 'docRes' },
    { t: 'La formule et la fiche de fabrication de la référence (Documents 1 et 2, résultats du responsable)', si: e => !e.f.docRef, duree: 15, f: { docRef: true }, vers: 'docRef' },
    { t: 'J\'ai de quoi préparer l\'appel d\'organisation', si: e => e.f.docRef, vers: 'appel' },
  ] });

add('docRes', { lieu: 'Bureau', pnj: 'moi', titre: 'Document 8 : les deux résines', fiches: ['vinnapas', 'orgal'],
  texte: `Tu lis les deux fiches techniques côte à côte.\nLa Vinnapas : MFFT de 2 °C, ES 60 %, COV inférieurs à 1 g/L, et la fiche précise qu'elle « n'a besoin d'aucun agent de coalescence ». L'Orgal : ES 50 %, mais MFFT de 20 °C et Tg de 20 °C : il forme un film « au-dessus de 20 °C ».\nUne chose te chagrine : la commande de la cliente promet une peinture « sans solvant, COV nuls » alors qu'une résine à MFFT de 20 °C ne filmifie pas à température ambiante sans agent de coalescence.`,
  choix: [{ t: 'Continuer', vers: 'incoherence' }] });

add('incoherence', { melange: true, lieu: 'Bureau', pnj: 'moi', titre: 'Une incohérence dans le dossier',
  texte: 'Que fais-tu de cette incohérence entre la promesse « COV nuls » de la cliente et la MFFT de 20 °C de l\'Orgal ?',
  choix: [
    { t: 'J\'en parle tout de suite à Mme Dubreuil (5 min)', duree: 5, f: { alerte: true }, note: 'Alerte : la promesse « sans solvant, COV nuls » est incompatible avec l\'Orgal (MFFT 20 °C : coalescent nécessaire). Signalé à Mme Dubreuil.', vers: 'alerteRep' },
    { t: 'Je la note dans mon cahier pour en parler plus tard', f: { alerte: 'plustard' }, note: 'À clarifier : promesse « COV nuls » de la cliente vs coalescent nécessaire avec l\'Orgal.', vers: 'docs' },
    { t: 'Je ne dis rien : on m\'a demandé de changer la résine, pas de discuter la commande', f: { alerte: false }, vers: 'docs' },
  ] });
add('alerteRep', { lieu: 'Bureau', pnj: 'dubreuil', titre: 'Réponse de Mme Dubreuil',
  texte: '« Bien vu. Notre cahier des charges dit COV inférieurs à 30 g/L, pas zéro : ce n\'est pas la même promesse. Je préviendrai la cliente à l\'appel de 15 h, et note-le dans ton rapport. Merci de me prévenir plutôt que de découvrir ça au dernier moment. »',
  choix: [{ t: 'Retourner au dossier', vers: 'docs' }] });

add('docRef', { lieu: 'Bureau', pnj: 'moi', titre: 'Documents 1, 2, 4 et 5 : la référence Vinnapas', fiches: ['formule', 'fabrication'],
  texte: () => { const pf = proprietes(FORMULE_REF, { ph: 'fiche' });
    return `Formule de référence (331 g) : eau 121,7 g, TiO₂ 60 g, CaCO₃ léger 60 g, Vinnapas 83,3 g, Foamex 1,5 g, Coadis BR3 0,2 g, Thixol 1,5 g, Coapur 3 g. Pas de coalescent.\nTableur avec les prises d'huile des fiches (20 et 14 g pour 100 g) : ES = ${nf(pf.ES)} %, CPV = ${nf(pf.CPV)} %, CPVC = ${nf(pf.CPVC)} %, donc λ = ${nf(pf.lambda, 2)}. COV = ${nf(pf.COV)} g/L. Coût matières premières ≈ ${nf(coutKg(FORMULE_REF))} €/kg.\nAnalyses du responsable : pouvoir masquant 7,4 m²/L ; comportement rhéofluidifiant, faible thixotropie ; film continu dès 3 °C.\nÉtonnant : avec λ = ${nf(pf.lambda, 2)} < 0,8, cette peinture ne devrait pas être mate, or elle l'est. Les prises d'huile des fiches sont-elles fiables ?\nFiche de fabrication : 70 % de l'eau, Foamex, Coadis, puis TiO₂ et CaCO₃ en pluie fine à 300 tr/min, dispersion 15 min à vitesse maximale (finesse 7 Hegman) ; ensuite la résine, le Thixol et le Coapur sous agitation lente (200 tr/min), enfin le reste de l'eau.`; },
  choix: [{ t: 'Revenir au dossier', vers: 'docs' }] });

add('appel', { melange: true, lieu: 'Téléphone', pnj: 'dubreuil', titre: 'L\'appel d\'organisation obligatoire',
  texte: e => `Il est ${hhmm(e.t)}. Mme Dubreuil décroche : « Dis-moi comment tu organises ta journée. Rappel : les analyses se délèguent, mais Karim, Inès et Lucas ne peuvent pas tout faire en même temps, et Lucas est très demandé. »`,
  choix: [
    { t: 'Je formule d\'abord, puis je délègue les analyses dès que la peinture est prête', f: { plan: 'seq' }, note: 'Plan : formulation, puis analyses déléguées.', vers: 'regle' },
    { t: 'Je fais d\'abord mesurer les prises d\'huile des poudres par Lucas (la référence « mate » m\'intrigue), pendant que je formule', f: { plan: 'mp' }, note: 'Plan : prises d\'huile des poudres demandées tout de suite à Lucas, formulation en parallèle.',
      run: e => deleguer(e, ANALYSES[0]), vers: 'regle' },
    { t: 'Je fais tout moi-même, je ne veux déranger personne', f: { plan: 'solo' }, note: 'Plan : tout réalisé seul·e.', vers: 'solo' },
  ] });
add('solo', { lieu: 'Téléphone', pnj: 'dubreuil', titre: 'Mme Dubreuil sourit',
  texte: '« Comme tu veux. Mais tu n\'as qu\'une journée, pas une semaine. Et l\'esprit d\'équipe fait partie de ce qu\'on attend. »',
  choix: [{ t: 'Je me mets au travail', vers: 'regle' }] });

// ───────────── Formulation ─────────────
add('regle', { melange: true, lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Que garder constant ?',
  texte: e => `Il est ${hhmm(e.t)}. Karim prépare la balance. « Pour que la nouvelle base ait le même extrait sec, la même CPV et la même CPVC, tu gardes constant quoi, au juste ? »`,
  choix: [
    { t: 'La masse de polymère SEC (50 g) : on ajuste la masse de dispersion et l\'eau', vers: 'calcMasse' },
    { t: 'La masse de dispersion de résine : 83,3 g d\'Orgal à la place de 83,3 g de Vinnapas', vers: 'regleNaif' },
    { t: 'Le volume de liquide apporté par la résine', vers: 'regleNaif' },
  ] });
add('regleNaif', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Karim fronce les sourcils',
  texte: '« Tu es sûr·e ? L\'Orgal est à 50 % d\'extrait sec, la Vinnapas à 60 % : 83,3 g de l\'une n\'apportent pas la même quantité de polymère que 83,3 g de l\'autre. Tu peux tester, mais moi je recalculerais. »',
  choix: [
    { t: 'Tu as raison, je recalcule', vers: 'calcMasse' },
    { t: 'Je teste quand même avec 83,3 g, on verra bien', f: { regle: 'naif' }, note: 'Choix : 83,3 g d\'Orgal à la place de 83,3 g de Vinnapas, sans recalcul.', vers: 'dispersion' },
  ] });
add('calcMasse', { lieu: 'Paillasse de formulation', pnj: 'moi', titre: 'Calcul : masse d\'Orgal',
  texte: 'La Vinnapas de référence (83,3 g, ES 60 %) apporte 50 g de polymère sec. L\'Orgal a un extrait sec de 50 %.',
  calcul: { q: 'Quelle masse de dispersion d\'Orgal faut-il peser ?', unite: 'g', vrai: () => 50 / 0.5, tol: 0.02,
    indice: 'Extrait sec = masse de polymère sec ÷ masse de dispersion. Quelle masse de dispersion à 50 % contient 50 g de sec ?',
    ok: { vers: 'calcEau', note: 'Orgal à peser : 100 g (apporte 50 g de polymère sec).' },
    ko: { vers: 'calcEau', duree: 15, f: { aideCalcul: true }, note: 'Calcul de la masse d\'Orgal fait avec l\'aide de Karim : 100 g.' } } });
add('calcEau', { lieu: 'Paillasse de formulation', pnj: 'moi', titre: 'Calcul : eau à ajuster',
  texte: 'Pour garder le même extrait sec, la masse totale (331,2 g) et celle des autres matières restent les mêmes : l\'Orgal pèse 100 g au lieu de 83,3 g, l\'eau (121,7 g dans la référence) diminue d\'autant. (Le coalescent, s\'il y en a, sera retiré de cette eau.)',
  calcul: { q: 'Quelle masse d\'eau faut-il, avant tout ajout de coalescent ?', unite: 'g', vrai: () => 121.7 - (100 - 83.3), tol: 0.02,
    indice: 'On ajoute 16,7 g de résine en plus ; l\'eau doit diminuer de cette masse pour garder 331,2 g.',
    ok: { f: { regle: 'ok' }, vers: e => e.f.refait ? 'formuleFinale' : 'dispersion', note: 'Eau : 105 g avant coalescent (formule : Orgal 100 g, eau 105 g).' },
    ko: { f: { regle: 'ok' }, duree: 10, vers: e => e.f.refait ? 'formuleFinale' : 'dispersion', note: 'Eau : 105 g avant coalescent (calculée avec l\'aide de Karim).' } } });

add('dispersion', { melange: true, lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Les amas de poudres',
  texte: e => `« Voilà le défaut dont se plaignent les opérateurs : quand on verse le TiO₂ et le CaCO₃ dans l'eau, ça fait des amas durs, et ils passent vingt minutes à les casser. Qu'est-ce que tu corriges dans la formule ? »${e.f.disp1 || e.f.disp2 ? '\n(Karim te rappelle que le dispersant est la matière qui aide à mouiller et séparer les grains.)' : ''}`,
  choix: [
    { t: 'La dose de dispersant (Coadis BR3 : 0,2 g pour 120 g de poudres)', vers: 'calcCoadis' },
    { t: 'Tracer d\'abord la courbe de défloculation du dispersant au viscosimètre', d: '5 min de préparation, puis 2 min par point', duree: 5, note: 'Courbe de défloculation du Coadis BR3 (mélange 50/50 TiO₂ / CaCO₃) demandée à la paillasse.', vers: 'stationCourbe' },
    { t: 'La vitesse d\'agitation', si: e => !e.f.disp1, duree: 10, f: { disp1: true }, note: 'Idée écartée : augmenter la vitesse (déjà au maximum dans la fiche).', vers: 'dispRep1' },
    { t: 'La quantité d\'eau de départ', si: e => !e.f.disp2, duree: 10, f: { disp2: true }, note: 'Idée écartée : plus d\'eau au départ (change l\'ES et la rhéologie).', vers: 'dispRep2' },
  ] });
add('dispRep1', { lieu: 'Paillasse', pnj: 'karim', titre: 'Karim', texte: '« La fiche prévoit déjà la vitesse maximale pendant 15 minutes. On ne peut pas aller plus vite que la machine. Cherche du côté de la formule. »', choix: [{ t: 'Reprendre', vers: 'dispersion' }] });
add('dispRep2', { lieu: 'Paillasse', pnj: 'karim', titre: 'Karim', texte: '« Plus d\'eau, c\'est changer l\'extrait sec et la viscosité, et ça ne s\'attaque pas à la cause : les grains ne sont pas assez mouillés et séparés. Cherche du côté de l\'additif qui sert à ça. »', choix: [{ t: 'Reprendre', vers: 'dispersion' }] });
add('calcCoadis', { lieu: 'Paillasse', pnj: 'moi', titre: 'Calcul : dose de dispersant', fiches: ['coadis'],
  texte: 'Le Coadis BR3 a un extrait sec de 40 %. La fiche technique recommande 0,15 à 0,20 % de matière active par rapport à la masse de poudres (TiO₂ + CaCO₃ = 120 g). Dose actuelle : 0,2 g de Coadis BR3, soit 0,067 %.',
  calcul: { q: 'Quelle masse de Coadis BR3 pèses-tu (visant le milieu de la plage, 0,175 %) ?', unite: 'g', vrai: () => 0.00175 * 120 / 0.4, tol: 0.15,
    indice: 'Matière active = masse de Coadis × 0,40. Il faut 0,175 % de 120 g de poudres comme matière active.',
    retour: v => v >= 1 ? 'Attention : à cette dose, le dispersant est très en excès (surdosage : film sensible à l\'eau, mousse, coût). Revois le calcul.' : null,
    ok: { f: { coadis: 0.525 }, vers: 'coalescent', note: 'Dispersant relevé à 0,525 g de Coadis BR3 (0,175 % de matière active sur les poudres) pour supprimer les amas.' },
    ko: { f: { coadis: 0.5 }, vers: 'coalescent', duree: 10, note: 'Dispersant relevé à 0,5 g de Coadis BR3 (valeur donnée par Karim).' } } });

// ───────────── Station : courbe de défloculation du dispersant ─────────────
export const INDICES_COURBE = [
  'Karim : « La fiche du Coadis BR3 donne 0,15 à 0,20 % de matière active sur les poudres. Commence autour de cette plage, et vérifie-la plutôt que de la croire. »',
  'Karim : « Trace la viscosité en fonction du % de dispersant. Cherche où la courbe cesse de baisser : c\'est le point d\'écoulement, la dose optimale. Au-delà, tu ajoutes du produit pour rien. »',
  'Karim : « Avec une lecture à ± 4 %, deux points qui diffèrent de moins de 10 % sur le plateau sont indiscernables. Pas la peine d\'aller chercher plus loin. »',
];
export function essaiCourbe(e, x) {
  const c = e.f.courbe || [];
  if (c.length >= COURBE_MAX || !DOSES_COURBE.includes(x)) return e;
  const v = lectureVisco(x, e.f.dem ?? 1, e.f.graine ?? 1, c.length + 1);
  return { ...e, t: e.t + COURBE_DUREE, f: { ...e.f, courbe: [...c, { x, g: masseCoadis(x), v258: v ? v[0] : null, v129: v ? v[1] : null }] } };
}
export const indiceCourbe = e => (e.f.indC || 0) >= INDICES_COURBE.length ? e : { ...e, t: e.t + 5, f: { ...e.f, indC: (e.f.indC || 0) + 1 } };

add('stationCourbe', { lieu: 'Paillasse', pnj: 'karim', titre: 'Courbe de défloculation', station: 'courbe',
  texte: 'Karim sort le disperseur et le viscosimètre à haut gradient. « Même protocole que pour nos essais de dosologie : 250 g de poudres, moitié TiO₂ moitié CaCO₃ léger, l\'eau juste nécessaire pour mouiller, et on ajoute le Coadis BR3 par petites quantités. Après chaque ajout : 2 minutes de dispersion, puis la viscosité à deux gradients. Quand la viscosité ne baisse plus, on a la dose optimale. »\n« Trop peu de dispersant et la pâte est trop épaisse pour être mesurée. »',
  choix: e => DOSES_COURBE.map(x => ({ x, t: `Retenir ${String(x).replace(".", ",")} % de dispersant`, f: { coadis: Math.round(masseCoadis(x, 120) * 100) / 100, dispPct: x, dispCourbe: true }, note: `Dose de Coadis BR3 retenue après ${(e.f.courbe || []).length} point(s) de courbe : ${String(x).replace('.', ',')} % de matière active (${nf(masseCoadis(x, 120), 2)} g pour 120 g de poudres).`, vers: 'debriefCourbe' })) });

add('debriefCourbe', { lieu: 'Paillasse', pnj: 'karim', titre: 'Ce que dit la courbe',
  texte: e => `Tu retiens ${nf(e.f.dispPct ?? 0, 2)} % de matière active, soit ${nf(e.f.coadis ?? 0, 2)} g de Coadis BR3 pour 120 g de poudres (extrait sec 40 %).`,
  debrief: e => {
    const x = e.f.dispPct ?? 0, dem = e.f.dem ?? 1, xe = x / dem, c = e.f.courbe || [], L = [];
    const lis = c.filter(p => p.v258 != null), hors = c.filter(p => p.v258 == null);
    if (xe >= BORNE_SEUIL && x <= BORNE_HAUTE) L.push({ ok: true, t: vari(e, 'c-ok', [`${nf(x, 2)} % est sur le plateau de la courbe : les poudres sont défloculées, la viscosité ne baisse presque plus. Dose conforme à la fiche (0,15 à 0,20 %).`, `Bien vu : à ${nf(x, 2)} %, la courbe est à plat, donc ajouter du dispersant ne changerait presque rien. C'est cohérent avec la fiche (0,15 à 0,20 %).`, `Dose de ${nf(x, 2)} % : tu es au niveau du plateau, là où les grains sont couverts. La fiche donne la même fourchette (0,15 à 0,20 %).`]) });
    else if (xe >= BORNE_BASSE && xe < BORNE_SEUIL) L.push({ ok: null, t: `${nf(x, 2)} % est encore sur la pente de la courbe : ça passe, mais une petite erreur de pesée ferait remonter la viscosité. Il vaut mieux se placer au début du plateau.` });
    else if (x > BORNE_HAUTE) L.push({ ok: null, t: `${nf(x, 2)} % est loin sur le plateau : la viscosité n'a presque plus changé depuis 0,2 %. La fiche précise qu'une légère surdose est sans effet, mais tu paies du dispersant inutile (et un excès rend le film plus sensible à l'eau).` });
    else L.push({ ok: false, t: `${vari(e, 'c-bas', [`${nf(x, 2)} % est trop bas : les poudres ne sont pas assez défloculées.`, `À ${nf(x, 2)} %, on est encore sur la pente : des grains restent agglomérés.`, `Avec ${nf(x, 2)} %, la défloculation est incomplète.`])} ${cer(e, 'c-bas2', 'il manque du dispersant pour couvrir les grains.', 'amas, viscosité élevée à bas gradient, thixotropie.', 'monter jusqu\'au début du plateau (autour de 0,17 à 0,20 %).')}` });
    if (!lis.length) L.push({ ok: false, t: vari(e, 'c-aucun', ['Tu n\'as obtenu aucun point mesurable : la dose a été choisie sans courbe. La dose optimale se mesure sur la courbe de défloculation, elle ne se devine pas.', 'Aucun point mesurable : sans courbe, la dose reste un pari. C\'est la courbe de défloculation qui désigne la dose, pas l\'intuition.']) });
    else {
      L.push({ ok: lis.length >= 4, t: `${c.length} ajout${c.length > 1 ? 's' : ''}, ${lis.length} point${lis.length > 1 ? 's' : ''} mesurable${lis.length > 1 ? 's' : ''}${hors.length ? `, ${hors.length} hors gamme (viscosité trop élevée pour le viscosimètre)` : ''}.${lis.length < 4 ? ' Pour repérer le point d\'écoulement, il faut des points de part et d\'autre : au moins 4.' : ''}` });
      L.push({ ok: null, t: `Seuil de défloculation de ce lot de poudres : environ ${nf(0.19 * dem, 2)} % (la fiche annonce 0,15 à 0,20 %). Les deux gradients donnent le même seuil ; la viscosité est plus forte à 129 s⁻¹ qu'à 258 s⁻¹ : la peinture est rhéofluidifiante.` });
    }
    const plat = lis.filter(p => p.x / dem >= BORNE_SEUIL).length;
    L.push(plat >= 2 ? { ok: true, t: 'Tu as vérifié que la viscosité ne baisse plus sur le plateau. Avec une lecture à ± 4 % (hypothèse du scénario), des écarts de moins de 10 % entre deux points voisins ne sont pas significatifs.' } : { ok: null, t: 'Métrologie : sans au moins deux points sur le plateau, tu ne sais pas si la baisse est vraiment terminée (la lecture a une dispersion d\'environ 4 %).' });
    if ((e.f.indC || 0) > 0) L.push({ ok: null, t: `Tu as demandé ${e.f.indC} coup(s) de pouce à Karim (5 min chacun).` });
    return L;
  },
  choix: () => [{ t: 'Passer à la suite', vers: 'coalescent' }] });

add('coalescent', { melange: true, lieu: 'Paillasse', pnj: 'karim', titre: 'Et le coalescent ?', fiches: ['dpnb'],
  texte: e => `« La Vinnapas filmifiait toute seule : sa MFFT est de 2 °C, donc la référence n'a pas d'agent de coalescence. L'Orgal, lui, a une MFFT de 20 °C. Notre cahier des charges veut un film continu dès 5 °C. Qu'est-ce qu'on met dans la formule ? »\n${e.f.fiche ? 'Tu te souviens de la fiche : MFFT de 2 °C pour la Vinnapas, 20 °C pour l\'Orgal.' : 'Tu n\'as pas lu la fiche de la résine : Karim te la tend. « MFFT de la Vinnapas : 2 °C ; celle de l\'Orgal : 20 °C. »'}\nKarim ajoute : « La fiche du DPnB ne donne aucun dosage. Chez nous, la règle d'atelier est de 4 à 8 % du polymère sec, à confirmer par un essai. »`,
  choix: e => { const v = e.f.refaitCoal ? 'formuleFinale' : 'stock'; return [
    { t: 'Rien : la référence n\'en avait pas, et ça garde les COV à zéro', f: { dpnb: 0 }, note: 'Pas de coalescent ajouté (la référence Vinnapas n\'en avait pas).', vers: v },
    { t: 'Ajouter 1 g par précaution, sans calcul', f: { dpnb: 1 }, note: 'Coalescent (DPnB) ajouté à 1 g, sans calcul.', vers: v },
    { t: 'Calculer la dose avec la règle d\'atelier de Karim (4 à 8 % du polymère sec)', vers: 'calcDpnb' },
    { t: 'Faire d\'abord un pré-essai au banc TMFF avec Lucas', d: '5 min de préparation, puis 5 min par essai', duree: 5, note: 'Pré-essai au banc TMFF demandé à Lucas.', vers: 'stationBanc' },
    { t: 'Mettre 10 g : on sera tranquille pour la filmification', f: { dpnb: 10 }, note: 'Coalescent (DPnB) mis à 10 g « par sécurité ».', vers: v },
  ]; } });
add('calcDpnb', { lieu: 'Paillasse', pnj: 'moi', titre: 'Calcul : dose de coalescent',
  texte: 'Les 100 g d\'Orgal apportent 50 g de polymère sec. La règle d\'atelier de Karim est de 4 à 8 % de la masse de polymère sec ; tu vises le milieu de la plage, 6 %.',
  calcul: { q: 'Quelle masse de DPnB pèses-tu ?', unite: 'g', vrai: () => 0.06 * 50, tol: 0.17,
    indice: 'Masse de DPnB = 6 % × masse de polymère sec (50 g, pas 100 g de dispersion).',
    retour: v => v >= 6 ? 'Attention : ce n\'est pas 6 % de la dispersion mais du polymère sec (50 g). Une telle dose ferait monter les COV.' : null,
    ok: { f: { dpnb: 3 }, vers: e => e.f.refaitCoal ? 'formuleFinale' : 'stock', note: 'Coalescent : 3 g de DPnB (6 % du polymère sec), retirés de l\'eau (102 g).' },
    ko: { f: { dpnb: 3 }, vers: e => e.f.refaitCoal ? 'formuleFinale' : 'stock', duree: 10, note: 'Coalescent : 3 g de DPnB (valeur donnée par Karim), retirés de l\'eau.' } } });

// ───────────── Station : le banc à gradient de température (TMFF) ─────────────
// Paramètre caché : l'efficacité du coalescent (e.f.eff, °C par %), tirée au début de la partie. L'élève la déduit de ses essais.
export const INDICES_BANC = [
  'Karim : « Rappelle-toi la règle d\'atelier : entre 4 et 8 % du polymère sec. Commence par une dose dans cette plage, puis encadre-la. »',
  'Karim : « Une seule mesure ne dit rien : trace la TMFF en fonction du % de coalescent. Si les points sont alignés, la pente te donne l\'efficacité du coalescent. »',
  'Karim : « Il faut TMFF ≤ 5 °C ET COV < 30 g/L. Avec 3 g, tu es dans la fenêtre pour ce lot, mais vérifie-le au banc, la lecture a une dispersion. »',
];
export function essaiBanc(e, g) {
  const banc = e.f.banc || [];
  if (banc.length >= ESSAIS_MAX || !DOSES_BANC.includes(g)) return e;
  const p = prop({ ...e, f: { ...e.f, dpnb: g } });
  const m = { g, pct: p.pctCoalescent, tmff: lectureBanc(p.tmff, e.f.graine ?? 1, banc.length + 1), cov: p.COV };
  return { ...e, t: e.t + DUREE_ESSAI, f: { ...e.f, banc: [...banc, m] } };
}
export const indiceBanc = e => (e.f.indB || 0) >= INDICES_BANC.length ? e : { ...e, t: e.t + 5, f: { ...e.f, indB: (e.f.indB || 0) + 1 } };
const apresCoal = e => e.f.refaitCoal ? 'formuleFinale' : 'stock';

add('stationBanc', { lieu: 'Paillasse', pnj: 'lucas', titre: 'Banc à gradient de température', station: 'banc',
  texte: 'Lucas t\'a installé le banc : une plaque métallique chauffée à une extrémité et refroidie à l\'autre. Tu prépares un petit essai de peinture pour chaque dose, tu l\'étales en bande sur la plaque, tu la laisses sécher, puis tu lis la température où le film devient continu : au-dessus, il est lisse ; au-dessous, il craquelle et poudre.\n« Chaque essai prend 5 minutes. Choisis la dose de DPnB, lis la TMFF, et décide. »',
  choix: e => DOSES_BANC.map(g => ({ g, t: `Retenir ${g} g de DPnB`, f: { dpnb: g, preEssai: true }, note: `Dose retenue après ${(e.f.banc || []).length} essai(s) au banc : ${nf(g, 0)} g de DPnB.`, vers: 'debriefBanc' })) });

// Débrief : ce qui est juste, ce qui ne l'est pas, ce qu'il faut en retenir (cause → effet → remède)
add('debriefBanc', { lieu: 'Paillasse', pnj: 'lucas', titre: 'Ce que dit le banc',
  texte: e => { const g = e.f.dpnb ?? 0; return `Tu retiens ${nf(g, 0)} g de DPnB. Lucas range le banc et regarde tes feuilles de mesures.`; },
  debrief: e => {
    const g = e.f.dpnb ?? 0, p = prop(e), banc = e.f.banc || [], pts = penteMesuree(banc), vraie = e.f.eff ?? 3, L = [];
    L.push(tmffOk(e) ? { ok: true, t: vari(e, 'b-tmff', [`TMFF de la formule retenue : environ ${nf(Math.max(0, p.tmff), 0)} °C, sous la limite de ${TMFF_MAX} °C.`, `Le film se forme dès ${nf(Math.max(0, p.tmff), 0)} °C environ : la limite de ${TMFF_MAX} °C est respectée.`, `Avec cette dose, la TMFF tombe vers ${nf(Math.max(0, p.tmff), 0)} °C, sous les ${TMFF_MAX} °C exigés.`]) } : { ok: false, t: `TMFF de la formule retenue : environ ${nf(Math.max(0, p.tmff), 0)} °C, au-dessus de ${TMFF_MAX} °C. ${cer(e, 'b-tmff2', 'trop peu de coalescent pour l\'Orgal (MFFT 20 °C).', 'la peinture craquellerait sur un mur froid.', 'relever la dose.')}` });
    L.push(covOk(e) ? { ok: true, t: vari(e, 'b-cov', [`COV : ${nf(p.COV, 0)} g/L, sous la limite de ${COV_MAX} g/L.`, `Côté environnement, ${nf(p.COV, 0)} g/L de COV : c'est sous les ${COV_MAX} g/L du cahier des charges.`]) } : { ok: false, t: `COV : ${nf(p.COV, 0)} g/L, au-dessus de ${COV_MAX} g/L. ${cer(e, 'b-cov2', 'trop de coalescent (le DPnB est le seul composé volatil de la formule).', 'l\'étiquette environnementale est hors cahier des charges.', 'redescendre la dose.')}` });
    if (!banc.length) L.push({ ok: false, t: vari(e, 'b-aucun', ['Tu n\'as fait aucun essai : la dose a été choisie sans mesure. Au banc, l\'efficacité du coalescent se mesure ; elle ne se devine pas.', 'Aucun essai au banc : la dose est une supposition. L\'efficacité du coalescent sur ce lot ne se connaît que par la mesure.']) });
    else if (pts) L.push({ ok: Math.abs(pts.efficacite - vraie) < 0.5, t: `Pente mesurée : ${nf(pts.efficacite, 1)}${pts.incertitude != null ? ` ± ${nf(pts.incertitude, 1)}` : ''} °C par % de coalescent (${pts.n} points). Valeur réelle du lot : ${nf(vraie, 1)} °C/%. ${Math.abs(pts.efficacite - vraie) < 0.5 ? 'La régression retrouve la bonne efficacité.' : 'L\'écart vient de la dispersion de lecture du banc (± 0,4 °C) : plus de points et des doses plus écartées réduisent l\'incertitude.'}` });
    else L.push({ ok: null, t: `Pour estimer la pente (efficacité du coalescent), il faut au moins 3 points exploitables sur 2 doses différentes.${banc.some(x => x.tmff == null) ? ' Les doses fortes donnent un film continu sur toute la plaque (< 0 °C) : le banc ne peut pas les lire, ces points ne servent pas à la pente. Choisis des doses qui restent dans la plage du banc (0 à 25 °C).' : ' Avec trop peu de points, tu ne connais pas la tendance.'}` });
    const rep = banc.some((x, i) => banc.findIndex(y => y.g === x.g) !== i);
    L.push(rep ? { ok: true, t: 'Tu as répété une dose : tu as vu que deux lectures de la même peinture ne sont pas identiques. C\'est la répétabilité du banc.' } : { ok: null, t: 'Métrologie : tu n\'as testé chaque dose qu\'une fois, sans voir la dispersion des lectures. Une répétition d\'une même dose l\'aurait montrée.' });
    if ((e.f.indB || 0) > 0) L.push({ ok: null, t: `Tu as demandé ${e.f.indB} coup(s) de pouce à Karim (5 min chacun).` });
    L.push({ ok: null, t: `Pour mémoire, la dose retenue (${nf(g, 0)} g) représente ${nf(p.pctCoalescent, 1)} % du polymère sec.` });
    return L;
  },
  choix: e => [{ t: 'Passer à la suite', vers: apresCoal(e) }] });

// ───────────── Matière première : le fût d'Orgal a-t-il gelé ? ─────────────
add('stock', { melange: true, lieu: 'Local de stockage', pnj: 'karim', titre: 'Le fût d\'Orgal',
  texte: 'Karim revient du local de stockage, un peu gêné.\n« Au fait, le fût d\'Orgal est resté dans le local non chauffé ce week-end. Il a fait −5 °C cette nuit. Je ne sais pas si ça compte… »',
  choix: [
    { t: 'Je contrôle le fût : aspect et tamisage sur 100 µm (15 min)', duree: 15, f: { stockCtrl: true }, note: 'Contrôle du fût d\'Orgal (stocké dans un local non chauffé, −5 °C).', vers: 'stockRes' },
    { t: 'On l\'utilise comme ça : on gagne du temps', vers: 'stockAlerte' },
  ] });
add('stockAlerte', { melange: true, lieu: 'Local de stockage', pnj: 'karim', titre: 'Karim insiste',
  texte: '« Une dispersion de copolymère styrène-acrylique n\'aime pas le gel : les particules peuvent coaguler. Du coagulum dans la peinture, ça se voit à la jauge Hegman et ça fausse toutes tes mesures. On vérifie, ça prend un quart d\'heure. »',
  choix: [
    { t: 'Tu as raison, je contrôle le fût (15 min)', duree: 15, f: { stockCtrl: true, stockAlerte: true }, note: 'Contrôle du fût d\'Orgal, à la demande de Karim.', vers: 'stockRes' },
    { t: 'Je n\'ai pas le temps, on l\'utilise', vers: 'fin_matiere' },
  ] });
add('stockRes', { lieu: 'Local de stockage', pnj: 'karim', titre: 'Résultat du contrôle',
  texte: 'Au tamisage sur 100 µm, il reste des grumeaux de coagulum : une partie de la dispersion a gelé.\n« Voilà. C\'est écrit sur la fiche : à protéger du gel. »',
  choix: e => [
    { t: `Demander un fût neuf à M. Perrin (livré vers ${hhmm(e.t + 40)} : 40 min d'attente avant de fabriquer)`, duree: 40, f: { stock: 'neuf' }, note: 'Fût d\'Orgal gelé écarté ; fût neuf commandé à M. Perrin.', vers: 'formuleFinale' },
    { t: 'Tamiser la dispersion et l\'utiliser quand même', duree: 10, f: { stock: 'tamise', lotDouteux: true }, note: 'Dispersion d\'Orgal tamisée (coagulum retiré) et utilisée malgré le gel.', vers: 'formuleFinale' },
  ] });
add('fin_matiere', { lieu: 'Local de stockage', pnj: 'karim', titre: 'Une peinture bâtie sur un lot dégradé', fin: { ton: 'ko', titre: 'Lot douteux utilisé' },
  texte: e => `Il est ${hhmm(e.t)}. Tu as utilisé la dispersion d'Orgal sans contrôler qu'elle avait gelé. La peinture est pleine de grains, la finesse est mauvaise, les mesures sont aberrantes et les résultats du rapport ne veulent rien dire. Mme Dubreuil : « Contrôler une matière première avant de s'en servir, c'est le B.A.-BA. On refait tout demain avec un fût neuf. »`,
  choix: [] });

add('formuleFinale', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Ta formule finale', station: 'formule',
  entree: e => ({ ...e, f: { ...e.f, fm: undefined } }),
  texte: e => `Il est ${hhmm(e.t)}. Karim te tend la feuille de pesée.\n« Avant de peser, pose ta formule noir sur blanc. Tout ce que tu as décidé jusqu'ici y est reporté, mais c'est toi qui signes : tu peux encore changer une masse. Le cahier des charges ne se discute pas, lui. »${e.f.refaitCoal || e.f.refaitForm || e.f.refait ? '\n(Tu refais la peinture : c\'est le moment de corriger ce qui ne va pas.)' : ''}`,
  choix: e => [validerFormule(e, fmDepuisFlags(e)).choix] });
add('fabrication', { melange: true, lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Fabriquer 300 g de peinture',
  texte: e => `Il est ${hhmm(e.t)}. La défloculeuse est prête, la balance aussi. Comment fabriques-tu la peinture ?`,
  choix: [
    { t: 'Je suis la fiche de fabrication : 70 % de l\'eau, antimousse, dispersant, poudres en pluie fine, dispersion de 15 min, puis résine, coalescent et additifs, puis le reste de l\'eau (75 min)', duree: 75, f: { fabrique: true }, note: 'Peinture fabriquée selon la fiche (dispersion de 15 min à vitesse maximale).', vers: 'cahier' },
    { t: 'Je mets tout dans le bécher et je disperse : ça gagnera du temps (40 min)', duree: 40, f: { rate: true }, vers: 'rate' },
  ] });
add('rate', { lieu: 'Paillasse', pnj: 'karim', titre: 'Le résultat n\'est pas beau',
  texte: 'La peinture a mousse, des grumeaux, et la jauge Hegman indique 4 : finesse de 40 µm. « Je t\'avais dit de suivre l\'ordre : sans lui, les poudres ne sont pas mouillées. Il faut tout refaire. »',
  choix: [{ t: 'Tout refaire proprement (75 min)', duree: 75, f: { fabrique: true }, note: 'Première fabrication ratée (ordre d\'introduction non respecté), refaite selon la fiche.', vers: 'cahier' }] });
add('cahier', { melange: true, lieu: 'Paillasse', pnj: 'moi', titre: 'Le cahier de laboratoire',
  texte: 'La peinture est prête dans le bécher. Tu as les mains encore collantes et un carnet ouvert.',
  choix: [
    { t: 'Je note maintenant le lot, les pesées réelles et mes observations (5 min)', duree: 5, f: { trace: true }, note: 'Lot ORG-01 fabriqué : pesées réelles et observations consignées dans le cahier.', vers: 'labo' },
    { t: 'Je noterai ça en rédigeant le rapport, de mémoire', f: { trace: false }, vers: 'labo' },
  ] });

// ───────────── Résultats d'analyses ─────────────
add('res_huile', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : prises d\'huile des poudres',
  texte: e => { const pm = prop(e, { ph: 'mesuree' }), pf = prop(e, { ph: 'fiche' }), m = e.f.phMes || { tio2: 25, caco3: 30 };
    const lis = e.f.huileMoi ? `Tu as mesuré toi-même, à la spatule (ISO 787-5) : TiO₂ ${nf(m.tio2, 1)} g d'huile pour 100 g (la fiche annonçait 20), CaCO₃ léger ${nf(m.caco3, 1)} g pour 100 g (la fiche annonçait 14). Tes poudres absorbent bien plus d'huile que sur les fiches.`
      : `Lucas, méthode à la spatule (ISO 787-5) : « TiO₂ : 25 g d'huile pour 100 g (la fiche annonçait 20). CaCO₃ léger : 30 g pour 100 g (la fiche annonçait 14). Nos poudres absorbent bien plus d'huile que sur les fiches. »`;
    return `${lis}\nAvec les valeurs des fiches, λ valait ${nf(pf.lambda, 2)} (CPVC = ${nf(pf.CPVC)} %). Avec les valeurs mesurées, le tableur donne CPVC = ${nf(pm.CPVC)} %.`; },
  visuel: e => ({ type: 'huile', fiche: [20, 14], mesure: e.f.phMes ? [Math.round(e.f.phMes.tio2), Math.round(e.f.phMes.caco3)] : [25, 30] }),
  debrief: e => {
    if (!e.f.huileMoi) return [];
    const L = [], ess = e.f.huileEssais || [];
    for (const k of ['tio2', 'caco3']) {
      const r = huileRetenue(e, k), nom = k === 'tio2' ? 'TiO₂' : 'CaCO₃', vrai = phVrai(e, k);
      if (!r) { L.push({ ok: false, t: `${nom} : aucune détermination valide, valeur par défaut utilisée.` }); continue; }
      const bon = Math.abs(r.ph - vrai) <= 0.06 * vrai;
      L.push({ ok: bon, t: `${nom} : ${nf(r.ph, 1)} g/100 g (${r.n} détermination${r.n > 1 ? 's' : ''}${r.ecart != null ? `, écart ${nf(r.ecart, 1)}` : ''}). Valeur réelle du lot : ${nf(vrai, 1)} g/100 g.${bon ? '' : ' Écart important : le point final a probablement été jugé trop tôt ou trop tard.'}` });
    }
    const rate = ess.filter(m => !m.ok).length;
    L.push(rate ? { ok: null, t: `${rate} détermination${rate > 1 ? 's' : ''} ratée${rate > 1 ? 's' : ''} (point final dépassé) : chacune a coûté ${HUILE_DUREE} min et une prise de poudre. Finir goutte à goutte évite de tout refaire.` } : { ok: true, t: 'Aucun point final dépassé : tu as fini goutte à goutte.' });
    const rep = ['tio2', 'caco3'].some(k => (huileRetenue(e, k)?.n || 0) >= 2);
    L.push(rep ? { ok: true, t: 'Tu as répété une détermination : l\'écart entre deux mesures donne une idée de la dispersion de la méthode (jugement du point final, hypothèse d\'environ ± 4 %).' } : { ok: null, t: 'Métrologie : une seule détermination par poudre ne donne aucune idée de la dispersion de la méthode, qui dépend du jugement de l\'opérateur (environ ± 4 % dans ce scénario).' });
    return L;
  },
  calcul: { q: 'Quelle est la valeur de λ = CPV / CPVC de ta formule avec les prises d\'huile mesurées ?', unite: '', vrai: e => prop(e, { ph: 'mesuree' }).lambda, tol: 0.03,
    indice: 'CPV vaut environ 42 % pour ta formule. Utilise la CPVC calculée avec les prises d\'huile mesurées (affichée plus haut) : λ = CPV ÷ CPVC.',
    ok: { f: { mes_huile: true }, vers: 'labo', note: 'Prises d\'huile mesurées : TiO₂ 25, CaCO₃ 30 g/100 g (fiches : 20 et 14). Avec ces valeurs, λ ≈ 0,85 : peinture mate, comme observé.' },
    ko: { f: { mes_huile: true }, vers: 'labo', duree: 10, note: 'Prises d\'huile mesurées ; λ recalculé avec l\'aide de Lucas (≈ 1).' } } });
// ───────────── Station : prises d'huile à la spatule (faites soi-même) ─────────────
// Paramètre caché : e.f.ph = prises d'huile réelles du lot de poudres. L'élève les mesure ; son résultat alimente le calcul de λ.
export const phVrai = (e, poudre) => e.f.ph?.[poudre] ?? (poudre === 'tio2' ? 25 : 30);
export function conclureHuile(e, poudre, huile) {
  const essais = (e.f.huileEssais || []).length;
  if (essais >= HUILE_MAX_ESSAIS) return { etat: e, ok: false, message: 'Tu as épuisé tes essais : la poudre et l\'huile de ce lot sont terminées.' };
  const rap = rapportPate(huile, phVrai(e, poudre)), ep = etatPate(rap), ok = ep.cle === 'fin', ph = Math.round(huile / M_POUDRE * 1000) / 10;
  const message = ok ? `Prise d'huile = ${nf(huile, 2)} g ÷ ${M_POUDRE} g × 100 = ${nf(ph, 1)} g pour 100 g.`
    : ep.cle === 'fluide' ? `Le point final est dépassé : la pâte est trop fluide. ${cer(e, 'h-fluide', 'trop d\'huile ajoutée d\'un coup.', 'la prise d\'huile serait surestimée.', 'recommencer avec une poudre neuve, en finissant goutte à goutte.')}`
    : 'Pas de pâte cohérente : le point final n\'est pas atteint, la valeur serait sous-estimée. Continue d\'ajouter de l\'huile, de plus en plus lentement.';
  const t = ok || ep.cle === 'fluide' ? HUILE_DUREE : 0;
  const mesure = { poudre, huile, ph: ok ? ph : null, ok };
  return { ok, message, etat: ok || ep.cle === 'fluide' ? { ...e, t: e.t + t, f: { ...e.f, huileEssais: [...(e.f.huileEssais || []), mesure] } } : e };
}
// Résultat retenu pour une poudre : moyenne des déterminations valides (null s'il n'y en a pas)
export function huileRetenue(e, poudre) {
  const v = (e.f.huileEssais || []).filter(m => m.poudre === poudre && m.ok).map(m => m.ph);
  return v.length ? { ph: v.reduce((a, b) => a + b, 0) / v.length, n: v.length, ecart: v.length > 1 ? Math.max(...v) - Math.min(...v) : null } : null;
}
add('stationHuile', { lieu: 'Paillasse', pnj: 'moi', titre: 'Prises d\'huile à la spatule', station: 'huile', fiches: ['durcal'],
  texte: 'Tu prépares la plaque de verre, la spatule et l\'huile de lin. Pour chaque poudre : 10 g, on ajoute l\'huile par petites quantités en malaxant, jusqu\'à une pâte lisse et cohérente qui ne se brise pas. Ce point final se détecte à l\'œil et à la spatule : il demande un peu de doigté.',
  choix: () => [{ t: 'Consigner les prises d\'huile et calculer λ', f: { huileMoi: true }, note: 'Prises d\'huile mesurées moi-même à la spatule (ISO 787-5).',
    run: n => { const T = huileRetenue(n, 'tio2'), C = huileRetenue(n, 'caco3'); return { ...n, f: { ...n.f, phMes: { tio2: T ? T.ph : 25, caco3: C ? C.ph : 30 } }, cmd: { ...n.cmd, huile: { pret: n.t, lu: true } } }; }, vers: 'res_huile' }] });

// ───────────── Dosage du DPnB dans la peinture (contrôle du COV) : choix de la technique, puis station CPG-FID ─────────────
// Besoin du scénario : le cahier des charges impose COV < 30 g/L ; jusqu'ici, le COV est CALCULÉ d'après la formule. Le contrôle qualité le vérifie sur la peinture fabriquée.
export const cEch = e => cEchantillon(covDe(e), prop(e).densite, e.f.graine ?? 1);
export const C_CTRL = 1.2;   // mg/mL : solution de contrôle préparée indépendamment des étalons (vérification de la justesse)
const cpgInit = { etal: [], ech: [], ctrl: [], prep: false, mode: 'interne' };
export const cpgDe = e => ({ ...cpgInit, ...(e.f.cpg || {}) });
const avecCpg = (e, c, dt = 0) => ({ ...e, t: e.t + dt, f: { ...e.f, cpg: { ...cpgDe(e), ...c } } });
export function injecterEtalon(e, c) {
  const g = cpgDe(e);
  if (g.etal.length >= ETAL_MAX || !NIVEAUX_ETALON.includes(c)) return e;
  const inj = injection(e.f.graine ?? 1, g.etal.length + g.ech.length + 1, c, e.f.rf ?? 1);
  return avecCpg(e, { etal: [...g.etal, { c, ...inj }] }, T_INJ);
}
export const preparerEchantillon = e => cpgDe(e).prep ? e : avecCpg(e, { prep: true }, T_PREP);
export function injecterEchantillon(e) {
  const g = cpgDe(e);
  if (!g.prep || g.ech.length >= ECH_MAX) return e;
  const inj = injection(e.f.graine ?? 1, g.etal.length + g.ech.length + 1, cEch(e), e.f.rf ?? 1);
  return avecCpg(e, { ech: [...g.ech, inj] }, T_INJ);
}
export function injecterControle(e) {
  const g = cpgDe(e);
  if (g.ctrl.length >= 2) return e;
  const inj = injection(e.f.graine ?? 1, 100 + g.ctrl.length, C_CTRL, e.f.rf ?? 1);
  return avecCpg(e, { ctrl: [...g.ctrl, inj] }, T_INJ);
}
// Justesse : taux de récupération de la solution de contrôle quantifiée avec la droite courante (100 % = juste)
export function recuperation(e) {
  const g = cpgDe(e), D = new Set(g.etal.map(p => p.c)).size >= 3 ? etalonnage(g.etal, g.mode) : null;
  if (!D || !g.ctrl.length) return null;
  const d = dosage(D, g.ctrl, g.mode);
  return d ? { taux: d.x0 / C_CTRL * 100, n: g.ctrl.length } : null;
}
export const choisirModeCpg = (e, mode) => avecCpg(e, { mode });
export const verdictCov = (cov, U) => cov + U < COV_MAX ? 'conforme' : cov - U > COV_MAX ? 'non conforme' : 'indéterminé (la limite est dans l\'incertitude)';
export function resultatCpg(e) {
  const g = cpgDe(e), niveaux = new Set(g.etal.map(p => p.c)), D = niveaux.size >= 3 ? etalonnage(g.etal, g.mode) : null;
  const dos = D && g.ech.length ? dosage(D, g.ech, g.mode) : null;
  if (!dos) return { D, dos: null };
  const rho = prop(e).densite, cov = covDepuisC(dos.x0, rho), U = 2 * covDepuisC(dos.u, rho);
  return { D, dos, cov, U, rho };
}

const TECHNIQUES = [
  { cle: 'cpg', t: 'Chromatographie en phase gazeuse avec détecteur FID, avec un étalon interne' },
  { cle: 'clhp', t: 'Chromatographie liquide (CLHP) avec détecteur UV' },
  { cle: 'uv', t: 'Spectrophotométrie UV-visible directe sur la peinture diluée' },
  { cle: 'masse', t: 'Dosage par différence de pesée : on sèche un échantillon à l\'étuve et on regarde la perte de masse' },
];
const IMPASSES = {
  clhp: 'Le DPnB est un éther de glycol : aucune double liaison conjuguée, donc pas de chromophore. À 254 nm, il est invisible ; en dessous de 210 nm, la peinture diluée (tensioactifs, additifs) absorbe bien plus que lui. Cause : détecteur UV inadapté à la molécule. Effet : aucun pic exploitable. Remède : choisir une technique où le DPnB répond, par exemple un détecteur universel ou, mieux ici, la CPG (le DPnB est volatil : téb. ≈ 230 °C) avec un FID.',
  uv: 'Sans chromophore, le DPnB n\'absorbe pas dans l\'UV-visible, et la peinture diluée, turbide et chargée en pigments, diffuse et absorbe de partout. Cause : technique non sélective. Effet : le signal mesuré est celui de la matrice, pas celui du DPnB. Remède : séparer avant de détecter, donc une chromatographie.',
  masse: 'Une perte de masse à l\'étuve compte tout ce qui s\'évapore : l\'eau (de loin le plus abondant), le DPnB, les autres volatils. Cause : technique non sélective. Effet : tu ne peux pas isoler les quelques grammes de DPnB parmi plus de 150 g d\'eau. Remède : une technique qui sépare les composés, la chromatographie.',
};
add('dpnbTech', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Doser le DPnB : quelle technique ?',
  texte: 'Inès : « Le cahier des charges impose COV < 30 g/L, et jusqu\'ici ce chiffre est seulement calculé d\'après la formule. Le contrôle qualité, c\'est de le vérifier sur la peinture fabriquée : combien de DPnB y reste-t-il vraiment ? Comment tu t\'y prends ? »\nLe DPnB : éther de glycol, liquide, miscible à l\'eau, température d\'ébullition d\'environ 230 °C. Il est présent à moins de 1 % dans une émulsion aqueuse chargée de pigments.',
  choix: () => TECHNIQUES.map(T => ({ t: T.t, f: { techCle: T.cle }, note: `Technique envisagée pour le dosage du DPnB : ${T.t}.`, duree: T.cle === 'cpg' ? 0 : 5, vers: T.cle === 'cpg' ? 'stationCpg' : 'dpnbImpasse',
    run: n => T.cle === 'cpg' ? { ...n, f: { ...n.f, impasses: n.f.impasses || 0 } } : { ...n, f: { ...n.f, impasses: (n.f.impasses || 0) + 1 } } })) });
add('dpnbImpasse', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Cette technique ne marchera pas',
  texte: e => `Inès réfléchit une minute (5 min), puis secoue la tête.\n« ${IMPASSES[e.f.techCle] || ''} »`,
  choix: () => [{ t: 'Reprendre : choisir une autre technique', vers: 'dpnbTech' }] });

const CONCL = ['simple', 'faux', 'u'];
add('stationCpg', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Dosage du DPnB par CPG-FID', station: 'cpg',
  texte: 'Inès te prête le chromatographe. « Comme le DPnB sort sous forme d\'un pic au FID et que les volumes injectés fluctuent, on ajoute un étalon interne à concentration fixe dans toutes les solutions : étalons et échantillon. L\'échantillon : 1,00 g de peinture complété à 10,0 mL au solvant. À toi : fais une droite d\'étalonnage, dose l\'échantillon, et conclus pour le COV. »',
  choix: e => {
    const R = resultatCpg(e);
    if (!R.dos) return [{ t: 'Abandonner le dosage et retourner à la paillasse', vers: 'labo' }];
    const cov = R.cov, U = R.U, v = verdictCov(cov, U), simple = cov < COV_MAX ? 'conforme' : 'non conforme', faux = cov < COV_MAX ? 'non conforme' : 'conforme';
    const base = { f: { mes_dpnb: true, covMes: cov, uMes: U }, vers: 'debriefCpg' };
    const L = {
      simple: { ...base, concl: 'simple', t: `Je conclus : COV = ${nf(cov, 1)} g/L, donc ${simple}`, f: { ...base.f, cpgConcl: 'simple' }, note: `Dosage du DPnB par CPG-FID : COV mesuré ${nf(cov, 1)} g/L (${simple}), sans incertitude.` },
      faux: { ...base, concl: 'faux', t: `Je conclus : COV = ${nf(cov, 1)} g/L, donc ${faux}`, f: { ...base.f, cpgConcl: 'faux' }, note: `Dosage du DPnB par CPG-FID : COV mesuré ${nf(cov, 1)} g/L, conclusion « ${faux} ».` },
      u: { ...base, concl: 'u', t: `Je conclus : COV = ${nf(cov, 1)} ± ${nf(U, 1)} g/L (k = 2) : ${v}`, f: { ...base.f, cpgConcl: 'u' }, note: `Dosage du DPnB par CPG-FID : COV = ${nf(cov, 1)} ± ${nf(U, 1)} g/L (k = 2), ${v}.` },
    };
    const o = (e.f.graine ?? 1) % 3;
    return CONCL.map((_, i) => L[CONCL[(i + o) % 3]]);
  } });

add('debriefCpg', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Ce que dit le chromatographe',
  texte: e => `Tu as retenu : COV = ${nf(e.f.covMes ?? 0, 1)} ± ${nf(e.f.uMes ?? 0, 1)} g/L (k = 2). Inès relit tes feuilles de mesures.`,
  debrief: e => {
    const g = cpgDe(e), R = resultatCpg(e), L = [], niv = new Set(g.etal.map(p => p.c)).size, vrai = covDe(e);
    const Di = niv >= 3 ? etalonnage(g.etal, 'interne') : null, De = niv >= 3 ? etalonnage(g.etal, 'externe') : null;
    L.push((e.f.impasses || 0) === 0 ? { ok: true, t: 'Technique : tu as d\'emblée choisi la CPG-FID. Le DPnB est volatil, sans chromophore : c\'est la bonne technique.' } : { ok: null, t: `Technique : ${e.f.impasses} essai${e.f.impasses > 1 ? 's' : ''} écarté${e.f.impasses > 1 ? 's' : ''} avant la CPG-FID. Bien choisir la technique en fonction des propriétés de la molécule (volatilité, chromophore) évite de perdre du temps.` });
    L.push(niv >= 5 ? { ok: true, t: `Étalonnage : ${niv} niveaux de concentration (${g.etal.length} injections), de quoi vérifier la linéarité.` } : { ok: niv >= 3 ? null : false, t: `Étalonnage : ${niv} niveau${niv > 1 ? 'x' : ''}. ${niv >= 3 ? 'C\'est le minimum : avec 3 niveaux, tu ne peux pas vraiment contrôler la linéarité.' : 'Trop peu pour une droite.'} Vise au moins 5 niveaux, qui encadrent la concentration attendue.` });
    if (Di && De) L.push({ ok: g.mode === 'interne' ? true : null, t: `Étalon interne ou non : écart-type résiduel relatif de la droite ${nf(Di.residRel, 1)} % avec l'étalon interne, contre ${nf(De.residRel, 1)} % en aire seule. ${g.mode === 'interne' ? 'Tu as quantifié avec l\'étalon interne : il compense les fluctuations du volume injecté.' : 'Tu as quantifié en aire seule : l\'erreur de volume injecté (variable d\'une injection à l\'autre) est directement reportée sur ton résultat. Avec l\'étalon interne, cette erreur disparaît dans le rapport des aires.'}` });
    const rec = recuperation(e);
    L.push(rec ? { ok: Math.abs(rec.taux - 100) <= 5, t: `Justesse : la solution de contrôle (préparée indépendamment des étalons, ${nf(C_CTRL, 1)} mg/mL) est retrouvée à ${nf(rec.taux, 0)} %. ${Math.abs(rec.taux - 100) <= 5 ? 'Un écart de moins de 5 % est compatible avec la dispersion du dosage : pas de biais décelé.' : 'Écart supérieur à 5 % : un biais est probable (pureté ou préparation des étalons). À corriger avant de rendre un résultat.'}` } : { ok: null, t: 'Justesse non vérifiée : une solution de contrôle, préparée indépendamment des étalons, permet de contrôler que la droite donne la bonne valeur (fidélité ≠ justesse : la droite peut être très bien alignée et fausse).' });
    if (R.dos) {
      L.push(R.dos.dansDomaine ? { ok: true, t: `Le dosage est dans le domaine d'étalonnage (${nf(Math.min(...R.D.xs), 2)} à ${nf(Math.max(...R.D.xs), 2)} ${g.mode === 'interne' ? 'en rapport c/c_IS' : 'mg/mL'}) : pas d'extrapolation.` } : { ok: false, t: `Le dosage tombe hors du domaine d'étalonnage : c'est une extrapolation, le résultat n'est pas fiable. ${cer(e, 'g-hors', 'étalons mal choisis.', 'on ne sait pas si la droite reste valable à cette concentration.', 'ajouter un étalon qui encadre la concentration.')}` });
      L.push(g.ech.length >= 2 ? { ok: true, t: `${g.ech.length} injections de l'échantillon : la moyenne réduit la part de l'incertitude due à la répétabilité.` } : { ok: null, t: 'Une seule injection de l\'échantillon : aucune idée de la répétabilité. Deux ou trois injections améliorent le résultat.' });
      const ecart = Math.abs(e.f.covMes - vrai), ok = ecart <= e.f.uMes;
      L.push({ ok, t: `COV mesuré : ${nf(e.f.covMes, 1)} ± ${nf(e.f.uMes, 1)} g/L. Valeur calculée d'après la formule : ${nf(vrai, 1)} g/L. ${ok ? 'La mesure confirme le calcul, dans son incertitude.' : 'L\'écart dépasse l\'incertitude annoncée : un biais n\'est pas pris en compte (étalonnage, préparation).'}` });
      const v = verdictCov(e.f.covMes, e.f.uMes), simple = e.f.covMes < COV_MAX ? 'conforme' : 'non conforme';
      if (e.f.cpgConcl === 'u') L.push({ ok: true, t: `Expression du résultat : valeur, incertitude élargie (k = 2) et décision tenant compte de l'incertitude : ${v}. ${vari(e, 'g-u', ["C'est l'expression complète attendue.", "Voilà une expression complète du résultat, telle qu'on l'écrit dans un rapport."])}` });
      else if (e.f.cpgConcl === 'simple') L.push({ ok: null, t: `Expression du résultat : « ${simple} » est juste, mais sans incertitude un résultat de mesure est incomplet. Avec U = ${nf(e.f.uMes, 1)} g/L, la décision est : ${v}.` });
      else L.push({ ok: false, t: `${vari(e, 'g-faux', ['Décision : ta conclusion contredit ta propre mesure.', 'Ta décision contredit le résultat que tu viens d\'obtenir.'])} ${cer(e, 'g-faux2', 'comparaison à la limite dans le mauvais sens.', 'tu laisserais passer une peinture hors cahier des charges, ou tu bloquerais une peinture conforme.', 'comparer la valeur mesurée (et son incertitude) à la limite de 30 g/L.')}` });
    }
    L.push({ ok: null, t: 'Hypothèses du modèle : réponse du FID linéaire sur la plage ; résidus normaux, de variance constante ; erreur de volume injecté commune aux deux pics (≈ 6 %) ; préparation de l\'échantillon ± 1 %. Les données chromatographiques sont de scénario, pas réelles.' });
    return L;
  },
  choix: () => [{ t: 'Retourner à la paillasse', vers: 'labo' }] });

add('res_es', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Résultat : extrait sec et densité',
  texte: e => { const p = prop(e), pc = prop(e, e.f.phMes ? { ph: 'mesuree' } : { ph: 'fiche' }), ok = e.f.regle === 'ok', es = p.ES - (e.f.lotDouteux ? 1.2 : 0), r = proprietes(FORMULE_REF);
    return `Inès : « Extrait sec ${nf(es)} %, densité ${nf(p.densite, 3)}. »\nD'après la formule (prises d'huile ${e.f.phMes ? 'que tu as mesurées' : 'des fiches, non vérifiées sur nos poudres'}) : CPV = ${nf(pc.CPV)} %, CPVC = ${nf(pc.CPVC)} %, λ = ${nf(pc.lambda, 2)}, COV calculé = ${nf(p.COV)} g/L (à vérifier par un dosage).\n${ok ? `${Math.abs(p.ES - r.ES) < 1.5 ? `Même extrait sec que la référence (${nf(r.ES)} %)` : `Extrait sec différent de la référence (${nf(r.ES)} %), mais conforme (> 50 %)`}${e.f.lotDouteux ? ', un peu plus bas qu\'attendu : le coagulum retiré du lot gelé a emporté du polymère' : ''}. ${covOk(e) ? 'Sur ces critères calculés (ES > 50 %, λ ≥ 0,8, COV < 30 g/L), le cahier des charges est respecté ; le COV reste à vérifier sur la peinture fabriquée.' : `Mais les COV calculés (${nf(p.COV)} g/L) dépassent la limite de 30 g/L : il y a trop de coalescent.`}` : `Attention : ES = ${nf(p.ES)} % et CPV = ${nf(p.CPV)} % ne correspondent pas à la référence (ES ${nf(r.ES)} %, CPV ${nf(r.CPV)} %). En remplaçant simplement 83,3 g par 83,3 g, tu as changé la quantité de polymère : la formule ne respecte pas la contrainte « mêmes ES, CPV, CPVC ».`}`; },
  visuel: e => ({ type: 'balance', es: prop(e).ES - (e.f.lotDouteux ? 1.2 : 0), dens: prop(e).densite }),
  choix: e => e.f.regle !== 'ok' ? [{ t: 'Reprendre le calcul et refaire la peinture (la fabrication ne vaut plus rien)', f: { refait: true, mes_es: false }, duree: 15, note: 'Formule corrigée : la première version (83,3 g d\'Orgal) avait un ES et une CPV différents de la référence.', run: e2 => effacerMesures(e2), vers: 'calcMasse' },
      { t: 'Je garde cette formule telle quelle', f: { mes_es: true }, note: 'ES mesuré différent de la référence : formule conservée en l\'état.', vers: 'labo' }]
    : !covOk(e) ? [refaireCoalescent('COV mesurés au-dessus de 30 g/L : dose de coalescent à revoir.'), { t: 'Je garde cette formule et je le signale', f: { mes_es: true }, note: 'COV supérieurs à 30 g/L : formule conservée, écart signalé.', vers: 'labo' }]
    : [{ ...retourLabo, f: { mes_es: true }, note: 'ES et densité mesurées : conformes.' }] });
add('res_rheo', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : rhéologie',
  texte: e => !dispOk(e.f) ? 'Lucas : « Viscosité élevée à bas gradient et nette thixotropie : il reste des amas mal dispersés. On est loin du comportement rhéofluidifiant à faible thixotropie demandé. »\nLe dispersant n\'a pas été corrigé : la cause des amas est restée.'
    : 'Lucas : « Courbes de viscosité en fonction du gradient de cisaillement : comportement rhéofluidifiant, boucle de thixotropie très faible. Proche de la référence Vinnapas. »',
  visuel: e => ({ type: 'rheo', mauvais: mauvaisRheo(e) }),
  choix: [{ ...retourLabo, run: e => ({ ...e, f: { ...e.f, mes_rheo: true, rheoKo: mauvaisRheo(e) } }), note: 'Rhéologie mesurée.' }] });
add('res_masq', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : pouvoir masquant',
  texte: e => { const pm = pouvoirMasquant(e), v = nf(pm, 1);
    if (pm >= 7) return `Lucas : « Rapport de contraste à 98 % pour un rendement de ${v} m²/L : pouvoir masquant de ${v} m²/L, au-dessus du minimum de 7,0 (référence Vinnapas : 7,4). »`;
    return mauvaisRheo(e) ? `Lucas : « Pouvoir masquant ${v} m²/L, en dessous des 7,0 attendus. Les amas de TiO₂ mal dispersés diffusent moins bien la lumière. »`
      : `Lucas : « Pouvoir masquant ${v} m²/L, en dessous des 7,0 attendus. Il y a trop peu de TiO₂ par litre de peinture : c'est lui qui masque. »`; },
  visuel: e => ({ type: 'masq', pm: Math.round(pouvoirMasquant(e) * 10) / 10 }),
  choix: e => { const pm = pouvoirMasquant(e), run = n => ({ ...n, f: { ...n.f, mes_masq: true } });
    return pm >= 7 ? [{ ...retourLabo, run, note: 'Pouvoir masquant mesuré : conforme.' }]
      : [refaireFormule(`Pouvoir masquant mesuré à ${nf(pm, 1)} m²/L (< 7,0) : formule à revoir.`), { ...retourLabo, run, note: `Pouvoir masquant mesuré à ${nf(pm, 1)} m²/L (< 7,0) : formule conservée, écart signalé.` }]; } });
add('res_brill', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : brillance',
  texte: e => { const b = brillance(e), mat = b.g60 < 10;
    return `Lucas : « Film de 100 µm sec sur carte contraste. À 60° : ${nf(b.g60, 1)} unités de brillance. À 85° : ${nf(b.g85, 1)}. ${mat ? 'C\'est une peinture mate (moins de 10 UB à 60°).' : 'Ce n\'est pas une mate : au-dessus de 10 UB à 60°, on est sur du satiné.'} »\n${mat ? 'C\'est cohérent avec λ proche de 1 : quand CPV approche CPVC, la surface du film est rugueuse à l\'échelle de la lumière et diffuse, au lieu de refléter.' : `Ici λ vaut ${nf(b.l, 2)} : il y a trop de liant par rapport aux poudres, le film est lisse et réfléchit.`}`; },
  visuel: e => { const b = brillance(e); return { type: 'gloss', g60: Math.round(b.g60 * 10) / 10, g85: Math.round(b.g85 * 10) / 10 }; },
  choix: e => { const b = brillance(e);
    return b.g60 < 10 ? [{ ...retourLabo, f: { mes_brill: true }, note: `Brillance mesurée : ${nf(b.g60, 1)} UB à 60° (mat).` }]
      : [refaireFormule(`Brillance mesurée à ${nf(b.g60, 1)} UB à 60° : pas assez mate, formule à revoir.`), { ...retourLabo, f: { mes_brill: true }, note: `Brillance mesurée à ${nf(b.g60, 1)} UB à 60° : formule conservée, écart signalé.` }]; } });
add('res_tmff', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : TMFF',
  texte: e => { const T = prop(e).tmff, d = e.f.dpnb ?? 0;
    return T <= 0 ? `Lucas : « Sur le banc à gradient de température : film continu jusqu'à la limite basse du banc (0 °C). Largement sous les 5 °C demandés. »\n${d > 6.5 ? 'Mais avec autant de coalescent, regarde les COV…' : ''}`.trim()
      : T <= TMFF_MAX ? `Lucas : « Sur le banc à gradient de température : film continu dès ${nf(T, 0)} °C environ (l'Orgal seul : 20 °C). Sous la limite de 5 °C du cahier des charges : le coalescent a fait son travail. »`
      : `Lucas : « Sur le banc : film continu seulement à partir de ${nf(T, 0)} °C environ. En dessous, il craquelle et reste poudreux. On est au-dessus des 5 °C demandés. »\n${d === 0 ? 'Sans coalescent, la MFFT de la peinture reste celle de l\'Orgal (20 °C) : la référence Vinnapas pouvait s\'en passer, pas cette résine.' : 'La dose de coalescent est trop faible pour abaisser assez la MFFT.'}`; },
  visuel: e => { const T = prop(e).tmff; return { type: 'tmff', tmff: T <= 0 ? null : Math.round(T) }; },
  choix: e => tmffOk(e) ? [{ ...retourLabo, f: { mes_tmff: true }, note: 'TMFF mesurée : conforme.' }]
    : [refaireCoalescent(`TMFF mesurée à ${nf(prop(e).tmff, 0)} °C, trop haute : dose de coalescent à revoir.`), { t: 'Je garde cette formule et je le signale', f: { mes_tmff: true }, note: `TMFF mesurée à ${nf(prop(e).tmff, 0)} °C (> 5 °C) : formule conservée, écart signalé.`, vers: 'labo' }] });
add('res_cout', { lieu: 'Service achats', pnj: 'perrin', titre: 'Devis de l\'Orgal', fiches: ['formule'],
  texte: 'M. Perrin : « L\'Orgal PST 50A est à 25 € les 5 litres. Les autres prix sont ceux du Document 1. À toi de calculer le coût matières premières de ta formule. »',
  calcul: { q: 'Coût matières premières de ta formule (€ par kg de peinture)', unite: '€/kg', vrai: e => coutKg(formule(e)), tol: 0.06,
    indice: 'Coût total = Σ (masse × prix par gramme) ; divise par la masse totale en kg. Attention aux unités de prix : €/L et densités pour les additifs liquides.',
    ok: { f: { mes_cout: true }, run: e => ({ ...e, f: { ...e.f, coutOk: coutKg(formule(e)) < 4.5 } }), vers: 'labo', note: 'Coût matières premières calculé.' },
    ko: { f: { mes_cout: true }, run: e => ({ ...e, f: { ...e.f, coutOk: coutKg(formule(e)) < 4.5 } }), vers: 'labo', duree: 10, note: 'Coût matières premières calculé avec l\'aide de M. Perrin.' } } });

// ───────────── Le hub : la paillasse ─────────────
const ligneAttente = e => Object.entries(e.cmd).filter(([, c]) => !c.lu && c.pret > e.t).map(([k, c]) => `⏳ ${labelDe(k)} : prêt vers ${hhmm(c.pret)}`);
add('labo', { lieu: 'Paillasse et laboratoire', pnj: 'moi', titre: 'La journée avance',
  texte: e => `Il est ${hhmm(e.t)}.${e.t >= T_RAPPORT ? '\nMme Dubreuil passe la tête : « J\'attends ton rapport, le délai est dépassé. »' : e.t >= T_CLIENT - 45 ? '\nL\'appel client approche (15 h).' : ''}\n${ligneAttente(e).join('\n')}`.trim(),
  choix: e => {
    const L = [];
    for (const A of ANALYSES) {
      const c = e.cmd[A.cle];
      if (c && !c.lu && c.pret <= e.t) L.push({ t: `📄 Lire le résultat : ${A.label}`, run: n => ({ ...n, cmd: { ...n.cmd, [A.cle]: { ...c, lu: true } } }), vers: `res_${A.cle}` });
      else if (!c && (e.f.fabrique || A.avant)) { const occ = e.libre[A.tech] > e.t && e.f.plan !== 'solo';
        L.push({ t: `Demander à ${PNJ[A.tech].nom} : ${A.label}`, d: e.f.plan === 'solo' ? `${A.duree} min de ton temps` : `${A.perso} min pour toi, résultat ${occ ? 'après ' + hhmm(e.libre[A.tech]) + ' (' + PNJ[A.tech].nom + ' est occupé·e)' : 'dans ' + A.duree + ' min'}`, run: n => deleguer(n, A), vers: 'labo', cle: A.cle, masque: true }); }
    }
    if (e.f.fabrique && !e.f.mes_dpnb) L.push({ t: 'Doser le DPnB dans la peinture fabriquée (contrôle du COV)', d: 'Choix de la technique, puis dosage : une vingtaine de minutes de ton temps', note: 'Contrôle qualité : dosage du DPnB dans la peinture (COV mesurés et non plus calculés).', vers: 'dpnbTech', cle: 'dpnb', masque: true });
    if (!e.cmd.huile) L.push({ t: 'Mesurer moi-même les prises d\'huile à la spatule', d: `${HUILE_DUREE} min par détermination, sans attendre personne`, note: 'Prises d\'huile des poudres : mesure faite moi-même.', vers: 'stationHuile', cle: 'huile-moi', masque: true });
    if (e.f.fabrique && !e.f.etuve) L.push({ t: 'Mettre un échantillon à l\'étuve à 50 °C (vieillissement accéléré)', d: '10 min ; résultat dans 7 jours', duree: 10, f: { etuve: true }, note: 'Échantillon mis à l\'étuve à 50 °C pour le test de stabilité (résultat dans 7 jours).', vers: 'labo', cle: 'etuve', masque: true });
    L.push({ t: 'Attendre 30 minutes (café, rangement, bibliographie)', duree: 30, vers: 'labo' });
    L.push({ t: 'Rédiger le rapport maintenant', d: '45 min ; la journée se termine avec le rapport', duree: 45, vers: 'rapport' });
    return L;
  } });

// ───────────── Appel client ─────────────
add('client', { lieu: 'Salle de réunion (visio)', pnj: 'aubry', titre: 'Appel avec la cliente, 15 h',
  texte: e => `Il est ${hhmm(e.t)}. Mme Aubry : « Alors, la nouvelle base à l'Orgal garde bien notre promesse « sans solvant, COV nuls » ? On imprime les étiquettes des pots cette semaine. »\n${e.f.alerte === true ? 'Mme Dubreuil lui a déjà expliqué que l\'Orgal exige un agent de coalescence. Mme Aubry semble ennuyée mais ouverte.' : ''}${e.f.mes_dpnb ? `\nTu peux lui donner un chiffre : le dosage du DPnB a donné COV = ${nf(e.f.covMes ?? 0, 1)} ± ${nf(e.f.uMes ?? 0, 1)} g/L (k = 2).` : ''}`,
  choix: e => e.f.alerte === true ? [{ t: 'Je confirme : COV inférieurs à 30 g/L mais non nuls, la mention « COV nuls » doit disparaître de l\'étiquette', duree: 20, f: { clientFait: true, clientOk: true }, note: 'Appel client : COV faibles mais non nuls avec l\'Orgal (coalescent), mention « COV nuls » à retirer de l\'étiquette.', vers: 'labo' }]
    : [{ t: 'Je lui précise que l\'Orgal exige un coalescent : les COV seront faibles mais pas nuls', duree: 20, f: { clientFait: true, clientOk: true, alerte: true, alerteTardive: true }, note: 'Appel client : j\'ai précisé que l\'Orgal exige un coalescent (COV non nuls).', vers: 'labo' },
      { t: 'Je réponds que oui, ça devrait aller', duree: 20, f: { clientFait: true, mensonge: true }, note: 'Appel client : réponse positive sans réserve sur la mention « COV nuls ».', vers: 'labo' }],
});

// ───────────── Rapport et fins ─────────────
add('rapport', { melange: true, lieu: 'Bureau', pnj: 'moi', titre: 'Le rapport',
  texte: e => `Tu t'installes pour rédiger. Il est ${hhmm(e.t)}. Le cahier des charges demande une peinture stable 30 mois. Qu'écris-tu ?`,
  choix: [
    { t: 'Stable 30 mois : tout est conforme', f: { stab: 'promis' }, vers: 'verdict' },
    { t: 'Non démontrable en une journée : un vieillissement accéléré est à suivre', f: { stab: 'honnete' }, vers: 'verdict' },
    { t: 'Je ne parle pas de la stabilité', f: { stab: 'omis' }, vers: 'verdict' },
  ] });
export const QC = ['es', 'rheo', 'masq'];
// Écarts réels au cahier des charges (valeurs vraies, y compris celles que l'élève n'aurait pas mesurées)
export function ecartsCdc(e) {
  const p = prop(e), L = [], l = lambdaVrai(e), pm = pouvoirMasquant(e);
  if (p.ES <= 50) L.push({ cle: 'es', t: `extrait sec de ${nf(p.ES)} % (> 50 % demandé)` });
  if (l < 0.8) L.push({ cle: 'lambda', t: `λ = ${nf(l, 2)} (≥ 0,8 demandé : la peinture n'est pas assez mate)` });
  if (!tmffOk(e)) L.push({ cle: 'tmff', t: `film continu seulement à partir de ${nf(p.tmff, 0)} °C environ (5 °C demandés)` });
  if (!covOk(e)) L.push({ cle: 'cov', t: `COV de ${nf(p.COV, 0)} g/L (limite de ${COV_MAX} g/L)` });
  if (mauvaisRheo(e)) L.push({ cle: 'disp', t: 'amas mal dispersés (rhéologie non conforme)' });
  else if (pm < 7) L.push({ cle: 'masq', t: `pouvoir masquant de ${nf(pm, 1)} m²/L (> 7,0 demandé)` });
  if (coutKg(formule(e)) >= 4.5) L.push({ cle: 'cout', t: `coût de ${nf(coutKg(formule(e)), 2)} €/kg (< 4,5 €/kg demandé)` });
  return L;
}
export function verdict(e) {
  const f = e.f;
  if (f.regle === 'naif') return 'fin_naif';
  if (f.stab === 'promis') return 'fin_promesse';
  if (f.mensonge) return 'fin_cloque';
  if (QC.some(k => !f['mes_' + k])) return 'fin_incomplet';
  if (ecartsCdc(e).length) return 'fin_ecart';
  if (e.t > T_RAPPORT) return 'fin_retard';
  return bilan(e).filter(b => b.niveau === 'ok').length >= 6 ? 'fin_excellent' : 'fin_bon';
}
add('verdict', { lieu: 'Bureau', pnj: 'dubreuil', titre: 'Mme Dubreuil lit ton rapport', texte: 'Elle lit en silence, puis lève les yeux.', choix: e => [{ t: 'Écouter son verdict', vers: verdict(e) }] });

// ───────────── Bilan par compétence (référentiel du sujet) ─────────────
export function bilan(e) {
  const f = e.f, n = x => x ? 1 : 0;
  const niv = (pts, max) => pts >= max ? 'ok' : pts > 0 ? 'moyen' : 'ko';
  const nbDeleg = Object.keys(e.cmd).length;
  const nbOpt = ['huile', 'brill', 'tmff', 'dpnb'].filter(k => f['mes_' + k]).length;
  const dOk = tmffOk(e) && covOk(e);
  const dTxt = dOk ? 'dosé à bon escient (TMFF et COV conformes)' : (f.dpnb ?? 0) < 2.5 ? 'insuffisant (la MFFT de l\'Orgal est de 20 °C)' : 'en excès (COV trop élevés)';
  const pr = [];
  const c14 = n(f.regle === 'ok' && !f.refait) + n(dOk) + n(f.mes_huile) + n(f.mes_dpnb && !f.impasses);
  pr.push({ comp: 'C1.4', titre: 'Choisir méthodes et techniques', niveau: niv(c14, f.mes_dpnb ? 4 : 3), texte: `Règle de remplacement de la résine ${f.regle === 'ok' && !f.refait ? 'juste dès le départ' : 'à corriger'} ; coalescent ${dTxt} ; prises d'huile ${f.mes_huile ? 'mesurées pour lever le doute sur la CPVC' : 'non mesurées (le tableur avec les valeurs des fiches donnait une peinture non mate)'}.` });
  pr.push({ comp: 'C2.1', titre: 'Préparer produits et matériel', niveau: !f.fabrique && !f.rate ? 'nd' : f.rate ? 'moyen' : 'ok', texte: f.rate ? 'Première fabrication ratée : l\'ordre d\'introduction de la fiche n\'avait pas été respecté.' : f.fabrique ? 'Fabrication conforme à la fiche, finesse correcte.' : 'Pas de fabrication réalisée.' });
  const c32 = n(f.alerte === true) * (f.alerteTardive ? 0.5 : 1) + n(f.stockCtrl) * (f.stockAlerte ? 0.5 : 1) + n(f.stab === 'honnete');
  pr.push({ comp: 'C3.2', titre: 'Détecter les non-conformités et alerter', niveau: niv(c32, 3), texte: `Promesse « COV nuls » incompatible avec l'Orgal ${f.alerte === true ? (f.alerteTardive ? 'signalée tardivement' : 'signalée tout de suite') : 'non signalée'} ; fût d'Orgal gelé ${f.stockCtrl ? (f.stockAlerte ? 'contrôlé après rappel de Karim' : 'contrôlé de ta propre initiative') : 'non contrôlé'} ; stabilité ${f.stab === 'honnete' ? 'annoncée honnêtement comme non démontrée' : f.stab === 'promis' ? 'garantie sans l\'avoir démontrée' : 'omise'}.` });
  const c41 = n(dispOk(f)) + n(dOk);
  pr.push({ comp: 'C4.1', titre: 'Modifier, améliorer le protocole', niveau: niv(c41, 2), texte: `Dispersant ${dispOk(f) ? `corrigé (amas supprimés${f.dispCourbe ? ', dose trouvée par la courbe de défloculation' : ''})` : 'non corrigé'} ; coalescent ${dOk ? 'ajouté et dosé' : (f.dpnb ?? 0) < 2.5 ? 'absent ou trop faible' : 'surdosé'}.` });
  const c61 = n(f.plan !== 'solo') + n(e.t <= T_RAPPORT) + n(nbOpt >= 2);
  pr.push({ comp: 'C6.1', titre: 'Organiser le travail, tenir les délais', niveau: niv(c61, 3), texte: `${f.plan === 'solo' ? 'Tout fait seul·e : trop séquentiel. ' : f.plan === 'mp' ? 'Analyses des matières premières lancées dès le début, en parallèle. ' : 'Tâches déléguées en parallèle. '}Rapport ${e.t <= T_RAPPORT ? 'rendu dans les temps' : 'rendu après 17 h'} ; ${nbOpt} analyse(s) complémentaire(s) sur 4 (prises d'huile, brillance, TMFF, dosage du DPnB).` });
  pr.push({ comp: 'C6.3', titre: 'Gérer les produits selon la réglementation', niveau: niv(n(f.stock === 'neuf') + n(f.stock === 'tamise') * 0.5 + n(f.coutOk), 2), texte: `${f.stock === 'neuf' ? 'Lot gelé écarté, fût neuf commandé. ' : f.stock === 'tamise' ? 'Lot gelé tamisé et utilisé : acceptable seulement avec réserve. ' : 'Aucun problème de stockage détecté. '}${f.coutOk ? 'Coût matières contrôlé (< 4,5 €/kg).' : 'Coût matières non vérifié.'}` });
  pr.push({ comp: 'C6.4', titre: 'Assurer la traçabilité', niveau: f.trace ? 'ok' : 'ko', texte: f.trace ? 'Lot, pesées et observations consignés au fur et à mesure.' : 'Pesées réelles et observations reconstituées de mémoire : traçabilité faible.' });
  pr.push({ comp: 'C7.3', titre: 'Travailler en équipe', niveau: f.plan === 'solo' ? 'ko' : niv(n(nbDeleg >= 3) + n(f.alerte === true), 2), texte: f.plan === 'solo' ? 'Aucune délégation : l\'équipe n\'a pas été sollicitée.' : `${nbDeleg} analyse(s) confiée(s) aux collègues ; ${f.alerte === true ? 'information remontée à la responsable' : 'communication à améliorer'}.` });
  return pr;
}

// ───────────── Résumé des choix de l'élève (affiché à la fin, pas de suivi pour l'enseignant) ─────────────
export function resume(e) {
  const f = e.f, L = [];
  L.push(`Formule finale : ${f.formuleLibre ? `posée par toi (Orgal ${nf(f.fm.liant, 0)} g, TiO₂ ${nf(f.fm.tio2, 0)} g, CaCO₃ ${nf(f.fm.caco3, 0)} g, eau ${nf(f.fm.eau, 0)} g)${f.refaitForm || f.refaitCoal || f.refait ? ', refaite au moins une fois' : ''}` : 'non posée'}.`);
  L.push(`Remplacement de la résine : ${f.regle === 'naif' ? 'masse pour masse (erreur, extrait sec faux)' : f.regle === 'ok' ? `règle de l'extrait sec appliquée${f.refait ? ' après correction' : ''}` : 'non traité'}.`);
  L.push(`Coalescent : ${nf(f.dpnb ?? 0, 0)} g de DPnB${f.preEssai ? ', choisi après un pré-essai au banc TMFF' : ', choisi sans pré-essai au banc'}${(f.banc || []).length ? ` (${f.banc.length} essai${f.banc.length > 1 ? 's' : ''})` : ''}.`);
  L.push(`Dispersant : ${f.coadis != null ? `${nf(f.coadis, 2)} g de Coadis BR3${f.dispCourbe ? ' (trouvés par une courbe de défloculation)' : ''}` : 'dose de départ conservée'}.`);
  L.push(`Organisation : ${f.plan === 'solo' ? 'tout fait seul·e' : `${Object.keys(e.cmd).length} analyses déléguées`}.`);
  L.push(`Contrôle du COV : ${f.mes_dpnb ? `dosage du DPnB par CPG-FID (${nf(f.covMes ?? 0, 1)} ± ${nf(f.uMes ?? 0, 1)} g/L)` : 'non fait (COV seulement calculés)'}.`);
  L.push(`Initiative : ${f.idees ? 'tu as demandé de l\'aide pour savoir quoi lancer (5 min)' : 'tu as décidé seul·e des analyses à lancer'}.`);
  L.push(`Client : ${f.clientFait ? (f.clientOk ? 'informé de la mention « COV nuls »' : 'mal renseigné') : 'pas rappelé'}.`);
  return L;
}

// ───────────── Les fins ─────────────
const fin = (id, ton, titre, texte) => add(id, { lieu: 'Fin de journée', pnj: 'dubreuil', titre, fin: { ton, titre }, texte, choix: [] });
fin('fin_excellent', 'ok', 'Une journée exemplaire', e => `Il est ${hhmm(e.t)}. Le dossier est complet : formule conforme, coalescent dosé, contrôles faits, prises d'huile, brillance et TMFF mesurés,${e.f.mes_dpnb ? ' COV vérifiés par un dosage du DPnB,' : ''} traçabilité soignée, alertes données au bon moment. Mme Dubreuil sourit : « Voilà comment je veux voir travailler une équipe. On valide le remplacement de la Vinnapas par l'Orgal, et la cliente retire la mention « COV nuls » de ses étiquettes. »`);
fin('fin_bon', 'ok', 'Mission remplie, avec des progrès à faire', e => `Il est ${hhmm(e.t)}. La nouvelle base respecte l'essentiel du cahier des charges et le rapport est rendu dans les temps. Quelques points auraient pu être mieux conduits (voir le bilan ci-dessous). « C'est solide, dit Mme Dubreuil. Pour la prochaine fois, regarde bien les remarques : elles feront la différence. »`);
fin('fin_retard', 'moyen', 'Rapport remis en retard', e => `Il est ${hhmm(e.t)}. Le travail est bon, mais le rapport arrive après 17 h : la cliente a été rappelée sans les résultats. « Sur le fond, c'est bien, mais en entreprise le délai fait partie du cahier des charges. »`);
fin('fin_incomplet', 'moyen', 'Dossier incomplet', e => `Il est ${hhmm(e.t)}. Il manque des contrôles essentiels (extrait sec, rhéologie, pouvoir masquant) : le rapport ne permet pas de dire si la peinture respecte le cahier des charges. « On ne valide pas une formule sans ces mesures. Il va falloir tout recommencer demain. »`);
const MOT_ECART = {
  tmff: '« La Vinnapas n\'avait pas besoin de coalescent, l\'Orgal si : la fiche le disait. Calcule la dose et mesure la TMFF avant de conclure. »',
  cov: '« Un peu de coalescent, oui ; trop, ça ne répond plus au cahier des charges. On dose à partir du polymère sec, pas à l\'œil. »',
  lambda: '« Une base mate se juge sur λ = CPV/CPVC : vérifie-le avec les prises d\'huile de NOS poudres avant de valider une formule. »',
  masq: '« Le TiO₂ coûte cher, mais c\'est lui qui masque : on n\'économise pas sur le pigment sans mesurer le pouvoir masquant. »',
  cout: '« Une bonne formule, c\'est aussi une formule qui se vend : 4,5 €/kg, c\'est écrit dans le cahier des charges. »',
  disp: '« Des amas dans la peinture, ça se corrige à la source : par la dose de dispersant, trouvée sur la courbe de défloculation. »',
  es: '« Le polymère sec, c\'est lui qui fait le film : on ne change pas sa quantité à la légère. »',
};
fin('fin_ecart', 'moyen', 'Une formule hors cahier des charges', e => { const L = ecartsCdc(e);
  return `Il est ${hhmm(e.t)}. Ta peinture ne respecte pas le cahier des charges : ${L.map(x => x.t).join(' ; ')}. ${MOT_ECART[L[0]?.cle] || ''}`.trim(); });
fin('fin_naif', 'ko', 'Une formule qui ne respecte pas la contrainte', e => `Il est ${hhmm(e.t)}. ${e.f.formuleLibre ? 'Ta formule d\'Orgal n\'a pas assez de polymère' : 'Ta formule remplace 83,3 g de Vinnapas par 83,3 g d\'Orgal'} : l'extrait sec tombe à ${nf(prop(e).ES)} % et la CPV passe à ${nf(prop(e).CPV)} %. La contrainte « mêmes ES, CPV et CPVC » n'est pas respectée. Le rapport est refusé : « On ne peut pas comparer deux peintures dont la composition en polymère a changé. »`);
fin('fin_promesse', 'ko', 'Une promesse qui ne se tient pas', e => `Il est ${hhmm(e.t)}. Ton rapport affirme que la peinture est stable 30 mois. Personne n'a pu le vérifier en une journée. Six mois plus tard, un lot revient du client avec des pots qui ont décanté. « Quand on ne sait pas encore, on l'écrit, dit Mme Dubreuil. Mentir par omission, c'est le pire des défauts dans un laboratoire. »`);
fin('fin_cloque', 'ko', 'La cliente a été mal renseignée', e => `Il est ${hhmm(e.t)}. Tu as laissé entendre à Mme Aubry que la mention « COV nuls » resterait valable avec l'Orgal. Les étiquettes sont imprimées, les pots partent en magasin. Quelques mois plus tard, un contrôle mesure les COV : la mention est trompeuse, les lots sont retirés des rayons. « Cette résine ne filmifie pas sans coalescent, c'était écrit sur la fiche, dit Mme Dubreuil. L'alerte, c'était ton rôle. »`);
fin('fin_perdue', 'ko', 'La journée est finie, pas le rapport', e => `Il est ${hhmm(Math.max(e.t, T_FIN))}. Le laboratoire ferme et ton rapport n'est pas rendu. La cliente n'a rien reçu. « Il fallait tenir le planning : savoir renoncer à une analyse annexe fait partie du métier. »`);

export const FINS = [
  ['fin_excellent', 'Une journée exemplaire'], ['fin_bon', 'Mission remplie'], ['fin_retard', 'Rapport en retard'], ['fin_incomplet', 'Dossier incomplet'], ['fin_ecart', 'Hors cahier des charges'],
  ['fin_naif', 'Formule non conforme'], ['fin_promesse', 'Promesse non tenue'], ['fin_cloque', 'Cliente mal renseignée'], ['fin_matiere', 'Lot douteux utilisé'], ['fin_perdue', 'Journée perdue'],
];
