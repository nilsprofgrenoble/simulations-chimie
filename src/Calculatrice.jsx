import { useState, useEffect, useRef, useCallback } from "react";
import { calculer, formater, CONSTANTES } from "./calculatrice";
import { KIT } from "./commun";
import { Pic } from "./Pictos";

// ═════════════════════════════════════════════════════════════════
//  CALCULATRICE SCIENTIFIQUE : bouton flottant (en bas à droite) sur toutes les pages de simulation, panneau qui reste ouvert
//  quand on change de simulation. Moteur : src/calculatrice.js (sans eval, testé). Clavier physique accepté ; sur téléphone,
//  le clavier du téléphone ne s'ouvre pas (inputMode « none ») : on utilise les touches de la calculatrice.
// ═════════════════════════════════════════════════════════════════
const lire = (cle, defaut) => { try { return window.localStorage.getItem(cle) ?? defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { window.localStorage.setItem(cle, v); } catch { /* indisponible */ } };

// [libellé affiché, texte inséré, décalage du curseur en arrière, nom accessible]
const SCI = [
  [['sin', 'sin(', 0, 'sinus'], ['cos', 'cos(', 0, 'cosinus'], ['tan', 'tan(', 0, 'tangente'], ['π', 'π', 0, 'pi'], ['e', 'e', 0, 'nombre e']],
  [['asin', 'asin(', 0, 'arc sinus'], ['acos', 'acos(', 0, 'arc cosinus'], ['atan', 'atan(', 0, 'arc tangente'], ['ln', 'ln(', 0, 'logarithme népérien'], ['log', 'log(', 0, 'logarithme décimal']],
  [['√', '√(', 0, 'racine carrée'], ['x²', '^2', 0, 'au carré'], ['xʸ', '^', 0, 'puissance'], ['eˣ', 'exp(', 0, 'exponentielle'], ['10ˣ', '10^(', 0, 'dix puissance']],
  [['(', '(', 0, 'parenthèse ouvrante'], [')', ')', 0, 'parenthèse fermante'], ['x⁻¹', '^(-1)', 0, 'inverse'], ['n!', '!', 0, 'factorielle']],
];
const NUM = [
  [['7'], ['8'], ['9'], ['÷', '÷', 0, 'divisé par', 'op'], ['⌫', null, 0, 'effacer le dernier caractère', 'ctl']],
  [['4'], ['5'], ['6'], ['×', '×', 0, 'multiplié par', 'op'], ['AC', null, 0, 'tout effacer', 'ctl']],
  [['1'], ['2'], ['3'], ['−', '−', 0, 'moins', 'op'], ['Ans', 'Ans', 0, 'dernier résultat', 'ctl']],
  [['0'], [',', ',', 0, 'virgule'], ['×10ⁿ', '×10^(', 0, 'fois dix puissance', 'ctl'], ['+', '+', 0, 'plus', 'op'], ['=', null, 0, 'égale', 'egal']],
];

export function Calculatrice({ activeId }) {
  const [ouvert, setOuvert] = useState(false), [expr, setExpr] = useState(''), [hist, setHist] = useState([]), [msg, setMsg] = useState('');
  const [angle, setAngle] = useState(() => (lire('calc-angle', 'deg') === 'rad' ? 'rad' : 'deg'));
  const [cs, setCs] = useState(() => { const n = parseInt(lire('calc-cs', '0'), 10); return n >= 2 && n <= 8 ? n : 0; });
  const [constantes, setConstantes] = useState(false), [sci, setSci] = useState(() => lire('calc-sci', '1') !== '0');
  const affichage = useRef(null), champ = useRef(null), bouton = useRef(null), curseur = useRef(null), ans = useRef(0);

  const fermer = useCallback(() => { setOuvert(false); bouton.current?.focus(); }, []);
  useEffect(() => {
    if (!ouvert) return undefined;
    const f = e => { if (e.key === 'Escape') fermer(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [ouvert, fermer]);
  useEffect(() => { if (ouvert) champ.current?.focus({ preventScroll: true }); }, [ouvert]);
  useEffect(() => {
    if (curseur.current != null && champ.current) { const c = curseur.current; curseur.current = null; champ.current.setSelectionRange(c, c); }
  });

  useEffect(() => { if (affichage.current) affichage.current.scrollTop = affichage.current.scrollHeight; }, [hist, msg, ouvert]);

  const inserer = txt => {
    const el = champ.current, d = el?.selectionStart ?? expr.length, f = el?.selectionEnd ?? expr.length;
    curseur.current = d + txt.length;
    setExpr(expr.slice(0, d) + txt + expr.slice(f)); setMsg('');
    el?.focus();
  };
  const effacer = () => {
    const el = champ.current, d = el?.selectionStart ?? expr.length, f = el?.selectionEnd ?? expr.length;
    if (f > d) { curseur.current = d; setExpr(expr.slice(0, d) + expr.slice(f)); } else if (d > 0) { curseur.current = d - 1; setExpr(expr.slice(0, d - 1) + expr.slice(d)); }
    setMsg(''); el?.focus();
  };
  const egal = () => {
    if (!expr.trim()) return;
    try {
      const v = calculer(expr, { angle, ans: ans.current });
      const r = formater(v, cs);
      ans.current = v;
      setHist(h => [...h.slice(-5), { expr, texte: r.texte, brut: r.brut }]); setMsg('');
      curseur.current = 0; setExpr('');
    } catch (e) { setMsg(e.message || 'Calcul impossible.'); }
  };
  const touche = ([lib, txt, , nom, type]) => {
    const agir = () => { if (lib === '=') egal(); else if (lib === '⌫') effacer(); else if (lib === 'AC') { setExpr(''); setMsg(''); setHist([]); ans.current = 0; champ.current?.focus(); } else inserer(txt ?? lib); };
    const couleur = type === 'egal' ? { background: '#f5a31a', color: '#3a2500', border: '1px solid #f5a31a' } : type === 'op' || type === 'ctl' ? { background: '#e8f1fb', color: '#0b4f94', border: '1px solid #c3d9f1' } : { background: '#fff', color: '#0c1a2e', border: '1px solid #cbd5e1' };
    return <button key={lib} type="button" onClick={agir} aria-label={nom || lib}
      style={{ ...couleur, minHeight: 36, borderRadius: 10, font: `700 ${lib.length > 3 ? 13 : 16}px inherit`, fontFamily: 'inherit', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}>{lib}</button>;
  };
  const surClavier = e => { if (e.key === 'Enter') { e.preventDefault(); egal(); } };

  if (!(activeId > 0)) return null;
  return (
    <>
      <button ref={bouton} type="button" data-calculatrice-bouton onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-haspopup="dialog"
        style={{ position: 'fixed', right: 10, bottom: 10, zIndex: 40, background: ouvert ? '#0b4f94' : 'rgba(255,255,255,.95)', color: ouvert ? '#fff' : '#475569', border: '1px solid #cbd5e1', borderRadius: 999,
          padding: '7px 12px', font: '700 13px inherit', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 1px 4px rgba(15,23,42,.15)' }}>
        <Pic n="calc"/>Calculatrice
      </button>
      {ouvert && (
        <div role="dialog" aria-label="Calculatrice scientifique" data-calculatrice
          style={{ position: 'fixed', right: 8, bottom: 52, zIndex: 41, width: 'min(344px, calc(100vw - 16px))', maxHeight: 'calc(100dvh - 70px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '1px solid #cbd5e1',
            borderRadius: 18, padding: 10, boxShadow: '0 8px 28px rgba(15,23,42,.28)', color: KIT.txt, fontFamily: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <b style={{ fontSize: 14, flex: 1, whiteSpace: 'nowrap' }}><Pic n="calc"/>Calculatrice</b>
            <button type="button" role="switch" aria-checked={angle === 'rad'} onClick={() => { const n = angle === 'deg' ? 'rad' : 'deg'; setAngle(n); ecrire('calc-angle', n); }} aria-label={`Angles en ${angle === 'deg' ? 'degrés' : 'radians'} : appuyer pour changer`}
              style={{ border: '1px solid #c3d9f1', background: '#e8f1fb', color: '#0b4f94', borderRadius: 999, padding: '4px 10px', font: '800 12.5px inherit', fontFamily: 'inherit', cursor: 'pointer' }}>{angle === 'deg' ? 'DEG' : 'RAD'}</button>
            <label style={{ fontSize: 12.5, color: KIT.txt2, display: 'flex', alignItems: 'center', gap: 4 }}>Chiffres sign.
              <select value={cs} onChange={e => { const n = Number(e.target.value); setCs(n); ecrire('calc-cs', String(n)); }} aria-label="Nombre de chiffres significatifs du résultat" style={{ width: 'auto', minHeight: 0, height: 28, fontSize: 13, borderRadius: 8, border: `1px solid ${KIT.bord}`, padding: '0 4px' }}>
                <option value={0}>auto</option>{[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select></label>
            <button type="button" onClick={fermer} aria-label="Fermer la calculatrice" style={{ border: 0, background: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#475569', padding: '2px 6px', width: 'auto', minHeight: 0 }}>×</button>
          </div>
          <div ref={affichage} aria-live="polite" style={{ background: '#f1f5f9', borderRadius: 12, padding: '6px 10px', minHeight: 40, maxHeight: 64, overflowY: 'auto', fontSize: 13.5, textAlign: 'right' }}>
            {hist.length === 0 && !msg && <div style={{ color: KIT.txt2, textAlign: 'left' }}>Ex. : 6,02×10^23÷12 puis =. Ans = dernier résultat ; un clic sur un résultat le recopie.</div>}
            {hist.map((h, i) => (
              <div key={i} style={{ color: KIT.txt2 }}>{h.expr} = <button type="button" onClick={() => inserer(h.brut)} aria-label={`Réutiliser le résultat ${h.texte}`} style={{ border: 0, background: 'none', padding: 0, font: '800 15px inherit', fontFamily: 'inherit', color: i === hist.length - 1 ? '#0c1a2e' : '#0b4f94', cursor: 'pointer' }}>{h.texte}</button></div>))}
            {msg && <div role="alert" style={{ color: '#b91c1c', fontWeight: 700, textAlign: 'left' }}>{msg}</div>}
          </div>
          <input ref={champ} value={expr} onChange={e => { setExpr(e.target.value); setMsg(''); }} onKeyDown={surClavier} inputMode="none" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Calcul à effectuer" placeholder="Tapez un calcul"
            style={{ width: '100%', boxSizing: 'border-box', margin: '6px 0', padding: '9px 10px', borderRadius: 12, border: '2px solid #0b4f94', font: '600 18px inherit', fontFamily: 'inherit', textAlign: 'right' }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <button type="button" aria-expanded={sci} onClick={() => { setSci(!sci); ecrire('calc-sci', sci ? '0' : '1'); }} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 999, padding: '3px 10px', font: '700 12.5px inherit', fontFamily: 'inherit', cursor: 'pointer', color: '#475569' }}>{sci ? 'Masquer les fonctions' : 'Fonctions scientifiques'}</button>
            <button type="button" aria-expanded={constantes} onClick={() => setConstantes(!constantes)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 999, padding: '3px 10px', font: '700 12.5px inherit', fontFamily: 'inherit', cursor: 'pointer', color: '#475569' }}>Constantes</button>
          </div>
          {constantes && (
            <div style={{ display: 'grid', gap: 4, marginBottom: 6 }} role="group" aria-label="Constantes physiques">
              {Object.entries(CONSTANTES).map(([sym, c]) => (
                <button key={sym} type="button" onClick={() => inserer(sym)} title={`${c.nom} = ${c.txt} ${c.unite}`}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 8, textAlign: 'left', border: '1px solid #e3eaf3', background: '#f8fafc', borderRadius: 10, padding: '5px 9px', font: '600 12.5px inherit', fontFamily: 'inherit', cursor: 'pointer', color: KIT.txt }}>
                  <span><b>{sym}</b> · {c.nom}</span><span style={{ color: KIT.txt2 }}>{c.txt.replace('^', '')} {c.unite}</span>
                </button>))}
            </div>)}
          {sci && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>{SCI.flat().map(touche)}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>{NUM.flat().map(touche)}</div>
        </div>)}
    </>
  );
}
