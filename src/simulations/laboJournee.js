// ====================================================
//  UNE JOURNÉE AU LABO : histoire à choix pour le BTS Métiers de la Chimie (sans React, testable seule).
//  Support : sujet de CCF4 (base de peinture blanche), lu à l'envers : la Vinnapas EP 3360 de la référence est en rupture, il faut la remplacer par l'Orgal PST 50A.
//  (Dans cette version, la référence se passe de coalescent ; l'Orgal, de MFFT 20 °C, en exige un : c'est tout l'intérêt du scénario.)
//  Le joueur est un technicien de R&D ; il délègue des analyses à des collègues fictifs (chacun ne fait qu'une chose à la fois),
//  la journée va de 8 h à 18 h (appel client à 15 h, rapport avant 17 h 30) et les décisions ont des conséquences : dix fins possibles.
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
export const T_RAPPORT = 570;    // 17 h 30
export const T_FIN = 600;        // 18 h 00

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
// Référence (Vinnapas, sans coalescent) : 331,2 g au total (Coapur à 0,5 % de matière sèche, soit 6,7 g de produit : bas de la plage de la fiche, 0,5 à 1,5 %). La nouvelle formule (Orgal) garde la même masse totale : l'eau compense.
export const FORMULE_REF = { resine: 'vinnapas', eau: 118.0, tio2: 60, caco3: 60, liant: 83.3, foamex: 1.5, coadis: 0.2, dpnb: 0, thixol: 1.5, coapur: 6.7 };
// Formule proposée par l'élève (e.f.fm), posée à l'étape « formule finale » ; sinon formule déduite de ses choix successifs
export const FM_CHAMPS = ['liant', 'eau', 'tio2', 'caco3', 'coadis', 'dpnb'];
export const formule = e => e.f.fm ? { resine: 'orgal', foamex: 1.5, thixol: 1.5 + (e.f.thixolAdd || 0), coapur: 6.7 + (e.f.coapurAdd || 0), ...e.f.fm } : formuleFlags(e);
export const fmDepuisFlags = e => { const f = formuleFlags(e); return Object.fromEntries(FM_CHAMPS.map(k => [k, f[k]])); };
const formuleFlags = e => {
  const naif = e.f.regle === 'naif', dpnb = e.f.dpnb ?? 0;
  return { resine: 'orgal', eau: (naif ? 118.0 : 101.3) - dpnb, tio2: 60, caco3: 60, liant: naif ? 83.3 : 100, foamex: 1.5,
    coadis: e.f.coadis ?? 0.2, dpnb, thixol: 1.5 + (e.f.thixolAdd || 0), coapur: 6.7 + (e.f.coapurAdd || 0) };
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
// Le joueur choisit un prénom et un avatar au départ : les collègues l'appellent ensuite par son prénom (voir texteDe)
export const NB_AVATARS = 6;
export const nettoyerPrenom = x => String(x ?? '').replace(/[<>«»\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20);
export const pn = e => e?.f?.prenom || '';
export const avatarDe = e => 'moi' + (((e?.f?.avatar ?? 0) % NB_AVATARS + NB_AVATARS) % NB_AVATARS);
export const etatInitial = (prenom = '', avatar = 0) => ({ scene: 'intro', t: 0, f: { ...secretsAleatoires(), prenom: nettoyerPrenom(prenom), avatar }, carnet: [], cmd: {}, libre: { ines: 0, lucas: 0, perrin: 0 }, essais: 0, vus: ['cdc'] });
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
export const NOMS_DOCS = { cdc: 'Cahier des charges', formule: 'Document 1 · Formule de référence', fabrication: 'Document 2 · Fiche de fabrication', vinnapas: 'Fiche Vinnapas', orgal: 'Fiche Orgal', dpnb: 'Fiche DPnB', coadis: 'Fiche Coadis', durcal: 'Fiche Durcal (CaCO₃)', coapur: 'Fiche Coapur', thixol: 'Fiche Thixol' };
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
// Mots sûrs en début de réplique : on peut y glisser « Prénom, » devant et passer le mot en minuscule (« Voilà » → « Camille, voilà »)
const DEBUTS_SURS = new Set(['avant', 'pour', 'comme', 'alors', 'dis', 'voilà', 'plus', 'au', 'un', 'une', 'le', 'la', 'les', 'tu', 'notre', 'bien', 'même', 'sur', 'quand', 'ton', 'ta', 'tes', 'avec', 'après', 'ce', 'cette', 'ça', 'mon', 'il', 'elle', 'on', 'je', 'nous', 'vous', 'si', 'donc', 'mais', 'et', 'ici', 'là', 'ah', 'oui', 'non', 'c', 'l', 'd', 'j', 't', 'n', 's', 'qu', 'comment', 'combien', 'quel', 'quelle', 'est', 'regarde', 'lis', 'pose', 'note', 'tiens', 'écoute', 'attention', 'ok']);
const nommer = (e, sc, t) => {
  const p = pn(e); if (!p || typeof t !== 'string' || sc.pnj === 'moi') return t;
  const toujours = sc.fin || e.scene === 'intro' || e.scene === 'verdict';
  if (!toujours && hash(`${e.scene}|${e.f.graine ?? 1}|prenom`) % 100 >= 50) return t;
  const m = t.match(/«\s*([A-Za-zÀ-ÿ]+)/);
  if (!m || m[1][0] !== m[1][0].toUpperCase() || !DEBUTS_SURS.has(m[1].toLowerCase())) return t;
  const i = t.indexOf(m[0]), mot = m[1][0].toLowerCase() + m[1].slice(1);
  return `${t.slice(0, i)}« ${p}, ${mot}${t.slice(i + m[0].length)}`;
};
const enPause = e => e.t >= PAUSE_DEB && e.t < PAUSE_FIN;
export const texteDe = (e, sc = SCENES[e.scene]) => {
  const t = nommer(e, sc, typeof sc.texte === 'function' ? sc.texte(e) : sc.texte);
  // Résultat lu pendant la pause déjeuner : le technicien l'a laissé sur la paillasse avant de partir
  return sc.id?.startsWith('res_') && enPause(e) ? `🍽 C'est la pause déjeuner : le résultat a été laissé sur ta paillasse avant le départ de l'équipe.\n${t}` : t;
};
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
  if (Number.isFinite(v) && Math.abs(v - vrai) <= Math.abs(vrai) * k.tol) { const st = choisir(e, k.ok); return { etat: k.garde ? { ...st, f: { ...st.f, ...k.garde(v) } } : st, juste: true, message: '' }; }
  const essais = e.essais + 1;
  if (essais >= 2) return { etat: choisir({ ...e, t: e.t + 5 }, k.ko), juste: false, message: '' };
  return { etat: { ...e, t: e.t + 5, essais }, juste: false, message: (k.retour && Number.isFinite(v) && k.retour(v, e)) || k.indice };
}

// Délégation d'une analyse à un technicien : il travaille en parallèle (une chose à la fois) ; seul·e en mode « solo », tout le temps est pour toi
function deleguer(e, A, moi = false) {
  const solo = e.f.plan === 'solo' || moi;
  if (solo) { const t = e.t + A.duree; return nota({ ...e, t, cmd: { ...e.cmd, [A.cle]: { pret: t, lu: false } } }, `Je réalise moi-même : ${A.label}.`); }
  const { pret } = planTech(e, A);
  return nota({ ...e, t: e.t + A.perso, libre: { ...e.libre, [A.tech]: pret }, cmd: { ...e.cmd, [A.cle]: { pret, lu: false } } },
    `Demande à ${PNJ[A.tech].nom} : ${A.label} (résultat vers ${hhmm(pret)}).`);
}

// ───────────── Formule finale : l'élève pose sa propre formule, confrontée au cahier des charges ─────────────
export const MASSE_MIN = 250, MASSE_MAX = 400;   // capacité de la cuve de la défloculeuse (g)
const fmComplet = fm => ({ resine: 'orgal', foamex: 1.5, thixol: 1.5, coapur: 6.7, ...fm });
// Contrôles « sur papier » : seulement ce qui se calcule avec ce que l'élève sait (fiches, ou ses propres mesures)
export function controlesFormule(e, fm) {
  const f = fmComplet(fm), mes = e.f.phMes, p = proprietes(f, mes ? { phPerso: mes } : { ph: 'fiche' }), act = pctActif(f), cout = coutKg(f);
  return [
    { cle: 'es', ok: p.ES > 50, t: `Extrait sec ${nf(p.ES)} % (cahier des charges : > 50 %).` },
    { cle: 'lambda', ok: p.lambda >= 0.8, t: `λ = CPV / CPVC = ${nf(p.CPV)} / ${nf(p.CPVC)} = ${nf(p.lambda, 2)} (≥ 0,8 demandé), calculé avec les prises d'huile ${mes ? 'que tu as mesurées' : 'des fiches techniques (TiO₂ 20, CaCO₃ 14) : valables pour nos poudres ?'}.` },
    { cle: 'cov', ok: p.COV < COV_MAX, t: `COV calculé ${nf(p.COV, 0)} g/L (< ${COV_MAX} g/L demandé).` },
    { cle: 'cout', ok: cout < 4.5, t: `Coût matières premières ${nf(cout, 2)} €/kg (< 4,5 €/kg demandé).` },
    { cle: 'disp', ok: act >= 0.15 && act <= 0.30 ? true : null, t: `Dispersant : ${nf(act, 2)} % de matière active sur les poudres, ${act >= 0.15 && act <= 0.30 ? 'dans' : 'hors de'} la plage recommandée par la fiche technique.` },
    ...(f.dpnb > 0 || e.f.coalPense || e.f.refaitCoal ? [{ cle: 'coal', ok: p.pctCoalescent >= 4 && p.pctCoalescent <= 8 ? true : null, t: `Coalescent : ${nf(p.pctCoalescent, 1)} % du polymère sec (règle d'atelier : 4 à 8 %).` }] : []),
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
  if (cle === 'huile' && /moi.?meme|spatule|je mesure|je fais moi|\bseule?\b/.test(t)) cle = 'huile-moi';
  else if (cle && cle !== 'huile' && ANALYSES.some(a => a.cle === cle && a.tech !== 'perrin') && /moi.?meme|je (le |la )?(fais|mesure|lance|realise) moi|\bseule?\b/.test(t)) cle += '-moi';
  if (!cle && /dejeuner|manger|pause|midi|repas|cantine/.test(t)) cle = 'pause';
  if (!cle) return { ok: false, etat: e, message: 'Je ne vois pas quelle mesure ou quelle action ça recouvre. Reformule avec le nom de la mesure ou du contrôle (par exemple « mesurer la viscosité »), ou demande des idées.' };
  const c = choixDe(e).find(x => x.cle === cle);
  if (c) return { ok: true, etat: choisir(e, c) };
  const A = ANALYSES.find(a => a.cle === cle.replace('-moi', ''));
  if (cle === 'pause') return { ok: false, etat: e, message: e.f.dejeune ? 'Tu as déjà déjeuné.' : 'La pause déjeuner est possible entre 11 h 30 et 14 h.' };
  if (e.cmd[cle === 'huile-moi' ? 'huile' : cle.replace('-moi', '')]) return { ok: false, etat: e, message: 'Tu l\'as déjà demandé : regarde « En cours » ou lis le résultat.' };
  if (cle === 'dpnb' && e.f.mes_dpnb) return { ok: false, etat: e, message: 'Le DPnB a déjà été dosé dans cette peinture.' };
  if (cle === 'etuve' && e.f.etuve) return { ok: false, etat: e, message: 'Un échantillon est déjà à l\'étuve.' };
  if (cle.endsWith('-moi') && cle !== 'huile-moi' && A && (e.f.fabrique || A.avant)) return { ok: true, etat: choisir(e, { run: n => deleguer(n, A, true), vers: 'labo' }) };
  if (!e.f.fabrique && cle !== 'huile' && !A?.avant) return { ok: false, etat: e, message: 'Il n\'y a pas de peinture à analyser pour l\'instant : il faut d\'abord en fabriquer.' };
  return { ok: false, etat: e, message: 'Ça n\'est pas possible maintenant.' };
}
export const demanderIdees = e => e.f.idees ? e : nota({ ...e, t: e.t + 5, f: { ...e.f, idees: true } }, 'Je prends cinq minutes pour faire le point sur ce que je peux encore lancer.');

// ───────────── Les analyses déléguées ─────────────
// avant : possible avant la fabrication (matières premières)
export const ANALYSES = [
  { cle: 'huile', tech: 'lucas', label: 'Prises d\'huile des poudres (TiO₂, CaCO₃)', duree: 40, perso: 10, avant: true },
  { cle: 'es', tech: 'ines', label: 'Extrait sec et densité de la peinture', duree: 40, perso: 5 },
  { cle: 'rheo', tech: 'lucas', label: 'Profil rhéologique (viscosimètre)', duree: 40, perso: 10 },
  { cle: 'masq', tech: 'lucas', label: 'Pouvoir masquant (4 épaisseurs, contraste)', duree: 60, perso: 20 },
  { cle: 'brill', tech: 'lucas', label: 'Brillance du film (glossmètre 60° et 85°)', duree: 30, perso: 5 },
  { cle: 'tmff', tech: 'lucas', label: 'Température minimale de formation de film (TMFF)', duree: 45, perso: 10 },
  { cle: 'cout', tech: 'perrin', label: 'Devis de l\'Orgal et coût matières premières', duree: 20, perso: 5 },
];
// Pause déjeuner de l'équipe : de 12 h 00 à 13 h 00, les techniciens ne travaillent pas (une analyse en cours est suspendue)
export const PAUSE_DEB = 240, PAUSE_FIN = 300;
export const planTech = (e, A) => {
  let debut = Math.max(e.t, e.libre[A.tech] || 0), pret;
  if (debut >= PAUSE_DEB && debut < PAUSE_FIN) debut = PAUSE_FIN;
  pret = debut + A.duree;
  if (debut < PAUSE_DEB && pret > PAUSE_DEB) pret += PAUSE_FIN - PAUSE_DEB;
  return { debut, pret };
};
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
// Pouvoir masquant (m²/L) : modèle de scénario, croît avec la concentration en TiO₂ (g/L de peinture) ; réf. Vinnapas ≈ 8,0 ; l'Orgal donne un film un peu moins efficace
// pour répartir le TiO₂ (≈ 6,6 avec 60 g de TiO₂) ; amas mal dispersés : −10 %
const KPM = 6.6, PM_C0 = 244.9;
// (les ajouts de correction d'épaississant ne comptent pas : quelques % de dilution)
export const pouvoirMasquant = e => { const e0 = { ...e, f: { ...e.f, coapurAdd: 0, thixolAdd: 0 } }, p = prop(e0), c = formule(e0).tio2 / (p.mTot / p.densite) * 1000; return KPM * Math.pow(c / PM_C0, 0.6) * (mauvaisRheo(e) ? 6.8 / 7.6 : 1); };
// Rhéologie à haut gradient (viscosimètre Lamy RM 100 Plus, mobile MS-R3, godet d'environ 30 mL, gradients de 1 à 1 000 s⁻¹).
// Critère : viscosité à 1 000 s⁻¹ en mPa·s. Référence Vinnapas 330 ; avec l'Orgal, mêmes masses de polymère sec, mais rien ne garantit la même viscosité une fois mélangé au reste :
// ici plus fluide à haut gradient. Le Coapur (newtonien) relève la viscosité à haut gradient ; le Thixol (pseudoplastique) relève surtout le bas gradient.
export const HS_MIN = 280, HS_MAX = 480, HS_REF = 330, HS_BASE = 190, BAS_REF = 20250, BAS_MAX = 24000;
export const K_COAPUR = 156;          // mPa·s à 1 000 s⁻¹ par gramme de Coapur (produit humide) pour 50 g de peinture : 1 g / 50 g = +0,5 % de matière sèche, soit le double de la dose de départ
export const M_ESSAI = 50;            // g : prise d'essai minimale (le godet contient ≈ 30 mL, soit ≈ 40 g)
export const ESSAIS_VISCO = 4, DUREE_VISCO = 10;
const rapport50 = (e, g) => g * M_ESSAI / prop(e).mTot;      // masse ajoutée au lot ramenée à 50 g de peinture
export const mesureVisco = (D, additif) => ({ hs: HS_BASE + (additif === 'coapur' ? K_COAPUR : 8) * D, bas: BAS_REF * (1 + (additif === 'thixol' ? 0.9 : 0.02) * D) });
export const hsVrai = e => { const m = mesureVisco(rapport50(e, e.f.coapurAdd || 0), 'coapur'), t = mesureVisco(rapport50(e, e.f.thixolAdd || 0), 'thixol'); return m.hs + t.hs - HS_BASE; };
export const basVrai = e => mesureVisco(rapport50(e, e.f.coapurAdd || 0), 'coapur').bas + mesureVisco(rapport50(e, e.f.thixolAdd || 0), 'thixol').bas - BAS_REF;
export const hsOk = e => { const v = hsVrai(e); return v >= HS_MIN && v <= HS_MAX; };
export const basOk = e => basVrai(e) <= BAS_MAX;
// Essai d'ajout sur une prise d'essai (50 g) ou sur tout le lot : m = masse de produit humide pesée
export function essaiVisco(e, m) {
  const v = e.f.visco || {}, n = (v.essais || []).length;
  if (!(m >= 0) || !v.taille || n >= (v.taille === 'tout' ? 1 : ESSAIS_VISCO)) return e;
  const D = m * M_ESSAI / (v.taille === 'tout' ? prop(e).mTot : M_ESSAI), r = mesureVisco(D, v.additif);
  const essai = { m, D, hs: r.hs, bas: r.bas, ok: r.hs >= HS_MIN && r.hs <= HS_MAX && r.bas <= BAS_MAX };
  return { ...e, t: e.t + DUREE_VISCO, f: { ...e.f, visco: { ...v, essais: [...(v.essais || []), essai] } } };
}
// λ réel : avec les prises d'huile (cachées) du lot de poudres
export const lambdaVrai = e => prop(e, { phPerso: { tio2: phVrai(e, 'tio2'), caco3: phVrai(e, 'caco3') } }).lambda;
// Brillance à 60° (UB) : mate quand λ ≥ 0,85, de plus en plus brillante quand λ baisse (modèle de scénario)
export const brillance = e => { const l = lambdaVrai(e), g60 = 2.8 + 70 * Math.pow(Math.max(0, 0.85 - l), 1.3); return { g60, g85: g60 * 2.3, l }; };

add('intro', { lieu: 'Bureau de la responsable', pnj: 'dubreuil', titre: 'Lundi, 8 h 00',
  texte: e => `Mme Dubreuil t'accueille avec un café et un dossier.\n« ${pn(e) ? 'Bonjour ' + pn(e) + '. ' : ''}Notre fournisseur est en rupture de Vinnapas EP 3360, la résine de notre base de peinture blanche intérieure. Il faut pouvoir la remplacer par l'Orgal PST 50A sans dégrader la base : mate (λ = CPV/CPVC ≥ 0,8), extrait sec supérieur à 50 %, pouvoir masquant supérieur à 7,0 m²/L, COV inférieurs à 30 g/L, matières premières à moins de 4,5 €/kg, et film qui se forme dès 5 °C. »\n« On en profite pour corriger un défaut : les opérateurs trouvent des gros amas de poudres à la dispersion. Je veux une formule, une peinture fabriquée et un dossier de contrôle qualité. »\n« Appel avec notre cliente, Mme Aubry, à 15 h. Rapport pour 17 h 30. Karim, Inès et Lucas t'aident, mais chacun ne fait qu'une chose à la fois. »`,
  choix: [{ t: 'Parcourir le dossier', vers: 'docs' }] });

add('docs', { lieu: 'Bureau', pnj: 'moi', titre: 'Étude du dossier',
  texte: e => `Tu étales les documents. Il est ${hhmm(e.t)}. Que fais-tu ?${e.f.docRef ? '' : '\n(Il te faut au moins la formule de référence pour avancer.)'}`,
  choix: () => [
    { t: 'Les fiches techniques des deux résines (Document 8)', si: e => !e.f.fiche, duree: 10, f: { fiche: true }, vers: 'docRes' },
    { t: 'La formule et la fiche de fabrication de la référence (Documents 1 et 2, résultats du responsable)', si: e => !e.f.docRef, duree: 15, f: { docRef: true }, vers: 'docRef' },
    { t: 'J\'ai de quoi préparer l\'appel d\'organisation', si: e => e.f.docRef, vers: 'appel' },
  ] });

add('docRes', { lieu: 'Bureau', pnj: 'moi', titre: 'Document 8 : les deux résines', fiches: ['vinnapas', 'orgal'],
  texte: 'Tu lis les deux fiches techniques côte à côte (elles sont affichées ci-dessous). Qu\'est-ce qui change pour la formule quand on passe de l\'une à l\'autre ?',
  choix: [{ t: 'J\'ai fait le tour des deux fiches', vers: 'docs' }] });

// Après avoir décidé d'ajouter du coalescent (par anticipation, ou après une mesure de TMFF) : la promesse faite à la cliente est-elle encore tenable ?
const suiteCoal = e => e.f.refaitCoal ? 'formuleFinale' : 'stock';
// Dose de coalescent décidée : si c'est la première fois, la promesse « COV nuls » faite à la cliente est à reconsidérer
const apresDose = e => (e.f.dpnb ?? 0) > 0 && e.f.alerte === undefined ? 'incoherence' : suiteCoal(e);
add('incoherence', { lieu: 'Paillasse', pnj: 'moi', titre: 'La promesse faite à la cliente',
  texte: e => `Tu viens de décider d'ajouter ${nf(e.f.dpnb ?? 0, 0)} g de DPnB, un solvant. Or la commande de la cliente promet une peinture « sans solvant, COV nuls ». Le cahier des charges interne, lui, dit COV inférieurs à 30 g/L.\nQue fais-tu de cette incohérence ?`,
  choix: [
    { t: 'J\'en parle tout de suite à Mme Dubreuil (5 min)', duree: 5, f: { alerte: true }, note: 'Alerte : la promesse « sans solvant, COV nuls » est incompatible avec l\'Orgal (MFFT 20 °C : coalescent nécessaire). Signalé à Mme Dubreuil.', vers: 'commResp' },
    { t: 'Je la note dans mon cahier pour en parler plus tard', f: { alerte: 'plustard' }, note: 'À clarifier : promesse « COV nuls » de la cliente vs coalescent nécessaire avec l\'Orgal.', vers: suiteCoal },
    { t: 'Je ne dis rien : on m\'a demandé de changer la résine, pas de discuter la commande', f: { alerte: false }, vers: suiteCoal },
  ] });
add('alerteRep', { lieu: 'Bureau', pnj: 'dubreuil', titre: 'Réponse de Mme Dubreuil',
  texte: '« Bien vu. Notre cahier des charges dit COV inférieurs à 30 g/L, pas zéro : ce n\'est pas la même promesse. Je préviendrai la cliente à l\'appel de 15 h, et note-le dans ton rapport. Merci de me prévenir plutôt que de découvrir ça au dernier moment. »',
  choix: [{ t: 'Reprendre la formulation', vers: suiteCoal }] });

add('docRef', { lieu: 'Bureau', pnj: 'moi', titre: 'Documents 1, 2, 4 et 5 : la référence Vinnapas', fiches: ['formule', 'fabrication'],
  texte: () => { const pf = proprietes(FORMULE_REF, { ph: 'fiche' });
    return `Formule de référence (331 g) : eau 118,0 g, TiO₂ 60 g, CaCO₃ léger 60 g, Vinnapas 83,3 g, Foamex 1,5 g, Coadis BR3 0,2 g, Thixol 1,5 g, Coapur 6,7 g. Pas de coalescent.\nTableur avec les prises d'huile des fiches (20 et 14 g pour 100 g) : ES = ${nf(pf.ES)} %, CPV = ${nf(pf.CPV)} %, CPVC = ${nf(pf.CPVC)} %, donc λ = ${nf(pf.lambda, 2)}. COV = ${nf(pf.COV)} g/L. Coût matières premières ≈ ${nf(coutKg(FORMULE_REF))} €/kg.\nAnalyses du responsable : pouvoir masquant 8,0 m²/L ; comportement rhéofluidifiant, faible thixotropie, viscosité à 1 000 s⁻¹ de 330 mPa·s ; film continu dès 3 °C.\nÉtonnant : avec λ = ${nf(pf.lambda, 2)} < 0,8, cette peinture ne devrait pas être mate, or elle l'est. Les prises d'huile des fiches sont-elles fiables ?\nFiche de fabrication : 70 % de l'eau, Foamex, Coadis, puis TiO₂ et CaCO₃ en pluie fine à 300 tr/min, dispersion 15 min à vitesse maximale (finesse 7 Hegman) ; ensuite la résine, le Thixol et le Coapur sous agitation lente (200 tr/min), enfin le reste de l'eau.`; },
  choix: [{ t: 'Revenir au dossier', vers: 'docs' }] });

// ───────────── Communication adaptée à l'interlocuteur (C7.3) : technicien·nes, responsable, cliente ─────────────
// Chaque choix a une qualité : 'adapte' (1), 'partiel' (0,5) ou 'mauvais' (0) ; elle est mémorisée dans f.comm et relue par la fiche d'auto-évaluation.
export const QUALITE_COMM = { adapte: 1, partiel: 0.5, mauvais: 0 };
const msg = (interl, qualite, t, retour, duree, vers) => ({ t, duree, note: `Communication (${interl}) : ${qualite === 'adapte' ? 'adaptée' : qualite === 'partiel' ? 'à ajuster' : 'inadaptée'}.`,
  run: e => ({ ...e, f: { ...e.f, comm: { ...(e.f.comm || {}), [interl]: qualite }, commRetour: retour, commVers: typeof vers === 'function' ? vers(e) : vers } }), vers: 'commRetour' });
add('commRetour', { lieu: 'Sur place', pnj: 'moi', titre: 'Ce que ça a donné', texte: e => e.f.commRetour || '', choix: e => [{ t: 'Continuer', vers: e.f.commVers || 'labo' }] });
add('commEquipe', { melange: true, lieu: 'Paillasse', pnj: 'moi', titre: 'Briefer l\'équipe',
  texte: 'Karim, Inès et Lucas sont autour de la paillasse, chacun avec sa propre charge de travail. Tu leur annonces comment la journée va se passer. Comment le leur dis-tu ?',
  choix: () => [
    msg('equipe', 'adapte', '« Bonjour tous. Aujourd\'hui, on remplace la Vinnapas par l\'Orgal. Je vous donnerai chaque échantillon avec la mesure voulue, la plage de gradients ou de températures et l\'heure à laquelle j\'en ai besoin. Si c\'est trop chargé, dites-le-moi et je réordonne. Merci ! »',
      'Karim, Inès et Lucas notent. Chacun sait ce que tu attends et pour quand, et peut s\'organiser : les demandes iront vite, sans allers-retours.', 0, 'planFormule'),
    msg('equipe', 'partiel', '« Salut la bande ! J\'aurai des trucs à vous faire mesurer, je vous dis ça au fur et à mesure, vous voyez. »',
      'Lucas fronce les sourcils : « Quels trucs ? Pour quand ? » Chaque demande demandera des précisions : cinq minutes perdues, et des allers-retours à venir.\nÀ retenir : pour un collègue technicien, un message précis (l\'échantillon, la mesure, le délai), poli et sans jargon inutile, fait gagner du temps à tout le monde.', 5, 'planFormule'),
    msg('equipe', 'mauvais', '« Il me faut vos résultats vite. Pas de retard, c\'est prioritaire sur tout le reste, compris ? »',
      'Le ton est sec. Personne ne répond, mais Karim glisse : « On est tous débordés aujourd\'hui, tu sais. » Tu obtiendras tes résultats, avec moins de bonne volonté la prochaine fois.\nÀ retenir : on demande plutôt qu\'on n\'exige, en donnant le contexte et l\'échéance. L\'équipe est une ressource, pas un exécutant.', 0, 'planFormule'),
  ] });
add('commResp', { melange: true, lieu: 'Couloir', pnj: 'moi', titre: 'Prévenir la responsable',
  texte: e => `Mme Dubreuil sort de réunion, elle a cinq minutes. Tu as décidé d'ajouter ${nf(e.f.dpnb ?? 0, 0)} g de DPnB et la cliente a été promise une peinture sans solvant. Comment lui présentes-tu l'incohérence ?`,
  choix: () => [
    msg('resp', 'adapte', '« Madame Dubreuil, un point important avant l\'appel de 15 h : la cliente attend une peinture « COV nuls ». Or l\'Orgal a une MFFT de 20 °C : il lui faut un peu de coalescent, donc des COV faibles mais non nuls, sous 30 g/L. Je propose que vous le lui annonciez, et je vous donne le chiffre dès que je l\'ai mesuré. »',
      'Mme Dubreuil a tout de suite compris l\'enjeu : constat, cause, conséquence pour la cliente, proposition chiffrée. Elle peut décider en deux minutes.', 0, 'alerteRep'),
    msg('resp', 'partiel', '« Patronne, y a un petit souci avec les COV de la cliente, ça va pas trop le faire avec l\'Orgal, je crois. »',
      'Mme Dubreuil lève un sourcil : « Je ne sais pas de quel souci tu parles ni quelle en est la conséquence. Reprends : le constat, la cause, ce que tu proposes. » Tu reformules posément, ce qui coûte cinq minutes.\nÀ retenir : avec une responsable, ton professionnel et structuré : le constat, la conséquence, la proposition.', 10, 'alerteRep'),
    msg('resp', 'mauvais', '« La dispersion styrène-acrylique d\'Orgal a une Tg et une MFFT de 20 °C, donc le film ne coalesce pas sans plastifiant temporaire, et le DPnB est un éther de glycol dipropylénique de faible volatilité… »',
      'Mme Dubreuil t\'interrompt : « Je n\'ai pas le temps de décrypter la MFFT. Qu\'est-ce que ça change pour la cliente ? » Il faut tout reformuler en conséquences (COV non nuls, mention à retirer) : dix minutes.\nÀ retenir : une responsable qui doit décider veut la conséquence et une proposition, pas le mécanisme.', 10, 'alerteRep'),
  ] });

add('appel', { melange: true, lieu: 'Téléphone', pnj: 'dubreuil', titre: 'L\'appel d\'organisation obligatoire',
  texte: e => `Il est ${hhmm(e.t)}. Mme Dubreuil décroche : « Dis-moi comment tu organises ta journée. Rappel : les analyses se délèguent, mais Karim, Inès et Lucas ne peuvent pas tout faire en même temps, et Lucas est très demandé. »`,
  choix: [
    { t: 'Je formule d\'abord, puis je délègue les analyses dès que la peinture est prête', f: { plan: 'seq' }, note: 'Plan : formulation, puis analyses déléguées.', vers: 'commEquipe' },
    { t: 'Je fais d\'abord mesurer les prises d\'huile des poudres par Lucas (la référence « mate » m\'intrigue), pendant que je formule', f: { plan: 'mp' }, note: 'Plan : prises d\'huile des poudres demandées tout de suite à Lucas, formulation en parallèle.',
      run: e => deleguer(e, ANALYSES[0]), vers: 'commEquipe' },
    { t: 'Je fais tout moi-même, je ne veux déranger personne', f: { plan: 'solo' }, note: 'Plan : tout réalisé seul·e.', vers: 'solo' },
  ] });
add('solo', { lieu: 'Téléphone', pnj: 'dubreuil', titre: 'Mme Dubreuil sourit',
  texte: '« Comme tu veux. Mais tu n\'as qu\'une journée, pas une semaine. Et l\'esprit d\'équipe fait partie de ce qu\'on attend. »',
  choix: [{ t: 'Je me mets au travail', vers: 'planFormule' }] });

// ───────────── Formulation ─────────────
// Question ouverte de départ : que modifie-t-on dans la formule ? (liste d'options dont certaines ne servent à rien)
export const PLAN_OPTIONS = [
  ['resine', 'Recalculer la quantité de résine'], ['disp', 'Revoir le dispersant (les amas de poudres)'], ['coal', 'Ajouter un agent de coalescence (solvant filmifiant)'],
  ['epais', 'Ajouter un épaississant supplémentaire'], ['tio2', 'Augmenter la quantité de TiO₂'], ['biocide', 'Ajouter un biocide'], ['ammo', 'Ajouter de l\'ammoniaque pour neutraliser'], ['rien', 'Rien d\'autre'],
];
export const choixPlan = (e, sel) => ({ t: 'Valider mon plan', f: { planForm: sel, coalPense: sel.includes('coal') }, note: `Modifications envisagées : ${sel.length ? sel.map(k => PLAN_OPTIONS.find(o => o[0] === k)?.[1]).join(' ; ') : 'aucune de plus que le changement de résine'}.`, vers: 'regle' });
// Ordre mélangé, mais l'agent de coalescence n'est jamais en tête de liste (cela le ferait remarquer)
export const optionsPlan = e => { const L = melanger(e, 'plan', PLAN_OPTIONS.filter(o => o[0] !== 'rien')); if (L[0][0] === 'coal') [L[0], L[2]] = [L[2], L[0]]; return L.concat([PLAN_OPTIONS.find(o => o[0] === 'rien')]); };
add('planFormule', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Que change-t-on dans la formule ?', station: 'plan',
  texte: e => `Il est ${hhmm(e.t)}. Karim t'attend à la paillasse avec la formule de référence.\n« Avant de peser quoi que ce soit : pour remplacer la Vinnapas par l'Orgal, qu'est-ce que tu changes ou que tu ajoutes dans la formule ? Coche ce que tu envisages. Tout ajout coûte de la matière, du temps ou des conséquences. »`,
  choix: e => [choixPlan(e, [])] });
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
  texte: 'Pour garder le même extrait sec, la masse totale de la formule reste 331,2 g, comme dans la référence (83,3 g de Vinnapas, 118,0 g d\'eau). Les autres matières ne changent pas. Avec ta masse d\'Orgal, il faut recalculer l\'eau.',
  calcul: { q: 'Quelle masse d\'eau faut-il dans ta formule ?', unite: 'g', vrai: () => 118.0 - (100 - 83.3), tol: 0.02,
    indice: 'On ajoute 16,7 g de résine en plus ; l\'eau doit diminuer de cette masse pour garder 331,2 g.',
    ok: { f: { regle: 'ok' }, vers: e => e.f.refait ? 'formuleFinale' : 'dispersion', note: 'Eau : 101,3 g (formule : Orgal 100 g, eau 101,3 g).' },
    ko: { f: { regle: 'ok' }, duree: 10, vers: e => e.f.refait ? 'formuleFinale' : 'dispersion', note: 'Eau : 101,3 g (calculée avec l\'aide de Karim).' } } });

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
const versCoal = e => e.f.coalPense ? 'coalescent' : 'stock';
add('calcCoadis', { lieu: 'Paillasse', pnj: 'moi', titre: 'Calcul : dose de dispersant', fiches: ['coadis'],
  texte: 'Karim : « Les amas viennent d\'un manque de dispersant. Lis la fiche technique du Coadis BR3 : elle dit quelle quantité mettre. »\nDans la formule, les poudres pèsent 60 g de TiO₂ et 60 g de CaCO₃ ; la dose actuelle est de 0,2 g de Coadis BR3.',
  calcul: { q: 'Quelle masse de Coadis BR3 (produit tel que fourni) pèses-tu pour les poudres de la formule ? Vise le milieu de la plage recommandée par la fiche.', unite: 'g', vrai: () => 0.00175 * 120 / 0.4, tol: 0.15,
    indice: 'Le dosage est une masse de matière active (extrait sec du produit) rapportée à la masse de poudres (pigments et charges). Exemple avec un autre produit : pour 100 g de poudres, 1 g d\'un dispersant à 30 % d\'extrait sec apporte 0,3 g de matière active, soit un dosage de 0,3 %. Applique la même idée avec la fiche du Coadis BR3 et nos 120 g de poudres.',
    retour: v => v >= 1 ? 'Attention : à cette dose, le dispersant est très en excès (surdosage : film sensible à l\'eau, mousse, coût). Revois le calcul.' : null,
    garde: v => ({ coadis: Math.round(v * 1000) / 1000 }),
    ok: { vers: versCoal, note: 'Dispersant relevé pour supprimer les amas (calcul fait à partir de la fiche du Coadis BR3).' },
    ko: { f: { coadis: 0.5 }, vers: versCoal, duree: 10, note: 'Dispersant relevé à 0,5 g de Coadis BR3 (valeur donnée par Karim).' } } });

