// ====================================================
//  UNE JOURNÉE AU LABO : histoire à choix pour le BTS Métiers de la Chimie (sans React, testable seule).
//  Support : sujet de CCF4 « changement de la résine Orgal PST 50A → Vinnapas EP 3360 » (base de peinture blanche, gamme colorée au violet de cobalt).
//  Le joueur est un technicien de R&D ; il délègue des analyses à des collègues fictifs (chacun ne fait qu'une chose à la fois),
//  la journée va de 8 h à 17 h (appel client à 15 h, rapport avant 16 h 30) et les décisions ont des conséquences : huit fins possibles.
//  Les calculs de formulation reposent sur le modèle de la simulation « Peinture à l'eau » (proprietes), pour rester cohérent avec elle.
//  Les données de mesure des analyses déléguées sont FICTIVES (elles servent le scénario) : voir le bilan et les notes de relecture.
// ====================================================
import { proprietes } from "./Peinture";

export const ID_LABO = 81;
export const CLE_ETAT = 'labo-histoire-v1';
export const CLE_FINS = 'labo-histoire-fins-v1';
export const T_CLIENT = 420;     // 15 h 00 (minutes depuis 8 h 00)
export const T_RAPPORT = 510;    // 16 h 30
export const T_FIN = 540;        // 17 h 00

export const hhmm = t => { const m = 480 + Math.round(t); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; };
export const nf = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

export const PNJ = {
  moi: { nom: 'Toi', role: 'Technicien·ne de R&D', emoji: '🧑‍🔬', couleur: '#0f766e' },
  dubreuil: { nom: 'Mme Dubreuil', role: 'Responsable du laboratoire', emoji: '👩‍💼', couleur: '#7c3aed' },
  karim: { nom: 'Karim', role: 'Technicien de formulation', emoji: '🧑‍🏭', couleur: '#b45309' },
  ines: { nom: 'Inès', role: 'Technicienne en analyses physico-chimiques', emoji: '👩‍🔬', couleur: '#0369a1' },
  lucas: { nom: 'Lucas', role: 'Technicien rhéologie et application', emoji: '🧔', couleur: '#15803d' },
  perrin: { nom: 'M. Perrin', role: 'Service achats', emoji: '🧑‍💼', couleur: '#475569' },
  aubry: { nom: 'Mme Aubry', role: 'Cliente (marque de peintures)', emoji: '👩‍🎨', couleur: '#be185d' },
};

// ───────────── Formule, propriétés et coût (modèle de la simulation Peinture) ─────────────
export const formule = e => {
  const ok = e.f.regle === 'ok';
  return { resine: 'vinnapas', eau: ok ? 116.7 : 100, tio2: 60, caco3: 60, liant: ok ? 83.3 : 100, foamex: 1.5,
    coadis: e.f.coadis ?? 0.2, dpnb: e.f.dpnb ?? 5, thixol: 1.5, coapur: 3 };
};
export const FORMULE_ORGAL = { resine: 'orgal', eau: 100, tio2: 60, caco3: 60, liant: 100, foamex: 1.5, coadis: 0.2, dpnb: 5, thixol: 1.5, coapur: 3 };
export const prop = (e, opts) => proprietes(formule(e), opts);

// Prix (€/g). Orgal : 25 € / 5 L ; Vinnapas : devis du scénario 3,60 €/kg ; autres : Document 1
const PRIX = { eau: 3.7 / 1000 / 1000, tio2: 0.010, caco3: 0.003, orgal: 5 / 1.03 / 1000, vinnapas: 0.0036, foamex: 6 / 200, coadis: 7 / 1000 / 1.22, dpnb: 3 / 1000 / 0.91, thixol: 7 / 1000 / 1.06, coapur: 8 / 1000 / 1.04 };
export const coutKg = f => {
  const m = proprietes(f).mTot;
  const c = f.eau * PRIX.eau + f.tio2 * PRIX.tio2 + f.caco3 * PRIX.caco3 + f.liant * (f.resine === 'orgal' ? PRIX.orgal : PRIX.vinnapas)
    + f.foamex * PRIX.foamex + f.coadis * PRIX.coadis + f.dpnb * PRIX.dpnb + f.thixol * PRIX.thixol + f.coapur * PRIX.coapur;
  return c / (m / 1000);
};

// ───────────── Moteur ─────────────
export const etatInitial = () => ({ scene: 'intro', t: 0, f: {}, carnet: [], cmd: {}, libre: { ines: 0, lucas: 0, perrin: 0 }, essais: 0 });
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
  return { ...e, scene: cible, essais: 0 };
}
export const texteDe = (e, sc = SCENES[e.scene]) => typeof sc.texte === 'function' ? sc.texte(e) : sc.texte;
export const choixDe = (e, sc = SCENES[e.scene]) => (typeof sc.choix === 'function' ? sc.choix(e) : sc.choix || []).filter(c => !c.si || c.si(e));

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

// ───────────── Les analyses déléguées ─────────────
export const ANALYSES = [
  { cle: 'es', tech: 'ines', label: 'Extrait sec et densité de la peinture', duree: 40, perso: 5 },
  { cle: 'rheo', tech: 'lucas', label: 'Profil rhéologique (viscosimètre)', duree: 45, perso: 10 },
  { cle: 'masq', tech: 'lucas', label: 'Pouvoir masquant (4 épaisseurs, contraste)', duree: 90, perso: 20 },
  { cle: 'tmff', tech: 'lucas', label: 'Température minimale de formation de film (TMFF)', duree: 60, perso: 10 },
  { cle: 'cout', tech: 'perrin', label: 'Devis de la Vinnapas et coût matières premières', duree: 20, perso: 5 },
];
const labelDe = cle => (ANALYSES.find(a => a.cle === cle) || { label: { co: 'Dosage du Co(II) dans le pigment', gamme: 'Gamme colorée (mesures L*a*b*)' }[cle] }).label;

// ═══════════════ LES SCÈNES ═══════════════
const retourLabo = { t: 'Retourner à la paillasse', vers: 'labo' };

add('intro', { lieu: 'Bureau de la responsable', pnj: 'dubreuil', titre: 'Lundi, 8 h 00',
  texte: `Mme Dubreuil t'accueille avec un café et un dossier.\n« La résine Orgal PST 50A risque la pénurie. Il faut pouvoir la remplacer par la Vinnapas EP 3360 dans notre base de peinture blanche, sans dégrader ses performances : mate (λ = CPV/CPVC ≥ 0,8), extrait sec supérieur à 50 %, pouvoir masquant supérieur à 7,0 m²/L, COV inférieurs à 30 g/L, matières premières à moins de 4,5 €/kg.\nOn en profite pour corriger un défaut : les opérateurs trouvent des gros amas de poudres à la dispersion. Et il faut préparer une gamme colorée avec un pigment violet de cobalt, que tu synthétiseras et contrôleras.\nAppel avec notre cliente, Mme Aubry, à 15 h. Rapport pour 16 h 30. Karim, Inès et Lucas t'aident, mais chacun ne fait qu'une chose à la fois. »`,
  choix: [{ t: 'Parcourir le dossier', vers: 'docs' }] });

