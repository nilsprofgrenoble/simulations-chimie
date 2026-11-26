import { useRef } from "react";
import { KIT, Section, stylePetitBouton } from "../commun";
import { NB } from "./Distillation";
import * as M from "./ksqModele";
import { ScenePrecipitation, etatScene, T_FIN, lcDefaut } from "./KsqScene";
import { useEtroit, useLecture, StyleAnim, BarreLecture, Chips, nbf, COL } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
//  Exploration animée de la simulation 309 : deux poignées règlent (échelle logarithmique) les concentrations des deux solutions ; « Verser » les mélange.
//  Si Qr > Ks, des ions disparaissent et le solide apparaît ; la jauge Qr ÷ Ks glisse jusqu'à l'équilibre. Volumes fixes : 50 mL de chaque solution.
//  Section « ion commun » (qualitative et chiffrée) : la solubilité d'un sel baisse quand l'eau contient déjà un de ses ions.
// ====================================================
const masseTxt = mg => (mg >= 1000 ? `${nbf(mg / 1000, 2)}${NB}g` : mg >= 1 ? `${nbf(mg, 1)}${NB}mg` : `${nbf(mg * 1000, 1)}${NB}µg`);
const VERDICTS = { precipite: ['#b91c1c', 'Précipité'], sature: ['#b45309', 'Saturée'], dissout: ['#15803d', 'Pas de solide'] };