// ───────────── Station : courbe de défloculation du dispersant ─────────────
export const INDICES_COURBE = [
  'Karim : « Relis la fiche du Coadis BR3 : elle donne une plage de dosage, en matière active sur les poudres. Commence autour de cette plage, et vérifie-la plutôt que de la croire. »',
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
  choix: () => [{ t: 'Passer à la suite', vers: versCoal }] });

add('coalescent', { melange: true, lieu: 'Paillasse', pnj: 'karim', titre: 'Le coalescent', fiches: ['dpnb'],
  texte: e => !e.f.refaitCoal
    ? 'Tu as prévu un agent de coalescence.\nKarim : « Pourquoi pas, mais il faut le doser. La fiche du DPnB ne donne aucun dosage. Chez nous, la règle d\'atelier est de 4 à 8 % du polymère sec, à confirmer par un essai. »'
    : e.f.coalPense ? `Ta mesure est tombée : TMFF ${nf(Math.max(0, prop(e).tmff), 0)} °C, COV calculés ${nf(prop(e).COV, 0)} g/L. La dose de coalescent n'est pas la bonne.\nKarim : « On la reprend. La règle d'atelier est de 4 à 8 % du polymère sec, à confirmer par un essai. »`
    : `Karim relit ta mesure : la TMFF de ta peinture est de ${nf(Math.max(0, prop(e).tmff), 0)} °C, bien au-dessus des 5 °C du cahier des charges. Elle craquellerait sur un mur froid.\n« Regarde la fiche de l'Orgal : MFFT de 20 °C. La Vinnapas filmifiait toute seule (2 °C), pas cette résine : il lui faut un agent de coalescence. La fiche du DPnB ne donne aucun dosage ; chez nous la règle d'atelier est de 4 à 8 % du polymère sec, à confirmer par un essai. »`,
  choix: [
    { t: 'Ajouter 1 g par précaution, sans calcul', f: { dpnb: 1 }, note: 'Coalescent (DPnB) ajouté à 1 g, sans calcul.', vers: e => apresDose(e) },
    { t: 'Calculer la dose avec la règle d\'atelier de Karim (4 à 8 % du polymère sec)', vers: 'calcDpnb' },
    { t: 'Faire d\'abord un pré-essai au banc TMFF avec Lucas', d: '5 min de préparation, puis 5 min par essai', duree: 5, note: 'Pré-essai au banc TMFF demandé à Lucas.', vers: 'stationBanc' },
    { t: 'Mettre 10 g : on sera tranquille pour la filmification', f: { dpnb: 10 }, note: 'Coalescent (DPnB) mis à 10 g « par sécurité ».', vers: e => apresDose(e) },
  ] });
