// ════════════════════════════════════════════════════════════════════════════
//  PROGRESSION DES PARCOURS RETROUVÉE SUR N'IMPORTE QUEL APPAREIL
//  Les parcours guidés (et les parties des jeux) gardent leur état dans le navigateur (useEtatPersistant, localStorage).
//  Pour un élève connecté, cet état est aussi copié dans son compte (table « etats_parcours », supabase/12-etats-parcours.sql) :
//  à la connexion, on récupère ce qu'il a fait ailleurs ; à chaque modification, on envoie la copie à jour.
//
//  Hypothèses de travail (explicites) :
//   • seuls les comptes élèves sont synchronisés : un professeur ou un visiteur non connecté reste sur son navigateur ;
//   • en cas de conflit pour un même parcours, la version modifiée en dernier l'emporte (horloge de l'appareil) :
//     c'est un état « courant » (l'étape où l'on s'est arrêté), pas un historique à fusionner ;
//   • les données locales d'un élève ne sont jamais montrées à un autre : si un autre élève se connecte sur le même appareil,
//     les parcours enregistrés sur cet appareil sont effacés avant de charger les siens (ils restent dans le compte du premier) ;
//   • des données locales créées avant la connexion (ou avant cette fonction) sont adoptées par le premier élève qui se connecte ;
//   • si la table n'existe pas encore sur le serveur, ou hors connexion, tout continue de fonctionner en local, sans message.
// ════════════════════════════════════════════════════════════════════════════
import { getSession, estEleve, rest, surSession, avantDeconnexion } from './serveur';

const CLE_MAJ = 'etats-maj-v1';            // { cle: horodatage (ms) de la dernière modification locale ; 0 = clé connue, sans donnée locale }
const CLE_PROPRIO = 'etats-proprietaire-v1';   // identifiant du compte à qui appartiennent les données locales
const TAILLE_MAX = 60000;                  // au-delà (en caractères), un état n'est pas envoyé
const DELAI_ENVOI_MS = 1500;               // les modifications rapprochées sont regroupées en un seul envoi
const RELANCE_MS = 20000;

