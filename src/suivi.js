// ════════════════════════════════════════════════════════════════════════════
//  SUIVI D'ACTIVITÉ D'UN ÉLÈVE CONNECTÉ, sur un exercice d'un atelier « je m'entraîne ».
//  useSuivi(cle, reussi) :
//   • note la réussite sur l'appareil (progression locale, toujours) ;
//   • si un élève est connecté : enregistre sur le serveur le temps actif, le nombre d'essais
//     (clics sur « Corriger »), le nombre de corrections demandées et la réussite.
//  Temps actif = onglet visible ET une action de l'élève (clic, frappe, défilement) dans la dernière minute.
//  Un enseignant ou un visiteur non connecté n'envoie rien.
// ════════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback } from 'react';
import { noterReussite } from './commun';
import { getSession, estEleve, rest, restaurer } from './serveur';

const INACTIVITE_MS = 60_000;     // au-delà, le temps n'est plus compté
const SEUIL_CREATION_S = 10;      // une ligne n'est créée qu'après une action, ou 10 s d'activité

const nouvelEtat = cle => ({ cle, id: null, creation: null, duree: 0, essais: 0, vues: 0, reussi: false, sale: false, dernier: Date.now(), echec: 0 });
const pret = s => s.id != null || s.essais || s.vues || s.reussi || s.duree >= SEUIL_CREATION_S;

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
    if (s.cle === cle && !s.reussi) { s.reussi = true; marquer(); }
  }, [reussi, cle, marquer]);

  return {
    essai: useCallback(() => { e.current.essais += 1; e.current.dernier = Date.now(); marquer(); }, [marquer]),
    vue: useCallback(() => { e.current.vues += 1; e.current.dernier = Date.now(); marquer(); }, [marquer]),
  };
}