add('calcDpnb', { lieu: 'Paillasse', pnj: 'moi', titre: 'Calcul : dose de coalescent', fiches: ['dpnb', 'orgal'],
  texte: 'Les 100 g d\'Orgal apportent 50 g de polymère sec. La règle d\'atelier de Karim est de 4 à 8 % de la masse de polymère sec ; tu vises le milieu de la plage, 6 %.',
  calcul: { q: 'Quelle masse de DPnB pèses-tu ?', unite: 'g', vrai: () => 0.06 * 50, tol: 0.17,
    indice: 'Masse de DPnB = 6 % × masse de polymère sec (50 g, pas 100 g de dispersion).',
    retour: v => v >= 6 ? 'Attention : ce n\'est pas 6 % de la dispersion mais du polymère sec (50 g). Une telle dose ferait monter les COV.' : null,
    ok: { f: { dpnb: 3 }, vers: e => apresDose(e), note: 'Coalescent : 3 g de DPnB (6 % du polymère sec), retirés de l\'eau (102 g).' },
    ko: { f: { dpnb: 3 }, vers: e => apresDose(e), duree: 10, note: 'Coalescent : 3 g de DPnB (valeur donnée par Karim), retirés de l\'eau.' } } });

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
const apresCoal = e => apresDose(e);

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
    { t: 'Je contrôle le fût : aspect et filtration sur toile de 100 µm (15 min)', duree: 15, f: { stockCtrl: true }, note: 'Contrôle du fût d\'Orgal (stocké dans un local non chauffé, −5 °C).', vers: 'stockRes' },
    { t: 'On l\'utilise comme ça : on gagne du temps', vers: 'stockAlerte' },
  ] });
add('stockAlerte', { melange: true, lieu: 'Local de stockage', pnj: 'karim', titre: 'Karim insiste',
  texte: '« Une dispersion de copolymère styrène-acrylique n\'aime pas le gel : les particules peuvent coaguler. Du coagulum dans la peinture, ça se voit à la jauge Hegman et ça fausse toutes tes mesures. On vérifie, ça prend un quart d\'heure. »',
  choix: [
    { t: 'Tu as raison, je contrôle le fût (15 min)', duree: 15, f: { stockCtrl: true, stockAlerte: true }, note: 'Contrôle du fût d\'Orgal, à la demande de Karim.', vers: 'stockRes' },
    { t: 'Je n\'ai pas le temps, on l\'utilise', vers: 'fin_matiere' },
  ] });
add('stockRes', { lieu: 'Local de stockage', pnj: 'karim', titre: 'Résultat du contrôle',
  texte: 'Sur la toile de filtration de 100 µm, il reste des grumeaux de coagulum : une partie de la dispersion a gelé.\n« Voilà. C\'est écrit sur la fiche : à protéger du gel. »',
  choix: e => [
    { t: `Demander un fût neuf à M. Perrin (livré vers ${hhmm(e.t + 40)} : 40 min d'attente avant de fabriquer)`, duree: 40, f: { stock: 'neuf' }, note: 'Fût d\'Orgal gelé écarté ; fût neuf commandé à M. Perrin.', vers: 'formuleFinale' },
    { t: 'Filtrer la dispersion sur toile de 100 µm et l\'utiliser quand même', duree: 10, f: { stock: 'tamise', lotDouteux: true }, note: 'Dispersion d\'Orgal filtrée sur toile (coagulum retiré) et utilisée malgré le gel.', vers: 'formuleFinale' },
  ] });
add('fin_matiere', { lieu: 'Local de stockage', pnj: 'karim', titre: 'Une peinture bâtie sur un lot dégradé', fin: { ton: 'ko', titre: 'Lot douteux utilisé' },
  texte: e => `Il est ${hhmm(e.t)}. Tu as utilisé la dispersion d'Orgal sans contrôler qu'elle avait gelé. La peinture est pleine de grains, la finesse est mauvaise, les mesures sont aberrantes et les résultats du rapport ne veulent rien dire. Mme Dubreuil : « Contrôler une matière première avant de s'en servir, c'est le B.A.-BA. On refait tout demain avec un fût neuf. »`,
  choix: [] });