add('docs', { lieu: 'Bureau', pnj: 'moi', titre: 'Étude du dossier',
  texte: e => `Tu étales les documents. Il est ${hhmm(e.t)}. Que lis-tu ?${e.f.docRef ? '' : '\n(Il te faut au moins la formule de référence pour avancer.)'}`,
  choix: () => [
    { t: 'Les fiches techniques des deux résines (Document 8)', si: e => !e.f.fiche, duree: 10, f: { fiche: true }, vers: 'docRes' },
    { t: 'La formule et la fiche de fabrication de la référence (Documents 1 et 2, résultats du responsable)', si: e => !e.f.docRef, duree: 15, f: { docRef: true }, vers: 'docRef' },
    { t: 'J\'ai de quoi préparer l\'appel d\'organisation', si: e => e.f.docRef, vers: 'appel' },
  ] });

add('docRes', { lieu: 'Bureau', pnj: 'moi', titre: 'Document 8 : les deux résines',
  texte: `ORGAL PST 50A : copolymère styrène-acrylique, ES 50 %, densité 1,03, MFFT 20 °C, Tg 20 °C. Usage : peinture mate à semi-brillante, intérieur / extérieur.\nVINNAPAS EP 3360 : copolymère acétate de vinyle-éthylène, ES 60 %, densité 1,07, MFFT 2 °C, Tg 10 °C. Usage : peinture mate à semi-mate, intérieur. Très faible teneur en COV.\nUne chose te chagrine : la commande parle d'une base « pour extérieur », le cahier des charges de « mat pour intérieur », et la fiche de la Vinnapas ne mentionne que l'intérieur.`,
  choix: [{ t: 'Continuer', vers: 'incoherence' }] });

add('incoherence', { lieu: 'Bureau', pnj: 'moi', titre: 'Une incohérence dans le dossier',
  texte: 'Que fais-tu de cette incohérence entre « extérieur » et « intérieur » ?',
  choix: [
    { t: 'J\'en parle tout de suite à Mme Dubreuil (5 min)', duree: 5, f: { alerte: true }, note: 'Alerte : la Vinnapas n\'est annoncée que pour l\'intérieur alors que la commande évoque l\'extérieur. Signalé à Mme Dubreuil.', vers: 'alerteRep' },
    { t: 'Je la note dans mon cahier pour en parler plus tard', f: { alerte: 'plustard' }, note: 'À clarifier : intérieur ou extérieur ? (Vinnapas : intérieur seulement).', vers: 'docs' },
    { t: 'Je ne dis rien : on m\'a demandé de changer la résine, pas de discuter la commande', f: { alerte: false }, vers: 'docs' },
  ] });
add('alerteRep', { lieu: 'Bureau', pnj: 'dubreuil', titre: 'Réponse de Mme Dubreuil',
  texte: '« Bien vu. La cliente a parlé de façades… mais la cible reste l\'intérieur. Je lui en parlerai à l\'appel de 15 h, et note-le dans ton rapport. Merci de me prévenir plutôt que de découvrir ça au dernier moment. »',
  choix: [{ t: 'Retourner au dossier', vers: 'docs' }] });

add('docRef', { lieu: 'Bureau', pnj: 'moi', titre: 'Documents 1, 2, 4 et 5 : la référence Orgal',
  texte: () => { const p = proprietes(FORMULE_ORGAL, { ph: 'mesuree' });
    return `Formule de référence (331 g) : eau 100 g, TiO₂ 60 g, CaCO₃ léger 60 g, Orgal 100 g, Foamex 1,5 g, Coadis BR3 0,2 g, DPnB 5 g, Thixol 1,5 g, Coapur 3 g.\nTableur (prises d'huile mesurées sur nos poudres) : ES = ${nf(p.ES)} %, CPV = ${nf(p.CPV)} %, CPVC = ${nf(p.CPVC)} %, λ = ${nf(p.lambda, 2)}, COV = ${nf(p.COV)} g/L. Coût matières premières ≈ ${nf(coutKg(FORMULE_ORGAL))} €/kg.\nAnalyses du responsable : pouvoir masquant 7,4 m²/L ; comportement rhéofluidifiant, faible thixotropie.\nFiche de fabrication : 70 % de l'eau, Foamex, Coadis, puis TiO₂ et CaCO₃ en pluie fine à 300 tr/min, dispersion 15 min à vitesse maximale (finesse 7 Hegman) ; ensuite Orgal, DPnB, Thixol, Coapur sous agitation lente (200 tr/min), enfin le reste de l'eau.`; },
  choix: [{ t: 'Revenir au dossier', vers: 'docs' }] });

add('appel', { lieu: 'Téléphone', pnj: 'dubreuil', titre: 'L\'appel d\'organisation obligatoire',
  texte: e => `Il est ${hhmm(e.t)}. Mme Dubreuil décroche : « Dis-moi comment tu organises ta journée. Rappel : le pigment demande de la synthèse et du séchage, les analyses se délèguent, mais Karim, Inès et Lucas ne peuvent pas tout faire en même temps. »`,
  choix: [
    { t: 'Je formule d\'abord, je délègue les analyses dès que la peinture est prête, et je m\'occupe du pigment ensuite', f: { plan: 'seq' }, note: 'Plan : formulation, puis analyses déléguées, puis pigment.', vers: 'regle' },
    { t: 'Je lance la synthèse du pigment tout de suite (séchage long) pendant que je formule', f: { plan: 'pig' }, note: 'Plan : synthèse du pigment en premier (séchage en parallèle), puis formulation.', vers: 'pigProto' },
    { t: 'Je fais tout moi-même, je ne veux déranger personne', f: { plan: 'solo' }, note: 'Plan : tout réalisé seul·e.', vers: 'solo' },
  ] });
add('solo', { lieu: 'Téléphone', pnj: 'dubreuil', titre: 'Mme Dubreuil sourit',
  texte: '« Comme tu veux. Mais tu n\'as que neuf heures, pas vingt-quatre. Et l\'esprit d\'équipe fait partie de ce qu\'on attend. »',
  choix: [{ t: 'Je me mets au travail', vers: 'regle' }] });

// ───────────── Formulation ─────────────
add('regle', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Que garder constant ?',
  texte: e => `Il est ${hhmm(e.t)}. Karim prépare la balance. « Pour que la nouvelle base ait le même extrait sec, la même CPV et la même CPVC, tu gardes constant quoi, au juste ? »`,
  choix: [
    { t: 'La masse de polymère SEC (50 g) : on ajuste la masse de dispersion et l\'eau', vers: 'calcMasse' },
    { t: 'La masse de dispersion de résine : 100 g de Vinnapas à la place de 100 g d\'Orgal', vers: 'regleNaif' },
    { t: 'Le volume de liquide apporté par la résine', vers: 'regleNaif' },
  ] });
