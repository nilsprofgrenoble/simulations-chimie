import { useState, useEffect, useRef } from "react";
import Fiches from "./Fiches";
import { formule, docsVus, nf, NOMS_DOCS } from "./laboJournee";
import { proprietes } from "./Peinture";

// Dossier de la journée : documents déjà consultés + calculette de formulation simplifiée, accessibles à tout moment.
const C = { doux: '#5b6472', bord: '#d9d2c3', accent: '#0f766e', encre: '#1e3a8a', rouge: '#b91c1c', vert: '#15803d' };
const num = s => { const x = parseFloat(String(s).replace(',', '.')); return Number.isFinite(x) ? x : 0; };

const CHAMPS = [['liant', 'Résine (liant), g'], ['eau', 'Eau, g'], ['tio2', 'TiO₂, g'], ['caco3', 'CaCO₃, g'], ['coadis', 'Coadis BR3 (dispersant), g'], ['dpnb', 'DPnB (coalescent), g']];

function Calculette({ e }) {
  const f0 = formule(e), mesure = e.f.phMes;
  const [resine, setResine] = useState(f0.resine);
  const [v, setV] = useState(() => Object.fromEntries(CHAMPS.map(([k]) => [k, String(f0[k]).replace('.', ',')])));
  const [ph, setPh] = useState(mesure ? 'mesuree' : 'fiche');
  const f = { ...f0, resine, ...Object.fromEntries(CHAMPS.map(([k]) => [k, num(v[k])])) };
  const p = proprietes(f, ph === 'mesuree' && mesure ? { phPerso: mesure } : { ph: 'fiche' });
  const ligne = (nom, val, aide) => <tr><td style={{ padding: '3px 8px 3px 0', fontWeight: 700 }}>{nom}</td><td style={{ padding: '3px 8px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{val}</td><td style={{ color: C.doux, fontSize: 12.5 }}>{aide}</td></tr>;
  return (
    <div data-calculette>
      <p style={{ margin: '0 0 10px', fontSize: 14, color: C.doux, lineHeight: 1.5 }}>Modifie les masses (elles partent de ta formule actuelle) : les grandeurs se recalculent. Cette calculette ne remplace pas les essais au laboratoire.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
        <label style={{ fontSize: 13 }}>Résine<select value={resine} onChange={ev => setResine(ev.target.value)} style={{ display: 'block', width: '100%', padding: 6, fontSize: 15 }}><option value="orgal">Orgal PST 50A (50 % ES)</option><option value="vinnapas">Vinnapas EP 3360 (60 % ES)</option></select></label>
        {CHAMPS.map(([k, nom]) => <label key={k} style={{ fontSize: 13 }}>{nom}<input value={v[k]} inputMode="decimal" onChange={ev => setV(o => ({ ...o, [k]: ev.target.value }))} style={{ display: 'block', width: '100%', padding: 6, fontSize: 15, boxSizing: 'border-box' }} /></label>)}
        <label style={{ fontSize: 13 }}>Prises d'huile utilisées<select value={ph} onChange={ev => setPh(ev.target.value)} style={{ display: 'block', width: '100%', padding: 6, fontSize: 15 }}><option value="fiche">Fiches techniques (TiO₂ 20, CaCO₃ 14)</option>{mesure && <option value="mesuree">Mes mesures (TiO₂ {nf(mesure.tio2, 0)}, CaCO₃ {nf(mesure.caco3, 0)})</option>}</select></label>
      </div>
      <div style={{ fontSize: 12.5, color: C.doux, margin: '8px 0' }}>Fixes : Foamex 1,5 g · Thixol 1,5 g · Coapur 3 g. Masse totale : {nf(p.mTot)} g.</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 15 }}><tbody>
        {ligne('Extrait sec', `${nf(p.ES)} %`, 'masse de matières sèches ÷ masse totale')}
        {ligne('CPV', `${nf(p.CPV)} %`, 'volume de pulvérulents ÷ (pulvérulents + liant sec)')}
        {ligne('CPVC', `${nf(p.CPVC)} %`, 'avec la prise d\'huile choisie')}
        {ligne('λ = CPV/CPVC', nf(p.lambda, 2), 'cahier des charges : λ ≥ 0,8')}
        {ligne('Densité', nf(p.densite, 3), '')}
        {ligne('COV calculé', `${nf(p.COV, 0)} g/L`, 'DPnB ÷ volume de peinture')}
      </tbody></table>
    </div>);
}

export default function Dossier({ e, onglet, onChange, onFermer }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); const k = ev => { if (ev.key === 'Escape') onFermer(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onFermer]);
  const vus = docsVus(e), ordre = Object.keys(NOMS_DOCS).filter(k => vus.includes(k));
  const tab = id => ({ padding: '6px 14px', border: `2px solid ${C.encre}`, borderRadius: 8, background: onglet === id ? C.encre : '#fff', color: onglet === id ? '#fff' : C.encre, fontWeight: 700, cursor: 'pointer', font: 'inherit', fontSize: 14 });
  return (
    <div role="dialog" aria-modal="true" aria-label="Dossier de la journée" data-dossier style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,32,.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'clamp(8px,3vw,28px)', overflowY: 'auto' }} onClick={ev => { if (ev.target === ev.currentTarget) onFermer(); }}>
      <div ref={ref} tabIndex={-1} style={{ background: '#fffef9', color: '#1f2937', borderRadius: 10, width: 'min(100%,860px)', padding: 'clamp(12px,3vw,20px)', boxShadow: '0 16px 40px rgba(0,0,0,.5)', outline: 'none', fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <b style={{ fontSize: 18, marginRight: 'auto' }}>📁 Dossier</b>
          <button type="button" data-onglet="docs" style={tab('docs')} onClick={() => onChange('docs')}>Documents ({ordre.length})</button>
          <button type="button" data-onglet="calc" style={tab('calc')} onClick={() => onChange('calc')}>🧮 Calculette</button>
          <button type="button" data-fermer onClick={onFermer} aria-label="Fermer le dossier" style={{ ...tab('x'), background: '#fff', color: C.encre }}>✕ Fermer</button>
        </div>
        {onglet === 'calc' ? <Calculette e={e} /> : <Fiches ids={ordre} ouvert={false} />}
      </div>
    </div>);
}