add('formuleFinale', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Ta formule finale', station: 'formule',
  entree: e => ({ ...e, f: { ...e.f, fm: undefined } }),
  texte: e => `Il est ${hhmm(e.t)}. Karim te tend la feuille de pesée.\n« Avant de peser, pose ta formule noir sur blanc. Tout ce que tu as décidé jusqu'ici y est reporté, mais c'est toi qui signes : tu peux encore changer une masse. Le cahier des charges ne se discute pas, lui. »${(e.f.dpnb ?? 0) > 0 && e.f.regle !== 'naif' ? `\n(L'eau reportée tient compte du DPnB : ${nf(101.3, 1)} g − ${nf(e.f.dpnb, 1)} g, pour garder une masse totale de 331,2 g.)` : ''}${e.f.refaitCoal || e.f.refaitForm || e.f.refait ? '\n(Tu refais la peinture : c\'est le moment de corriger ce qui ne va pas.)' : ''}`,
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
// Masse de peinture réellement pesée pour l'échantillon (jamais exactement 1,000 g)
export const mEch = e => { const sg = brasser(`${e.f.graine ?? 1}|mechs`) / 4294967296 < 0.5 ? -1 : 1; return Math.round((1 + sg * (0.02 + 0.05 * brasser(`${e.f.graine ?? 1}|mechm`) / 4294967296)) * 1000) / 1000; };
export const cEch = e => cEchantillon(covDe(e), prop(e).densite, e.f.graine ?? 1, mEch(e));
// Masse volumique utilisée par l'élève pour passer de c au COV : celle d'Inès, ou son estimation (1,0 g/mL « comme l'eau »)
export const rhoCpg = e => e.f.rhoUtilise ?? prop(e).densite;
export const C_CTRL = 1.2;   // mg/mL : solution de contrôle préparée indépendamment des étalons (vérification de la justesse)
const cpgInit = { etal: [], ech: [], ctrl: [], prep: false, mode: 'interne' };
export const cpgDe = e => ({ ...cpgInit, ...(e.f.cpg || {}) });
const avecCpg = (e, c, dt = 0) => ({ ...e, t: e.t + dt, f: { ...e.f, cpg: { ...cpgDe(e), ...c } } });
// ───────────── Méthode CPG : étalon interne, températures d'injecteur / four / détecteur (choix de l'élève) ─────────────
export const IS_OPTIONS = [
  { cle: 'c14', t: 'n-Tétradécane', d: 'alcane, éb. 253 °C, absent des peintures, bonne réponse au FID' },
  { cle: 'tol', t: 'Toluène', d: 'solvant courant, éb. 111 °C' },
  { cle: 'bg', t: '2-Butoxyéthanol (butylglycol)', d: 'éther de glycol voisin du DPnB, éb. 171 °C' },
  { cle: 'tpnb', t: 'Tripropylène glycol butyl éther', d: 'éther de glycol très proche du DPnB, éb. 274 °C' },
];
export const T_INJECTEUR = [200, 250, 300], T_DETECTEUR = [200, 250, 300];
export const FOURS = [{ cle: 'iso60', t: 'Isotherme à 60 °C' }, { cle: 'iso130', t: 'Isotherme à 130 °C' }, { cle: 'grad', t: 'Gradient : 60 °C puis 20 °C/min jusqu\'à 240 °C' }];
export const METHODE_DEFAUT = { is: 'c14', inj: 250, four: 'grad', det: 250 };
export const methodeCpg = e => ({ ...METHODE_DEFAUT, ...(e.f.cpgMeth || {}) });
export const methodeChoisie = e => !!e.f.cpgMeth;
export const qualiteMethode = m => {
  const L = []; let bruit = 1, tRun = 2;
  const o = {};
  if (m.is === 'tol') { o.isIndep = true; L.push({ ok: false, t: 'Étalon interne toluène : trop volatil (éb. 111 °C), il sort avec le solvant et s\'évapore du flacon. Son aire ne suit plus le volume injecté : il ne corrige plus rien.' }); }
  else if (m.is === 'bg') { o.aIPlus = 0.18; L.push({ ok: false, t: 'Étalon interne butylglycol : il est déjà présent dans de nombreuses peintures à l\'eau. L\'échantillon apporte son propre pic : l\'aire de l\'étalon est faussée et le COV est sous-estimé.' }); }
  else if (m.is === 'tpnb') { bruit *= 3; L.push({ ok: false, t: 'Étalon interne tripropylène glycol butyl éther : structure presque identique au DPnB, les pics se chevauchent. Intégration moins répétable.' }); }
  else L.push({ ok: true, t: 'Étalon interne n-tétradécane : absent des peintures, éluant après le DPnB sans chevauchement, réponse stable au FID.' });
  if (m.inj < 250) { bruit *= 2; L.push({ ok: false, t: `Injecteur à ${m.inj} °C : vaporisation incomplète du DPnB (éb. 230 °C) et de l'étalon. Pics qui traînent, discrimination, résultats moins répétables.` }); }
  else L.push({ ok: true, t: `Injecteur à ${m.inj} °C : au-dessus des points d'ébullition, vaporisation complète.` });
  if (m.det < 250) { bruit *= 2; L.push({ ok: false, t: `Détecteur à ${m.det} °C : en dessous de la température finale de colonne ou de l'injecteur, les composés peu volatils condensent. Perte de signal et bruit.` }); }
  else L.push({ ok: true, t: `Détecteur à ${m.det} °C : au moins aussi chaud que la colonne, pas de condensation.` });
  if (m.four === 'iso60') { bruit *= 1.5; tRun = 8; L.push({ ok: false, t: 'Four isotherme à 60 °C : le DPnB (éb. 230 °C) sort très tard avec un pic large. Analyse longue (8 min par injection), pics étalés.' }); }
  else if (m.four === 'iso130') { tRun = 3; L.push({ ok: true, t: 'Four isotherme à 130 °C : les deux composés sortent avec des pics fins, 3 min par injection.' }); }
  else L.push({ ok: true, t: 'Gradient de température : séparation rapide et pics fins, 2 min par injection (refroidissement compris).' });
  return { opts: { ...o, bruit }, tRun, lignes: L, ok: L.every(x => x.ok) };
};
export const qm = e => qualiteMethode(methodeCpg(e));
export const choisirMethode = (e, m) => e.f.cpgMeth ? e : nota({ ...e, t: e.t + 10, f: { ...e.f, cpgMeth: { ...METHODE_DEFAUT, ...m } } }, 'Méthode CPG choisie (étalon interne, températures d\'injecteur, de four et de détecteur) ; mise en équilibre 10 min.');
export function injecterEtalon(e, c) {
  const g = cpgDe(e);
  if (g.etal.length >= ETAL_MAX || !NIVEAUX_ETALON.includes(c)) return e;
  const Q = qm(e), inj = injection(e.f.graine ?? 1, g.etal.length + g.ech.length + 1, c, e.f.rf ?? 1, { ...Q.opts, aIPlus: 0 });
  return avecCpg(e, { etal: [...g.etal, { c, ...inj }] }, Q.tRun);
}
export const preparerEchantillon = e => cpgDe(e).prep ? e : avecCpg(e, { prep: true }, T_PREP);
export function injecterEchantillon(e) {
  const g = cpgDe(e);
  if (!g.prep || g.ech.length >= ECH_MAX) return e;
  const Q = qm(e), inj = injection(e.f.graine ?? 1, g.etal.length + g.ech.length + 1, cEch(e), e.f.rf ?? 1, Q.opts);
  return avecCpg(e, { ech: [...g.ech, inj] }, Q.tRun);
}
export function injecterControle(e) {
  const g = cpgDe(e);
  if (g.ctrl.length >= 2) return e;
  const Q = qm(e), inj = injection(e.f.graine ?? 1, 100 + g.ctrl.length, C_CTRL, e.f.rf ?? 1, { ...Q.opts, aIPlus: 0 });
  return avecCpg(e, { ctrl: [...g.ctrl, inj] }, Q.tRun);
}
// Justesse : taux de récupération de la solution de contrôle quantifiée avec la droite courante (100 % = juste)
export function recuperation(e) {
  const g = cpgDe(e), D = new Set(g.etal.map(p => p.c)).size >= 3 ? etalonnage(g.etal, g.mode) : null;
  if (!D || !g.ctrl.length) return null;
  const d = dosage(D, g.ctrl, g.mode);
  return d ? { taux: d.x0 / C_CTRL * 100, n: g.ctrl.length } : null;
}
export const choisirModeCpg = (e, mode) => avecCpg(e, { mode });
// Calcul du COV par l'élève (COV = c × V / m × ρ) : 3 tentatives, la formule peut être demandée à Inès (5 min, pas pendant la pause)
export const inesEnPause = e => e.t >= PAUSE_DEB && e.t < PAUSE_FIN;
export const demanderFormuleCov = e => e.f.formCov || inesEnPause(e) ? e : nota({ ...e, t: e.t + 5, f: { ...e.f, formCov: true } }, 'Formule COV = c × V ÷ m × ρ demandée à Inès.');
export function verifierCov(e, v) {
  const R = resultatCpg(e); if (!R.dos) return { etat: e, juste: false };
  const juste = Number.isFinite(v) && Math.abs(v - R.cov) <= R.cov * 0.03, essais = (e.f.covEss || 0) + 1;
  if (juste) return { etat: { ...e, f: { ...e.f, covEss: essais, covCalc: e.f.formCov ? 'aide' : 'ok' } }, juste: true };
  return { etat: { ...e, t: e.t + 2, f: { ...e.f, covEss: essais, covCalc: essais >= 3 ? 'aide' : undefined } }, juste: false };
}
export const verdictCov = (cov, U) => cov + U < COV_MAX ? 'conforme' : cov - U > COV_MAX ? 'non conforme' : 'indéterminé (la limite est dans l\'incertitude)';
export function resultatCpg(e) {
  const g = cpgDe(e), niveaux = new Set(g.etal.map(p => p.c)), D = niveaux.size >= 3 ? etalonnage(g.etal, g.mode) : null;
  const dos = D && g.ech.length ? dosage(D, g.ech, g.mode) : null;
  if (!dos) return { D, dos: null };
  const rho = rhoCpg(e), m = mEch(e), cov = covDepuisC(dos.x0, rho, m), U = 2 * covDepuisC(dos.u, rho, m);
  return { D, dos, cov, U, rho, m };
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
  choix: () => TECHNIQUES.map(T => ({ t: T.t, f: { techCle: T.cle }, note: `Technique envisagée pour le dosage du DPnB : ${T.t}.`, duree: T.cle === 'cpg' ? 0 : 5, vers: e => T.cle === 'cpg' ? (e.f.densMes != null || e.f.rhoUtilise != null ? 'stationCpg' : 'cpgDens') : 'dpnbImpasse',
    run: n => T.cle === 'cpg' ? { ...n, f: { ...n.f, impasses: n.f.impasses || 0 } } : { ...n, f: { ...n.f, impasses: (n.f.impasses || 0) + 1 } } })) });
add('dpnbImpasse', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Cette technique ne marchera pas',
  texte: e => `Inès réfléchit une minute (5 min), puis secoue la tête.\n« ${IMPASSES[e.f.techCle] || ''} »`,
  choix: () => [{ t: 'Reprendre : choisir une autre technique', vers: 'dpnbTech' }] });

const CONCL = ['simple', 'faux', 'u'];
add('cpgDens', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Il te manque la masse volumique',
  texte: e => { const c = e.cmd.es; return `Inès : « Le chromatographe te donnera la concentration en DPnB dans la solution injectée. Pour en tirer le COV, c'est-à-dire des grammes de DPnB par litre de PEINTURE, il te faut la masse volumique de la peinture. C'est moi qui l'ai mesurée${c ? '' : ', mais tu ne m\'as pas encore demandé cette analyse'}. »${inesEnPause(e) ? `\nIl est ${hhmm(e.t)} : Inès est en pause déjeuner jusqu'à ${hhmm(PAUSE_FIN)}.` : ''}`; },
  choix: e => { const c = e.cmd.es, A = ANALYSES.find(a => a.cle === 'es'), L = [];
    if (c && !c.lu && c.pret <= e.t) L.push({ t: 'Lire le résultat de l\'extrait sec et de la masse volumique', run: n => ({ ...n, cmd: { ...n.cmd, es: { ...c, lu: true } } }), vers: 'res_es' });
    else if (c && !c.lu) L.push({ t: `Attendre le résultat d'Inès (prêt vers ${hhmm(c.pret)})`, duree: c.pret - e.t, run: n => ({ ...n, cmd: { ...n.cmd, es: { ...c, lu: true } } }), vers: 'res_es' });
    else if (!c) L.push({ t: `Demander l'extrait sec et la masse volumique à Inès (résultat vers ${hhmm(planTech(e, A).pret)}), et faire autre chose en attendant`, duree: A.perso, run: n => deleguer(n, A), vers: 'labo' });
    L.push({ t: 'Je prendrai ρ ≈ 1,0 g/mL, comme l\'eau, pour avancer', f: { rhoUtilise: 1.0 }, note: 'Masse volumique de la peinture estimée à 1,0 g/mL (non mesurée).', vers: 'stationCpg' });
    return L; } });
add('stationCpg', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Dosage du DPnB par CPG-FID', station: 'cpg',
  texte: 'Inès te prête le chromatographe. « Comme le DPnB sort sous forme d\'un pic au FID et que les volumes injectés fluctuent, on ajoute un étalon interne à concentration fixe dans toutes les solutions : étalons et échantillon. L\'échantillon : environ 1 g de peinture, pesé exactement, complété à 10,0 mL au solvant, puis centrifugé pour ne garder que le surnageant limpide. À toi : fais une droite d\'étalonnage, dose l\'échantillon, calcule le COV, et conclus. »',
  choix: e => {
    const R = resultatCpg(e);
    if (!R.dos) return [{ t: 'Abandonner le dosage et retourner à la paillasse', vers: 'labo' }];
    const cov = R.cov, U = R.U, v = verdictCov(cov, U), simple = cov < COV_MAX ? 'conforme' : 'non conforme', faux = cov < COV_MAX ? 'non conforme' : 'conforme';
    const base = { f: { mes_dpnb: true, covMes: cov, uMes: U }, vers: 'debriefCpg' };
    const L = {
      simple: { ...base, concl: 'simple', t: `Je conclus : COV = ${nf(cov, 1)} g/L, donc ${simple}`, f: { ...base.f, cpgConcl: 'simple' }, note: `Dosage du DPnB par CPG-FID : COV mesuré ${nf(cov, 1)} g/L (${simple}), sans incertitude.` },
      faux: { ...base, concl: 'faux', t: `Je conclus : COV = ${nf(cov, 1)} g/L, donc ${faux}`, f: { ...base.f, cpgConcl: 'faux' }, note: `Dosage du DPnB par CPG-FID : COV mesuré ${nf(cov, 1)} g/L, conclusion « ${faux} ».` },
      u: { ...base, concl: 'u', t: `Je conclus : COV = ${nf(cov, 1)} g/L, U(COV) = ${nf(U, 1)} g/L (k = 2, niveau de confiance ≈ 95 %) : ${v}`, f: { ...base.f, cpgConcl: 'u' }, note: `Dosage du DPnB par CPG-FID : COV = ${nf(cov, 1)} g/L, U = ${nf(U, 1)} g/L (k = 2, ≈ 95 %), ${v}.` },
    };
    const o = (e.f.graine ?? 1) % 3;
    return CONCL.map((_, i) => L[CONCL[(i + o) % 3]]);
  } });