add('regleNaif', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Karim fronce les sourcils',
  texte: '« Tu es sûr·e ? La Vinnapas est à 60 % d\'extrait sec, l\'Orgal à 50 % : 100 g de l\'une n\'apportent pas la même quantité de polymère que 100 g de l\'autre. Tu peux tester, mais moi je recalculerais. »',
  choix: [
    { t: 'Tu as raison, je recalcule', vers: 'calcMasse' },
    { t: 'Je teste quand même avec 100 g, on verra bien', f: { regle: 'naif' }, note: 'Choix : 100 g de Vinnapas à la place de 100 g d\'Orgal, sans recalcul.', vers: 'dispersion' },
  ] });
add('calcMasse', { lieu: 'Paillasse de formulation', pnj: 'moi', titre: 'Calcul : masse de Vinnapas',
  texte: 'L\'Orgal (100 g, ES 50 %) apporte 50 g de polymère sec. La Vinnapas a un extrait sec de 60 %.',
  calcul: { q: 'Quelle masse de dispersion de Vinnapas faut-il peser ?', unite: 'g', vrai: () => 100 * 0.5 / 0.6, tol: 0.02,
    indice: 'Extrait sec = masse de polymère sec ÷ masse de dispersion. Quelle masse de dispersion à 60 % contient 50 g de sec ?',
    ok: { vers: 'calcEau', note: 'Vinnapas à peser : 83,3 g (apporte 50 g de polymère sec).' },
    ko: { vers: 'calcEau', duree: 15, f: { aideCalcul: true }, note: 'Calcul de la masse de Vinnapas fait avec l\'aide de Karim : 83,3 g.' } } });
add('calcEau', { lieu: 'Paillasse de formulation', pnj: 'moi', titre: 'Calcul : eau à ajuster',
  texte: 'Pour garder le même extrait sec, la masse totale (331,2 g) et celle des autres matières restent les mêmes : la Vinnapas pèse 83,3 g au lieu de 100 g, l\'eau compense.',
  calcul: { q: 'Quelle masse d\'eau faut-il ajouter au total ?', unite: 'g', vrai: () => 100 + (100 - 83.3), tol: 0.02,
    indice: 'On retire 16,7 g de résine ; l\'eau doit remplacer cette masse en plus des 100 g initiaux.',
    ok: { f: { regle: 'ok' }, vers: e => e.f.refait ? 'fabrication' : 'dispersion', note: 'Eau totale : 116,7 g (formule : Vinnapas 83,3 g, eau 116,7 g).' },
    ko: { f: { regle: 'ok' }, duree: 10, vers: e => e.f.refait ? 'fabrication' : 'dispersion', note: 'Eau totale : 116,7 g (calculée avec l\'aide de Karim).' } } });

add('dispersion', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Les amas de poudres',
  texte: e => `« Voilà le défaut dont se plaignent les opérateurs : quand on verse le TiO₂ et le CaCO₃ dans l'eau, ça fait des amas durs, et ils passent vingt minutes à les casser. Qu'est-ce que tu corriges dans la formule ? »${e.f.disp1 || e.f.disp2 ? '\n(Karim te rappelle que le dispersant est la matière qui aide à mouiller et séparer les grains.)' : ''}`,
  choix: [
    { t: 'La dose de dispersant (Coadis BR3 : 0,2 g pour 120 g de poudres)', vers: 'calcCoadis' },
    { t: 'La vitesse d\'agitation', si: e => !e.f.disp1, duree: 10, f: { disp1: true }, note: 'Idée écartée : augmenter la vitesse (déjà au maximum dans la fiche).', vers: 'dispRep1' },
    { t: 'La quantité d\'eau de départ', si: e => !e.f.disp2, duree: 10, f: { disp2: true }, note: 'Idée écartée : plus d\'eau au départ (change l\'ES et la rhéologie).', vers: 'dispRep2' },
  ] });
add('dispRep1', { lieu: 'Paillasse', pnj: 'karim', titre: 'Karim', texte: '« La fiche prévoit déjà la vitesse maximale pendant 15 minutes. On ne peut pas aller plus vite que la machine. Cherche du côté de la formule. »', choix: [{ t: 'Reprendre', vers: 'dispersion' }] });
add('dispRep2', { lieu: 'Paillasse', pnj: 'karim', titre: 'Karim', texte: '« Plus d\'eau, c\'est changer l\'extrait sec et la viscosité, et ça ne s\'attaque pas à la cause : les grains ne sont pas assez mouillés et séparés. Cherche du côté de l\'additif qui sert à ça. »', choix: [{ t: 'Reprendre', vers: 'dispersion' }] });
add('calcCoadis', { lieu: 'Paillasse', pnj: 'moi', titre: 'Calcul : dose de dispersant',
  texte: 'Le Coadis BR3 a un extrait sec de 40 %. La fiche technique recommande 0,15 à 0,20 % de matière active par rapport à la masse de poudres (TiO₂ + CaCO₃ = 120 g). Dose actuelle : 0,2 g de Coadis BR3, soit 0,067 %.',
  calcul: { q: 'Quelle masse de Coadis BR3 pèses-tu (visant le milieu de la plage, 0,175 %) ?', unite: 'g', vrai: () => 0.00175 * 120 / 0.4, tol: 0.15,
    indice: 'Matière active = masse de Coadis × 0,40. Il faut 0,175 % de 120 g de poudres comme matière active.',
    retour: v => v >= 1 ? 'Attention : à cette dose, le dispersant est très en excès (surdosage : film sensible à l\'eau, mousse, coût). Revois le calcul.' : null,
    ok: { f: { coadis: 0.525 }, vers: 'coalescent', note: 'Dispersant relevé à 0,525 g de Coadis BR3 (0,175 % de matière active sur les poudres) pour supprimer les amas.' },
    ko: { f: { coadis: 0.5 }, vers: 'coalescent', duree: 10, note: 'Dispersant relevé à 0,5 g de Coadis BR3 (valeur donnée par Karim).' } } });

add('coalescent', { lieu: 'Paillasse', pnj: 'karim', titre: 'Et le coalescent ?',
  texte: e => `« Dans la référence il y a 5 g de DPnB, l'agent de coalescence, qui aide les particules de résine à fusionner en un film continu. Avec la Vinnapas, on le garde ? »\n${e.f.fiche ? 'Tu te souviens : la MFFT de la Vinnapas est de 2 °C, contre 20 °C pour l\'Orgal.' : 'Tu n\'as pas lu la fiche de la résine : Karim te la tend. « MFFT de la Vinnapas : 2 °C ; celle de l\'Orgal : 20 °C. »'}`,
  choix: [
    { t: 'Garder 5 g : on ne change pas ce qui marche', f: { dpnb: 5 }, note: 'Coalescent conservé à 5 g.', vers: 'fabrication' },
    { t: 'Le supprimer : MFFT de 2 °C, le film se forme sans lui à température ambiante, et les COV tombent à zéro', f: { dpnb: 0 }, note: 'Coalescent (DPnB) supprimé : MFFT de la Vinnapas = 2 °C.', vers: 'fabrication' },
    { t: 'Le réduire à 2 g par précaution', f: { dpnb: 2 }, note: 'Coalescent réduit à 2 g par précaution.', vers: 'fabrication' },
  ] });

