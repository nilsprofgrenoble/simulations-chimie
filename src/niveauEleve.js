import { useState, useEffect, useMemo } from "react";
import { rest, useSession } from "./serveur";
import { NIVEAUX_CHAPITRES, chapitreDe } from "./chapitres";
import { niveauxDepuisReussites } from "./niveaux";

// ═══════════════════════════════════════════════════════════════════════════
//  LE NIVEAU D'UN ÉLÈVE (2GT, 1G, TSTL, BTS), pour ne lui proposer que des exercices et défis de son année.
//  On ne le demande pas : on le déduit, dans cet ordre,
//   1. du niveau qu'il a choisi dans « Je m'entraîne » (mémorisé sur l'appareil) ;
//   2. des chapitres en cours de sa classe (choisis par le professeur) ;
//   3. de ce qu'il a déjà réussi (niveau le plus fréquent).
//  Sans aucune de ces informations : null (on ne lui propose alors pas de nouveauté au hasard).
// ═══════════════════════════════════════════════════════════════════════════
const CLES_NIVEAUX = NIVEAUX_CHAPITRES.map(n => n.key);

function niveauChoisi() {
  try {
    const v = JSON.parse(window.localStorage.getItem('entrainement-niveau-v1') || 'null');
    return CLES_NIVEAUX.includes(v) ? v : null;
  } catch { return null; }
}

// Niveaux de l'élève connecté : Set non vide, ou null si on ne sait pas
export function useNiveauxEleve(items, d) {
  const sess = useSession();
  const classeId = sess?.profil?.role === 'eleve' ? sess.profil.classe_id : null;
  const [chapitres, setChapitres] = useState([]);
  useEffect(() => {
    if (!classeId) return undefined;
    let vivant = true;
    rest(`classes?select=chapitres&id=eq.${classeId}`).then(r => { if (vivant) setChapitres(r[0]?.chapitres || []); }).catch(() => {});
    return () => { vivant = false; };
  }, [classeId]);
  const choisi = niveauChoisi();
  return useMemo(() => {
    if (choisi) return new Set([choisi]);
    const deClasse = new Set(chapitres.map(chapitreDe).filter(Boolean).map(c => c.niveau));
    return deClasse.size ? deClasse : niveauxDepuisReussites(items, d);
  }, [choisi, chapitres, items, d]);
}