add('debriefCpg', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Ce que dit le chromatographe',
  texte: e => `Tu as retenu : COV = ${nf(e.f.covMes ?? 0, 1)} g/L, U(COV) = ${nf(e.f.uMes ?? 0, 1)} g/L (k = 2). Inès relit tes feuilles de mesures.`,
  debrief: e => {
    const g = cpgDe(e), R = resultatCpg(e), L = [], niv = new Set(g.etal.map(p => p.c)).size, vrai = covDe(e);
    const Di = niv >= 3 ? etalonnage(g.etal, 'interne') : null, De = niv >= 3 ? etalonnage(g.etal, 'externe') : null;
    L.push((e.f.impasses || 0) === 0 ? { ok: true, t: 'Technique : tu as d\'emblée choisi la CPG-FID. Le DPnB est volatil, sans chromophore : c\'est la bonne technique.' } : { ok: null, t: `Technique : ${e.f.impasses} essai${e.f.impasses > 1 ? 's' : ''} écarté${e.f.impasses > 1 ? 's' : ''} avant la CPG-FID. Bien choisir la technique en fonction des propriétés de la molécule (volatilité, chromophore) évite de perdre du temps.` });
    if (e.f.cpgMeth) for (const l of qm(e).lignes) L.push(l);
    L.push(niv >= 5 ? { ok: true, t: `Étalonnage : ${niv} niveaux de concentration (${g.etal.length} injections), de quoi vérifier la linéarité.` } : { ok: niv >= 3 ? null : false, t: `Étalonnage : ${niv} niveau${niv > 1 ? 'x' : ''}. ${niv >= 3 ? 'C\'est le minimum : avec 3 niveaux, tu ne peux pas vraiment contrôler la linéarité.' : 'Trop peu pour une droite.'} Vise au moins 5 niveaux, qui encadrent la concentration attendue.` });
    if (Di && De) L.push({ ok: g.mode === 'interne' ? true : null, t: `Étalon interne ou non : écart-type résiduel relatif de la droite ${nf(Di.residRel, 1)} % avec l'étalon interne, contre ${nf(De.residRel, 1)} % en aire seule. ${g.mode === 'interne' ? 'Tu as quantifié avec l\'étalon interne : il compense les fluctuations du volume injecté.' : 'Tu as quantifié en aire seule : l\'erreur de volume injecté (variable d\'une injection à l\'autre) est directement reportée sur ton résultat. Avec l\'étalon interne, cette erreur disparaît dans le rapport des aires.'}` });
    const rec = recuperation(e);
    L.push(rec ? { ok: Math.abs(rec.taux - 100) <= 5, t: `Justesse : la solution de contrôle (préparée indépendamment des étalons, ${nf(C_CTRL, 1)} mg/mL) est retrouvée à ${nf(rec.taux, 0)} %. ${Math.abs(rec.taux - 100) <= 5 ? 'Un écart de moins de 5 % est compatible avec la dispersion du dosage : pas de biais décelé.' : 'Écart supérieur à 5 % : un biais est probable (pureté ou préparation des étalons). À corriger avant de rendre un résultat.'}` } : { ok: null, t: 'Justesse non vérifiée : une solution de contrôle, préparée indépendamment des étalons, permet de contrôler que la droite donne la bonne valeur (fidélité ≠ justesse : la droite peut être très bien alignée et fausse).' });
    if (R.dos) {
      L.push(R.dos.dansDomaine ? { ok: true, t: `Le dosage est dans le domaine d'étalonnage (${nf(Math.min(...R.D.xs), 2)} à ${nf(Math.max(...R.D.xs), 2)} ${g.mode === 'interne' ? 'en rapport c/c_IS' : 'mg/mL'}) : pas d'extrapolation.` } : { ok: false, t: `Le dosage tombe hors du domaine d'étalonnage : c'est une extrapolation, le résultat n'est pas fiable. ${cer(e, 'g-hors', 'étalons mal choisis.', 'on ne sait pas si la droite reste valable à cette concentration.', 'ajouter un étalon qui encadre la concentration.')}` });
      L.push(g.ech.length >= 2 ? { ok: true, t: `${g.ech.length} injections de l'échantillon : la moyenne réduit la part de l'incertitude due à la répétabilité.` } : { ok: null, t: 'Une seule injection de l\'échantillon : aucune idée de la répétabilité. Deux ou trois injections améliorent le résultat.' });
      const ecart = Math.abs(e.f.covMes - vrai), ok = ecart <= e.f.uMes;
      L.push({ ok, t: `COV mesuré : ${nf(e.f.covMes, 1)} g/L, U = ${nf(e.f.uMes, 1)} g/L (k = 2). Valeur calculée d'après la formule : ${nf(vrai, 1)} g/L. ${ok ? 'La mesure confirme le calcul, dans son incertitude.' : 'L\'écart dépasse l\'incertitude annoncée : un biais n\'est pas pris en compte (étalonnage, préparation).'}` });
      const v = verdictCov(e.f.covMes, e.f.uMes), simple = e.f.covMes < COV_MAX ? 'conforme' : 'non conforme';
      if (e.f.cpgConcl === 'u') L.push({ ok: true, t: `Expression du résultat : valeur, incertitude élargie (k = 2) et décision tenant compte de l'incertitude : ${v}. ${vari(e, 'g-u', ["C'est l'expression complète attendue.", "Voilà une expression complète du résultat, telle qu'on l'écrit dans un rapport."])}` });
      else if (e.f.cpgConcl === 'simple') L.push({ ok: null, t: `Expression du résultat : « ${simple} » est juste, mais sans incertitude un résultat de mesure est incomplet. Avec U = ${nf(e.f.uMes, 1)} g/L, la décision est : ${v}.` });
      else L.push({ ok: false, t: `${vari(e, 'g-faux', ['Décision : ta conclusion contredit ta propre mesure.', 'Ta décision contredit le résultat que tu viens d\'obtenir.'])} ${cer(e, 'g-faux2', 'comparaison à la limite dans le mauvais sens.', 'tu laisserais passer une peinture hors cahier des charges, ou tu bloquerais une peinture conforme.', 'comparer la valeur mesurée (et son incertitude) à la limite de 30 g/L.')}` });
    }
    if (R.dos) {
      L.push(e.f.rhoUtilise != null ? { ok: false, t: `Masse volumique : tu as estimé ρ ≈ ${nf(e.f.rhoUtilise, 1)} g/mL au lieu de la mesurer (la vraie vaut ${nf(prop(e).densite, 3)} g/mL). Cause : valeur non mesurée. Effet : le COV est faussé de ${nf(Math.abs(1 - e.f.rhoUtilise / prop(e).densite) * 100, 0)} %. Remède : demander la masse volumique à Inès avant de doser.` } : { ok: true, t: `Masse volumique : mesurée par Inès (ρ = ${nf(prop(e).densite, 3)} g/mL), utilisée pour passer de la concentration de la solution au COV de la peinture.` });
      L.push(e.f.covCalc === 'ok' ? { ok: true, t: `Calcul du COV (c × V ÷ m × ρ) fait par toi, avec la masse réellement pesée (${nf(R.m, 3)} g et non 1,000 g).` } : { ok: null, t: `Calcul du COV : fait avec de l'aide (formule demandée à Inès ou valeur révélée). Retiens la logique des unités : mg/mL × mL ÷ g × g/mL = g/L de peinture, avec la masse réellement pesée (${nf(R.m, 3)} g).` });
      L.push({ ok: null, t: `Incertitude : l'incertitude-type u(c) combine l'incertitude de la droite d'étalonnage (écart-type résiduel, nombre de niveaux et d'injections) et celle de la préparation (pesée, dilution, ≈ 1 %). L'incertitude élargie vaut U = k × u avec k = 2, soit un niveau de confiance d'environ 95 % si la distribution est normale (hypothèse du modèle). On écrit « COV = x g/L, U = y g/L (k = 2) », pas un « ± » sans préciser.` });
    }
    L.push({ ok: null, t: 'Hypothèses du modèle : réponse du FID linéaire sur la plage ; résidus normaux, de variance constante ; erreur de volume injecté commune aux deux pics (≈ 6 %) ; préparation de l\'échantillon ± 1 %. Les données chromatographiques sont de scénario, pas réelles.' });
    return L;
  },
  choix: () => [{ t: 'Retourner à la paillasse', vers: 'labo' }] });

add('res_es2', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Résultat : extrait sec et densité',
  texte: e => { const p = prop(e), pc = prop(e, e.f.phMes ? { ph: 'mesuree' } : { ph: 'fiche' }), ok = e.f.regle === 'ok', es = p.ES - (e.f.lotDouteux ? 1.2 : 0), r = proprietes(FORMULE_REF);
    return `Ton résultat : extrait sec ${nf(es)} %${e.f.esConcl === 'complet' ? ' (expression complète avec incertitude)' : ''}, masse volumique ${nf(p.densite, 3)} g/mL (donnée par Inès).\nD'après la formule (prises d'huile ${e.f.phMes ? 'que tu as mesurées' : 'des fiches, non vérifiées sur nos poudres'}) : CPV = ${nf(pc.CPV)} %, CPVC = ${nf(pc.CPVC)} %, λ = ${nf(pc.lambda, 2)}, COV calculé = ${nf(p.COV)} g/L (à vérifier par un dosage).\n${ok ? `${Math.abs(p.ES - r.ES) < 1.5 ? `Même extrait sec que la référence (${nf(r.ES)} %)` : `Extrait sec différent de la référence (${nf(r.ES)} %), mais conforme (> 50 %)`}${e.f.lotDouteux ? ', un peu plus bas qu\'attendu : le coagulum retiré du lot gelé a emporté du polymère' : ''}. ${covOk(e) ? 'Sur ces critères calculés (ES > 50 %, λ ≥ 0,8, COV < 30 g/L), le cahier des charges est respecté ; le COV reste à vérifier sur la peinture fabriquée.' : `Mais les COV calculés (${nf(p.COV)} g/L) dépassent la limite de 30 g/L : il y a trop de coalescent.`}` : `Attention : ES = ${nf(p.ES)} % et CPV = ${nf(p.CPV)} % ne correspondent pas à la référence (ES ${nf(r.ES)} %, CPV ${nf(r.CPV)} %). En remplaçant simplement 83,3 g par 83,3 g, tu as changé la quantité de polymère : la formule ne respecte pas la contrainte « mêmes ES, CPV, CPVC ».`}`; },
  visuel: e => ({ type: 'balance', es: prop(e).ES - (e.f.lotDouteux ? 1.2 : 0), dens: prop(e).densite }),
  choix: e => e.f.regle !== 'ok' ? [{ t: 'Reprendre le calcul et refaire la peinture (la fabrication ne vaut plus rien)', f: { refait: true, mes_es: false }, duree: 15, note: 'Formule corrigée : la première version (83,3 g d\'Orgal) avait un ES et une CPV différents de la référence.', run: e2 => effacerMesures(e2), vers: 'calcMasse' },
      { t: 'Je garde cette formule telle quelle', f: { mes_es: true }, note: 'ES mesuré différent de la référence : formule conservée en l\'état.', vers: 'labo' }]
    : !covOk(e) ? [refaireCoalescent('COV mesurés au-dessus de 30 g/L : dose de coalescent à revoir.'), { t: 'Je garde cette formule et je le signale', f: { mes_es: true }, note: 'COV supérieurs à 30 g/L : formule conservée, écart signalé.', vers: 'labo' }]
    : [{ ...retourLabo, f: { mes_es: true }, note: 'ES et densité mesurées : conformes.' }] });
// ───────────── Extrait sec : Inès donne les résultats bruts, l'élève calcule, vérifie la concordance et exprime le résultat ─────────────
export const ES_SR = 0.5, ES_U = 0.8;             // écart-type de répétabilité de la méthode (% d'extrait sec) et incertitude élargie (k = 2) donnés par le laboratoire
const fr3 = x => Math.round(x * 1000) / 1000;
const alea = (e, cle) => brasser(`${e.f.graine ?? 1}|${cle}`) / 4294967296;
const pc3 = x => x.toFixed(3).replace('.', ',');
// Feuille de paillasse d'Inès : pesées brutes, masse volumique et caractéristiques de la méthode (affichée aussi à l'écran de calcul)
export const esFeuille = e => { const B = esBrut(e); return `Essai 1 : m₀ (capsule vide) = ${pc3(B[0].m0)} g ; m₁ (capsule + peinture) = ${pc3(B[0].m1)} g ; m₂ (après étuve) = ${pc3(B[0].m2)} g\nEssai 2 : m₀ = ${pc3(B[1].m0)} g ; m₁ = ${pc3(B[1].m1)} g ; m₂ = ${pc3(B[1].m2)} g\nMasse volumique (pycnomètre) : ρ = ${nf(prop(e).densite, 3)} g/mL.\nÉcart-type de répétabilité de la méthode : s_r = ${nf(ES_SR, 1)} % d'extrait sec ; limite de répétabilité r = 2,8 × s_r. Incertitude élargie de la méthode (k = 2) : U = ${nf(ES_U, 1)} %.`; };
export const esBrut = e => {
  const vrai = prop(e).ES - (e.f.lotDouteux ? 1.2 : 0);
  return [1, 2].map(i => { const m0 = fr3(1.15 + 0.2 * alea(e, 'esm0' + i)), prise = 1.4 + 0.25 * alea(e, 'esp' + i), m1 = fr3(m0 + prise), es = vrai + (alea(e, 'esd' + i) - 0.5) * 0.8, m2 = fr3(m0 + (m1 - m0) * es / 100); return { m0, m1, m2 }; });
};
export const esCalc = e => { const B = esBrut(e).map(x => (x.m2 - x.m0) / (x.m1 - x.m0) * 100); return { es1: B[0], es2: B[1], ecart: Math.abs(B[0] - B[1]), r: 2.8 * ES_SR, moy: (B[0] + B[1]) / 2, U: ES_U }; };
add('res_es', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Résultats bruts : extrait sec et masse volumique',
  entree: e => ({ ...e, f: { ...e.f, densMes: prop(e).densite } }),
  texte: e => `Inès te tend sa feuille de paillasse : « Étuve à 105 °C pendant 2 h, jusqu'à masse constante, deux essais sur capsules d'aluminium. Je ne te donne que les pesées. »\n\n${esFeuille(e)}`,
  choix: [{ t: 'Calculer les extraits secs', vers: 'calcEs' }] });
