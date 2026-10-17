import { rest } from "./serveur";

// Lecture des devoirs d'une classe, côté professeur. Trois cas, sans jamais casser la page :
//   • supabase/07 appliqué : on lit aussi « eleves » (devoirs ciblés)                      → { dispo: true,  cible: true }
//   • seulement supabase/06 : colonne « eleves » absente, on relit sans elle              → { dispo: true,  cible: false }
//   • table « devoirs » absente (06 pas appliqué)                                           → { dispo: false }
export async function lireDevoirs(classeId, limite) {
  const fin = `&classe_id=eq.${classeId}&order=cree_le.desc${limite ? `&limit=${limite}` : ''}`;
  try { return { liste: await rest(`devoirs?select=id,titre,cles,echeance,cree_le,eleves${fin}`), dispo: true, cible: true, erreur: '' }; }
  catch { /* colonne « eleves » absente, ou autre problème : on réessaie sans */ }
  try { return { liste: await rest(`devoirs?select=id,titre,cles,echeance,cree_le${fin}`), dispo: true, cible: false, erreur: '' }; }
  catch (e) { return { liste: [], dispo: false, cible: false, erreur: e.statut === 404 ? '' : e.message }; }
}
