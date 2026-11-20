// Données et utilitaires du montage de la simulation 189 (sans composant React).
import { useEffect, useRef, useState } from 'react';
export const VOL_MOL = { acide: 60.05 / 1.05, eth: 46.07 / 0.789 };   // mL par mol
export const ML_ENTRAINEUR = 60;                                       // mL de cyclohexane (volume indicatif)
export const ML_BALLON = 750;
export const volumeMelange = (nA, nB) => nA * VOL_MOL.acide + nB * VOL_MOL.eth;
const R = 56, CY = 290;
// hauteur (px) de liquide dans une sphère de rayon R et de volume ML_BALLON : V/Vmax = h²(3R − h)/(4R³)
export function hauteurNiveau(V) {
  const f = Math.max(0, Math.min(0.97, V / ML_BALLON)); let a = 0, b = 2 * R;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (m * m * (3 * R - m) / (4 * R ** 3) < f) a = m; else b = m; }
  return (a + b) / 2;
}
export const niveauY = V => CY + R - hauteurNiveau(V);
export const PALIERS_CHAUFFE = [20, 30, 45, 60, 75];

const reduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function useAnime(cible) {
  const [v, setV] = useState(cible), ref = useRef(cible), rm = reduit();
  useEffect(() => {
    if (rm) { ref.current = cible; return undefined; }
    let raf; const t0 = performance.now(), v0 = ref.current, d = Math.min(1800, 500 + Math.abs(cible - v0) * 5);
    const f = now => { const k = Math.min(1, (now - t0) / d), e = 1 - (1 - k) ** 3; ref.current = v0 + (cible - v0) * e; setV(ref.current); if (k < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [cible, rm]);
  return rm ? cible : v;
}
// gouttes de l'ampoule : 'eth' (éthanol) ou 'cat' (acide sulfurique), pendant 1,8 s
export function useGouttes(initial = null) {
  const [g, setG] = useState(initial), tm = useRef(0);
  useEffect(() => { if (initial) tm.current = setTimeout(() => setG(null), 1800); return () => clearTimeout(tm.current); }, [initial]);
  const lancer = type => { setG(type); clearTimeout(tm.current); tm.current = setTimeout(() => setG(null), 1800); };
  return [g, lancer];
}

export const LEGENDE = ['réfrigérant vertical, ouvert à l’air en haut (eau froide : entrée en bas, sortie en haut)', 'pince fixée sur le col du ballon', 'potence', 'ballon à fond rond : mélange et grains de pierre ponce (niveau à l’échelle)', 'chauffe-ballon avec bouton de puissance', 'support élévateur', 'ampoule de coulée (réactif ajouté goutte à goutte)'];
export const LEGENDE_DS = { 8: 'bras latéral : les vapeurs montent par lui, le trop-plein de solvant y retombe vers le ballon', 9: 'piège de Dean-Stark : tube gradué (graduations en mL)', 10: 'cyclohexane (entraîneur), miscible au contenu du ballon (teinte jaune pâle) ; dans le tube, moins dense que l’eau, il surnage et déborde vers le ballon ; l’eau reste au fond', 11: 'robinet de vidange du piège' };

// Textes d'état (sans aucune valeur de rendement)
export const texteEtat = (T, ds = false) => T < 75 ? 'Le mélange est chaud mais ne bout pas : pas de reflux, aucune vapeur ne monte dans le réfrigérant.'
  : ds ? 'Ébullition : les vapeurs montent par le bras latéral, se condensent dans le réfrigérant et tombent dans le piège gradué ; l’eau, plus dense, se rassemble au fond, le cyclohexane en excès déborde vers le ballon.'
    : 'Reflux : les vapeurs se condensent en continu dans le réfrigérant et retombent dans le ballon.';
export const NOTE_REFLUX = 'À reflux, la température est limitée par l’ébullition du mélange (vers 75 à 85 °C à la pression atmosphérique) : on ne peut pas chauffer plus. Le sommet du réfrigérant reste ouvert à l’air : jamais de montage fermé chauffé.';
export const NOTE_DS = 'Avec un solvant entraîneur non miscible à l’eau, l’eau formée est retirée du ballon au fur et à mesure (on admet ici que l’élimination est totale et immédiate).';

export const NOTE_EAU = 'Le niveau du ballon ne baisse pas quand l’eau est retirée (volume constant : hypothèse du modèle) ; l’eau recueillie affichée dans le piège est celle de l’essai de 3 h.';
export const MSG_RETOUR = 'Sous 75 °C le montage de Dean-Stark ne fonctionne plus : retour au reflux simple.';
