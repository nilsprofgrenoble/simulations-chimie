/* eslint-disable react-refresh/only-export-components */
import { useRef } from "react";
import { KIT, Section, stylePetitBouton } from "../commun";
import * as M from "./tsolModele";
import { SceneSolubilite } from "./TsolScene";
import { useEtroit, useLecture, StyleAnim, BarreLecture, Chips, COL } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
//  Exploration animée de la simulation 312 : on choisit un solide, une masse d'eau et une masse de solide, puis on règle la température (poignée sur l'axe) ou on lance un balayage (chauffer de 10 à 90 °C, refroidir de 90 à 10 °C).
//  Le point d'état se déplace sur le graphe : au-dessus de la courbe, des cristaux apparaissent dans le bécher.
// ====================================================
export const T_BALAYAGE = 8, T_BAS = 10, T_HAUT = 90;
export const W_OPTIONS = { nh4cl: [20, 40, 50, 60, 80], li2co3: [0.6, 1.0, 1.4, 1.8] };
export const exInitial = () => ({ sol: 'nh4cl', mEau: 100, w: 50, T: 20, dir: 'froid' });

export function TsolExplore({ ex, setEx, ouv, setOuv, menu }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite);
  const L = useLecture(T_BALAYAGE, false), anime = !reduitMouvement(), phase = usePhase(0.8, anime);
  const so = M.SOLIDES[ex.sol], m = ex.w * ex.mEau / 100, jeu = L.t > 0 || L.joue;
  const u = Math.min(1, L.t / T_BALAYAGE), T = jeu ? (ex.dir === 'froid' ? T_HAUT - (T_HAUT - T_BAS) * u : T_BAS + (T_HAUT - T_BAS) * u) : ex.T;
  const e = M.etat(so, T, m, ex.mEau), sT = M.sol(so, T), tS = M.tSat(so, ex.w);
  const regler = v => { L.reset(); L.setTouche(true); setEx(x => (x.T === v ? x : { ...x, T: v })); };
  const choisir = patch => { L.reset(); setEx(x => { const y = { ...x, ...patch }; if (patch.sol && patch.sol !== x.sol) y.w = patch.sol === 'nh4cl' ? 50 : 1.4; return y; }); };
  const sens = dir => { L.reset(); setEx(x => ({ ...x, dir })); };
  const tt = Math.round(T);
  const detail = tS == null ? '' : so.sens === 'croissante' ? ` Les premiers cristaux apparaissent quand on refroidit sous ${M.nbf(tS, 0)}${M.NB}°C.` : ` Les premiers cristaux apparaissent quand on chauffe au-dessus de ${M.nbf(tS, 0)}${M.NB}°C.`;
  const message = !L.touche && !jeu ? 'Faites glisser la poignée rouge sur l’axe des températures (ou touchez le graphe) : le point d’état se déplace et des cristaux apparaissent ou disparaissent. Ou cliquez sur le bouton ci-dessous pour lancer un balayage de température.'
    : e.statut === 'depot' ? `À ${tt}${M.NB}°C, ${ex.mEau}${M.NB}g d’eau dissolvent au plus ${M.gTxt(e.lim)}${M.NB}g de ${so.formule} : il reste ${M.gTxt(e.cristaux)}${M.NB}g de cristaux au fond. La solution est saturée.${detail}`
    : e.statut === 'limite' ? `À ${tt}${M.NB}°C, la solution est tout juste saturée : tout le solide est dissous, mais il n’y a plus de marge.${detail}`
    : `À ${tt}${M.NB}°C, la solution n’est pas saturée : les ${M.gTxt(m)}${M.NB}g sont dissous (la limite est ${M.gTxt(e.lim)}${M.NB}g).${detail}`;
  const aria = `Bécher contenant ${ex.mEau} g d’eau et ${M.gTxt(m)} g de ${so.nom}, température ${tt} °C. Graphe de la solubilité de ${so.formule} en fonction de la température, avec un point d’état et une poignée de température.`;
  const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
    <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
    <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);
  const libelle = ex.dir === 'froid' ? '▶ Refroidir de 90 à 10 °C' : '▶ Chauffer de 10 à 90 °C';
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={`${so.formule} · ${ex.mEau} g d’eau · ${M.gTxt(m)} g de solide`} ouvert={ouv.melange} onBascule={() => setOuv(o => ({ ...o, melange: !o.melange }))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {sel('tsol-so', 'Solide', ex.sol, ev => choisir({ sol: ev.target.value }), M.ORDRE.map(k => <option key={k} value={k}>{M.SOLIDES[k].nom} ({M.SOLIDES[k].formule})</option>))}
            {sel('tsol-eau', 'Masse d’eau', ex.mEau, ev => choisir({ mEau: Number(ev.target.value) }), [100, 200, 500].map(v => <option key={v} value={v}>{v} g</option>))}
            {sel('tsol-w', 'Solide ajouté (pour 100 g d’eau)', ex.w, ev => choisir({ w: Number(ev.target.value) }), W_OPTIONS[ex.sol].map(v => <option key={v} value={v}>{M.gTxt(v)} g pour 100 g d’eau</option>))}
          </div>
        </Section>
      </div>
      <SceneSolubilite solide={so} m={m} mEau={ex.mEau} T={T} setT={regler} etroit={etroit} touche={L.touche || jeu} svgRef={svgRef} aria={aria} phase={phase} dir={L.joue ? (ex.dir === 'froid' ? 'froid' : 'chaud') : null} lecture/>
      <div role="status" aria-live="polite" style={{ minHeight: 70, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <div style={{ maxWidth: 920, margin: '0 auto 6px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Balayage :</span>
        <button type="button" onClick={() => sens('froid')} aria-pressed={ex.dir === 'froid'} style={stylePetitBouton(ex.dir === 'froid', '#0369a1')}>Refroidir</button>
        <button type="button" onClick={() => sens('chaud')} aria-pressed={ex.dir === 'chaud'} style={stylePetitBouton(ex.dir === 'chaud', '#b45309')}>Chauffer</button>
      </div>
      <BarreLecture L={L} tFin={T_BALAYAGE} libelle={libelle}/>
      <Chips items={[['T', `${tt} °C`, '#dc2626'], ['Solution', e.statut === 'depot' ? 'saturée' : e.statut === 'limite' ? 'à la limite' : 'non saturée', e.statut === 'depot' ? '#b45309' : COL.gris], ['s(T)', `${M.gTxt(sT)} g/100 g`, so.col], ['Dissous', `${M.gTxt(e.dissous)} g`, so.col], ['Cristaux', `${M.gTxt(e.cristaux)} g`, e.cristaux > 0 ? '#b45309' : COL.gris]]}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre="Comment lire le graphe ?" ouvert={ouv.graphe} onBascule={() => setOuv(o => ({ ...o, graphe: !o.graphe }))}>
          <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
            La courbe donne la <strong>solubilité s</strong> : la masse maximale de {so.formule} qui se dissout dans 100 g d’eau à la température T. Le point d’état se place à la hauteur <strong>m(solide) pour 100 g d’eau</strong> (ici {M.gTxt(ex.w)}{M.NB}g).
            <div style={{ marginTop: 6 }}>Point <strong>sous la courbe</strong> : tout est dissous (solution non saturée). Point <strong>au-dessus</strong> : la solution est saturée et l’excès se dépose en cristaux, de masse (hauteur du point − s) × m(eau) ÷ 100. Pour {so.formule}, la solubilité {so.sens === 'croissante' ? 'augmente' : 'diminue'} avec la température : la dissolution est {so.dH}.</div>
          </div>
        </Section>
      </div>
    </div>);
}