add('calcEs', { lieu: 'Laboratoire d\'analyses', pnj: 'moi', titre: 'Calcul : extrait sec', fiches: [],
  texte: e => `À partir des pesées d'Inès, calcule l'extrait sec de chaque essai (ES = masse de matière sèche ÷ masse de peinture), puis leur moyenne.\n\n${esFeuille(e)}`,
  calcul: { q: 'Quel est l\'extrait sec moyen de la peinture (en %) ?', unite: '%', vrai: e => esCalc(e).moy, tol: 0.004,
    indice: 'Pour chaque essai : ES = (m₂ − m₀) ÷ (m₁ − m₀) × 100. Attention : m₀ est la capsule vide, m₁ la capsule avec la peinture humide, m₂ la capsule avec le résidu sec.',
    ok: { vers: 'esConcl', note: 'Extrait sec : calcul fait à partir des pesées brutes.' },
    ko: { vers: 'esConcl', duree: 10, f: { esAide: true }, note: 'Extrait sec calculé avec l\'aide d\'Inès.' } } });
add('esConcl', { melange: true, lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Comment rends-tu le résultat ?',
  texte: e => { const c = esCalc(e); return `Tu trouves ES₁ = ${nf(c.es1, 2)} % et ES₂ = ${nf(c.es2, 2)} %. Rappel : s_r = ${nf(ES_SR, 1)} %, r = 2,8 × s_r, U de la méthode = ${nf(ES_U, 1)} % (k = 2).\nInès : « Avant de moyenner, as-tu regardé si les deux essais sont compatibles ? Et comment écris-tu le résultat dans ton rapport ? »`; },
  choix: e => { const c = esCalc(e), m = nf(c.moy, 1), U = nf(c.U, 1);
    return [
      { t: `ES = ${m} %`, f: { esConcl: 'simple' }, note: `Extrait sec ${m} % rendu sans vérification de concordance ni incertitude.`, vers: 'res_es2' },
      { t: `Moyenne des deux essais : ES = ${m} ± ${U} %`, f: { esConcl: 'sansK' }, note: `Extrait sec ${m} ± ${U} % : incertitude donnée sans facteur d'élargissement ni niveau de confiance.`, vers: 'res_es2' },
      { t: `|ES₁ − ES₂| = ${nf(c.ecart, 2)} % ≤ r = 2,8 × s_r = ${nf(c.r, 2)} % : essais concordants, je moyenne. ES = ${m} %, U(ES) = ${U} % (k = 2, soit un niveau de confiance d'environ 95 %)`, f: { esConcl: 'complet' }, note: `Extrait sec ${m} %, U = ${U} % (k = 2, ≈ 95 %), concordance des essais vérifiée (écart ≤ r).`, vers: 'res_es2' },
    ]; } });
const mauvaiseVisc = e => mauvaisRheo(e) || !hsOk(e) || !basOk(e);
const nomAdd = a => a === 'coapur' ? 'du Coapur' : 'du Thixol';
const choisirAdd = a => ({ t: `Ajouter ${nomAdd(a)}`, d: 'essai d\'abord sur une petite quantité', duree: 2, note: `Correction envisagée : ajout ${nomAdd(a)}.`, run: e => ({ ...e, f: { ...e.f, msgVisco: undefined, visco: { additif: a, taille: null, essais: [] } } }), vers: 'viscoPrise' });
add('res_rheo', { melange: true, lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : rhéologie', fiches: ['coapur', 'thixol'],
  texte: e => {
    if (!dispOk(e.f)) return 'Lucas : « Viscosité élevée à bas gradient et nette thixotropie : il reste des amas mal dispersés. On est loin du comportement rhéofluidifiant à faible thixotropie demandé. »\nLe dispersant n\'a pas été corrigé : la cause des amas est restée.';
    const hs = hsVrai(e), bas = basVrai(e), ajout = (e.f.coapurAdd || 0) > 0 || (e.f.thixolAdd || 0) > 0;
    const tete = `Lucas : « ${ajout ? 'Nouvelle mesure du lot' : 'Profil mesuré au Lamy RM 100 Plus, mobile MS-R3'}, de 1 à 1 000 s⁻¹ : comportement rhéofluidifiant, boucle de thixotropie faible. À 1 s⁻¹ : ${nf(bas, 0)} mPa·s ; à 1 000 s⁻¹ : ${nf(hs, 0)} mPa·s.`;
    if (hsOk(e) && basOk(e)) return `${tete} Le cahier des charges demande ${HS_MIN} à ${HS_MAX} mPa·s à 1 000 s⁻¹ (référence Vinnapas : ${HS_REF}) : c'est bon. »`;
    if (!basOk(e)) return `${tete} Le bas gradient est monté de ${nf((bas / BAS_REF - 1) * 100, 0)} % par rapport à la référence : ça va couler moins bien et marquer les traces de rouleau. Et à 1 000 s⁻¹ on est toujours à ${nf(hs, 0)} mPa·s pour ${HS_MIN} à ${HS_MAX} demandés. »`;
    return `${tete} On attendait ${HS_MIN} à ${HS_MAX} mPa·s (référence Vinnapas : ${HS_REF}). »\n${hs < HS_MIN ? 'Au rouleau, la peinture est trop fluide à haut gradient : film mince peu garnissant, éclaboussures, étalement médiocre.' : 'Au pinceau, la peinture tire : trop visqueuse à haut gradient.'}\nÀ masse de polymère sec égale, rien ne garantit que deux résines donnent la même viscosité une fois mélangées au reste : il faut la mesurer, puis corriger.`; },
  visuel: e => ({ type: 'rheo', mauvais: mauvaisRheo(e), hs: hsVrai(e), bas: basVrai(e) }),
  choix: e => mauvaiseVisc(e) && dispOk(e.f)
    ? [choisirAdd('coapur'), choisirAdd('thixol'),
      { ...retourLabo, t: 'Je garde la formule et je signale l\'écart', run: n => ({ ...n, f: { ...n.f, mes_rheo: true, rheoKo: true } }), note: `Viscosité à 1 000 s⁻¹ de ${nf(hsVrai(e), 0)} mPa·s (${HS_MIN} à ${HS_MAX} demandés) : formule conservée, écart signalé.` }]
    : [{ ...retourLabo, run: n => ({ ...n, f: { ...n.f, mes_rheo: true, rheoKo: mauvaisRheo(n) || !hsOk(n) || !basOk(n) } }), note: 'Rhéologie mesurée.' }] });
// Essai d'ajout : où tester ? (le godet du viscosimètre contient ≈ 30 mL ; si on se rate sur tout le lot, il est perdu)
const trop_petit = g => ({ t: `Sur ${g} g de peinture`, duree: 3, note: `Essai d'ajout envisagé sur ${g} g : insuffisant pour remplir le godet.`, run: e => ({ ...e, f: { ...e.f, msgVisco: `Lucas : « Avec ${g} g, le godet ne se remplit pas : le mobile n'est pas entièrement immergé et la mesure n'a aucun sens. Regarde le schéma : il faut de quoi remplir la cuve. »` } }), vers: 'viscoPrise' });
add('viscoPrise', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Où tester l\'ajout ?', fiches: ['coapur', 'thixol'],
  texte: e => `${e.f.msgVisco ? e.f.msgVisco + '\n\n' : ''}Lucas : « Tu veux essayer ${nomAdd(e.f.visco?.additif)}. Sur quelle quantité de peinture fais-tu l'essai ? Voilà la cuve du viscosimètre avec son mobile MS-R3 : il doit être entièrement immergé dans la peinture. »`,
  visuel: () => ({ type: 'godet' }),
  choix: () => [trop_petit(1), trop_petit(10),
    { t: 'Sur 50 g de peinture', duree: 5, note: 'Essai d\'ajout sur une prise d\'essai de 50 g.', run: e => ({ ...e, f: { ...e.f, msgVisco: undefined, visco: { ...e.f.visco, taille: M_ESSAI, essais: [] } } }), vers: 'viscoDose' },
    { t: 'Sur la totalité du lot', d: 'plus rapide, mais irréversible', duree: 0, note: 'Ajout directement sur tout le lot.', run: e => ({ ...e, f: { ...e.f, msgVisco: undefined, visco: { ...e.f.visco, taille: 'tout', essais: [] } } }), vers: 'viscoDose' },
    { t: 'Finalement, je laisse tomber cet additif', duree: 0, vers: 'res_rheo' }] });
const appliquerVisco = (e, essai) => { const v = e.f.visco, k = v.taille === 'tout' ? 1 : prop(e).mTot / M_ESSAI, g = Math.round(essai.m * k * 10) / 10, cle = v.additif === 'coapur' ? 'coapurAdd' : 'thixolAdd';
  return { ...e, t: e.t + (v.taille === 'tout' ? 0 : 10), f: { ...e.f, [cle]: (e.f[cle] || 0) + (v.taille === 'tout' ? essai.m : g), viscoTaille: v.taille, viscoNb: (v.essais || []).length, visco: undefined } }; };
add('viscoDose', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Combien d\'additif ?', station: 'visco', fiches: ['coapur', 'thixol'],
  texte: e => e.f.visco?.taille === 'tout'
    ? `Lucas : « Tu ajoutes ${nomAdd(e.f.visco.additif)} directement dans le lot de ${nf(prop(e).mTot, 0)} g. Combien en pèses-tu, produit tel que livré ? Après, il n'y a pas de retour en arrière. »`
    : `Lucas : « Tu pèses ${nomAdd(e.f.visco?.additif)} (produit tel que livré) sur la balance au centigramme, tu l'ajoutes à ta prise d'essai de 50 g, tu mélanges et je mesure. Combien en mets-tu ? Tu peux faire ${ESSAIS_VISCO} essais au plus : chacun consomme une prise d'essai. »`,
  choix: e => { const v = e.f.visco || {}, es = v.essais || [], d = es[es.length - 1];
    const retenir = d && d.ok ? [{ t: v.taille === 'tout' ? 'Valider : le lot est bon' : 'Retenir cette dose et l\'ajouter à tout le lot', d: v.taille === 'tout' ? '' : 'mélange et remesure du lot : 10 min', duree: 0, note: `Dose retenue : ${nf(d.m, 2)} g ${nomAdd(v.additif)} ${v.taille === 'tout' ? 'ajoutés au lot' : 'pour 50 g, appliquée au lot'}.`, run: n => appliquerVisco(n, d), vers: 'res_rheo' }] : [];
    const perdu = v.taille === 'tout' && d && !d.ok ? [{ t: 'Le lot est perdu : refaire la peinture', d: '45 min (fabrication à refaire, toutes les mesures aussi)', duree: 45, f: { lotPerdu: true, coapurAdd: 0, thixolAdd: 0 }, note: 'Ajout hors cible sur tout le lot : peinture perdue, fabrication à refaire.', run: n => ({ ...effacerMesures(n), f: { ...effacerMesures(n).f, visco: undefined } }), vers: 'fabrication' }] : [];
    return [...retenir, ...perdu, ...(perdu.length ? [] : [{ t: 'Abandonner cet additif', duree: 0, run: n => ({ ...n, f: { ...n.f, visco: undefined } }), vers: 'res_rheo' }])]; } });
add('res_masq', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : pouvoir masquant',
  texte: e => { const pm = pouvoirMasquant(e), v = nf(pm, 1);
    if (pm >= 7) return `Lucas : « Rapport de contraste à 98 % pour un rendement de ${v} m²/L : pouvoir masquant de ${v} m²/L, au-dessus du minimum de 7,0 (référence Vinnapas : 8,0). »`;
    return mauvaisRheo(e) ? `Lucas : « Pouvoir masquant ${v} m²/L, en dessous des 7,0 attendus. Les amas de TiO₂ mal dispersés diffusent moins bien la lumière. »`
      : `Lucas : « Pouvoir masquant ${v} m²/L, en dessous des 7,0 attendus. La référence Vinnapas était à 8,0. À toi de voir ce qui, dans la formule, explique l'écart. »`; },
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
  texte: e => { const f = formule(e); return `M. Perrin : « L'Orgal PST 50A est à 25 € les 5 litres (densité 1,03). Le DPnB est à 3 € le litre (densité 0,91). Les autres prix sont ceux du Document 1. À toi de calculer le coût matières premières de ta formule. »\nTa formule (en g) : Orgal ${nf(f.liant, 1)}, eau ${nf(f.eau, 1)}, TiO₂ ${nf(f.tio2, 1)}, CaCO₃ ${nf(f.caco3, 1)}, Coadis BR3 ${nf(f.coadis, 3)}, DPnB ${nf(f.dpnb, 1)}, Foamex ${nf(f.foamex, 1)}, Thixol ${nf(f.thixol, 1)}, Coapur ${nf(f.coapur, 1)}.`; },
  calcul: { q: 'Coût matières premières de ta formule (€ par kg de peinture)', unite: '€/kg', vrai: e => coutKg(formule(e)), tol: 0.06,
    indice: 'Coût total = Σ (masse × prix par gramme) ; divise par la masse totale en kg. Attention aux unités de prix : €/L et densités pour les additifs liquides.',
    ok: { f: { mes_cout: true }, run: e => ({ ...e, f: { ...e.f, coutOk: coutKg(formule(e)) < 4.5 } }), vers: 'commAchats', note: 'Coût matières premières calculé.' },
    ko: { f: { mes_cout: true }, run: e => ({ ...e, f: { ...e.f, coutOk: coutKg(formule(e)) < 4.5 } }), vers: 'commAchats', duree: 10, note: 'Coût matières premières calculé avec l\'aide de M. Perrin.' } } });

