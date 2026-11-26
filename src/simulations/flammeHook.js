// Hooks de la simulation 313 : boucle d'animation (trajet, atome) et tirages au hasard (photons absorbés ; instantanés d'atomes excités).
import { useState, useEffect, useRef } from "react";
import * as M from "./flammeModele";
import { reduitMouvement } from "./hookHorloge";

// p de 0 à 1 en boucle sur `duree` ms tant que `actif` ; `manuel` (nombre) impose p
export function useBoucle(duree, actif) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!actif) return undefined;
    let id, t0 = null, base = 0;
    const f = ts => { if (t0 == null) { t0 = ts; } setP(((base + (ts - t0) / duree) % 1 + 1) % 1); id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [actif, duree]);
  return [p, setP];
}
export const N_ATOMES = 10000;
const CAD = { 10: { periode: 1300, par: 1 }, 100: { periode: 260, par: 1 }, 1000: { periode: 100, par: 10 } };
export const MAX_UNITES = 3000;
const sigDe = t => `${t.methode}|${t.el}|${t.fl}|${t.c}`;
const vide = sig => ({ sig, n: 0, nEx: 0, dernier: null, lot: 1, lotRes: null, ex: [] });
function lancer(etat, t, k, rnd) {
  const el = M.element(t.el), e = { ...(etat.sig === sigDe(t) ? etat : vide(sigDe(t))) }, avant = { n: e.n, nEx: e.nEx };
  e.lot = k;
  for (let j = 0; j < k && e.n < MAX_UNITES; j++) {
    e.n++;
    if (t.methode === 'absorption') { const a = rnd() < M.probaAbsorbe(el, t.fl, t.c); if (a) e.nEx++; e.dernier = { absorbe: a }; }
    else { const ex = M.instantane(el, M.flamme(t.fl).T, N_ATOMES, rnd); e.nEx += ex.length; e.dernier = { ex }; }
  }
  e.lotRes = { n: e.n - avant.n, ex: e.nEx - avant.nEx };
  return e;
}
export function useTiragesFlamme() {
  const [t, setT] = useState({ methode: 'absorption', el: 'Na', fl: 'acetylene', c: 2, etat: vide('') });
  const [play, setPlay] = useState(null), [rejeu, setRejeu] = useState(0), [demo, setDemo] = useState(null), [manuel, setManuel] = useState(null), [vitDemo, setVitDemo] = useState('lent');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });
  const sig = sigDe(t), etat = t.etat.sig === sig ? t.etat : vide(sig);
  const tirer = k => setT(s => ({ ...s, etat: lancer(s.etat, tRef.current, k, Math.random) }));
  const quitterDemo = () => { setDemo(null); setManuel(null); };
  const jouerScenario = sc => { setPlay(null); setManuel(null); setDemo(d => ({ sc, cle: (d?.cle ?? 0) + 1 })); };
  const lancerK = k => { quitterDemo(); if (k === 1) { setPlay(null); tirer(1); return; } const c = CAD[k]; tirer(c.par); setPlay(k - c.par > 0 ? { restant: k - c.par, ...c } : null); };
  const regler = patch => { setPlay(null); quitterDemo(); setT(s => ({ ...s, ...patch })); };
  const effacer = () => { quitterDemo(); setPlay(null); setT(s => ({ ...s, etat: vide('') })); };
  const rejouer = () => (demo ? jouerScenario(demo.sc) : setRejeu(r => r + 1));
  const plein = etat.n >= MAX_UNITES, actif = !!play && !plein, periode = play?.periode, par = play?.par;
  useEffect(() => {
    if (!actif) return undefined;
    const id = setInterval(() => { tirer(par); setPlay(p => (p && p.restant - par > 0 ? { ...p, restant: p.restant - par } : null)); }, periode);
    return () => clearInterval(id);
  }, [actif, periode, par]);
  const anime = etat.lot === 1 && !reduitMouvement();
  const dureeAnim = actif && par === 1 ? Math.round(periode * 0.88) : 3200;
  const dureeDemo = { normal: 4500, lent: 10000, tres: 22000 }[vitDemo];
  return { t, etat, rejeu, rejouer, demo, manuel, setManuel, vitDemo, setVitDemo, dureeDemo, jouerScenario, quitterDemo, lancer: lancerK, regler, effacer, plein, anime, dureeAnim, lecture: actif, restant: play?.restant ?? 0 };
}

// ---------- textes de légende de l'animation d'un atome (sc 1 = événement : excitation/absorption ; sc 0 = rien) ----------
const f2 = v => v.toFixed(2).replace('.', ',');
export function legendeFlamme(methode, sc, p, el) {
  const L = `${Math.round(el.lam)}${' '}nm`;
  if (sc == null) return methode === 'absorption' ? 'Cliquez sur « 1 photon » : un photon de la lampe va traverser la flamme.' : 'Cliquez sur « 1 instantané » : on photographie 10 000 atomes libres de la flamme.';
  if (methode === 'absorption') {
    if (p < 0.4) return `1. Un photon de la lampe (${L}, ${f2(M.energieEV(el.lam))}${' '}eV) arrive sur les atomes de la flamme.`;
    if (sc === 1) return p < 0.78 ? '2. Un atome absorbe le photon : son électron passe au niveau excité (même écart d’énergie que la raie).' : '3. Le photon a disparu (l’énergie part en chaleur par chocs) : aucun coup au détecteur.';
    return p < 0.5 ? '2. Aucun atome n’absorbe ce photon : il traverse la flamme.' : '3. Le photon arrive au détecteur : un coup est compté.';
  }
  if (p < 0.3) return '1. Un atome libre, au niveau fondamental, reçoit un choc d’une particule du gaz chaud de la flamme.';
  if (sc === 1) return p < 0.7 ? '2. Le choc est assez violent : l’électron passe au niveau excité.' : `3. L’atome revient au fondamental et émet un photon de ${L} : c’est la lumière de la flamme.`;
  return '2. Le choc est trop faible : l’électron reste au fondamental, aucune lumière (c’est le cas de presque tous les atomes).';
}
export const texteEvenement = (methode, d) => (!d ? 'rien tiré pour l’instant' : methode === 'absorption' ? (d.absorbe ? 'photon absorbé : aucun coup au détecteur' : 'photon transmis : un coup au détecteur') : `${d.ex.length} atome${d.ex.length > 1 ? 's' : ''} excité${d.ex.length > 1 ? 's' : ''} sur 10 000`);
