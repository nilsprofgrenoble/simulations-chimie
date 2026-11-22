import { useState, useEffect, useRef, useCallback } from "react";
import { calculer, formater, CONSTANTES } from "./calculatrice";
import { vide, inserer, insererTexte, fraction, puissance, racine, supprimer, deplacer, serialiser, depuisTexte } from "./editeurMaths";
import { KIT } from "./commun";
import { Pic } from "./Pictos";

// ═════════════════════════════════════════════════════════════════
//  CALCULATRICE SCIENTIFIQUE : bouton flottant (en bas à droite) sur toutes les pages de simulation et d'exercice, panneau qui reste
//  ouvert quand on change de page. Saisie « 2D » façon NumWorks : fractions avec barre, exposants en petit, racine ; flèches pour
//  se déplacer. Moteur : src/calculatrice.js ; éditeur : src/editeurMaths.js (sans eval, testés). Clavier physique accepté
//  (la touche / crée une fraction, ^ un exposant, → sort de l'exposant). La zone de saisie n'est pas un champ de texte :
//  le clavier du téléphone ne s'ouvre pas, on utilise les touches de la calculatrice.
// ═════════════════════════════════════════════════════════════════
const lire = (cle, defaut) => { try { return window.localStorage.getItem(cle) ?? defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { window.localStorage.setItem(cle, v); } catch { /* indisponible */ } };

// ── Affichage d'une expression : jetons → mise en forme (fraction avec barre, exposant, racine), caret à l'indice c (−1 : aucun) ──
const STYLE_CSS = `@keyframes calc-clignote { 50% { opacity: 0; } }
.calc-caret { display: inline-block; width: 2px; height: 1.15em; background: #0b4f94; vertical-align: text-bottom; margin: 0 -1px; animation: calc-clignote 1.1s steps(1) infinite; }
.calc-ph { display: inline-block; width: .6em; height: .95em; border: 1.5px dashed #94a3b8; border-radius: 3px; vertical-align: middle; margin: 0 1px; }`;
function Rendu({ t, c }) {
  let i = 0, n = 0;
  const cle = () => `k${n++}`;
  function liste(fin) {
    const sortie = []; let contenu = false;
    while (i <= t.length) {
      if (i === c) sortie.push(<span key={cle()} className="calc-caret" aria-hidden="true" />);
      if (i === t.length || fin.includes(t[i])) break;
      const x = t[i++];
      contenu = true;
      if (x === 'FO') {
        const num = liste(['FS']); i++;
        const den = liste(['FC']); i++;
        sortie.push(<span key={cle()} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 3px' }}>
          <span style={{ borderBottom: '1.5px solid currentColor', padding: '0 3px 1px', textAlign: 'center' }}>{num}</span><span style={{ padding: '1px 3px 0', textAlign: 'center' }}>{den}</span></span>);
      } else if (x === 'PO') {
        const e = liste(['PC']); i++;
        sortie.push(<sup key={cle()} style={{ fontSize: '.68em', lineHeight: 0, verticalAlign: 'super', margin: '0 1px' }}>{e}</sup>);
      } else if (x === 'RO') {
        const a = liste(['RC']); i++;
        sortie.push(<span key={cle()} style={{ whiteSpace: 'nowrap' }}>√<span style={{ borderTop: '1.5px solid currentColor', padding: '0 2px' }}>{a}</span></span>);
      } else sortie.push(<span key={cle()}>{x}</span>);
    }
    if (!contenu) sortie.push(<span key={cle()} className="calc-ph" aria-hidden="true" />);
    return sortie;
  }
  return <>{(() => { const r = liste([]); if (!t.length) return r.filter(e => e.props.className !== 'calc-ph'); return r; })()}</>;
}

// [libellé, action, nom accessible, type]
const SCI = [
  [['sin', 'sin(', 'sinus'], ['cos', 'cos(', 'cosinus'], ['tan', 'tan(', 'tangente'], ['π', 'π', 'pi'], ['e', 'e', 'nombre e']],
  [['asin', 'asin(', 'arc sinus'], ['acos', 'acos(', 'arc cosinus'], ['atan', 'atan(', 'arc tangente'], ['ln', 'ln(', 'logarithme népérien'], ['log', 'log(', 'logarithme décimal']],
  [['√', '@racine', 'racine carrée'], ['x²', '@carre', 'au carré'], ['xʸ', '@pow', 'puissance'], ['eˣ', '@exp', 'exponentielle'], ['10ˣ', '@dix', 'dix puissance']],
  [['(', '(', 'parenthèse ouvrante'], [')', ')', 'parenthèse fermante'], ['x⁻¹', '@inverse', 'inverse'], ['n!', '!', 'factorielle'], ['a/b', '@frac', 'fraction']],
];
const NUM = [
  [['7'], ['8'], ['9'], ['÷', '÷', 'divisé par', 'op'], ['⌫', '@eff', 'effacer', 'ctl']],
  [['4'], ['5'], ['6'], ['×', '×', 'multiplié par', 'op'], ['AC', '@ac', 'tout effacer', 'ctl']],
  [['1'], ['2'], ['3'], ['−', '−', 'moins', 'op'], ['Ans', 'Ans', 'dernier résultat', 'ctl']],
  [['0'], [',', ',', 'virgule'], ['×10ⁿ', '@x10', 'fois dix puissance', 'ctl'], ['+', '+', 'plus', 'op'], ['=', '@egal', 'égale', 'egal']],
];
const FLECHES = [['◀', 'g', 'curseur à gauche'], ['▲', 'h', 'curseur vers le haut'], ['▼', 'b', 'curseur vers le bas'], ['▶', 'd', 'curseur à droite']];
const chars = txt => [...txt];

export function Calculatrice({ activeId }) {
  const [ouvert, setOuvert] = useState(false), [ed, setEd] = useState(vide()), [hist, setHist] = useState([]), [msg, setMsg] = useState('');
  const [angle, setAngle] = useState(() => (lire('calc-angle', 'deg') === 'rad' ? 'rad' : 'deg'));
  const [cs, setCs] = useState(() => { const n = parseInt(lire('calc-cs', '0'), 10); return n >= 2 && n <= 8 ? n : 0; });
  const [constantes, setConstantes] = useState(false), [sci, setSci] = useState(() => lire('calc-sci', '1') !== '0');
  const zone = useRef(null), affichage = useRef(null), bouton = useRef(null), ans = useRef(0);

  const fermer = useCallback(() => { setOuvert(false); bouton.current?.focus(); }, []);
  useEffect(() => {
    if (!ouvert) return undefined;
    const f = e => { if (e.key === 'Escape') fermer(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [ouvert, fermer]);
  useEffect(() => { if (ouvert) zone.current?.focus({ preventScroll: true }); }, [ouvert]);
  useEffect(() => { if (affichage.current) affichage.current.scrollTop = affichage.current.scrollHeight; }, [hist, msg, ouvert]);

  const maj = f => { setEd(f); setMsg(''); zone.current?.focus({ preventScroll: true }); };
  const egal = () => {
    const texte = serialiser(ed.t);
    if (!texte.trim()) return;
    try {
      const v = calculer(texte, { angle, ans: ans.current });
      const r = formater(v, cs);
      ans.current = v;
      setHist(h => [...h.slice(-5), { t: ed.t, texte: r.texte, brut: r.brut }]); setMsg(''); setEd(vide());
    } catch (e) { setMsg(e.message || 'Calcul impossible.'); }
  };
  const agir = action => {
    switch (action) {
      case '@egal': return egal();
      case '@eff': return maj(s => supprimer(s));
      case '@ac': setHist([]); ans.current = 0; return maj(() => vide());
      case '@frac': return maj(s => fraction(s));
      case '@racine': return maj(s => racine(s));
      case '@pow': return maj(s => puissance(s));
      case '@carre': return maj(s => puissance(s, ['2'], true));
      case '@inverse': return maj(s => puissance(s, ['−', '1'], true));
      case '@exp': return maj(s => puissance(insererTexte(s, ['e']), []));
      case '@dix': return maj(s => puissance(insererTexte(s, ['1', '0']), []));
      case '@x10': return maj(s => puissance(insererTexte(s, ['×', '1', '0']), []));
      default: return maj(s => insererTexte(s, chars(action)));
    }
  };
  const touche = ([lib, action, nom, type]) => {
    const couleur = type === 'egal' ? { background: '#f5a31a', color: '#3a2500', border: '1px solid #f5a31a' } : type === 'op' || type === 'ctl' ? { background: '#e8f1fb', color: '#0b4f94', border: '1px solid #c3d9f1' } : { background: '#fff', color: '#0c1a2e', border: '1px solid #cbd5e1' };
    return <button key={lib} type="button" onClick={() => agir(action ?? lib)} aria-label={nom || lib}
      style={{ ...couleur, minHeight: 36, borderRadius: 10, font: `700 ${lib.length > 3 ? 13 : 16}px inherit`, fontFamily: 'inherit', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}>{lib}</button>;
  };
  const surClavier = e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Enter') { e.preventDefault(); return egal(); }
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); return maj(s => supprimer(s)); }
    const fl = { ArrowLeft: 'g', ArrowRight: 'd', ArrowUp: 'h', ArrowDown: 'b' }[k];
    if (fl) { e.preventDefault(); return maj(s => deplacer(s, fl)); }
    if (k.length === 1 && k !== ' ') { e.preventDefault(); maj(s => inserer(s, k)); }
  };
  const surColler = e => { e.preventDefault(); const txt = (e.clipboardData?.getData('text') || '').replace(/\s+/g, '').replace(/\//g, '÷'); if (txt) maj(s => insererTexte(s, depuisTexte(txt))); };

  if (!(activeId > 0)) return null;
  const lisible = serialiser(ed.t);
  return (
    <>
      <style>{STYLE_CSS}</style>
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
            <b style={{ fontSize: 14, flex: 1, whiteSpace: 'nowrap' }}><Pic n="calc"/></b>
            <button type="button" role="switch" aria-checked={angle === 'rad'} onClick={() => { const n = angle === 'deg' ? 'rad' : 'deg'; setAngle(n); ecrire('calc-angle', n); }} aria-label={`Angles en ${angle === 'deg' ? 'degrés' : 'radians'} : appuyer pour changer`}
              style={{ border: '1px solid #c3d9f1', background: '#e8f1fb', color: '#0b4f94', borderRadius: 999, padding: '4px 10px', font: '800 12.5px inherit', fontFamily: 'inherit', cursor: 'pointer' }}>{angle === 'deg' ? 'DEG' : 'RAD'}</button>
            <label style={{ fontSize: 12.5, color: KIT.txt2, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>Chiffres sign.
              <select value={cs} onChange={e => { const n = Number(e.target.value); setCs(n); ecrire('calc-cs', String(n)); }} aria-label="Nombre de chiffres significatifs du résultat" style={{ width: 'auto', minHeight: 0, height: 28, fontSize: 13, borderRadius: 8, border: `1px solid ${KIT.bord}`, padding: '0 4px' }}>
                <option value={0}>auto</option>{[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select></label>
            <button type="button" onClick={fermer} aria-label="Fermer la calculatrice" style={{ border: 0, background: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#475569', padding: '2px 6px', width: 'auto', minHeight: 0 }}>×</button>
          </div>
          <div ref={affichage} aria-live="polite" style={{ background: '#f1f5f9', borderRadius: 12, padding: '6px 10px', minHeight: 40, maxHeight: 96, overflowY: 'auto', fontSize: 15, textAlign: 'right' }}>
            {hist.length === 0 && !msg && <div style={{ color: KIT.txt2, textAlign: 'left', fontSize: 13 }}>Touche « a/b » ou / : fraction. Touche ^ ou xʸ : exposant. Flèches : se déplacer (→ pour sortir d’un exposant).</div>}
            {hist.map((h, i) => (
              <div key={i} style={{ color: KIT.txt2, margin: '2px 0' }}><Rendu t={h.t} c={-1} /> = <button type="button" onClick={() => maj(s => insererTexte(s, depuisTexte(h.brut)))} aria-label={`Réutiliser le résultat ${h.texte}`} style={{ border: 0, background: 'none', padding: 0, font: '800 15px inherit', fontFamily: 'inherit', color: i === hist.length - 1 ? '#0c1a2e' : '#0b4f94', cursor: 'pointer' }}>{h.texte}</button></div>))}
            {msg && <div role="alert" style={{ color: '#b91c1c', fontWeight: 700, textAlign: 'left', fontSize: 13.5 }}>{msg}</div>}
          </div>
          <div ref={zone} tabIndex={0} role="textbox" aria-label={`Calcul à effectuer. ${lisible || 'vide'}`} data-saisie onKeyDown={surClavier} onPaste={surColler} onClick={() => zone.current?.focus()}
            style={{ boxSizing: 'border-box', margin: '6px 0', padding: '8px 10px', minHeight: 62, borderRadius: 12, border: '2px solid #0b4f94', font: '600 20px inherit', fontFamily: 'inherit', textAlign: 'right', overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span><Rendu t={ed.t} c={ed.c} /></span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center' }}>
            <button type="button" aria-expanded={sci} onClick={() => { setSci(!sci); ecrire('calc-sci', sci ? '0' : '1'); }} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 999, padding: '3px 9px', font: '700 12px inherit', fontFamily: 'inherit', cursor: 'pointer', color: '#475569' }}>Fonctions</button>
            <button type="button" aria-expanded={constantes} onClick={() => setConstantes(!constantes)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 999, padding: '3px 9px', font: '700 12px inherit', fontFamily: 'inherit', cursor: 'pointer', color: '#475569' }}>Constantes</button>
            <span style={{ flex: 1 }} />
            {FLECHES.map(([l, sens, nom]) => <button key={sens} type="button" onClick={() => maj(s => deplacer(s, sens))} aria-label={nom}
              style={{ width: 30, minWidth: 0, minHeight: 0, height: 30, border: '1px solid #c3d9f1', background: '#e8f1fb', color: '#0b4f94', borderRadius: 9, fontSize: 12, cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}>{l}</button>)}
          </div>
          {constantes && (
            <div style={{ display: 'grid', gap: 4, marginBottom: 6 }} role="group" aria-label="Constantes physiques">
              {Object.entries(CONSTANTES).map(([sym, c]) => (
                <button key={sym} type="button" onClick={() => agir(sym)} title={`${c.nom} = ${c.txt} ${c.unite}`}
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
