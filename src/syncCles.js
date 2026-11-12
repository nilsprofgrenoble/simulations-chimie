// ═══════════════════════════════════════════════════════════════════════════
//  LISTE DES EXERCICES VALIDES du classement public (table « cles_valides », supabase/14-classement-durci.sql).
//  Le classement ne compte que les exercices et défis qui existent vraiment sur le site : sinon un élève pourrait gonfler ses étoiles en
//  envoyant au serveur des exercices inventés. La liste se tient à jour toute seule : quand un professeur ouvre « Suivi professeur »,
//  le site ajoute les exercices et défis qui manquent (les élèves n'ont aucun droit sur cette table). Une fois par visite au plus.
//  Sans le script 14, ou pour un compte qui n'est pas professeur, l'appel échoue sans bruit.
// ═══════════════════════════════════════════════════════════════════════════
import { rest, toutLire } from './serveur';

export const FORMAT_CLE = /^[0-9]{1,3}:[A-Za-z0-9._:-]{1,70}$/;     // le même que dans la base
let dejaFait = false;

// Clés à ajouter : celles du site qui ne sont pas encore dans la liste (fonction pure, testée)
export const clesManquantes = (clesDuSite, existantes) => {
  const connues = new Set(existantes);
  return [...new Set(clesDuSite)].filter(c => typeof c === 'string' && FORMAT_CLE.test(c) && !connues.has(c));
};

export async function synchroniserClesValides(clesDuSite) {
  if (dejaFait) return;
  dejaFait = true;
  try {
    const existantes = (await toutLire('cles_valides?select=cle&order=cle')).map(r => r.cle);
    const aAjouter = clesManquantes(clesDuSite, existantes);
    for (let i = 0; i < aAjouter.length; i += 400) {
      await rest('cles_valides', { method: 'POST', corps: aAjouter.slice(i, i + 400).map(cle => ({ cle })), entetes: { Prefer: 'resolution=ignore-duplicates,return=minimal' } });
    }
  } catch { /* script 14 absent, ou compte sans droit : on ne fait rien */ }
}