add('fabrication', { lieu: 'Paillasse de formulation', pnj: 'karim', titre: 'Fabriquer 300 g de peinture',
  texte: e => `Il est ${hhmm(e.t)}. La défloculeuse est prête, la balance aussi. Comment fabriques-tu la peinture ?`,
  choix: [
    { t: 'Je suis la fiche de fabrication : 70 % de l\'eau, antimousse, dispersant, poudres en pluie fine, dispersion de 15 min, puis liant et additifs, puis le reste de l\'eau (75 min)', duree: 75, f: { fabrique: true }, note: 'Peinture fabriquée selon la fiche (dispersion de 15 min à vitesse maximale).', vers: 'cahier' },
    { t: 'Je mets tout dans le bécher et je disperse : ça gagnera du temps (40 min)', duree: 40, f: { rate: true }, vers: 'rate' },
  ] });
add('rate', { lieu: 'Paillasse', pnj: 'karim', titre: 'Le résultat n\'est pas beau',
  texte: 'La peinture a mousse, des grumeaux, et la jauge Hegman indique 4 : finesse de 40 µm. « Je t\'avais dit de suivre l\'ordre : sans lui, les poudres ne sont pas mouillées. Il faut tout refaire. »',
  choix: [{ t: 'Tout refaire proprement (75 min)', duree: 75, f: { fabrique: true }, note: 'Première fabrication ratée (ordre d\'introduction non respecté), refaite selon la fiche.', vers: 'cahier' }] });
add('cahier', { lieu: 'Paillasse', pnj: 'moi', titre: 'Le cahier de laboratoire',
  texte: 'La peinture est prête dans le bécher. Tu as les mains encore collantes et un carnet ouvert.',
  choix: [
    { t: 'Je note maintenant le lot, les pesées réelles et mes observations (5 min)', duree: 5, f: { trace: true }, note: 'Lot VIN-01 fabriqué : pesées réelles et observations consignées dans le cahier.', vers: 'labo' },
    { t: 'Je noterai ça en rédigeant le rapport, de mémoire', f: { trace: false }, vers: 'labo' },
  ] });

// ───────────── Pigment ─────────────
add('pigProto', { lieu: 'Bibliographie', pnj: 'moi', titre: 'Choisir un mode opératoire pour le violet de cobalt',
  texte: e => `Il est ${hhmm(e.t)}. Comment obtiens-tu le pigment ?`,
  choix: [
    { t: 'Par précipitation : un sel de cobalt(II) en solution, avec des ions ammonium et phosphate (mode opératoire de la bibliographie)', duree: 15, f: { pigProto: true }, vers: 'pigSecu' },
    { t: 'Par calcination d\'oxydes à 1 000 °C', vers: 'pigNon1' },
    { t: 'J\'en commande un tout fait', vers: 'pigNon2' },
  ] });
add('pigNon1', { lieu: 'Bibliographie', pnj: 'lucas', titre: 'Lucas', texte: '« Il n\'y a pas de four à 1 000 °C libre aujourd\'hui, et ça prendrait toute la journée. Cherche une voie en solution, à température ambiante. »', choix: [{ t: 'Reprendre', vers: 'pigProto' }] });
add('pigNon2', { lieu: 'Bibliographie', pnj: 'dubreuil', titre: 'Mme Dubreuil', texte: '« On te demande de le synthétiser, justement pour en contrôler la qualité. Un pigment du commerce ne répond pas à la question posée. »', choix: [{ t: 'Reprendre', vers: 'pigProto' }] });
add('pigSecu', { lieu: 'Paillasse de chimie', pnj: 'ines', titre: 'Les sels de cobalt(II)',
  texte: 'Inès a sorti les flacons. « Les sels de cobalt(II) sont classés CMR (cancérogène, mutagène, reprotoxique : la FDS le précise). Comment tu t\'organises ? »',
  choix: [
    { t: 'Je lis la FDS, je mets gants, lunettes et blouse, je pèse et je filtre sous hotte, et les déchets vont dans le bidon « métaux » (10 min)', duree: 10, f: { secu: true }, note: 'Sécurité : FDS lue, EPI, travail sous hotte, déchets de cobalt dans le bidon dédié.', vers: 'pigSynth' },
    { t: 'Gants et lunettes, mais je travaille sur la paillasse : ce ne sont que quelques grammes', vers: 'secuAlerte' },
    { t: 'On est pressés : je commence directement', vers: 'secuAlerte' },
  ] });
add('secuAlerte', { lieu: 'Paillasse de chimie', pnj: 'ines', titre: 'Inès t\'arrête',
  texte: '« Stop. De la poudre de sel de cobalt à l\'air libre, c\'est de l\'inhalation et des projections possibles. On travaille sous hotte, on porte les protections adaptées et on trie les déchets. Ça ne se discute pas. »',
  choix: [
    { t: 'Tu as raison, on le fait dans les règles (10 min)', duree: 10, f: { secu: true, secuAlerte: true }, note: 'Sécurité : rappelé à l\'ordre par Inès, reprise sous hotte avec EPI et tri des déchets.', vers: 'pigSynth' },
    { t: 'C\'est juste quelques grammes, ça ira', vers: 'fin_incident' },
  ] });
add('pigSynth', { lieu: 'Paillasse de chimie', pnj: 'moi', titre: 'Synthèse lancée',
  texte: 'Tu prépares les solutions, mélanges, un précipité violet se forme. Il faut maintenant filtrer, rincer, puis laisser sécher : le pigment sera prêt dans environ deux heures.',
  choix: [{ t: 'Suite de la journée', duree: 40, run: e => nota({ ...e, f: { ...e.f, pigSynth: true }, cmd: { ...e.cmd, pig: { pret: e.t + 120, lu: false } } }, 'Synthèse du violet de cobalt lancée (précipité en cours de séchage).'),
    vers: e => e.f.fabrique ? 'labo' : 'regle' }] });