export function KsqExplore({ ex, setEx, ouv, setOuv, menu }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite);
  const L = useLecture(T_FIN, false), anime = !reduitMouvement(), ph = usePhase(0.8, anime);
  const sel = M.SELS[ex.sel], e = etatScene(sel, ex.lc1, ex.lc2), jeu = L.t > 0 || L.joue, f = jeu ? Math.min(1, L.t / T_FIN) : null;
  const fin = f != null && f >= 1, [coul, lib] = VERDICTS[e.v];
  const regler = cle => v => { L.reset(); L.setTouche(true); setEx(x => (x[cle] === v ? x : { ...x, [cle]: v })); };
  const choisirSel = id => { const s = M.SELS[id]; L.reset(); setEx(x => ({ ...x, sel: id, lc1: lcDefaut(s, 'cation'), lc2: lcDefaut(s, 'anion'), c0: 0 })); };
  const s0 = M.solubilite(sel), s1 = ex.c0 > 0 ? M.solubiliteIonCommun(sel, ex.c0, 'anion') : s0;
  const message = f == null ? (!L.touche ? 'Saisissez une poignée ⇕ sur un des deux béchers et faites-la glisser : la concentration de la solution change (échelle logarithmique). Puis cliquez sur « Verser » pour mélanger les deux solutions.'
    : `Si on mélangeait maintenant : Qr = ${M.sciNb(e.q0, 2)} contre Ks = ${M.sciNb(sel.Ks, 2)}. ${e.v === 'precipite' ? 'Qr > Ks : un précipité va se former.' : e.v === 'sature' ? 'Qr ≈ Ks : la solution serait juste saturée.' : 'Qr < Ks : aucun précipité ne se forme.'} Cliquez sur « Verser » pour le voir.`)
    : !fin ? 'Les solutions se mélangent : chaque ion se retrouve dilué (le volume double) ; on compare alors Qr à Ks.'
    : e.v === 'precipite' ? `Qr > Ks : des ions se sont associés en solide (${masseTxt(e.mg)} de ${sel.f}). La solution est maintenant saturée : Qr = Ks.`
    : e.v === 'sature' ? 'Qr ≈ Ks : la solution est saturée, sans solide en excès : on est à l’équilibre.' : 'Qr < Ks : pas de précipité. Les ions restent dissous, la solution n’est pas saturée.';
  const aria = `Deux béchers de solutions ioniques d’ions ${sel.cation} à ${M.sciNb(e.c1, 1)} mol/L et ${sel.anion} à ${M.sciNb(e.c2, 1)} mol/L, versés dans un grand bécher. Après mélange Qr vaut ${M.sciNb(e.q0, 2)} et Ks vaut ${M.sciNb(sel.Ks, 2)} : ${lib}.`;
  return (
    <div ref={boite}>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div style={{ minWidth: 0 }}>
          <label htmlFor="ksq-sel" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Le sel peu soluble qui peut se former</label>
          <select id="ksq-sel" value={ex.sel} onChange={ev => choisirSel(ev.target.value)} style={menu}>
            {M.ORDRE_SELS.map(k => <option key={k} value={k}>{M.SELS[k].nom} ({M.SELS[k].f}) : Ks = {M.sciNb(M.SELS[k].Ks, 2)}</option>)}
          </select>
        </div>
      </div>
      <ScenePrecipitation sel={sel} lc1={ex.lc1} lc2={ex.lc2} setLc1={regler('lc1')} setLc2={regler('lc2')} f={f} ph={ph} etroit={etroit} touche={L.touche} svgRef={svgRef} aria={aria}/>
      <div role="status" aria-live="polite" style={{ minHeight: 48, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: fin ? 700 : 400, color: fin ? coul : KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T_FIN} libelle="▶ Verser"/>
      <Chips items={[['Qr après mélange', M.sciNb(e.q0, 2), coul], ['Ks', M.sciNb(sel.Ks, 2), COL.Ec], ['Qr ÷ Ks', e.q0 / sel.Ks >= 100 || e.q0 / sel.Ks < 0.1 ? M.sciNb(e.q0 / sel.Ks, 1) : nbf(e.q0 / sel.Ks, 2), coul], ['Verdict', lib, coul], ['Solide formé', e.x > 0 ? masseTxt(e.mg) : 'aucun', e.x > 0 ? '#b91c1c' : COL.gris], ['Solubilité s (mol/L)', M.sciNb(s0, 2), COL.v]]}/>
      <div style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <Section titre={`Pour aller plus loin : un ion commun (${sel.anion} déjà présent dans l’eau : ${ex.c0 > 0 ? `${M.sciNb(ex.c0, 1)} mol/L` : 'aucun'})`} ouvert={ouv.commun} onBascule={() => setOuv(o => ({ ...o, commun: !o.commun }))}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Dissolvons {sel.f} dans une eau qui contient déjà des ions {sel.anion} (apportés par un autre sel très soluble). Les ions {sel.anion} en plus font baisser la solubilité : l’équilibre de dissolution est déplacé vers le solide.</div>
          <div role="group" aria-label={`Concentration en ions ${sel.anion} déjà présents`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {[0, 1e-3, 1e-2, 1e-1].map(c => <button key={c} type="button" aria-pressed={ex.c0 === c} onClick={() => setEx(x => ({ ...x, c0: c }))} style={{ ...stylePetitBouton(ex.c0 === c, '#0369a1'), minHeight: 42 }}>{c ? `${M.sciNb(c, 0)} mol/L` : 'eau pure'}</button>)}
          </div>
          {[['dans l’eau pure', s0, '#38bdf8'], [`avec ${ex.c0 ? M.sciNb(ex.c0, 1) : '0'} mol/L de ${sel.anion}`, s1, '#fb923c']].map(([t, v, c]) => (
            <div key={t} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt, gap: 8 }}><span>s {t}</span><strong style={{ fontFamily: 'ui-monospace, monospace' }}>{M.sciNb(v, 2)}{NB}mol/L</strong></div>
              <div style={{ height: 14, background: '#f1f5f9', borderRadius: 7, overflow: 'hidden' }}><div style={{ width: `${Math.max(1.2, v / s0 * 100)}%`, height: '100%', background: c, borderRadius: 7, transition: 'width .4s' }}/></div>
            </div>))}
          <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.5 }}>{ex.c0 > 0 ? <>La solubilité est divisée par environ <strong>{s0 / s1 >= 10 ? nbf(s0 / s1, 0) : nbf(s0 / s1, 1)}</strong>. Calcul : Ks = [{sel.cation}]{sel.a > 1 ? M.sup(sel.a) : ''} × [{sel.anion}]{sel.b > 1 ? M.sup(sel.b) : ''} avec [{sel.anion}] ≈ {M.sciNb(ex.c0, 1)} + {sel.b} s.</> : 'Choisissez une concentration d’ions déjà présents pour comparer.'}</div>
        </Section>
      </div>
    </div>);
}
