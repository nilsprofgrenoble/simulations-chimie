// ====================================================
//  Montage animé de la simulation 189 : montage à reflux ⇄ montage de Dean-Stark (schéma simplifié, non à l'échelle sauf les NIVEAUX).
//  Ballon bicol (col central : réfrigérant ou piège de Dean-Stark ; col latéral : ampoule de coulée), barreau aimanté, chauffe-ballon à bouton de puissance
//  sur support élévateur, pince sur le col du ballon, potence ; eau froide entrée en bas, sortie en haut ; sommet du réfrigérant OUVERT à l'air.
//  Niveaux calculés à partir des quantités de matière : V = n·M/ρ (éthanol 46,07 g/mol, 0,789 g/mL ; acide éthanoïque 60,05 g/mol, 1,05 g/mL).
// ====================================================
import { useId, useState } from 'react';
import { COL } from './optOutils';
import { Fl } from './optSchemas';
import { ML_ENTRAINEUR, ML_BALLON, volumeMelange, niveauY, useAnime, useGouttes, LEGENDE, LEGENDE_DS, texteEtat, NOTE_REFLUX, NOTE_DS, NOTE_EAU } from './optMontageModele';
import { KIT, styleBouton, stylePetitBouton, Section } from '../commun';

const NBF = '\u202f';
const R = 56, CX = 165, CY = 290;
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, a = 'start' }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} stroke="#fff" strokeWidth={3.5} paintOrder="stroke">{children}</text>);
const Mk = ({ x, y, n, lx, ly }) => (
  <g><line x1={x} y1={y} x2={lx} y2={ly} stroke={COL.gris} strokeWidth={1.6} strokeLinecap="round"/><circle cx={lx} cy={ly} r={2.4} fill={COL.gris}/>
    <circle cx={x} cy={y} r={12.5} fill="#fff" stroke={COL.txt} strokeWidth={1.8}/><text x={x} y={y + 6} fontSize={18} fontWeight={700} fill={COL.txt} textAnchor="middle">{n}</text></g>);
const BOLT = 'M 2 -7 L -4 1 L 0 1 L -2 7 L 4 -2 L 0 -2 Z';
const mix = (a, b, t) => Math.round(a + (b - a) * t);

const BULLES = [[150, 0.2], [178, 0.5], [165, 0.1], [140, 0.7], [190, 0.35], [158, 0.85], [172, 0.6], [184, 0.9]];
const ETINCELLES = [[138, 326], [192, 326], [152, 333], [178, 333], [165, 324]];

