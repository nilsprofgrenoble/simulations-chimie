// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS PAR COMPÉTENCE : fonctions communes (sans React) à tous les ateliers de remédiation (REA, VAL, puis ANA et S'APP).
//  Un « item » = { id, cle, type, titre, detail, niveaux: ['1G'], chapitres: ['1g-champ'], dif? }.
//  Un « type » = { id, nom, but, filtre?: 'niveau', difficulte?: { 1: libellé, … } }.
//  Source des niveaux et des chapitres : src/chapitres.js (champ « domaine » de chaque exercice ou famille d'exercices).
// ═══════════════════════════════════════════════════════════════════════════
import { CHAPITRES, NIVEAUX_CHAPITRES } from './chapitres.js';

// Niveaux et chapitres d'un domaine du programme : { niveaux, chapitres }
export function rattachement(domaine) {
  const chs = domaine ? CHAPITRES.filter(c => c.domaines.includes(domaine)) : [];
  return { niveaux: [...new Set(chs.map(c => c.niveau))], chapitres: chs.map(c => c.id) };
}

// Enseignements d'un niveau, quand le niveau en compte plusieurs (TSTL : PCM et les trois parties de SPCL). Clé = valeur du paramètre d'adresse « ens ».
export const ENSEIGNEMENTS = {
  TSTL: [
    { key: 'pcm', label: 'PCM', rubrique: 'PCM' },
    { key: 'sp', label: 'SPCL · Systèmes et procédés', rubrique: 'SPCL · Systèmes et procédés' },
    { key: 'ondes', label: 'SPCL · Ondes', rubrique: 'SPCL · Ondes' },
    { key: 'cdd', label: 'SPCL · Chimie et développement durable', rubrique: 'SPCL · Chimie et développement durable' },
  ],
};
// Clé de l'enseignement d'un chapitre ('' si son niveau n'en distingue pas)
export const enseignementDe = chap => (ENSEIGNEMENTS[chap?.niveau] || []).find(e => e.rubrique === chap.rubrique)?.key || '';
// Chapitres d'un niveau, limités à un enseignement s'il est donné
export const chapitresDe = (niv, ens) => CHAPITRES.filter(c => c.niveau === niv && (!ens || enseignementDe(c) === ens));
// Nom d'un chapitre sans son émoji de tête (certains appareils les affichent comme des cases vides)
export const nomChapitre = c => c.label.replace(/^[^\p{L}\p{N}]+/u, '');

export const itemsDuType = (items, type) => items.filter(i => i.type === type);
export const niveauxDuType = (items, type) => NIVEAUX_CHAPITRES.map(n => ({ ...n, n: itemsDuType(items, type).filter(i => i.niveaux.includes(n.key)).length })).filter(n => n.n > 0);
// Chapitres d'un niveau qui contiennent des exercices du type, dans l'ordre du programme : [{ chap, n }]
export const chapitresDuNiveauType = (items, type, niv, ens) => chapitresDe(niv, ens)
  .map(c => ({ chap: c, n: itemsDuType(items, type).filter(i => i.chapitres.includes(c.id)).length })).filter(x => x.n > 0);
// Exercices d'une sélection { type, niv, ch, dif } (tout niveau si niv vide, tout chapitre si ch vide, toute difficulté si dif vide)
export function filtrer(items, { type, niv, ens, ch, dif }) {
  const chs = niv && ens ? chapitresDe(niv, ens).map(c => c.id) : null;   // chapitres de l'enseignement choisi
  return itemsDuType(items, type).filter(i => (!niv || i.niveaux.includes(niv)) && (!chs || i.chapitres.some(c => chs.includes(c)))
    && (!ch || i.chapitres.includes(ch)) && (!dif || String(i.dif) === String(dif)));
}
// Enseignements d'un niveau qui contiennent des exercices du type : [{ ...enseignement, n }]
export const enseignementsDuNiveauType = (items, type, niv) => (ENSEIGNEMENTS[niv] || [])
  .map(e => ({ ...e, n: filtrer(items, { type, niv, ens: e.key }).length })).filter(e => e.n > 0);
// Difficultés présentes dans les exercices d'une sélection (sans tenir compte de la difficulté déjà choisie) : [{ dif, n }]
export function difficultesDuType(items, sel, type) {
  const base = filtrer(items, { type: sel.type, niv: sel.niv, ens: sel.ens, ch: sel.ch });
  return Object.keys(type.difficulte || {}).map(d => ({ dif: d, n: base.filter(i => String(i.dif) === d).length }));
}

// Sélection valide : un type connu, un chapitre qui existe et qui appartient au niveau choisi, une difficulté connue.
// Une arrivée directe sur un exercice (lien, devoir, page d'un chapitre) reconstitue le fil d'Ariane.
export function sanitiser(s, items, types) {
  const type = types.some(t => t.id === s.type) ? s.type : '';
  const def = types.find(t => t.id === type);
  const ch = CHAPITRES.find(c => c.id === s.ch);
  const niv = def && def.filtre ? s.niv : '';
  const ensOk = niv && (ENSEIGNEMENTS[niv] || []).some(e => e.key === s.ens) ? s.ens : '';
  const chOk = ch && niv && ch.niveau === niv && (!ensOk || enseignementDe(ch) === ensOk) ? ch.id : '';
  const dif = def && def.difficulte && def.difficulte[s.dif] ? String(s.dif) : '';
  const it = items.find(i => i.id === s.ex);
  if (it) {
    const filtre = types.find(t => t.id === it.type).filtre;
    const c = it.chapitres.includes(chOk) ? CHAPITRES.find(x => x.id === chOk) : CHAPITRES.find(x => it.chapitres.includes(x.id));
    return { type: it.type, niv: filtre && c ? c.niveau : '', ens: filtre && c ? enseignementDe(c) : '', ch: filtre && c ? c.id : '', dif: '', ex: it.id };
  }
  return { type, niv, ens: ensOk, ch: chOk, dif, ex: '' };
}