add('methodeCo', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Comment doser le Co(II) ?',
  texte: 'Inès a le pigment sec. « Tu veux contrôler la qualité : on dose le cobalt. Quelle méthode ? »',
  choix: [
    { t: 'Dissolution acide puis complexométrie à l\'EDTA (≈ 75 min)', run: e => deleguer({ ...e, f: { ...e.f, methodeCo: 'edta' } }, { cle: 'co', tech: 'ines', label: 'Dosage du Co(II) par complexométrie (EDTA)', duree: 75, perso: 10 }), vers: 'labo' },
    { t: 'Dissolution acide puis spectrophotométrie, avec une droite d\'étalonnage (≈ 60 min)', run: e => deleguer({ ...e, f: { ...e.f, methodeCo: 'uv' } }, { cle: 'co', tech: 'ines', label: 'Dosage du Co(II) par spectrophotométrie', duree: 60, perso: 10 }), vers: 'labo' },
    { t: 'Gravimétrie : on pèse le cobalt précipité (≈ 3 h)', run: e => deleguer({ ...e, f: { ...e.f, methodeCo: 'gravi' } }, { cle: 'co', tech: 'ines', label: 'Dosage du Co(II) par gravimétrie', duree: 180, perso: 20 }), vers: 'labo' },
  ] });
add('res_co', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Résultat : cobalt dans le pigment',
  texte: e => `« Voilà. Teneur en cobalt : w(Co) = 30,4 % en masse${e.f.methodeCo === 'uv' ? ' (incertitude ±3 % de la valeur, liée à l\'étalonnage)' : e.f.methodeCo === 'gravi' ? ' (méthode longue, mais très juste)' : ''}. »\nIl faut en déduire la formule du pigment. Masses molaires : Co 58,93 ; NH₄ 18,04 ; PO₄ 94,97 ; H₂O 18,02 g/mol.\nCalcule w(Co) pour chaque candidat et compare à 30,4 %.`,
  choix: [
    { t: 'Co₃(PO₄)₂', vers: 'pigNon', f: { pigTest: 'a' } },
    { t: 'NH₄CoPO₄·H₂O', vers: 'pigOui', f: { pigTest: 'b' } },
    { t: 'Co₃(PO₄)₂·8 H₂O', vers: 'pigNon', f: { pigTest: 'c' } },
  ] });
add('pigNon', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Ça ne colle pas',
  texte: e => `Pour ${e.f.pigTest === 'a' ? 'Co₃(PO₄)₂ : M = 366,7 g/mol, donc w(Co) = 48,2 %' : 'Co₃(PO₄)₂·8 H₂O : M = 510,9 g/mol, donc w(Co) = 34,6 %'}. La mesure donne 30,4 % : trop loin. Reprends ton calcul avec les autres candidats.`,
  choix: [{ t: 'Reprendre', duree: 5, run: e => nota({ ...e, f: { ...e.f, pigAide: true } }, ''), vers: 'res_co' }] });
add('pigOui', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'La formule du pigment',
  texte: 'NH₄CoPO₄·H₂O : M = 189,96 g/mol, donc w(Co) = 31,0 %. La mesure (30,4 %) correspond à une pureté d\'environ 98 % : le pigment contient un peu d\'eau en excès ou d\'impuretés. « Beau travail, ton pigment est de bonne qualité. »',
  choix: [{ t: 'Noter et revenir à la paillasse', f: { pigFormule: true }, note: 'Pigment : w(Co) = 30,4 %, formule probable NH₄CoPO₄·H₂O (31,0 % théorique), pureté ≈ 98 %.', vers: 'labo' }] });

add('gammeChoix', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Quelle gamme de couleurs ?',
  texte: '« Pour la gamme colorée, tu me donnes les teneurs en pigment à préparer. Je mesure L*a*b* sur des films de 100 µm humide, sur fond blanc. »',
  choix: [
    { t: '0,5 / 1 / 2 / 4 % massique de pigment', run: e => deleguer({ ...e, f: { ...e.f, gamme: 'ok' } }, { cle: 'gamme', tech: 'lucas', label: 'Gamme colorée (0,5 à 4 %)', duree: 60, perso: 15 }), vers: 'labo' },
    { t: '5 / 10 / 20 % massique de pigment, pour de belles couleurs bien saturées', run: e => deleguer({ ...e, f: { ...e.f, gamme: 'cher' } }, { cle: 'gamme', tech: 'lucas', label: 'Gamme colorée (5 à 20 %)', duree: 60, perso: 15 }), vers: 'labo' },
    { t: 'Un seul mélange à 2 %, ça suffit pour voir la couleur', run: e => deleguer({ ...e, f: { ...e.f, gamme: 'un' } }, { cle: 'gamme', tech: 'lucas', label: 'Un mélange à 2 %', duree: 30, perso: 10 }), vers: 'labo' },
  ] });
const aStar = c => 22 * (1 - Math.exp(-c / 2.2));
const ligneLab = c => `${nf(c, c < 1 ? 1 : 0)} % : a* = ${nf(aStar(c))} ; b* = ${nf(-0.72 * aStar(c))}`;
add('res_gamme', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : gamme colorée',
  texte: e => e.f.gamme === 'ok' ? `Lucas t'a préparé le tableau (valeurs de scénario) :\n${[0.5, 1, 2, 4].map(ligneLab).join('\n')}\nLes points a* = f(b*) s'alignent : tu as une vraie gamme, exploitable, avec peu de pigment. Tu peux tracer le graphique b* en fonction de a*, chaque point indexé par son pourcentage de pigment.`
    : e.f.gamme === 'cher' ? `Lucas a mesuré :\n${[5, 10, 20].map(ligneLab).join('\n')}\nLes points sont presque confondus : au-delà de quelques pourcents la couleur sature. Tu as dépensé beaucoup de pigment cher (et cancérogène) pour une gamme sans intérêt : il fallait descendre sous 5 %.`
    : `Lucas a mesuré un seul mélange : ${ligneLab(2)}.\nTu as une couleur, pas une gamme : impossible de tracer l'évolution de a* et b* avec la teneur en pigment.`,
  choix: [{ t: 'Noter et revenir à la paillasse', note: 'Gamme colorée mesurée (L*a*b*).', vers: 'labo' }] });

// ───────────── Résultats d'analyses de la peinture ─────────────
add('res_es', { lieu: 'Laboratoire d\'analyses', pnj: 'ines', titre: 'Résultat : extrait sec et densité',
  texte: e => { const p = prop(e), ok = e.f.regle === 'ok';
    return `Inès : « Extrait sec ${nf(p.ES)} %, densité ${nf(p.densite, 3)}. »\nD'après la formule : CPV = ${nf(p.CPV)} %, CPVC = ${nf(p.CPVC)} %, λ = ${nf(p.lambda, 2)}, COV = ${nf(p.COV)} g/L.\n${ok ? `Même extrait sec que la référence (51,8 %) : le cahier des charges (ES > 50 %, λ ≥ 0,8, COV < 30 g/L) est respecté.` : `Attention : ES = ${nf(p.ES)} % et CPV = ${nf(p.CPV)} % ne correspondent pas à la référence (ES 51,8 %, CPV 42,9 %). En remplaçant simplement 100 g par 100 g, tu as changé la quantité de polymère : la formule ne respecte pas la contrainte « mêmes ES, CPV, CPVC ».`}`; },
  choix: e => e.f.regle === 'ok' ? [{ ...retourLabo, f: { mes_es: true }, note: 'ES et densité mesurées : conformes.' }]
    : [{ t: 'Reprendre le calcul et refaire la peinture (la fabrication ne vaut plus rien)', f: { refait: true, mes_es: false }, duree: 15, note: 'Formule corrigée : la première version (100 g de Vinnapas) avait un ES et une CPV différents de la référence.', run: e2 => ({ ...e2, cmd: Object.fromEntries(Object.entries(e2.cmd).filter(([k]) => k === 'pig' || k === 'co' || k === 'gamme')), f: { ...e2.f, fabrique: false, mes_rheo: false, mes_masq: false, mes_tmff: false, mes_cout: false } }), vers: 'calcMasse' },
      { t: 'Je garde cette formule telle quelle', f: { mes_es: true }, note: 'ES mesuré différent de la référence : formule conservée en l\'état.', vers: 'labo' }] });