export function SvgMontage({ T = 75, nA = 1, nB = 1, cat = false, ds = false, eauMl = 0, vol, goutte = null, reserve = 0.5 }) {
  const id = useId().replace(/\W/g, ''), V = vol ?? (volumeMelange(nA, nB) + (ds ? ML_ENTRAINEUR : 0)), yN = niveauY(V);
  const chaud = T >= 75, nBul = chaud ? 8 : 0, nGo = chaud ? 4 : 0, durGo = 1.0, brume = chaud ? 0.6 : 0;
  const tc = (T - 20) / 55, cChauf = `rgb(${mix(226, 253, tc)},${mix(232, 186, tc)},${mix(240, 116, tc)})`, angle = -120 + tc * 240;
  const durEt = (1.8 - 1.1 * tc).toFixed(2);
  const ax = ds ? 235 : 165;            // axe du réfrigérant
  const yH = ds ? 94 : 128, yS = ds ? 40 : 50;        // hauteurs des tuyaux d'eau (entrée en bas, sortie en haut)
  const yJ = ds ? 30 : 36, yJ2 = ds ? 104 : 140;       // jaquette du réfrigérant
  const yBas = ds ? 112 : 168;                         // pied du tube intérieur
  const ampBas = 174 + 24 * (1 - reserve);             // niveau dans l'ampoule
  const ml = Math.max(0, eauMl), yEau = 186 - ml * 2.64;
  return (
    <svg viewBox="0 0 420 430" style={{ width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={ds ? 'Schéma d’un montage de Dean-Stark : ballon chauffé sur un chauffe-ballon, bras latéral par lequel montent les vapeurs, réfrigérant à eau (entrée en bas, sortie en haut) posé sur un tube gradué à robinet où l’eau, plus dense, se rassemble sous le cyclohexane, le trop-plein de solvant retombant dans le ballon.'
        : 'Schéma d’un montage à reflux : ballon sur un chauffe-ballon à bouton de puissance, surmonté d’un réfrigérant vertical ouvert à l’air dont l’eau froide entre par le bas et sort par le haut, ballon fixé à une potence par une pince, ampoule de coulée sur le col latéral.'}>
      <defs><clipPath id={'b' + id}><circle cx={CX} cy={CY} r={R - 1}/></clipPath><clipPath id={'t' + id}><rect x={225} y={127} width={20} height={59}/></clipPath></defs>
      <style>{`
        .mt-b { transform: translateY(var(--st, 0px)); } .mt-g { transform: translateY(var(--st, 0px)); } .mt-e { opacity: 1; } .mt-br { opacity: var(--o1); }
        @media (prefers-reduced-motion: no-preference) {
          .mt-b { animation: mt-bulle var(--d, 1.6s) linear infinite; } .mt-g { animation: mt-goutte var(--d, 1.2s) linear infinite; }
          .mt-e { animation: mt-etin var(--d, 1.2s) ease-in-out infinite; } .mt-br { animation: mt-brume 1.6s ease-in-out infinite; }
          .mt-a { animation: mt-ajout 0.45s linear infinite; }
          @keyframes mt-bulle { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(var(--dy)); opacity: 0; } }
          @keyframes mt-goutte { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(var(--dy)); opacity: 1; } }
          @keyframes mt-etin { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
          @keyframes mt-brume { 0%, 100% { opacity: var(--o1); } 50% { opacity: var(--o2); } }
          @keyframes mt-ajout { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(var(--dy)); opacity: 1; } }
        }`}</style>
      {/* potence : tige, socle ; noix et bras de la pince sur le col du ballon */}
      <rect x={90} y={412} width={320} height={8} rx={3} fill="#94a3b8" stroke={COL.verre} strokeWidth={2}/>
      <line x1={398} y1={22} x2={398} y2={412} stroke="#64748b" strokeWidth={7} strokeLinecap="round"/>
      <line x1={174} y1={226} x2={394} y2={226} stroke="#64748b" strokeWidth={5} strokeLinecap="round"/>
      <rect x={386} y={218} width={24} height={16} rx={3} fill="#cbd5e1" stroke={COL.verre} strokeWidth={2}/>
      {/* support élévateur */}
      <rect x={100} y={386} width={130} height={7} rx={2} fill="#cbd5e1" stroke={COL.verre} strokeWidth={2}/>
      <rect x={100} y={404} width={130} height={7} rx={2} fill="#cbd5e1" stroke={COL.verre} strokeWidth={2}/>
      <path d="M 114 393 L 216 404 M 216 393 L 114 404" stroke={COL.verre} strokeWidth={2.2} strokeLinecap="round"/>
      <circle cx={242} cy={398} r={7} fill="#e2e8f0" stroke={COL.verre} strokeWidth={2}/><line x1={230} y1={398} x2={235} y2={398} stroke={COL.verre} strokeWidth={2.2}/>
      {/* chauffe-ballon : coque (vue en coupe) et boîtier avec bouton de puissance */}
      <path d="M 95 290 A 70 70 0 0 0 235 290 Z" fill={cChauf} stroke={COL.verre} strokeWidth={3} strokeLinejoin="round"/>
      <rect x={120} y={354} width={90} height={32} rx={6} fill="#e2e8f0" stroke={COL.verre} strokeWidth={2.4}/>
      <circle cx={165} cy={370} r={12} fill="#fff" stroke={COL.verre} strokeWidth={2.2}/>
      <line x1={165} y1={370} x2={165} y2={361} stroke={COL.rouge} strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${angle} 165 370)`}/>
      <circle cx={140} cy={370} r={2.2} fill={COL.gris}/><circle cx={190} cy={370} r={2.2} fill={chaud ? COL.rouge : COL.gris}/>
      {/* liquide du ballon */}
      <g clipPath={`url(#b${id})`}>
        <rect x={100} y={yN} width={130} height={260} fill={ds ? '#e6f0c8' : '#dbeafe'}/>
        <line x1={100} y1={yN} x2={230} y2={yN} stroke="#2563eb" strokeWidth={2}/>
        {[[152, 341], [165, 343], [178, 341]].map(([x, y], i) => <polygon key={i} points={`${x - 4},${y + 2} ${x - 3},${y - 3} ${x + 2},${y - 4} ${x + 4},${y + 1} ${x + 1},${y + 3}`} fill="#d6d3d1" stroke={COL.verre} strokeWidth={1.2}/>)}
      </g>
      {/* bulles d'ébullition : leur nombre et leur rythme croissent avec la température (absentes sous 60 °C) */}
      {BULLES.slice(0, nBul).map(([x, f], i) => { const dy = Math.min(-30, -(330 - yN - 6)); return (
        <circle key={i} className="mt-b" cx={x} cy={330} r={3 + (i % 3)} fill="none" stroke="#1d4ed8" strokeWidth={1.6} clipPath={`url(#b${id})`}
          style={{ '--dy': dy + 'px', '--st': (dy * f).toFixed(0) + 'px', '--d': (1.5 - 0.5 * tc).toFixed(2) + 's', animationDelay: (-f * 1.5).toFixed(2) + 's' }}/>); })}
      {/* catalyseur : étincelles en nombre CONSTANT (non consommé) ; le scintillement s'accélère avec la température sans jamais cesser */}
      {cat && ETINCELLES.map(([x, y], i) => (
        <path key={i} className="mt-e" d={BOLT} transform={`translate(${x} ${y}) scale(1.3)`} fill="#f59e0b" stroke="#92400e" strokeWidth={1}
          style={{ '--d': durEt + 's', animationDelay: (-i * 0.3).toFixed(1) + 's' }}/>))}
      {/* verre du ballon : sphère, col central, col latéral */}
      <path d="M 174 235 A 56 56 0 1 1 121 255.4 M 139 240.4 A 56 56 0 0 1 156 235" fill="none" stroke={COL.verre} strokeWidth={3} strokeLinecap="round"/>
      <path d="M 156 176 V 235 M 174 176 V 235" fill="none" stroke={COL.verre} strokeWidth={3} strokeLinecap="round"/>
      <path d="M 121 214 V 255 M 139 214 V 241" fill="none" stroke={COL.verre} strokeWidth={3} strokeLinecap="round"/>
      {/* ampoule de coulée sur le col latéral (le réactif ajouté tombe goutte à goutte dans le ballon) */}
      <rect x={117} y={208} width={26} height={9} rx={2} fill="#f1f5f9" stroke={COL.verre} strokeWidth={2}/>
      <path d="M 127 217 V 236 M 133 217 V 236" stroke={COL.verre} strokeWidth={2.2} fill="none" strokeLinecap="round"/>
      <path d="M 127 200 L 112 178 C 104 168 106 152 120 148 H 136 C 150 152 152 168 144 178 L 133 200 Z" fill="#fff" stroke={COL.verre} strokeWidth={2.4} strokeLinejoin="round"/>
      <clipPath id={'a' + id}><path d="M 127 200 L 112 178 C 104 168 106 152 120 148 H 136 C 150 152 152 168 144 178 L 133 200 Z"/></clipPath>
      <rect x={100} y={ampBas} width={56} height={52} fill="#dbeafe" clipPath={`url(#a${id})`}/>
      <rect x={118} y={140} width={20} height={8} rx={2} fill="#94a3b8" stroke={COL.verre} strokeWidth={1.8}/>
      <rect x={118} y={201} width={24} height={6} rx={2} fill="#e2e8f0" stroke={COL.verre} strokeWidth={1.8}/><line x1={118} y1={204} x2={106} y2={199} stroke={COL.verre} strokeWidth={2.2} strokeLinecap="round"/>
      {goutte && [0, 1, 2].map(i => <ellipse key={i} className="mt-a" cx={130} cy={238} rx={2.6} ry={3.4} fill={goutte === 'cat' ? '#d97706' : '#2563eb'} stroke="#fff" strokeWidth={0.8}
        style={{ '--dy': (yN - 238 - 3) + 'px', animationDelay: (-i * 0.15).toFixed(2) + 's' }}/>)}
      {/* pince fixée sur le col du ballon */}
      <rect x={150} y={218} width={30} height={16} rx={3} fill="#cbd5e1" stroke={COL.verre} strokeWidth={2}/>
      {!ds && (<g>
        {/* réfrigérant droit, vertical : tube intérieur ouvert à l'air en haut, jaquette parcourue par l'eau */}
        <rect x={143} y={yJ} width={44} height={yJ2 - yJ} fill="#e0f2fe" stroke={COL.verre} strokeWidth={2.6}/>
        <rect x={156} y={14} width={18} height={yBas - 14} fill="#fff" stroke={COL.verre} strokeWidth={2.6}/>
        <rect x={151} y={10} width={28} height={6} rx={2} fill="#f1f5f9" stroke={COL.verre} strokeWidth={1.8}/>
        <rect x={151} y={yBas} width={28} height={9} rx={2} fill="#f1f5f9" stroke={COL.verre} strokeWidth={2}/>
        {brume > 0 && <rect className="mt-br" x={157} y={78} width={16} height={yBas - 80} fill="#94a3b8" style={{ '--o1': brume * 0.55, '--o2': brume }}/>}
        {Array.from({ length: nGo }).map((_, i) => <ellipse key={i} className="mt-g" cx={165} cy={104} rx={2.6} ry={3.4} fill={COL.bleu}
          style={{ '--dy': (yN - 104 - 4) + 'px', '--st': ((yN - 108) * i / Math.max(1, nGo)).toFixed(0) + 'px', '--d': durGo + 's', animationDelay: (-i * durGo / Math.max(1, nGo)).toFixed(2) + 's' }}/>)}
      </g>)}
      {ds && (<g>
        {/* bras latéral (vapeurs vers le haut, trop-plein vers le ballon) et piège de Dean-Stark gradué, robinet en bas */}
        <path d="M 157 176 V 131 L 223 113 M 173 176 V 145 L 223 127 M 223 127 V 186 M 247 108 V 186" fill="none" stroke={COL.verre} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 223 186 H 247" stroke={COL.verre} strokeWidth={2.6} strokeLinecap="round"/>
        <rect x={151} y={168} width={28} height={9} rx={2} fill="#f1f5f9" stroke={COL.verre} strokeWidth={2}/>
        <g clipPath={`url(#t${id})`}><rect x={224} y={127} width={22} height={59} fill="#fef9c3"/><rect x={224} y={yEau} width={22} height={186 - yEau} fill={COL.eau}/>
          {ml > 0 && <line x1={224} y1={yEau} x2={246} y2={yEau} stroke="#2563eb" strokeWidth={1.6}/>}</g>
        {[10, 20].map(m => <text key={'g' + m} x={251} y={186 - m * 2.64 + 6} fontSize={18} fontWeight={700} fill={COL.txt} stroke="#fff" strokeWidth={3} paintOrder="stroke">{m}</text>)}
        {[0, 5, 10, 15, 20].map(m => <line key={m} x1={223} y1={186 - m * 2.64} x2={m % 10 === 0 ? 233 : 229} y2={186 - m * 2.64} stroke={COL.verre} strokeWidth={1.6}/>)}
        <rect x={219} y={100} width={32} height={10} rx={2} fill="#f1f5f9" stroke={COL.verre} strokeWidth={2}/>
        <rect x={226} y={14} width={18} height={88} fill="#fff" stroke={COL.verre} strokeWidth={2.6}/>
        <rect x={221} y={10} width={28} height={6} rx={2} fill="#f1f5f9" stroke={COL.verre} strokeWidth={1.8}/>
        <rect x={213} y={yJ} width={44} height={yJ2 - yJ} fill="#e0f2fe" stroke={COL.verre} strokeWidth={2.6}/>
        <rect x={226} y={yJ} width={18} height={yJ2 - yJ} fill="#fff" stroke={COL.verre} strokeWidth={2.2}/>
        {brume > 0 && <rect className="mt-br" x={227} y={64} width={16} height={36} fill="#94a3b8" style={{ '--o1': brume * 0.55, '--o2': brume }}/>}
        <path d="M 232 186 V 205 M 238 186 V 205" stroke={COL.verre} strokeWidth={2.2} strokeLinecap="round"/>
        <rect x={218} y={190} width={36} height={8} rx={3} fill="#e2e8f0" stroke={COL.verre} strokeWidth={2}/><line x1={254} y1={194} x2={268} y2={188} stroke={COL.verre} strokeWidth={2.4} strokeLinecap="round"/><circle cx={270} cy={187} r={3.4} fill={COL.verre}/>
        {chaud && <g><Fl x1={165} y1={168} x2={165} y2={150} c={COL.gris} w={1.8} tete={6} demi={2.6}/><Fl x1={181} y1={139} x2={212} y2={131} c={COL.gris} w={1.8} tete={6} demi={2.6}/><Fl x1={235} y1={96} x2={235} y2={78} c={COL.gris} w={1.8} tete={6} demi={2.6}/></g>}
        {Array.from({ length: nGo }).map((_, i) => <ellipse key={i} className="mt-g" cx={235} cy={106} rx={2.4} ry={3.2} fill={COL.bleu}
          style={{ '--dy': 18 + 'px', '--st': (9 * (i % 2)) + 'px', '--d': durGo * 0.6 + 's', animationDelay: (-i * 0.3).toFixed(2) + 's' }}/>)}
        {nGo > 0 && [0, 1].map(i => <ellipse key={'r' + i} className="mt-g" cx={165} cy={150} rx={2.4} ry={3.2} fill="#ca8a04"
          style={{ '--dy': (yN - 152) + 'px', '--st': (((yN - 152) * i) / 2).toFixed(0) + 'px', '--d': durGo * 1.4 + 's', animationDelay: (-i * durGo * 0.7).toFixed(2) + 's' }}/>)}
      </g>)}
      {/* tuyaux d'eau : ENTRÉE EN BAS, SORTIE EN HAUT ; flèches de sens */}
      <path d={`M ${ax + 22} ${yH} H ${ax + 78}`} stroke="#7dd3fc" strokeWidth={6} strokeLinecap="round" fill="none"/>
      <path d={`M ${ax + 22} ${yS} H ${ax + 78}`} stroke="#7dd3fc" strokeWidth={6} strokeLinecap="round" fill="none"/>
      <Fl x1={ax + 74} y1={yH} x2={ax + 34} y2={yH} c={COL.bleu} w={2.2} tete={8}/><Fl x1={ax + 34} y1={yS} x2={ax + 74} y2={yS} c={COL.bleu} w={2.2} tete={8}/>
      <Tx x={ax + 84} y={yH + 6} c={COL.bleu}>entrée</Tx><Tx x={ax + 84} y={yS + 6} c={COL.bleu}>sortie</Tx>
      {/* repères numérotés (légende sous le schéma) */}
      {!ds && <Mk x={106} y={64} n={1} lx={143} ly={64}/>}
      <Mk x={330} y={246} n={2} lx={330} ly={229}/>
      <Mk x={364} y={150} n={3} lx={395} ly={150}/>
      <Mk x={262} y={270} n={4} lx={216} ly={274}/>
      <Mk x={262} y={372} n={5} lx={211} ly={372}/>
      <Mk x={272} y={398} n={6} lx={251} ly={398}/>
      <Mk x={60} y={178} n={7} lx={106} ly={178}/>
      {ds && <g><Mk x={185} y={50} n={1} lx={213} ly={50}/><Mk x={190} y={88} n={8} lx={190} ly={121}/><Mk x={196} y={160} n={10} lx={228} ly={132}/><Mk x={300} y={180} n={9} lx={248} ly={180}/><Mk x={296} y={205} n={11} lx={272} ly={192}/></g>}
      {cat && <g><Tx x={242} y={322} s={18} c="#92400e">catalyseur H⁺</Tx><Tx x={242} y={342} s={18} c="#92400e">non consommé</Tx><line x1={238} y1={321} x2={198} y2={321} stroke="#92400e" strokeWidth={1.4} strokeDasharray="3 3"/></g>}
    </svg>);
}

export function Legende({ ds }) {
  const l = [[1, LEGENDE[0]], ...LEGENDE.slice(1).map((t, i) => [i + 2, t])];
  const lignes = ds ? [...l.filter(([n]) => n !== 1), [1, 'réfrigérant vertical posé sur le piège, ouvert à l’air en haut (eau froide : entrée en bas, sortie en haut)'], ...Object.entries(LEGENDE_DS).map(([n, t]) => [+n, t])] : l;
  lignes.sort((a, b) => a[0] - b[0]);
  return <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '2px 14px', fontSize: 13.5, color: KIT.txt2, lineHeight: 1.45 }}>
    {lignes.map(([n, t]) => <li key={n}><strong style={{ color: KIT.txt }}>{n}</strong> {t}</li>)}</ul>;
}

