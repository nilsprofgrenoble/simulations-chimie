import { useRef } from "react";
import { KIT, styleBoite, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import * as M from "./pilePcmModele";
import { ScenePile } from "./PilePcmSchemas";
import { COL, nbf, useEtroit, useLecture, coordSvg, StyleAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 305 (piles, TSTL).
//  Voltmètre : la borne V se saisit et se déplace d'un côté à l'autre (elle change de signe la tension : on lit la polarité).
//  « Débiter » remplace le voltmètre par une lampe : les électrons circulent dans le fil, les ions dans le pont salin, la lame du pôle − s'use, celle du pôle + grossit,
//  jusqu'à épuisement du réactif limitant. La durée réelle de fonctionnement (Q ÷ i) s'affiche sur un temps accéléré.
// ====================================================
const T_FIN = 6;   // s d'animation pour une pile entière
const duree = s => (s >= 7200 ? `${nbf(s / 3600, 1)}${NB}h` : s >= 120 ? `${nbf(s / 60, 0)}${NB}min` : `${nbf(s, 0)}${NB}s`);

export function PilePcmExplore({ ex, setEx }) {
  const svgRef = useRef(null), drag = useRef(false), boite = useRef(null);
  const etroit = useEtroit(boite);
  const paire = ex.paire.split('|'), { borneV, ie } = ex;
  const L = useLecture(T_FIN, false), jeu = L.t > 0 || L.joue, f = jeu ? Math.min(1, L.t / T_FIN) : 0;
  const s = M.etatExplore(paire, f), { e } = s, plusSide = paire[0] === e.plus ? 'g' : 'd', usee = f >= 1;
  const lu = jeu ? null : M.tensionLue(paire, borneV), tDebit = M.duree(s.Q, ie), tTot = M.duree(s.Qmax, ie);
  const phase = jeu && !usee ? (L.t * 1.1) % 1 : null;
  const noms = id => M.METAUX[id].nom;
  const xV = borneV === 'g' ? 95 : 305, grip = etroit ? 64 : 56;
  const reset = () => L.reset();
  const poser = ev => { const { X } = coordSvg(svgRef.current, ev), c = X < 200 ? 'g' : 'd'; setEx(x => (x.borneV === c ? x : { ...x, borneV: c })); };
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; L.setTouche(true); poser(ev); };
  const bouge = ev => { if (drag.current) poser(ev); };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavier = ev => { if (!['ArrowLeft', 'ArrowRight'].includes(ev.key)) return; ev.preventDefault(); L.setTouche(true); setEx(x => ({ ...x, borneV: ev.key === 'ArrowLeft' ? 'g' : 'd' })); };
  const change = (cle, v) => { reset(); setEx(x => ({ ...x, [cle]: v })); };
  const message = !jeu ? (!L.touche ? 'Saisis la pastille « V » sur le fil du voltmètre et fais-la passer de l’autre côté : le signe de la tension change. Une valeur positive signifie que la borne V est sur le pôle +.' : `Le voltmètre affiche ${lu > 0 ? '+' : '−'}${nbf(Math.abs(lu), 2)} V avec la borne V du côté ${borneV === 'g' ? 'gauche' : 'droit'} : le pôle + est ${lu > 0 ? 'de ce côté-là' : 'de l’autre côté'}. Appuie sur « Débiter » pour faire fonctionner la pile.`)
    : usee ? `Pile usée : le réactif limitant est entièrement consommé. Charge débitée Q = ${nbf(s.Qmax, 0)} C, soit ${duree(tTot)} de fonctionnement à ${ie}${NB}mA.`
      : 'La pile débite : les électrons vont du pôle − (anode) vers le pôle + (cathode) dans le fil, et les ions circulent dans le pont salin. La lame du pôle − s’use, celle du pôle + grossit.';
  const aria = `Pile ${noms(paire[0])} et ${noms(paire[1])} reliées par un pont salin. Pôle plus : ${noms(e.plus)}. Anode : ${noms(e.moins)}. Capacité ${nbf(s.Qmax, 0)} coulombs, durée de fonctionnement ${duree(tTot)} à ${ie} milliampères.`;
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div style={{ minWidth: 0 }}>
          <label htmlFor="pp-paire" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>La pile (demi-pile de gauche | de droite)</label>
          <select id="pp-paire" value={ex.paire} onChange={ev => change('paire', ev.target.value)} style={{ width: '100%', minHeight: 42, borderRadius: 8, border: `1.5px solid ${KIT.bord}`, padding: '0 10px', fontSize: 15 }}>
            {M.PILES.map(([a, b]) => <option key={a + b} value={`${a}|${b}`}>{noms(a)} | {noms(b)}</option>)}
          </select>
        </div>
        <Seg label="Intensité débitée" valeur={ie} onChange={v => change('ie', v)} options={[20, 50, 100].map(x => [x, `${x} mA`])}/>
      </div>
      <ScenePile svgRef={svgRef} paire={paire} borneV={jeu ? null : borneV} lu={lu} charge={jeu ? 'lampe' : 'volt'} poles={jeu} noms={jeu} flux={false} phase={phase} usure={f} plusSide={plusSide} iTexte={`i = ${ie} mA`} allumee={jeu && !usee} maxWidth={460} aria={aria}>
        {!jeu && <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Borne V du voltmètre : flèches gauche et droite pour la placer sur l’électrode de gauche ou de droite" aria-valuemin={0} aria-valuemax={1} aria-valuenow={borneV === 'g' ? 0 : 1} aria-valuetext={`borne V côté ${borneV === 'g' ? 'gauche' : 'droit'}`} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavier}>
          <rect x="50" y="56" width="300" height="46" fill="transparent"/>
          <rect className="xa-anneau" x={xV - grip / 2} y="62" width={grip} height="30" rx="15" fill="#fff" stroke="#dc2626" strokeWidth="3.5"/>
          <text x={xV} y="83" textAnchor="middle" fontSize="17" fontWeight="800" fill="#dc2626">V ⇄</text>
          {!L.touche && <rect className="xa-pulse" x={xV - grip / 2 - 3} y="59" width={grip + 6} height="36" rx="18" fill="none" stroke="#dc2626" strokeWidth="3"/>}
        </g>}
      </ScenePile>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: usee ? 700 : 400, color: usee ? '#15803d' : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T_FIN} libelle="▶ Débiter"/>
      <Chips items={[['Tension à vide', `${nbf(e.U, 2)}${NB}V`, '#dc2626'], ['Charge débitée', `${nbf(s.Q, 0)}${NB}C`, '#b45309'], ['Capacité Q', `${nbf(s.Qmax, 0)}${NB}C`, COL.v], ['Durée', `${duree(tDebit)}`, '#15803d']]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Pôle + (cathode : réduction)" valeur={`${noms(e.plus)}`} couleur="#dc2626"/>
        <LigneMesure nom="Pôle − (anode : oxydation)" valeur={`${noms(e.moins)}`} couleur="#1d4ed8"/>
        <LigneMesure nom="Capacité Q = n(e⁻) × F" valeur={`${nbf(s.Qmax, 0)}${NB}C`} couleur="#b45309"/>
        <LigneMesure nom={`Durée de fonctionnement Q ÷ i à ${ie} mA`} valeur={duree(tTot)} couleur="#15803d"/>
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Équation de fonctionnement : {M.equationTexte(e.moins, e.plus).replace('→', '=')}. Chaque demi-pile contient 100{NB}mL à 0,10{NB}mol/L, et la lame du pôle − pèse 2,0{NB}g : le réactif limitant fixe la capacité.</div>
      </div>
    </div>);
}