add('res_rheo', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : rhéologie',
  texte: e => e.f.coadis < 0.4 ? 'Lucas : « Viscosité élevée à bas gradient et nette thixotropie : il reste des amas mal dispersés. On est loin du comportement rhéofluidifiant à faible thixotropie demandé. »\nLe dispersant n\'a pas été corrigé : la cause des amas est restée.'
    : 'Lucas : « Courbes de viscosité en fonction du gradient de cisaillement : comportement rhéofluidifiant, boucle de thixotropie très faible. Proche de la référence Orgal. »',
  choix: [{ ...retourLabo, run: e => ({ ...e, f: { ...e.f, mes_rheo: true, rheoKo: e.f.coadis < 0.4 } }), note: 'Rhéologie mesurée.' }] });
add('res_masq', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : pouvoir masquant',
  texte: e => e.f.coadis < 0.4 ? 'Lucas : « Pouvoir masquant 6,8 m²/L, en dessous des 7,0 attendus. Les amas de TiO₂ mal dispersés diffusent moins bien la lumière. »'
    : 'Lucas : « Rapport de contraste à 98 % pour un rendement de 7,6 m²/L : pouvoir masquant de 7,6 m²/L, au-dessus du minimum de 7,0 (référence Orgal : 7,4). »',
  choix: [{ ...retourLabo, run: e => ({ ...e, f: { ...e.f, mes_masq: true } }), note: 'Pouvoir masquant mesuré.' }] });
add('res_tmff', { lieu: 'Atelier d\'application', pnj: 'lucas', titre: 'Résultat : TMFF',
  texte: e => (e.f.dpnb ?? 5) === 0 ? 'Lucas : « Sur le banc à gradient de température : film continu dès 3 °C environ, sans coalescent (fiche : 2 °C). En dessous, le film craquelle et reste poudreux. Pour du chantier en hiver, il faudrait la mentionner. »'
    : 'Lucas : « Avec ce coalescent la TMFF passe sous la limite basse du banc (0 °C). Mais c\'était déjà bas sans lui : il est probablement inutile pour la Vinnapas, et il coûte des COV. »',
  choix: [{ ...retourLabo, f: { mes_tmff: true }, note: 'TMFF mesurée.' }] });
add('res_cout', { lieu: 'Service achats', pnj: 'perrin', titre: 'Devis de la Vinnapas',
  texte: 'M. Perrin : « La Vinnapas EP 3360 est à 3,60 €/kg en palette. Les autres prix sont ceux du Document 1. À toi de calculer le coût matières premières de ta formule. »',
  calcul: { q: 'Coût matières premières de ta formule (€ par kg de peinture)', unite: '€/kg', vrai: e => coutKg(formule(e)), tol: 0.06,
    indice: 'Coût total = Σ (masse × prix par gramme) ; divise par la masse totale en kg. Attention aux unités de prix : €/L et densités pour les additifs liquides.',
    ok: { f: { mes_cout: true, coutOk: true }, vers: 'labo', note: 'Coût matières premières calculé : conforme au cahier des charges (< 4,5 €/kg).' },
    ko: { f: { mes_cout: true }, vers: 'labo', duree: 10, note: 'Coût matières premières calculé avec l\'aide de M. Perrin.' } } });

// ───────────── Le hub : la paillasse ─────────────
export const statutCmd = e => Object.entries(e.cmd).map(([k, c]) => ({ cle: k, label: labelDe(k) || 'Synthèse du pigment (séchage)', pret: c.pret, etat: c.lu ? 'lu' : c.pret > e.t ? 'cours' : 'pret' }));
const ligneAttente = e => Object.entries(e.cmd).filter(([, c]) => !c.lu && c.pret > e.t).map(([k, c]) => `⏳ ${labelDe(k) || 'Pigment : séchage en cours'} : prêt vers ${hhmm(c.pret)}`);
add('labo', { lieu: 'Paillasse et laboratoire', pnj: 'moi', titre: 'La journée avance',
  texte: e => `Il est ${hhmm(e.t)}.${e.t >= T_RAPPORT ? '\nMme Dubreuil passe la tête : « J\'attends ton rapport, le délai est dépassé. »' : e.t >= T_CLIENT - 45 ? '\nL\'appel client approche (15 h).' : ''}\n${ligneAttente(e).join('\n')}`.trim(),
  choix: e => {
    const L = [];
    if (e.f.fabrique) for (const A of ANALYSES) {
      const c = e.cmd[A.cle];
      if (c && !c.lu && c.pret <= e.t) L.push({ t: `📄 Lire le résultat : ${A.label}`, run: n => ({ ...n, cmd: { ...n.cmd, [A.cle]: { ...c, lu: true } } }), vers: `res_${A.cle}` });
      else if (!c) { const occ = e.libre[A.tech] > e.t && e.f.plan !== 'solo';
        L.push({ t: `Demander à ${PNJ[A.tech].nom} : ${A.label}`, d: e.f.plan === 'solo' ? `${A.duree} min de ton temps` : `${A.perso} min pour toi, résultat ${occ ? 'après ' + hhmm(e.libre[A.tech]) + ' (' + PNJ[A.tech].nom + ' est occupé·e)' : 'dans ' + A.duree + ' min'}`, run: n => deleguer(n, A), vers: 'labo' }); }
    }
    if (e.f.fabrique && !e.f.etuve) L.push({ t: 'Mettre un échantillon à l\'étuve à 50 °C (vieillissement accéléré)', d: '10 min ; résultat dans 7 jours', duree: 10, f: { etuve: true }, note: 'Échantillon mis à l\'étuve à 50 °C pour le test de stabilité (résultat dans 7 jours).', vers: 'labo' });
    if (!e.f.pigSynth) L.push({ t: 'Préparer la synthèse du violet de cobalt', vers: 'pigProto' });
    const cp = e.cmd.pig;
    if (cp && !cp.lu && cp.pret <= e.t) L.push({ t: 'Récupérer le pigment sec (filtré, rincé, séché)', run: n => nota({ ...n, cmd: { ...n.cmd, pig: { ...cp, lu: true } }, f: { ...n.f, pigPret: true } }, 'Pigment violet de cobalt récupéré sec.'), vers: 'labo' });
    if (e.f.pigPret) {
      if (!e.cmd.co) L.push({ t: 'Demander à Inès de doser le Co(II) dans le pigment', vers: 'methodeCo' });
      else if (!e.cmd.co.lu && e.cmd.co.pret <= e.t) L.push({ t: '📄 Lire le résultat : dosage du Co(II)', run: n => ({ ...n, cmd: { ...n.cmd, co: { ...n.cmd.co, lu: true } } }), vers: 'res_co' });
      if (e.f.fabrique && !e.cmd.gamme) L.push({ t: 'Demander à Lucas une gamme colorée (mesures L*a*b*)', vers: 'gammeChoix' });
      else if (e.cmd.gamme && !e.cmd.gamme.lu && e.cmd.gamme.pret <= e.t) L.push({ t: '📄 Lire le résultat : gamme colorée', run: n => ({ ...n, cmd: { ...n.cmd, gamme: { ...n.cmd.gamme, lu: true } } }), vers: 'res_gamme' });
    }
    L.push({ t: 'Attendre 30 minutes (café, rangement, bibliographie)', duree: 30, vers: 'labo' });
    L.push({ t: 'Rédiger le rapport maintenant', d: '45 min ; la journée se termine avec le rapport', duree: 45, vers: 'rapport' });
    return L;
  } });