// Bloc complet : schéma animé + bouton à deux positions « Reflux / Dean-Stark » + état ; légende et notes dans une rubrique repliée
export function MontageBloc({ etat, goutte, eauMl = 0, onBascule, afficheBascule = true, reserve, noteEau = false, message = null, sousBascule = null }) {
  const cible = volumeMelange(etat.nA, etat.nB) + (etat.ds ? ML_ENTRAINEUR : 0), vol = useAnime(cible), ds = etat.ds, [leg, setLeg] = useState(false);
  const b = on => ({ ...stylePetitBouton(on === ds, '#0369a1'), minHeight: 44, minWidth: 130, padding: '8px 14px', fontSize: 15 });
  return (
    <div>
      <SvgMontage T={etat.T} nA={etat.nA} nB={etat.nB} cat={etat.cat} ds={ds} eauMl={eauMl} vol={vol} goutte={goutte} reserve={reserve ?? Math.max(0, Math.min(1, (5 - etat.nB) / 4))}/>
      {afficheBascule && <div role="group" aria-label="Type de montage" style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '8px 0 4px', flexWrap: 'wrap' }}>
        <button type="button" aria-pressed={!ds} onClick={() => onBascule(false)} style={b(false)}>Montage à reflux</button>
        <button type="button" aria-pressed={ds} onClick={() => onBascule(true)} style={b(true)}>Montage de Dean-Stark</button></div>}
      {sousBascule}
      {message && <div role="status" style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginBottom: 4 }}>{message}</div>}
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, textAlign: 'center' }}>
        Volume dans le ballon : <strong>{Math.round(cible)}{NBF}mL</strong>{ds ? ` (dont ${ML_ENTRAINEUR}${NBF}mL de cyclohexane, volume indicatif)` : ''}, ballon de {ML_BALLON}{NBF}mL.</div>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5, marginTop: 4 }} role="status">{texteEtat(etat.T, ds)}</div>
      {ds && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 4 }}>{NOTE_DS}{noteEau ? ' ' + NOTE_EAU : ''}</div>}
      <Section titre="Légende et notes du montage" ouvert={leg} onBascule={() => setLeg(o => !o)}>
        <Legende ds={ds}/>
        {!ds && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 6 }}>{NOTE_REFLUX}</div>}
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Schéma simplifié, non à l’échelle (seuls les niveaux le sont).</div>
      </Section>
    </div>);
}