const lire = (cle, defaut) => { try { const b = window.localStorage.getItem(cle); return b ? JSON.parse(b) : defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { window.localStorage.setItem(cle, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

export const estSynchronisee = cle => typeof cle === 'string' && cle.length > 0 && cle.length <= 120 && !cle.startsWith('bandeau-');

// ── Abonnements : un composant qui affiche l'état d'une clé est prévenu quand le serveur lui apporte une version plus récente ──
const ecouteurs = new Map();
export function surChangementServeur(cle, f) {
  if (!ecouteurs.has(cle)) ecouteurs.set(cle, new Set());
  ecouteurs.get(cle).add(f);
  return () => ecouteurs.get(cle)?.delete(f);
}
const notifier = cle => ecouteurs.get(cle)?.forEach(f => f());

// ── État de la synchronisation ──
let compte = null;         // identifiant du compte dont l'état est chargé (null : pas encore, ou personne)
let pret = false;          // l'état du serveur a été récupéré : on peut envoyer
let indisponible = false;  // la table n'existe pas (404) : on n'essaie plus pendant cette visite
let enCours = null;
let dernierEchec = 0;
let dernierePull = 0;
const file = new Map();    // cle → minuteur d'envoi

// Appelé par useEtatPersistant : la clé existe sur cet appareil ; « avait » = une valeur y était déjà gardée avant ce chargement
export function enregistrer(cle, avait) {
  if (!estSynchronisee(cle)) return;
  const maj = lire(CLE_MAJ, {});
  if (maj[cle] === undefined) { maj[cle] = avait ? 1 : 0; ecrire(CLE_MAJ, maj); }   // donnée d'avant la synchro : plus ancienne que toute version du serveur
}
// Appelé par useEtatPersistant quand l'élève a modifié son état
export function noterModification(cle) {
  if (!estSynchronisee(cle)) return;
  const maj = lire(CLE_MAJ, {});
  maj[cle] = Date.now(); ecrire(CLE_MAJ, maj);
  if (!estEleve(getSession())) return;
  if (!pret) { if (!indisponible && Date.now() - dernierEchec > RELANCE_MS) synchroniser(); return; }
  planifier(cle);
}

function planifier(cle, delai = DELAI_ENVOI_MS) {
  clearTimeout(file.get(cle));
  file.set(cle, setTimeout(() => pousser(cle), delai));
}
async function pousser(cle, fin = false) {
  file.delete(cle);
  if (!pret || indisponible || !estEleve(getSession())) return;
  let brut = null;
  try { brut = window.localStorage.getItem(cle); } catch { /* indisponible */ }
  const t = lire(CLE_MAJ, {})[cle];
  if (brut == null || brut.length > TAILLE_MAX || !(t > 0)) return;
  try {
    await rest('etats_parcours?on_conflict=user_id,cle', { method: 'POST', keepalive: fin,
      corps: { cle, etat: JSON.parse(brut), maj: new Date(t).toISOString() },
      entetes: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  } catch (e) {
    if (e.statut === 404) indisponible = true;
    else if (!fin) planifier(cle, RELANCE_MS);
  }
}
function toutEnvoyer(fin = false) {
  const cles = [...file.keys()];
  cles.forEach(c => clearTimeout(file.get(c)));
  return Promise.all(cles.map(c => pousser(c, fin)));
}

// À la connexion : on ne montre jamais les données locales d'un autre élève, puis on fusionne avec le compte
function reserverAppareil(uid) {
  let proprio = null;
  try { proprio = window.localStorage.getItem(CLE_PROPRIO); } catch { /* indisponible */ }
  if (proprio && proprio !== uid) {
    const cles = Object.keys(lire(CLE_MAJ, {}));
    cles.forEach(c => { try { window.localStorage.removeItem(c); } catch { /* indisponible */ } });
    try { window.localStorage.removeItem(CLE_MAJ); } catch { /* indisponible */ }
    cles.forEach(notifier);
  }
  try { window.localStorage.setItem(CLE_PROPRIO, uid); } catch { /* indisponible */ }
}

async function synchroniser(forcer = false) {
  const s = getSession();
  const uid = estEleve(s) ? s.user?.id : null;
  if (!uid) { compte = null; pret = false; return; }
  if (compte === uid && pret && !forcer) return;
  if (enCours) return enCours;
  enCours = (async () => {
    try {
      reserverAppareil(uid);
      const lignes = await rest('etats_parcours?select=cle,etat,maj');
      const maj = lire(CLE_MAJ, {});
      const serveur = new Map();
      for (const l of lignes || []) {
        if (!estSynchronisee(l.cle)) continue;
        const tS = Date.parse(l.maj) || 0;
        serveur.set(l.cle, tS);
        if (tS > (maj[l.cle] || 0)) {
          try { window.localStorage.setItem(l.cle, JSON.stringify(l.etat)); } catch { continue; }
          maj[l.cle] = tS;
          notifier(l.cle);
        }
      }
      ecrire(CLE_MAJ, maj);
      compte = uid; pret = true; dernierEchec = 0; dernierePull = Date.now();
      // ce que cet appareil a de plus récent que le compte (ou que le compte n'a pas encore) part au serveur
      for (const [cle, t] of Object.entries(maj)) if (t > 0 && t > (serveur.get(cle) ?? -1)) planifier(cle, 300);
    } catch (e) {
      dernierEchec = Date.now();
      if (e.statut === 404) indisponible = true;
    } finally { enCours = null; }
  })();
  return enCours;
}

// Démarrage : au chargement du site, à chaque changement de session, et au retour sur l'onglet
let demarre = false;
export function demarrerSynchro() {
  if (demarre || typeof window === 'undefined') return;
  demarre = true;
  surSession(() => { synchroniser(); });
  synchroniser();
  avantDeconnexion.push(() => toutEnvoyer(false));
  const vider = () => { toutEnvoyer(true); };
  window.addEventListener('pagehide', vider);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') vider(); else if (Date.now() - dernierePull > 60000) synchroniser(true); });
  window.addEventListener('online', () => { synchroniser(); });
}