// ───────────── Appel client ─────────────
add('client', { lieu: 'Salle de réunion (visio)', pnj: 'aubry', titre: 'Appel avec la cliente, 15 h',
  texte: e => `Il est ${hhmm(e.t)}. Mme Aubry : « Alors, on peut remplacer l'Orgal par la Vinnapas ? C'est pour notre gamme de peintures de façades et de terrasses, vous savez. »\n${e.f.alerte === true ? 'Mme Dubreuil lui a déjà expliqué que la Vinnapas est une résine pour l\'intérieur. Mme Aubry semble ennuyée mais ouverte.' : ''}`,
  choix: e => e.f.alerte === true ? [{ t: 'Je confirme : pour l\'intérieur oui, pour l\'extérieur on garde l\'Orgal', duree: 20, f: { clientFait: true, clientOk: true }, note: 'Appel client : usage de la Vinnapas limité à l\'intérieur, confirmé à la cliente.', vers: 'labo' }]
    : [{ t: 'Je lui précise que la fiche de la Vinnapas ne la recommande que pour l\'intérieur', duree: 20, f: { clientFait: true, clientOk: true, alerte: true, alerteTardive: true }, note: 'Appel client : j\'ai précisé que la Vinnapas est une résine pour l\'intérieur seulement.', vers: 'labo' },
      { t: 'Je réponds que oui, ça devrait aller', duree: 20, f: { clientFait: true, mensonge: true }, note: 'Appel client : réponse positive sans réserve sur l\'usage extérieur.', vers: 'labo' }],
});

// ───────────── Rapport et fins ─────────────
add('rapport', { lieu: 'Bureau', pnj: 'moi', titre: 'Le rapport',
  texte: e => `Tu t'installes pour rédiger. Il est ${hhmm(e.t)}. Le cahier des charges demande une peinture stable 30 mois. Que écris-tu ?`,
  choix: [
    { t: 'Stable 30 mois : tout est conforme', f: { stab: 'promis' }, vers: 'verdict' },
    { t: 'Non démontrable en une journée : un vieillissement accéléré est à suivre', f: { stab: 'honnete' }, vers: 'verdict' },
    { t: 'Je ne parle pas de la stabilité', f: { stab: 'omis' }, vers: 'verdict' },
  ] });
export const QC = ['es', 'rheo', 'masq'];
export function verdict(e) {
  const f = e.f;
  if (f.regle === 'naif') return 'fin_naif';
  if (f.stab === 'promis') return 'fin_promesse';
  if (f.mensonge) return 'fin_cloque';
  if (QC.some(k => !f['mes_' + k])) return 'fin_incomplet';
  if (e.t > T_RAPPORT) return 'fin_retard';
  return bilan(e).filter(b => b.niveau === 'ok').length >= 6 ? 'fin_excellent' : 'fin_bon';
}
add('verdict', { lieu: 'Bureau', pnj: 'dubreuil', titre: 'Mme Dubreuil lit ton rapport', texte: 'Elle lit en silence, puis lève les yeux.', choix: e => [{ t: 'Écouter son verdict', vers: verdict(e) }] });

// ───────────── Bilan par compétence (référentiel du sujet) ─────────────
export function bilan(e) {
  const f = e.f, n = x => x ? 1 : 0;
  const niv = (pts, max) => pts >= max ? 'ok' : pts > 0 ? 'moyen' : 'ko';
  const nbDeleg = Object.keys(e.cmd).filter(k => k !== 'pig').length;
  const pr = [];
  const c14 = n(f.regle === 'ok' && !f.refait) + n(f.dpnb === 0 || f.dpnb === 2) + n(f.pigProto);
  pr.push({ comp: 'C1.4', titre: 'Choisir méthodes et techniques', niveau: niv(c14, 3), texte: `Règle de remplacement de la résine ${f.regle === 'ok' && !f.refait ? 'juste dès le départ' : 'à corriger'} ; coalescent ${f.dpnb === 0 ? 'supprimé à bon escient' : f.dpnb === 2 ? 'réduit' : 'conservé sans justification'} ; pigment ${f.pigProto ? 'synthétisé par une voie adaptée' : 'non abordé'}.` });
  pr.push({ comp: 'C2.1', titre: 'Préparer produits et matériel', niveau: !f.fabrique && !f.rate ? 'nd' : f.rate ? 'moyen' : 'ok', texte: f.rate ? 'Première fabrication ratée : l\'ordre d\'introduction de la fiche n\'avait pas été respecté.' : f.fabrique ? 'Fabrication conforme à la fiche, finesse correcte.' : 'Pas de fabrication réalisée.' });
  const c32 = n(f.alerte === true) * (f.alerteTardive ? 0.5 : 1) + n(f.secu) * (f.secuAlerte ? 0.5 : 1) + n(f.stab === 'honnete');
  pr.push({ comp: 'C3.2', titre: 'Détecter les non-conformités et alerter', niveau: niv(c32, 3), texte: `Incohérence extérieur / intérieur ${f.alerte === true ? (f.alerteTardive ? 'signalée tardivement' : 'signalée tout de suite') : 'non signalée'} ; sécurité cobalt ${f.secu ? (f.secuAlerte ? 'rappelée par Inès' : 'respectée') : 'non traitée'} ; stabilité ${f.stab === 'honnete' ? 'annoncée honnêtement comme non démontrée' : f.stab === 'promis' ? 'garantie sans l\'avoir démontrée' : 'omise'}.` });
  const c41 = n(f.coadis >= 0.4 && f.coadis <= 0.7) + n(f.dpnb === 0 || f.dpnb === 2);
  pr.push({ comp: 'C4.1', titre: 'Modifier, améliorer le protocole', niveau: niv(c41, 2), texte: `Dispersant ${f.coadis >= 0.4 && f.coadis <= 0.7 ? 'corrigé (amas supprimés)' : 'non corrigé'} ; coalescent ${f.dpnb === 0 ? 'supprimé (COV à zéro)' : f.dpnb === 2 ? 'réduit' : 'inchangé'}.` });
  const c61 = n(f.plan !== 'solo') + n(e.t <= T_RAPPORT) + n(f.pigFormule && f.gamme === 'ok');
  pr.push({ comp: 'C6.1', titre: 'Organiser le travail, tenir les délais', niveau: niv(c61, 3), texte: `${f.plan === 'solo' ? 'Tout fait seul·e : trop séquentiel. ' : 'Tâches déléguées en parallèle. '}Rapport ${e.t <= T_RAPPORT ? 'rendu dans les temps' : 'rendu après 16 h 30'} ; pigment et gamme ${f.pigFormule && f.gamme === 'ok' ? 'menés à terme' : 'incomplets'}.` });
  pr.push({ comp: 'C6.3', titre: 'Gérer les produits selon la réglementation', niveau: niv(n(f.secu) + n(f.coutOk), 2), texte: `${f.secu ? 'FDS lue et déchets de cobalt triés. ' : 'Gestion du cobalt (CMR) non maîtrisée. '}${f.coutOk ? 'Coût matières contrôlé (< 4,5 €/kg).' : 'Coût matières non vérifié.'}` });
  pr.push({ comp: 'C6.4', titre: 'Assurer la traçabilité', niveau: f.trace ? 'ok' : 'ko', texte: f.trace ? 'Lot, pesées et observations consignés au fur et à mesure.' : 'Pesées réelles et observations reconstituées de mémoire : traçabilité faible.' });
  pr.push({ comp: 'C7.3', titre: 'Travailler en équipe', niveau: f.plan === 'solo' ? 'ko' : niv(n(nbDeleg >= 2) + n(f.alerte === true), 2), texte: f.plan === 'solo' ? 'Aucune délégation : l\'équipe n\'a pas été sollicitée.' : `${nbDeleg} analyse(s) confiée(s) aux collègues ; ${f.alerte === true ? 'information remontée à la responsable' : 'communication à améliorer'}.` });
  return pr;
}

