// ════════════════════════════════════════════════════════════════════════════
//  SUIVI D'ACTIVITÉ D'UN ÉLÈVE CONNECTÉ, sur un exercice d'un atelier « je m'entraîne ».
//  useSuivi(cle, reussi) :
//   • note la réussite sur l'appareil (progression locale, toujours) ;
//   • si un élève est connecté : enregistre sur le serveur le temps actif, le nombre d'essais
//     (clics sur « Corriger »), le nombre de corrections demandées et la réussite.
//  Temps actif = onglet visible ET une action de l'élève (clic, frappe, défilement) dans la dernière minute.
//  Un enseignant ou un visiteur non connecté n'envoie rien.
// ════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { noterReussite } from './commun';
import { annoncerReussite, etoilesReussite } from './carnet';
import { getSession, estEleve, rest, restaurer } from './serveur';

const INACTIVITE_MS = 60_000;     // au-delà, le temps n'est plus compté
const SEUIL_CREATION_S = 10;      // une ligne n'est créée qu'après une action, ou 10 s d'activité

const nouvelEtat = cle => ({ cle, id: null, creation: null, duree: 0, essais: 0, vues: 0, reussi: false, sale: false, dernier: Date.now(), echec: 0 });
const pret = s => s.id != null || s.essais || s.vues || s.reussi || s.duree >= SEUIL_CREATION_S;

// Date de la dernière réussite de chaque exercice ou défi (sur l'appareil) : la mission Kepler s'en sert pour ne compter que les réussites obtenues pendant la partie.
export const CLE_HORODATAGE = 'defi-horodatage-v1';
function horodaterReussite(cle) {
  try {
    const t = JSON.parse(window.localStorage.getItem(CLE_HORODATAGE) || '{}');
    t[cle] = Date.now();
    window.localStorage.setItem(CLE_HORODATAGE, JSON.stringify(t));
  } catch { /* stockage indisponible : la mission ne pourra pas voir la réussite */ }
}