// Montage du parcours guidé : état local, commandes réduites à celles de l'étape
export function MontageGuide({ init, commandes = [], eauMl = 0, reserve, goutteInit = null }) {
  const [etat, setEtat] = useState(init), [goutte, lancer] = useGouttes(goutteInit);
  const bt = { ...stylePetitBouton(false, '#0369a1'), minHeight: 44, fontSize: 15 };
  return (
    <div>
      <MontageBloc etat={etat} goutte={goutte} eauMl={etat.ds ? eauMl : 0} reserve={reserve} afficheBascule={commandes.includes('bascule')} onBascule={ds => setEtat(s => ({ ...s, ds }))}/>
      {commandes.includes('acide') && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <button type="button" style={{ ...bt, background: '#fff' }} onClick={() => lancer('cat')}>Rejouer : quelques gouttes d’acide sulfurique</button></div>}
      {commandes.includes('ajout') && <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" style={styleBouton(true, '#15803d')} disabled={etat.nB >= init.nB + 1} onClick={() => { setEtat(s => ({ ...s, nB: s.nB + 1 })); lancer('eth'); }}>Ajouter 1,00 mol d’éthanol</button>
        <button type="button" style={bt} onClick={() => setEtat(init)}>Rétablir</button></div>}
      {commandes.includes('rapports') && <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14, color: KIT.txt }}>Éthanol pour 1,00 mol d’acide{' '}
          <select value={etat.nB} onChange={e => { const v = +e.target.value; if (v > etat.nB) lancer('eth'); setEtat(s => ({ ...s, nB: v })); }}
            style={{ font: 'inherit', fontSize: 15, minHeight: 44, borderRadius: 10, border: `1px solid ${KIT.bord}`, padding: '6px 8px' }}>
            {[1, 2, 3, 5].map(r => <option key={r} value={r}>{String(r.toFixed(2)).replace('.', ',')} mol</option>)}</select></label></div>}
    </div>);
}
