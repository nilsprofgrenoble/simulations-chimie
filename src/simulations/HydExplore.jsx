/* eslint-disable react-refresh/only-export-components */
import { useRef } from "react";
import { KIT, Section } from "../commun";
import { NB } from "./Distillation";
import * as M from "./hydModele";
import { SceneHydroxydes } from "./HydScene";
import { useEtroit, useLecture, StyleAnim, BarreLecture, Chips, COL } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
//  Exploration animée de la simulation 311 : on choisit deux cations (et leurs concentrations), puis on règle le pH (poignée sur l'axe) ou on ajoute de la soude (animation de pH 1 à 13).
//  Les ions disparaissent et les grains d'hydroxyde se forment au fil du pH ; l'axe montre les zones de précipitation et la fenêtre de séparation.
// ====================================================
export const T_SOUDE = 9, PH_DEP = 1, PH_ARR = 13;
export const exInitial = () => ({ a: 'Cr', cA: 0.01, b: 'Ni', cB: 0.01, ph: 3.0 });

export function HydExplore({ ex, setEx, ouv, setOuv, menu }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite);
  const L = useLecture(T_SOUDE, false), anime = !reduitMouvement(), phase = usePhase(0.8, anime);
  const jeu = L.t > 0 || L.joue, ph = jeu ? PH_DEP + (PH_ARR - PH_DEP) * Math.min(1, L.t / T_SOUDE) : ex.ph;
  const A = M.CATS[ex.a], B = M.CATS[ex.b], w = M.fenetre(A, ex.cA, B, ex.cB), P = w.premier, S = w.second;
  const regler = v => { L.reset(); L.setTouche(true); setEx(x => (x.ph === v ? x : { ...x, ph: v })); };
  const stA = M.statut(A, ex.cA, ph), stB = M.statut(B, ex.cB, ph), lib = { dissous: 'dissous', partiel: 'précipite', total: 'précipité' };
  const qualite = w.ok ? (w.qualite === 'nette' ? `fenêtre de pH ${M.phTxt(w.lo)} à ${M.phTxt(w.hi)}` : `fenêtre trop étroite (${M.nbf(w.largeur, 2)} unité de pH)`) : 'aucune fenêtre';
  const stP = M.statut(P, w.cPremier, ph), stS = M.statut(S, w.cSecond, ph);
  const message = !L.touche && !jeu ? 'Faites glisser la poignée rouge sur l’axe de pH (ou touchez l’axe) : les ions disparaissent et les grains d’hydroxyde se forment. Ou cliquez sur « Ajouter la soude » pour faire monter le pH tout seul.'
    : stS !== 'dissous' && stP !== 'total' ? `À pH ${M.phTxt(ph)}, les deux hydroxydes précipitent ensemble : pas de séparation. Cherchez un pH où le premier est quasi totalement précipité (≤ 1,0×10⁻⁵ mol/L) sans que le second ait commencé.`
    : stS !== 'dissous' ? `À pH ${M.phTxt(ph)}, ${S.solide} précipite : les deux cations sont maintenant mélangés dans le solide.`
    : stP === 'total' ? `À pH ${M.phTxt(ph)}, ${P.solide} est quasi totalement précipité et les ions ${S.ion} sont encore dissous : c’est la séparation ${w.ok ? 'recherchée' : 'recherchée (mais elle n’existe pas pour ces deux cations : revoyez l’axe)'}.`
    : stP === 'partiel' ? `À pH ${M.phTxt(ph)}, ${P.solide} précipite : il reste encore des ions ${P.ion} dissous (plus de 1,0×10⁻⁵ mol/L).` : `À pH ${M.phTxt(ph)}, aucun hydroxyde ne précipite : les deux cations sont dissous.`;
  const aria = `Bécher contenant des ions ${A.ion} à ${M.sciNb(ex.cA, 1)} mol/L et ${B.ion} à ${M.sciNb(ex.cB, 1)} mol/L, pH ${M.phTxt(ph)}. ${A.solide} précipite de pH ${M.phTxt(M.phDebut(A, ex.cA))} à ${M.phTxt(M.phFin(A))} et ${B.solide} de pH ${M.phTxt(M.phDebut(B, ex.cB))} à ${M.phTxt(M.phFin(B))} ; ${qualite}.`;
  const choisir = cle => ev => { L.reset(); setEx(x => ({ ...x, [cle]: ev.target.value })); };
  const choisirC = cle => ev => { L.reset(); setEx(x => ({ ...x, [cle]: Number(ev.target.value) })); };
  const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
    <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
    <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);
  const optsCat = (autre) => M.ORDRE.map(k => <option key={k} value={k} disabled={k === autre}>{M.CATS[k].nom} ({M.CATS[k].ion}) : Ks({M.CATS[k].solide}) = {M.sciNb(M.CATS[k].Ks, 2)}</option>);
  const optsC = M.CONCS.map(c => <option key={c} value={c}>{M.sciNb(c, 1)} mol/L</option>);
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={`Les deux cations : ${A.ion} ${M.sciNb(ex.cA, 1)} mol/L et ${B.ion} ${M.sciNb(ex.cB, 1)} mol/L`} ouvert={ouv.cations} onBascule={() => setOuv(o => ({ ...o, cations: !o.cations }))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {sel('hyd-a', 'Premier cation', ex.a, choisir('a'), optsCat(ex.b))}{sel('hyd-ca', 'Sa concentration', ex.cA, choisirC('cA'), optsC)}
            {sel('hyd-b', 'Second cation', ex.b, choisir('b'), optsCat(ex.a))}{sel('hyd-cb', 'Sa concentration', ex.cB, choisirC('cB'), optsC)}
          </div>
        </Section>
      </div>
      <SceneHydroxydes cations={[{ cat: A, c: ex.cA }, { cat: B, c: ex.cB }]} ph={ph} setPh={regler} etroit={etroit} touche={L.touche || jeu} svgRef={svgRef} aria={aria} phase={phase} soude={L.joue} fenetre/>
      <div role="status" aria-live="polite" style={{ minHeight: 48, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T_SOUDE} libelle="▶ Ajouter la soude"/>
      <Chips items={[['pH', M.phTxt(ph), '#dc2626'], [`${A.ion}`, lib[stA], stA === 'dissous' ? COL.gris : A.col], [`${B.ion}`, lib[stB], stB === 'dissous' ? COL.gris : B.col], ['Séparation', w.qualite === 'nette' ? 'possible' : w.qualite === 'étroite' ? 'très étroite' : 'impossible', w.qualite === 'nette' ? '#15803d' : '#b91c1c'], ['Fenêtre', w.ok ? `${M.phTxt(w.lo)} à ${M.phTxt(w.hi)}` : 'aucune', COL.v]]}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Comment lire l’axe de pH ?" ouvert={ouv.axe} onBascule={() => setOuv(o => ({ ...o, axe: !o.axe }))}>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
            Chaque barre colorée commence au <strong>pH de début de précipitation</strong> (Qr = Ks : [HO⁻] = (Ks ÷ c)<sup>1/n</sup>) et se termine au pH où il ne reste que 1,0×10⁻⁵{NB}mol/L d’ions (précipitation <strong>quasi totale</strong>, convention). Pour séparer deux cations, il faut un pH situé entre la fin de la première barre et le début de la seconde : c’est la <strong>fenêtre de séparation</strong> (bande verte). Si les barres se chevauchent, aucun pH ne sépare les deux cations.
            <div style={{ marginTop: 6 }}>Pour {P.ion} ({M.sciNb(w.cPremier, 1)}{NB}mol/L) et {S.ion} ({M.sciNb(w.cSecond, 1)}{NB}mol/L) : {w.ok ? <>{P.solide} est quasi totalement précipité à pH {M.phTxt(w.lo)}, {S.solide} commence à pH {M.phTxt(w.hi)} : fenêtre de {M.nbf(w.largeur, 2)} unité{w.largeur >= 2 ? 's' : ''} de pH ({w.qualite}).</> : <>{P.solide} n’est quasi totalement précipité qu’à pH {M.phTxt(w.lo)}, mais {S.solide} commence déjà à pH {M.phTxt(w.hi)} : les zones se chevauchent, la séparation est impossible.</>}</div>
          </div>
        </Section>
      </div>
    </div>);
}