export function useSuivi(cle, reussi) {
  const e = useRef(null);                      // état de l'exercice courant ; remplacé (et non modifié) quand on change d'exercice
  if (e.current == null) e.current = nouvelEtat(cle);

  // Envoi : crée la ligne au premier envoi, puis la met à jour avec les valeurs cumulées (idempotent)
  const envoyer = useCallback(async (fin = false, etat = null) => {
    const s = etat || e.current;
    const sess = getSession();
    if (!estEleve(sess) || !s.sale) return;
    if (s.creation) { try { await s.creation; } catch { /* réessayé plus tard */ } }
    if (!s.sale) return;
    s.sale = false;
    const valeurs = { duree_s: Math.min(s.duree, 86400), essais: s.essais, corrections_vues: s.vues, reussi: s.reussi };
    try {
      if (s.id == null) {
        if (!s.creation) {
          s.creation = rest('activites?select=id', { method: 'POST', corps: { cle: s.cle, ...valeurs }, entetes: { Prefer: 'return=representation' }, keepalive: fin })
            .then(r => { s.id = r[0].id; }).finally(() => { s.creation = null; });
        }
        await s.creation;
      } else {
        await rest(`activites?id=eq.${s.id}`, { method: 'PATCH', corps: { ...valeurs, maj: new Date().toISOString() }, keepalive: fin });
      }
      s.echec = 0;
    } catch (err) {
      s.sale = true; s.echec += 1;                   // on réessaiera au prochain tick
      if (err.statut === 401) restaurer();
    }
  }, []);

  const marquer = useCallback(() => {
    const s = e.current;
    s.sale = true;
    if (pret(s)) envoyer();
  }, [envoyer]);

  // Changement d'exercice : on envoie ce qui reste de l'ancien, puis on repart de zéro
  useEffect(() => {
    if (e.current.cle !== cle) {
      const ancien = e.current;
      e.current = nouvelEtat(cle);
      envoyer(true, ancien);
    }
  }, [cle, envoyer]);

  // Horloge du temps actif + envoi toutes les 30 s
  useEffect(() => {
    const action = () => { e.current.dernier = Date.now(); };
    const evts = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'];
    evts.forEach(n => window.addEventListener(n, action, { passive: true }));
    let tic = 0;
    const horloge = setInterval(() => {
      const s = e.current;
      if (document.visibilityState === 'visible' && Date.now() - s.dernier < INACTIVITE_MS && estEleve(getSession())) {
        s.duree += 1; s.sale = true;
      }
      tic += 1;
      if (tic % 30 === 0 || (s.sale && s.echec && tic % 10 === 0)) {
        if (pret(s)) envoyer();
      }
    }, 1000);
    const sortie = () => { if (document.visibilityState === 'hidden') envoyer(true); };
    const fermeture = () => envoyer(true);
    document.addEventListener('visibilitychange', sortie);
    window.addEventListener('pagehide', fermeture);
    return () => {
      clearInterval(horloge);
      evts.forEach(n => window.removeEventListener(n, action));
      document.removeEventListener('visibilitychange', sortie);
      window.removeEventListener('pagehide', fermeture);
      envoyer(true);
    };
  }, [envoyer]);

  // Réussite : progression locale + serveur
  useEffect(() => {
    if (!reussi) return;
    noterReussite(cle);
    const s = e.current;
    if (s.cle === cle && !s.reussi) { s.reussi = true; horodaterReussite(cle); annoncerReussite({ cle, etoiles: etoilesReussite(s.essais, s.vues) }); marquer(); }
  }, [reussi, cle, marquer]);

  return {
    essai: useCallback(() => { e.current.essais += 1; e.current.dernier = Date.now(); marquer(); }, [marquer]),
    vue: useCallback(() => { e.current.vues += 1; e.current.dernier = Date.now(); marquer(); }, [marquer]),
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  TEMPS PASSÉ SUR LES SIMULATIONS, par simulation et par mode (guidé / exploration / défi).
//  Chaque simulation signale son mode avec useSignalerMode(mode) ; <SuiviTemps simId> (dans App)
//  mesure le temps actif avec les mêmes règles que les exercices et l'enregistre sous la clé
//  « sim:<id>:<mode> » (durée seulement : ni essais ni réussite).
// ════════════════════════════════════════════════════════════════════════════
let modeSim = null;
const abonnes = new Set();
const fixerMode = m => { if (m !== modeSim) { modeSim = m; abonnes.forEach(f => f()); } };
export const nomsSim = {};     // id → titre, rempli par App (pour l'affichage)

// ── Mode d'ouverture d'une simulation (selon l'historique de l'élève dans ce navigateur) ──
//  • première visite, ou parcours guidé commencé mais pas terminé → parcours guidé (on reprend à l'étape où l'élève s'était arrêté) ;
//  • parcours guidé terminé (drapeau « fini » posé par CarteParcours à la dernière étape) → exploration libre ;
//  • un lien de devoir vers un défi demande explicitement l'exploration (« mode-demande », valable 5 secondes) → exploration libre.
//  L'état du parcours est celui que la simulation sauvegarde déjà (useEtatPersistant, clé « …-guide-… »).
export function modeOuverture(cleGuide) {
  const r = choisirMode(cleGuide);
  window.__modeOuverture = r;   // lu par ModeParDefaut : si la simulation s'ouvre déjà sur l'exploration, on ne la bascule pas sur le parcours guidé
  return r;
}
function choisirMode(cleGuide) {
  try {
    const d = JSON.parse(window.sessionStorage.getItem('mode-demande') || 'null');
    if (d && (d.mode === 'explore' || d.mode === 'defi') && Date.now() - d.t < 5000) return d.mode;   // « defi » : demandé par la mission Kepler (EscapeKepler)
  } catch { /* pas de demande */ }
  try {
    const brut = window.localStorage.getItem(cleGuide);
    if (brut && JSON.parse(brut)?.fini) return 'explore';
  } catch { /* état illisible : on ouvre le parcours */ }
  return 'guide';
}

export function useSignalerMode(mode) {
  const m = mode === 'exercice' ? 'defi' : (mode || 'explore');
  useEffect(() => { fixerMode(m); return () => fixerMode(null); }, [m]);
}

export function SuiviTemps({ simId }) {
  const mode = useSyncExternalStore(f => { abonnes.add(f); return () => abonnes.delete(f); }, () => modeSim);
  useSuivi(`sim:${simId}:${mode || 'libre'}`, false);
  return null;
}

export const estSimulation = cle => typeof cle === 'string' && cle.startsWith('sim:');
export const MODES = [['guide', 'Guidé'], ['explore', 'Exploration libre'], ['defi', 'Défi']];
// (une simulation sans choix de mode compte comme exploration libre)
// lignes de type « sim:… » → [{ id, nom, total, guide, explore, defi, libre }] trié par temps décroissant
export function tempsParSimulation(lignes) {
  const m = new Map();
  for (const l of lignes) {
    if (!estSimulation(l.cle)) continue;
    const [, id, mode] = l.cle.split(':');
    const a = m.get(id) || { id, nom: nomsSim[id] || `Simulation ${id}`, total: 0, guide: 0, explore: 0, defi: 0 };
    a[mode === 'libre' || !(mode in a) ? 'explore' : mode] += l.duree_s; a.total += l.duree_s;
    m.set(id, a);
  }
  return [...m.values()].sort((x, y) => y.total - x.total);
}

// ════════════════════════════════════════════════════════════════════════════
//  DÉFIS DES SIMULATIONS
//  Une simulation déclare ses défis avec declarerDefis(id, [[nom, titre], …]). Chaque défi est suivi comme un
//  exercice (useSuivi, clé « <id>:defi.<nom> ») : temps actif, essais (clics sur « Vérifier »), solutions vues, réussite.
//  Les pages « Mon compte » et « Suivi professeur » les affichent à part des exercices « je m'entraîne ».
// ════════════════════════════════════════════════════════════════════════════
export const DEFIS = [];
export function declarerDefis(simId, liste) {
  liste.forEach(([nom, titre]) => {
    const cle = `${simId}:defi.${nom}`;
    if (!DEFIS.some(d => d.cle === cle)) DEFIS.push({ cle, sim: simId, comp: 'DÉFI', titre });
  });
}
export const estDefi = cle => typeof cle === 'string' && /^[0-9]{1,3}:defi\./.test(cle);
// Libellés des défis : « Nom de la simulation — défi »
export const etiquettesDefis = () => DEFIS.map(d => ({ ...d, titre: `${nomsSim[d.sim] || `Simulation ${d.sim}`} — ${d.titre}` }));

// ── Suivi d'un défi « une question, un bouton Vérifier » ────────────────────────────────────────────────
//  Dans la simulation :  const [sd, noterDefi] = useCompteurDefi();
//                        au clic sur « Vérifier » :  noterDefi(toutEstJuste)
//                        dans le rendu, en mode défi :  <SuiviDefi cle={`${SIM}:defi.principal`} etat={sd} />
//  (et, au niveau du module :  declarerDefis(SIM, [['principal', 'Titre du défi']]) ).
//  Le défi est « réussi » quand une vérification trouve tout juste. Le composant n'existe qu'en mode défi : le temps compté
//  est donc celui passé sur le défi, comme pour les exercices.
export function useCompteurDefi() {
  const [etat, setEtat] = useState({ essais: 0, reussi: false });
  const noter = useCallback(ok => setEtat(x => ({ essais: x.essais + 1, reussi: x.reussi || !!ok })), []);
  return [etat, noter];
}

export function SuiviDefi({ cle, etat }) {
  const s = useSuivi(cle, etat.reussi);
  const deja = useRef(etat.essais);
  useEffect(() => { if (etat.essais > deja.current) s.essai(); deja.current = etat.essais; }, [etat.essais, s]);
  return null;
}

// Défi sans bouton « Vérifier » (critères affichés en direct) : réussi dès que tous les critères sont remplis.
export function SuiviDefiDirect({ cle, reussi }) { useSuivi(cle, reussi); return null; }