add('commAchats', { melange: true, lieu: 'Service achats', pnj: 'perrin', titre: 'Rendre compte à M. Perrin',
  texte: 'M. Perrin n\'est pas chimiste : il gère les commandes et le budget. Il te demande : « Alors, on commande quoi, en quelle quantité, et pourquoi ce n\'est plus la Vinnapas ? » Que lui réponds-tu ?',
  choix: () => [
    msg('achats', 'adapte', '« Bonjour M. Perrin. Il faut remplacer la Vinnapas par l\'Orgal PST 50A : c\'est la même famille de liant, au prix de 25 € les 5 litres. Pour un lot d\'essai, un fût de 5 litres suffit ; je vous confirme la quantité dès que la formule est validée. »',
      'M. Perrin note le produit, le prix, la quantité et la raison du changement. Il lance la commande sans te rappeler.', 0, 'labo'),
    msg('achats', 'partiel', '« Salut ! Je sais pas trop, mets-moi de l\'Orgal, ça ira, on verra bien pour la quantité. »',
      'M. Perrin soupire : « Il me faut une référence, une quantité et une date, sinon je ne peux rien commander. » Tu dois tout reprendre : cinq minutes.\nÀ retenir : un acheteur a besoin d\'une référence, d\'une quantité, d\'un prix et d\'un délai.', 5, 'labo'),
    msg('achats', 'mauvais', '« Il faut une dispersion styrène-acrylique de MFFT 20 °C, de Tg 27 °C et à 50 % d\'extrait sec, avec coalescent à ajuster selon les essais de film. »',
      'M. Perrin : « Je ne sais pas ce que veulent dire ces sigles. Donne-moi un nom commercial et une quantité. » Il faut tout reformuler en termes de commande : dix minutes.\nÀ retenir : avec un service achats, on parle référence, quantité et prix, pas propriétés physico-chimiques.', 10, 'labo'),
  ] });

// ───────────── Le hub : la paillasse ─────────────
const ligneAttente = e => Object.entries(e.cmd).filter(([, c]) => !c.lu && c.pret > e.t).map(([k, c]) => `⏳ ${labelDe(k)} : prêt vers ${hhmm(c.pret)}`).concat(e.t >= PAUSE_DEB && e.t < PAUSE_FIN ? ['🍽 C\'est la pause déjeuner : Karim, Inès et Lucas ne reprendront qu\'à ' + hhmm(PAUSE_FIN) + '.'] : []);
add('labo', { lieu: 'Paillasse et laboratoire', pnj: 'moi', titre: 'La journée avance',
  texte: e => `Il est ${hhmm(e.t)}.${e.t >= T_RAPPORT ? '\nMme Dubreuil passe la tête : « J\'attends ton rapport, le délai est dépassé. »' : e.t >= T_CLIENT - 45 && !e.f.clientFait ? '\nL\'appel client approche (15 h).' : ''}${e.f.fabrique ? '\nTa peinture est fabriquée : elle est prête pour les contrôles.' : ''}\n${ligneAttente(e).join('\n')}`.trim(),
  choix: e => {
    const L = [];
    for (const A of ANALYSES) {
      const c = e.cmd[A.cle];
      if (c && !c.lu && c.pret <= e.t) L.push({ t: `📄 Lire le résultat : ${A.label}`, run: n => ({ ...n, cmd: { ...n.cmd, [A.cle]: { ...c, lu: true } } }), vers: `res_${A.cle}` });
      else if (!c && (e.f.fabrique || A.avant)) { const P = planTech(e, A), occ = e.libre[A.tech] > e.t && e.f.plan !== 'solo', enPause = e.t >= PAUSE_DEB && e.t < PAUSE_FIN;
        L.push({ t: `Demander à ${PNJ[A.tech].nom} : ${A.label}`, d: e.f.plan === 'solo' ? `${A.duree} min de ton temps` : `${A.perso} min pour toi, résultat vers ${hhmm(P.pret)}${enPause ? ` (${PNJ[A.tech].nom} est en pause déjeuner jusqu'à ${hhmm(PAUSE_FIN)})` : occ ? ` (${PNJ[A.tech].nom} est occupé·e jusqu'à ${hhmm(e.libre[A.tech])})` : ''}`, run: n => deleguer(n, A), vers: 'labo', cle: A.cle, masque: true });
        if (e.f.plan !== 'solo' && A.tech !== 'perrin' && (occ || enPause || P.pret - e.t > A.duree + 20)) L.push({ t: `Le faire moi-même : ${A.label}`, d: `${A.duree} min de ton temps, sans attendre personne`, run: n => deleguer(n, A, true), vers: 'labo', cle: A.cle + '-moi', masque: true }); }
    }
    if (e.t >= PAUSE_DEB - 30 && e.t < PAUSE_FIN + 30 && !e.f.dejeune) L.push({ t: 'Prendre ma pause déjeuner (45 min)', d: 'l\'équipe aussi mange entre 12 h et 13 h', duree: 45, f: { dejeune: true }, note: 'Pause déjeuner prise.', vers: 'labo', cle: 'pause', masque: true });
    if (e.f.fabrique && !e.f.mes_dpnb) L.push({ t: 'Doser le DPnB dans la peinture fabriquée (contrôle du COV)', d: 'Choix de la technique, puis dosage : une vingtaine de minutes de ton temps', note: 'Contrôle qualité : dosage du DPnB dans la peinture (COV mesurés et non plus calculés).', vers: 'dpnbTech', cle: 'dpnb', masque: true });
    if (!e.cmd.huile) L.push({ t: 'Mesurer moi-même les prises d\'huile à la spatule', d: `${HUILE_DUREE} min par détermination, sans attendre personne`, note: 'Prises d\'huile des poudres : mesure faite moi-même.', vers: 'stationHuile', cle: 'huile-moi', masque: true });
    if (e.f.fabrique && !e.f.etuve) L.push({ t: 'Mettre un échantillon à l\'étuve à 50 °C (vieillissement accéléré)', d: '10 min ; résultat dans 7 jours', duree: 10, f: { etuve: true }, note: 'Échantillon mis à l\'étuve à 50 °C pour le test de stabilité (résultat dans 7 jours).', vers: 'labo', cle: 'etuve', masque: true });
    L.push({ t: 'Attendre 30 minutes (café, rangement, bibliographie)', duree: 30, vers: 'labo' });
    const manquants = [['es', 'extrait sec'], ['rheo', 'rhéologie'], ['masq', 'pouvoir masquant'], ['tmff', 'TMFF'], ['brill', 'brillance']].filter(([k]) => !e.f['mes_' + k]).map(x => x[1]);
    L.push({ t: 'Rédiger le rapport maintenant', d: `45 min ; la journée se termine avec le rapport${manquants.length ? ` (il manque encore : ${manquants.join(', ')})` : ''}`, duree: 45, vers: 'rapport' });
    return L;
  } });

