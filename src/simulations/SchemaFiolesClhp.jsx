// Schéma des fioles du dosage de la caféine par CLHP avec étalon interne (document 1 du sujet).
// Inspiré du schéma de la simulation « Étalon interne » ; valeurs de l'énoncé du TP (benzoïne = étalon interne).
import { useState, useEffect } from 'react';

function Etroit() {
  const T = (x, y, t, o = {}) => <text x={x} y={y} textAnchor="middle" fontSize={o.f || 12.5} fontWeight={o.b ? 700 : 400} fill={o.c || '#334155'}>{t}</text>;
  const F = (x, y, w, h, fill, stroke, titre, lignes, ct) => <g><rect x={x} y={y} width={w} height={h} rx="8" fill={fill} stroke={stroke} strokeWidth="1.8" />{T(x + w / 2, y + 19, titre, { b: 1, c: ct })}{lignes.map((l, i) => T(x + w / 2, y + 38 + i * 16, l, { f: 11.5, c: '#475569' }))}</g>;
  const fl = (x1, y1, x2, y2, v, xt, yt) => <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#fcl2)" />{T(xt, yt, v, { f: 12, c: '#0f172a', b: 1 })}</g>;
  return (
    <svg width="100%" viewBox="0 0 360 400" role="img" aria-label="Fiole 3, référence : 100 µL de la fiole 1 et 200 µL de la fiole 2, qsp 20 mL. Fiole 5, échantillon : 100 µL de la fiole 4 et 200 µL de la fiole 2, qsp 20 mL." style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <defs><marker id="fcl2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" /></marker></defs>
      {T(180, 16, 'Référence', { b: 1, f: 13, c: '#9a6000' })}
      {F(8, 26, 165, 64, '#e8f8f5', '#2a9d8f', 'Fiole 1 (50 mL)', ['caféine ≈ 50 mg', 'éluant qsp 50 mL'], '#1a7a6e')}
      {F(187, 26, 165, 64, '#f3eeff', '#6a4c93', 'Fiole 2 (50 mL)', ['benzoïne ≈ 100 mg', 'éluant qsp 50 mL'], '#4a2c73')}
      {fl(90, 90, 150, 126, '100 µL', 82, 114)}{fl(270, 90, 210, 126, '200 µL', 282, 114)}
      {F(95, 128, 170, 52, '#fffbe6', '#e9a824', 'Fiole 3 (20 mL)', ['référence, qsp éluant'], '#9a6000')}
      {T(180, 212, 'Échantillon', { b: 1, f: 13, c: '#9a6000' })}
      {F(8, 222, 165, 64, '#fff0f5', '#e63946', 'Fiole 4 (50 mL)', ['m g de gel, filtré', 'éluant qsp 50 mL'], '#a01020')}
      {F(187, 222, 165, 64, '#f3eeff', '#6a4c93', 'Fiole 2 (même)', ['benzoïne ≈ 100 mg', 'éluant qsp 50 mL'], '#4a2c73')}
      {fl(90, 286, 150, 322, '100 µL', 82, 310)}{fl(270, 286, 210, 322, '200 µL', 282, 310)}
      {F(95, 324, 170, 52, '#fffbe6', '#e9a824', 'Fiole 5 (20 mL)', ['échantillon, qsp éluant'], '#9a6000')}
      {T(180, 394, 'Fioles 3 et 5 : injectées en CLHP', { f: 11, c: '#64748b' })}
    </svg>);
}

export default function SchemaFiolesClhp() {
  const [etroit, setEtroit] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width: 560px)').matches);
  useEffect(() => { if (!window.matchMedia) return undefined; const m = window.matchMedia('(max-width: 560px)'), f = () => setEtroit(m.matches); m.addEventListener?.('change', f); return () => m.removeEventListener?.('change', f); }, []);
  if (etroit) return <Etroit />;
  const T = (x, y, s, o = {}) => <text x={x} y={y} textAnchor="middle" fontSize={o.f || 11} fontWeight={o.b ? 700 : 400} fill={o.c || '#334155'}>{s}</text>;
  return (
    <svg width="100%" viewBox="0 0 680 240" role="img" aria-label="Fioles 1 et 2 de solutions mères ; fiole 3 : référence (100 µL de fiole 1 et 200 µL de fiole 2, qsp 20 mL) ; fiole 4 : gel dans 50 mL ; fiole 5 : échantillon injecté (100 µL de fiole 4 et 200 µL de fiole 2, qsp 20 mL)" style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <defs><marker id="fcl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" /></marker></defs>
      <rect x="10" y="10" width="150" height="86" rx="8" fill="#e8f8f5" stroke="#2a9d8f" strokeWidth="1.5" />{T(85, 28, 'Fiole 1 (50 mL)', { b: 1, c: '#1a7a6e' })}{T(85, 48, 'caféine ≈ 50 mg')}{T(85, 66, '+ éluant qsp 50 mL', { c: '#64748b', f: 10 })}
      <rect x="265" y="10" width="150" height="86" rx="8" fill="#f3eeff" stroke="#6a4c93" strokeWidth="2" />{T(340, 28, 'Fiole 2 (50 mL)', { b: 1, c: '#4a2c73' })}{T(340, 48, 'benzoïne ≈ 100 mg')}{T(340, 66, '(étalon interne)', { c: '#6a4c93', f: 10 })}{T(340, 82, '+ éluant qsp 50 mL', { c: '#64748b', f: 10 })}
      <rect x="520" y="10" width="150" height="86" rx="8" fill="#fff0f5" stroke="#e63946" strokeWidth="1.5" />{T(595, 28, 'Fiole 4 (50 mL)', { b: 1, c: '#a01020' })}{T(595, 48, 'm g de gel (à calculer)')}{T(595, 66, '+ éluant qsp 50 mL', { c: '#64748b', f: 10 })}{T(595, 82, 'puis filtration', { c: '#64748b', f: 10 })}
      <rect x="130" y="150" width="150" height="72" rx="8" fill="#fffbe6" stroke="#e9a824" strokeWidth="2" />{T(205, 168, 'Fiole 3 (20 mL)', { b: 1, c: '#9a6000' })}{T(205, 184, 'solution de référence')}{T(205, 200, 'injectée en CLHP', { c: '#64748b', f: 10 })}
      <rect x="400" y="150" width="150" height="72" rx="8" fill="#fffbe6" stroke="#e9a824" strokeWidth="2" />{T(475, 168, 'Fiole 5 (20 mL)', { b: 1, c: '#9a6000' })}{T(475, 184, 'solution échantillon')}{T(475, 200, 'injectée en CLHP', { c: '#64748b', f: 10 })}
      <line x1="85" y1="96" x2="175" y2="150" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#fcl)" />{T(95, 126, '100 µL', { f: 10 })}
      <line x1="310" y1="96" x2="235" y2="150" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#fcl)" />{T(330, 120, '200 µL', { f: 10 })}
      <line x1="370" y1="96" x2="445" y2="150" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#fcl)" />{T(345, 134, '200 µL', { f: 10 })}
      <line x1="595" y1="96" x2="515" y2="150" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#fcl)" />{T(600, 126, '100 µL', { f: 10 })}
      {T(205, 235, 'qsp éluant → 20 mL', { c: '#94a3b8', f: 9 })}{T(475, 235, 'qsp éluant → 20 mL', { c: '#94a3b8', f: 9 })}
    </svg>);
}