// ───────────── Les fins ─────────────
const fin = (id, ton, titre, texte) => add(id, { lieu: 'Fin de journée', pnj: 'dubreuil', titre, fin: { ton, titre }, texte, choix: [] });
fin('fin_excellent', 'ok', 'Une journée exemplaire', e => `Il est ${hhmm(e.t)}. Le dossier est complet : formule conforme, contrôles faits, pigment caractérisé, gamme colorée tracée, traçabilité soignée, alertes données au bon moment. Mme Dubreuil sourit : « Voilà comment je veux voir travailler une équipe. On valide le changement de résine pour la gamme intérieure, et on garde l'Orgal pour la façade. »`);
fin('fin_bon', 'ok', 'Mission remplie, avec des progrès à faire', e => `Il est ${hhmm(e.t)}. La nouvelle base respecte l'essentiel du cahier des charges et le rapport est rendu dans les temps. Quelques points auraient pu être mieux conduits (voir le bilan ci-dessous). « C'est solide, dit Mme Dubreuil. Pour la prochaine fois, regarde bien les remarques : elles feront la différence. »`);
fin('fin_retard', 'moyen', 'Rapport remis en retard', e => `Il est ${hhmm(e.t)}. Le travail est bon, mais le rapport arrive après 16 h 30 : la cliente a été rappelée sans les résultats. « Sur le fond, c'est bien, mais en entreprise le délai fait partie du cahier des charges. »`);
fin('fin_incomplet', 'moyen', 'Dossier incomplet', e => `Il est ${hhmm(e.t)}. Il manque des contrôles essentiels (extrait sec, rhéologie, pouvoir masquant) : le rapport ne permet pas de dire si la peinture respecte le cahier des charges. « On ne valide pas une formule sans ces mesures. Il va falloir tout recommencer demain. »`);
fin('fin_naif', 'ko', 'Une formule qui ne respecte pas la contrainte', e => `Il est ${hhmm(e.t)}. Ta formule remplace 100 g d'Orgal par 100 g de Vinnapas : l'extrait sec monte à ${nf(prop(e).ES)} % et la CPV tombe à ${nf(prop(e).CPV)} %. La contrainte « mêmes ES, CPV et CPVC » n'est pas respectée. Le rapport est refusé : « On ne peut pas comparer deux peintures dont la composition en polymère a changé. »`);
fin('fin_promesse', 'ko', 'Une promesse qui ne se tient pas', e => `Il est ${hhmm(e.t)}. Ton rapport affirme que la peinture est stable 30 mois. Personne n'a pu le vérifier en une journée. Six mois plus tard, un lot revient du client avec des pots qui ont décanté. « Quand on ne sait pas encore, on l'écrit, dit Mme Dubreuil. Mentir par omission, c'est le pire des défauts dans un laboratoire. »`);
fin('fin_cloque', 'ko', 'La cliente a été mal renseignée', e => `Il est ${hhmm(e.t)}. Tu as laissé entendre à Mme Aubry que la Vinnapas conviendrait aux façades. Elle l'utilise en extérieur. Quelques mois plus tard : cloquage et décollement. Le contrat est suspendu. « Cette résine n'est pas faite pour l'extérieur, c'était écrit sur la fiche, dit Mme Dubreuil. L'alerte, c'était ton rôle. »`);
fin('fin_incident', 'ko', 'Incident de sécurité', () => 'Tu as manipulé le sel de cobalt à l\'air libre et sans les protections adaptées. De la poudre se disperse, Inès déclenche la procédure : évacuation de la paillasse, déclaration d\'incident, nettoyage, retrait de la manipulation. La journée est terminée pour toi. « On ne prend jamais un risque CMR pour gagner une demi-heure. »');
fin('fin_perdue', 'ko', 'La journée est finie, pas le rapport', e => `Il est ${hhmm(Math.max(e.t, T_FIN))}. Le laboratoire ferme et ton rapport n'est pas rendu. La cliente n'a rien reçu. « Il fallait tenir le planning : savoir renoncer à une tâche annexe fait partie du métier. »`);

export const FINS = [
  ['fin_excellent', 'Une journée exemplaire'], ['fin_bon', 'Mission remplie'], ['fin_retard', 'Rapport en retard'], ['fin_incomplet', 'Dossier incomplet'],
  ['fin_naif', 'Formule non conforme'], ['fin_promesse', 'Promesse non tenue'], ['fin_cloque', 'Cliente mal renseignée'], ['fin_incident', 'Incident de sécurité'], ['fin_perdue', 'Journée perdue'],
];