// ───────────── Appel client ─────────────
add('client', { lieu: 'Salle de réunion (visio)', pnj: 'aubry', titre: 'Appel avec la cliente, 15 h',
  texte: e => `Il est ${hhmm(e.t)}. Mme Aubry : « Alors, la nouvelle base à l'Orgal garde bien notre promesse « sans solvant, COV nuls » ? On imprime les étiquettes des pots cette semaine. »\n${e.f.alerte === true ? 'Mme Dubreuil lui a déjà expliqué que l\'Orgal exige un agent de coalescence. Mme Aubry semble ennuyée mais ouverte.' : ''}${e.f.mes_dpnb ? `\nTu peux lui donner un chiffre : le dosage du DPnB a donné COV = ${nf(e.f.covMes ?? 0, 1)} g/L, avec une incertitude élargie U = ${nf(e.f.uMes ?? 0, 1)} g/L (k = 2, niveau de confiance d'environ 95 %).` : ''}`,
  choix: e => { const cov = (e.f.dpnb ?? 0) > 0;
    return [
      { t: 'Je lui donne les COV de ma formule en mots simples, et ce que cela implique pour son étiquette', duree: 20, f: { clientFait: true, clientOk: true, ...(cov && e.f.alerte !== true ? { alerte: true, alerteTardive: true } : {}) },
        note: cov ? 'Appel client : COV faibles mais non nuls (coalescent), mention « COV nuls » à retirer de l\'étiquette.' : 'Appel client : COV nuls dans ma formule, mention possible sur l\'étiquette.',
        run: n => ({ ...n, f: { ...n.f, comm: { ...(n.f.comm || {}), client: 'adapte' }, commRetour: cov ? 'Mme Aubry : « D\'accord : un peu de solvant, mais peu, et c\'est ce qui permet à la peinture de bien former son film. Je retire la mention de l\'étiquette. Merci pour la clarté. »' : 'Mme Aubry : « Parfait, je garde ma mention. Merci pour la clarté. »', commVers: 'labo' } }), vers: 'commRetour' },
      { t: 'Je lui récite mes résultats : COV en g/L par CPG-FID, incertitude élargie, MFFT du polymère, dose de coalescent', duree: 20, f: { clientFait: true, clientOk: true, ...(cov && e.f.alerte !== true ? { alerte: true, alerteTardive: true } : {}) },
        note: 'Appel client : résultats donnés avec un vocabulaire trop technique.',
        run: n => ({ ...n, t: n.t + 10, f: { ...n.f, comm: { ...(n.f.comm || {}), client: 'partiel' }, commRetour: 'Mme Aubry : « Je n\'ai pas compris vos g/L ni votre MFFT. En clair : je peux garder ma mention, oui ou non ? » Tu dois tout reprendre en mots simples : dix minutes de plus.\nÀ retenir : avec une cliente, on parle de ce que cela change pour elle (ici l\'étiquette), avec un seul chiffre si besoin et sans jargon.', commVers: 'labo' } }), vers: 'commRetour' },
      { t: 'Je réponds que oui, ça devrait aller', duree: 20, f: { clientFait: true, ...(cov ? { mensonge: true } : { clientOk: true }) }, note: 'Appel client : réponse positive sans réserve sur la mention « COV nuls ».', vers: 'labo' },
    ]; } });

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
  if (!mauvaisRheo(e) && !hsOk(e)) L.push({ cle: 'hs', t: `viscosité à haut gradient de ${nf(hsVrai(e), 0)} mPa·s à 1 000 s⁻¹ (${HS_MIN} à ${HS_MAX} demandés)` });
  if (!mauvaisRheo(e) && !basOk(e)) L.push({ cle: 'bas', t: 'viscosité à bas gradient trop élevée (trop de Thixol)' });
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
add('verdict', { lieu: 'Bureau', pnj: 'dubreuil', titre: 'Mme Dubreuil lit ton rapport', texte: e => `Elle lit en silence, puis lève les yeux${pn(e) ? ' : « ' + pn(e) + ', j\'ai lu ton rapport. »' : '.'}`, choix: e => [{ t: 'Écouter son verdict', vers: verdict(e) }] });

// ───────────── Bilan par compétence (référentiel du sujet) ─────────────
export function bilan(e) {
  const f = e.f, n = x => x ? 1 : 0;
  let dr = null;      // dernier rapport points/max calculé (sert à la fiche d'évaluation)
  const niv = (pts, max) => { dr = Math.max(0, Math.min(1, pts / max)); return pts >= max ? 'ok' : pts > 0 ? 'moyen' : 'ko'; };
  const nbDeleg = Object.keys(e.cmd).length;
  const nbOpt = ['huile', 'brill', 'tmff', 'dpnb'].filter(k => f['mes_' + k]).length;
  const dOk = tmffOk(e) && covOk(e);
  const dTxt = dOk ? 'dosé à bon escient (TMFF et COV conformes)' : (f.dpnb ?? 0) < 2.5 ? 'insuffisant (la MFFT de l\'Orgal est de 20 °C)' : 'en excès (COV trop élevés)';
  const pr = [];
  const RATIO_PAR_NIVEAU = { ok: 1, moyen: 0.55, ko: 0.15, nd: 0 };
  const ajoute = o => { const coherent = dr != null && (o.niveau === 'ok' ? dr >= 1 : o.niveau === 'moyen' ? dr > 0 && dr < 1 : o.niveau === 'ko' ? dr <= 0 : false); pr.push({ ...o, ratio: coherent ? dr : RATIO_PAR_NIVEAU[o.niveau] }); dr = null; };
  const c14 = n(f.regle === 'ok' && !f.refait) + n(dOk) + n(f.mes_huile) + n(f.mes_dpnb && !f.impasses) + n(f.mes_dpnb && f.cpgMeth && qm(e).ok);
  ajoute({ comp: 'C1.4', titre: 'Choisir méthodes et techniques', niveau: niv(c14, f.mes_dpnb ? 5 : 3), texte: `Règle de remplacement de la résine ${f.regle === 'ok' && !f.refait ? 'juste dès le départ' : 'à corriger'} ; coalescent ${dTxt} ; prises d'huile ${f.mes_huile ? 'mesurées pour lever le doute sur la CPVC' : 'non mesurées (le tableur avec les valeurs des fiches donnait une peinture non mate)'}.` });
  // C2.1 : préparer et réaliser. On ne juge que ce que l'élève a réellement fait (fabrication, prises d'huile à la spatule, dosage CPG, essai d'ajout d'épaississant)
  const gestes = [];
  gestes.push(f.rate ? { r: 0.5, t: 'première fabrication ratée : l\'ordre d\'introduction de la fiche n\'avait pas été respecté' } : f.fabrique ? { r: 1, t: 'fabrication conforme à la fiche, finesse correcte' } : { r: 0, t: 'pas de fabrication réalisée' });
  if (f.huileMoi) {
    const ess = f.huileEssais || [], R = ['tio2', 'caco3'].map(k => huileRetenue(e, k)), echecs = ess.filter(m => !m.ok).length;
    const r = R.reduce((a, x) => a + (!x ? 0 : x.n >= 2 && x.ecart <= 1 ? 1 : 0.7), 0) / 2 * (echecs ? 0.85 : 1);
    gestes.push({ r, t: `prises d'huile à la spatule ${r >= 0.99 ? 'bien réalisées (points finaux nets, déterminations répétables)' : r >= 0.6 ? 'exploitables, mais peu ou pas répétées' + (echecs ? ' et un point final dépassé' : '') : 'incomplètes'}` });
  }
  if (f.mes_dpnb) {
    const rec = recuperation(e), r = !rec ? 0.6 : Math.abs(rec.taux - 100) <= 5 ? 1 : 0.5;
    gestes.push({ r, t: `dosage CPG ${!rec ? 'sans solution de contrôle : justesse non vérifiée' : r === 1 ? 'avec une solution de contrôle retrouvée à ' + nf(rec.taux, 0) + ' % (justesse vérifiée)' : 'avec une solution de contrôle mal retrouvée (' + nf(rec.taux, 0) + ' %) : étalonnage à revoir'}` });
  }
  if (f.viscoTaille || f.lotPerdu) {
    gestes.push(f.lotPerdu ? { r: 0, t: 'ajout d\'épaississant fait directement sur tout le lot, avec une dose hors cible : peinture perdue' }
      : f.viscoTaille === 50 ? { r: (f.viscoNb || 1) <= 2 ? 1 : 0.8, t: `dose d'épaississant d'abord cherchée sur une prise d'essai de 50 g (${f.viscoNb || 1} essai${(f.viscoNb || 1) > 1 ? 's' : ''}), puis appliquée au lot` }
        : { r: 0.6, t: 'ajout d\'épaississant fait directement sur tout le lot (dose heureusement bonne, mais risqué)' });
  }
  dr = gestes.reduce((a, x) => a + x.r, 0) / gestes.length;
  ajoute({ comp: 'C2.1', titre: 'Préparer produits et matériel', niveau: dr >= 0.99 ? 'ok' : dr > 0 ? 'moyen' : f.fabrique || f.rate ? 'ko' : 'nd', texte: gestes.map(x => x.t[0].toUpperCase() + x.t.slice(1)).join(' ; ') + '.' });
  const c32 = n(f.alerte === true) * (f.alerteTardive ? 0.5 : 1) + n(f.stockCtrl) * (f.stockAlerte ? 0.5 : 1) + n(f.stab === 'honnete');
  // Exploitation des mesures (extrait sec, COV) : calcul, concordance, expression avec incertitude ; comptée dans C3 (interpréter et valider)
  let ptsExp = 0, maxExp = 0, txtExp = '';
  { const pEs = f.mes_es && f.esConcl ? (f.esAide ? 0.5 : 1) + ({ complet: 1, sansK: 0.5, simple: 0 }[f.esConcl] ?? 0) : 0, mEs = f.mes_es && f.esConcl ? 2 : 0;
    const pCov = f.mes_dpnb && f.covCalc ? (f.covCalc === 'ok' && f.rhoUtilise == null ? 1 : 0.5) + (f.cpgConcl === 'u' ? 1 : f.cpgConcl === 'simple' ? 0.5 : 0) : 0, mCov = f.mes_dpnb && f.covCalc ? 2 : 0;
    ptsExp = pEs + pCov; maxExp = mEs + mCov;
    txtExp = [mEs ? `Extrait sec : calcul ${f.esAide ? 'fait avec de l\'aide' : 'fait seul·e'} ; résultat ${({ complet: 'exprimé avec concordance des essais et incertitude élargie (k = 2)', sansK: 'donné avec une incertitude sans facteur d\'élargissement ni niveau de confiance', simple: 'donné sans vérification de concordance ni incertitude' })[f.esConcl]}.` : null,
        mCov ? `COV : ${f.covCalc === 'ok' && f.rhoUtilise == null ? 'calcul fait seul·e à partir de la concentration, de la masse pesée et de la masse volumique mesurée' : f.rhoUtilise != null ? 'masse volumique estimée au lieu d\'être mesurée' : 'calcul fait avec de l\'aide'} ; conclusion ${({ u: 'avec incertitude élargie et décision tenant compte de l\'incertitude', simple: 'sans incertitude', faux: 'contredisant la mesure' })[f.cpgConcl] || 'à préciser'}.` : null].filter(Boolean).join(' '); }
  ajoute({ comp: 'C3.2', titre: 'Détecter les non-conformités et alerter', niveau: niv(c32 + ptsExp, 3 + maxExp), texte: `${txtExp ? txtExp + ' ' : ''}Promesse « COV nuls » incompatible avec l'Orgal ${f.alerte === true ? (f.alerteTardive ? 'signalée tardivement' : 'signalée tout de suite') : 'non signalée'} ; fût d'Orgal gelé ${f.stockCtrl ? (f.stockAlerte ? 'contrôlé après rappel de Karim' : 'contrôlé de ta propre initiative') : 'non contrôlé'} ; stabilité ${f.stab === 'honnete' ? 'annoncée honnêtement comme non démontrée' : f.stab === 'promis' ? 'garantie sans l\'avoir démontrée' : 'omise'}.` });
  const c41 = n(dispOk(f)) + n(dOk) + n(hsOk(e) && basOk(e));
  ajoute({ comp: 'C4.1', titre: 'Modifier, améliorer le protocole', niveau: niv(c41, 3), texte: `Dispersant ${dispOk(f) ? `corrigé (amas supprimés${f.dispCourbe ? ', dose trouvée par la courbe de défloculation' : ''})` : 'non corrigé'} ; coalescent ${dOk ? (f.coalPense ? 'prévu dès le départ et dosé' : 'ajouté après la mesure de la TMFF, et dosé') : (f.dpnb ?? 0) < 2.5 ? 'absent ou trop faible' : 'surdosé'}.` });
  const c61 = n(f.plan !== 'solo') + n(e.t <= T_RAPPORT) + n(nbOpt >= 2);
  ajoute({ comp: 'C6.1', titre: 'Organiser le travail, tenir les délais', niveau: niv(c61, 3), texte: `${f.plan === 'solo' ? 'Tout fait seul·e : trop séquentiel. ' : f.plan === 'mp' ? 'Analyses des matières premières lancées dès le début, en parallèle. ' : 'Tâches déléguées en parallèle. '}Rapport ${e.t <= T_RAPPORT ? 'rendu dans les temps' : 'rendu après 17 h'} ; ${nbOpt} analyse(s) complémentaire(s) sur 4 (prises d'huile, brillance, TMFF, dosage du DPnB).` });
  ajoute({ comp: 'C6.3', titre: 'Gérer les produits selon la réglementation', niveau: niv(n(f.stock === 'neuf') + n(f.stock === 'tamise') * 0.5 + n(f.coutOk), 2), texte: `${f.stock === 'neuf' ? 'Lot gelé écarté, fût neuf commandé. ' : f.stock === 'tamise' ? 'Lot gelé tamisé et utilisé : acceptable seulement avec réserve. ' : 'Aucun problème de stockage détecté. '}${f.coutOk ? 'Coût matières contrôlé (< 4,5 €/kg).' : 'Coût matières non vérifié.'}` });
  ajoute({ comp: 'C6.4', titre: 'Assurer la traçabilité', niveau: f.trace ? 'ok' : 'ko', texte: f.trace ? 'Lot, pesées et observations consignés au fur et à mesure.' : 'Pesées réelles et observations reconstituées de mémoire : traçabilité faible.' });
  const COMM = f.comm || {}, nomsComm = { equipe: 'message à l\'équipe', resp: 'message à la responsable', client: 'échange avec la cliente', achats: 'échange avec le service achats' }, qual = { adapte: 'adapté à l\'interlocuteur', partiel: 'à ajuster (trop vague, trop familier ou trop technique)', mauvais: 'inadapté (ton ou contenu)' };
  const nbComm = Object.keys(COMM).length, ptsComm = Object.values(COMM).reduce((a, q) => a + QUALITE_COMM[q], 0);
  ajoute({ comp: 'C7.3', titre: 'Travailler en équipe', niveau: f.plan === 'solo' ? 'ko' : niv(n(nbDeleg >= 3) + n(f.alerte === true) + ptsComm, 2 + nbComm), texte: (f.plan === 'solo' ? 'Aucune délégation : l\'équipe n\'a pas été sollicitée.' : `${nbDeleg} analyse(s) confiée(s) aux collègues ; ${f.alerte === true ? 'information remontée à la responsable' : 'communication à améliorer'}.`) + (nbComm ? ` Communication : ${Object.entries(COMM).map(([k, q]) => `${nomsComm[k]} ${qual[q]}`).join(' ; ')}.` : '') });
  return pr;
}

// ───────────── Fiche d'évaluation au format des CCF4 (auto-évaluation indicative, imprimable, rien n'est transmis) ─────────────
export const GROUPES_CCF = [
  { code: 'C1', titre: 'RECHERCHER ET ANALYSER', comps: ['C1.4'], capacites: ['C.1.4. Sélectionner les méthodes, techniques et matériels en fonction de l\'expérience à réaliser'] },
  { code: 'C2', titre: 'RÉALISER', comps: ['C2.1'], capacites: ['C.2.1. Préparer les produits, le matériel et les accessoires sur les équipements de laboratoire les plus courants'] },
  { code: 'C3', titre: 'INTERPRÉTER ET VALIDER', comps: ['C3.2'], capacites: ['C.3.2. Détecter les non-conformités dans les activités de contrôle qualité et de R&D au regard des exigences de la sécurité, de la protection de l\'environnement et de la qualité et alerter'] },
  { code: 'C4', titre: 'OPTIMISER ET ADAPTER', comps: ['C4.1'], capacites: ['C.4.1. Modifier, améliorer ou transférer le protocole'] },
  { code: 'C6', titre: 'ORGANISER', comps: ['C6.1', 'C6.3', 'C6.4'], capacites: ['C.6.1. Organiser le travail et planifier les expériences dans le respect des délais', 'C.6.3. Gérer le stock des produits en appliquant la réglementation', 'C.6.4. Assurer la traçabilité des activités'] },
  { code: 'C7', titre: 'ADOPTER DES COMPORTEMENTS PROFESSIONNELS', comps: ['C7.3'], capacites: ['C.7.3. Travailler en équipe dans un groupe multiculturel et/ou pluridisciplinaire'] },
];
// Niveau d'acquisition (A à D) : lecture qualitative du parcours, sans note chiffrée
export const niveauCcf = r => r >= 0.8 ? 'A' : r >= 0.6 ? 'B' : r >= 0.4 ? 'C' : 'D';
export function ficheCcf(e) {
  const B = bilan(e);
  const groupes = GROUPES_CCF.map(g => {
    const items = B.filter(b => g.comps.includes(b.comp)), ratio = items.reduce((a, b) => a + b.ratio, 0) / items.length;
    return { ...g, niveau: niveauCcf(ratio), commentaire: items.map(b => g.comps.length > 1 ? `${b.comp} : ${b.texte}` : b.texte).join('\n') };
  });
  return { groupes };
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
  L.push(`Modifications envisagées au départ : ${(f.planForm || []).length ? f.planForm.map(k => PLAN_OPTIONS.find(o => o[0] === k)?.[1]).join(' ; ') : 'aucune de plus que le changement de résine'}.`);
  L.push(`Initiative : ${f.idees ? 'tu as demandé de l\'aide pour savoir quoi lancer (5 min)' : 'tu as décidé seul·e des analyses à lancer'}.`);
  L.push(`Client : ${f.clientFait ? (f.clientOk ? 'informé de la mention « COV nuls »' : 'mal renseigné') : 'pas rappelé'}.`);
  return L;
}

// ───────────── Les fins ─────────────
const fin = (id, ton, titre, texte) => add(id, { lieu: 'Fin de journée', pnj: 'dubreuil', titre, fin: { ton, titre }, texte, choix: [] });
fin('fin_excellent', 'ok', 'Une journée exemplaire', e => `Il est ${hhmm(e.t)}. Le dossier est complet : formule conforme, coalescent dosé, contrôles faits, prises d'huile, brillance et TMFF mesurés,${e.f.mes_dpnb ? ' COV vérifiés par un dosage du DPnB,' : ''} traçabilité soignée, alertes données au bon moment. Mme Dubreuil sourit : « Voilà comment je veux voir travailler une équipe. On valide le remplacement de la Vinnapas par l'Orgal, et la cliente retire la mention « COV nuls » de ses étiquettes. »`);
fin('fin_bon', 'ok', 'Mission remplie, avec des progrès à faire', e => `Il est ${hhmm(e.t)}. La nouvelle base respecte l'essentiel du cahier des charges et le rapport est rendu dans les temps. Quelques points auraient pu être mieux conduits (voir le bilan ci-dessous). « C'est solide, dit Mme Dubreuil. Pour la prochaine fois, regarde bien les remarques : elles feront la différence. »`);
fin('fin_retard', 'moyen', 'Rapport remis en retard', e => `Il est ${hhmm(e.t)}. Le travail est bon, mais le rapport arrive après 17 h 30 : la cliente a été rappelée sans les résultats. « Sur le fond, c'est bien, mais en entreprise le délai fait partie du cahier des charges. »`);
fin('fin_incomplet', 'moyen', 'Dossier incomplet', e => { const NOM = { es: 'l\'extrait sec', rheo: 'la rhéologie', masq: 'le pouvoir masquant' }, manque = QC.filter(k => !e.f['mes_' + k]).map(k => NOM[k]), solides = bilan(e).filter(b => b.niveau === 'ok').map(b => b.titre.toLowerCase());
  return `Il est ${hhmm(e.t)}. Il manque des contrôles essentiels : ${manque.join(', ')}. Sans eux, le rapport ne permet pas de dire si la peinture respecte le cahier des charges.${solides.length ? `\nTon travail est pourtant solide sur plusieurs points (${solides.join(' ; ')}).` : ''}\n« On ne valide pas une formule sans ces mesures. Pas besoin de tout recommencer : demain, on refait les contrôles manquants sur ta peinture. Et il faut les lancer plus tôt : l'équipe déjeune, elle aussi, et chacun ne fait qu'une chose à la fois. »`; });
const MOT_ECART = {
  tmff: '« La Vinnapas n\'avait pas besoin de coalescent, l\'Orgal si : la fiche le disait. Calcule la dose et mesure la TMFF avant de conclure. »',
  cov: '« Un peu de coalescent, oui ; trop, ça ne répond plus au cahier des charges. On dose à partir du polymère sec, pas à l\'œil. »',
  lambda: '« Une base mate se juge sur λ = CPV/CPVC : vérifie-le avec les prises d\'huile de NOS poudres avant de valider une formule. »',
  masq: '« Le TiO₂ coûte cher, mais c\'est lui qui masque : on n\'économise pas sur le pigment sans mesurer le pouvoir masquant. »',
  cout: '« Une bonne formule, c\'est aussi une formule qui se vend : 4,5 €/kg, c\'est écrit dans le cahier des charges. »',
  bas: '« Le Thixol relève le bas gradient : trop, et la peinture ne s\'étale plus. Pour le haut gradient, c\'est le Coapur. »',
  hs: '« À haut gradient, c\'est le Coapur qui règle la viscosité, pas le Thixol : relis les deux fiches avant de choisir l\'épaississant. »',
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
