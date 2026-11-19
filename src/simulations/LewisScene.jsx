/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { KIT } from "../commun";
import { chargeSigne, structureVide, liaisonsAtome } from "./lewisModele";

// ====================================================
//  Dessin d'un schéma de Lewis (sim 154) : atomes, liaisons (traits), doublets non liants (tirets), charges (cercle + / −), lacune (rectangle vide).
//  Le même dessin sert à l'éditeur (touches sur le dessin), aux cartes « À retenir » et aux schémas fixes des exercices.
//  Disposition : l'atome central au milieu, les autres atomes à l'ouest, à l'est, puis au sud et au nord ; les doublets non liants occupent les côtés libres.
//  Le dessin est une écriture, pas la forme réelle de l'entité (les angles ne sont pas ceux de la molécule).
// ====================================================
const DIRS = { E: [1, 0], N: [0, -1], W: [-1, 0], S: [0, 1] };
const OPP = { E: 'W', W: 'E', N: 'S', S: 'N' };
const ORDRE_LIBRE = ['N', 'S', 'E', 'W'];
const COL = { encre: '#0f172a', liaison: '#0369a1', doublet: '#b45309', charge: '#b91c1c', vert: '#15803d', gris: '#64748b' };

export function geometrie(ent) {
  const n = ent.atomes.length;
  if (n === 1) return { pos: [[0, 0]], voisins: [[]] };
  if (n === 2) return { pos: [[-48, 0], [48, 0]], voisins: [['E'], ['W']] };
  const cotes = n === 3 ? ['W', 'E'] : n === 4 ? ['W', 'E', 'S'] : ['W', 'N', 'E', 'S'];
  return { pos: [[0, 0], ...cotes.map(c => [DIRS[c][0] * 80, DIRS[c][1] * 80])], voisins: [cotes, ...cotes.map(c => [OPP[c]])] };
}
const cotesLibres = (g, i) => ORDRE_LIBRE.filter(c => !g.voisins[i].includes(c));

// Décrit un schéma pour la lecture à voix haute
export function descriptionSchema(ent, st) {
  const liaisons = ent.atomes.map((s, i) => (i > 0 && st.liens[i] > 0 ? `${s} lié à ${ent.atomes[0]} par ${st.liens[i] === 1 ? 'une liaison simple' : st.liens[i] === 2 ? 'une liaison double' : 'une liaison triple'}` : null)).filter(Boolean);
  const lp = ent.atomes.map((s, i) => (st.lp[i] > 0 ? `${st.lp[i]} doublet${st.lp[i] > 1 ? 's' : ''} non liant${st.lp[i] > 1 ? 's' : ''} sur ${s}` : null)).filter(Boolean);
  const ch = ent.atomes.map((s, i) => (st.ch[i] ? `charge ${chargeSigne(st.ch[i])} sur ${s}` : null)).filter(Boolean);
  const lac = ent.atomes.map((s, i) => (st.lac[i] ? `lacune électronique sur ${s}` : null)).filter(Boolean);
  const tout = [...liaisons, ...lp, ...ch, ...lac];
  return `Schéma de Lewis de ${ent.formule}${tout.length ? ' : ' + tout.join(' ; ') : ' : encore vide'}.`;
}

// Dessin SVG : à placer dans un <svg>. (cx, cy) : position de l'atome central ; s : échelle des distances ; fsA, fsC : tailles des textes (inchangées par s)
export function DessinLewis({ ent, st, cx = 150, cy = 108, s = 1, fsA = 20, fsC = 12.5, interactif = null, erreurs = [], couleurDoublet = COL.doublet }) {
  const g = geometrie(ent), R = Math.max(12, 17 * s);
  const P = g.pos.map(([x, y]) => [cx + x * s, cy + y * s]);
  const n = ent.atomes.length;
  const elems = [];
  // liaisons (traits parallèles)
  for (let k = 1; k < n; k++) {
    const o = st.liens[k]; if (!o) continue;
    const [x0, y0] = P[0], [x1, y1] = P[k], d = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / d, uy = (y1 - y0) / d, nx = -uy, ny = ux;
    for (let t = 0; t < o; t++) {
      const off = (t - (o - 1) / 2) * 6.5;
      elems.push(<line key={`l${k}-${t}`} x1={x0 + ux * R + nx * off} y1={y0 + uy * R + ny * off} x2={x1 - ux * R + nx * off} y2={y1 - uy * R + ny * off} stroke={COL.liaison} strokeWidth="3.4" strokeLinecap="round"/>);
    }
  }
  // atomes, doublets non liants, lacunes, charges
  ent.atomes.forEach((sym, i) => {
    const [x, y] = P[i], libres = cotesLibres(g, i), mauvais = erreurs.includes(i);
    elems.push(<circle key={`a${i}`} cx={x} cy={y} r={R} fill="#fff" stroke={mauvais ? '#dc2626' : '#475569'} strokeWidth={mauvais ? 3 : 1.6}/>);
    elems.push(<text key={`t${i}`} x={x} y={y + fsA * 0.35} fontSize={fsA} fontWeight="800" textAnchor="middle" fill={COL.encre}>{sym}</text>);
    for (let k = 0; k < st.lp[i]; k++) {
      const c = libres[k % Math.max(1, libres.length)]; if (!c) break;
      const [dx, dy] = DIRS[c], bx = x + dx * (R + 8), by = y + dy * (R + 8), horiz = dy !== 0, L = 8;
      // deux doublets sur un même côté (cas d'une erreur de l'élève) : décalés
      const dec = k >= libres.length ? 7 : 0;
      elems.push(<line key={`p${i}-${k}`} x1={bx - (horiz ? L : 0) + (horiz ? 0 : dec)} y1={by - (horiz ? 0 : L) + (horiz ? dec : 0)} x2={bx + (horiz ? L : 0) + (horiz ? 0 : dec)} y2={by + (horiz ? 0 : L) + (horiz ? dec : 0)}
        stroke={couleurDoublet} strokeWidth="3.4" strokeLinecap="round"/>);
    }
    if (st.lac[i]) {
      const c = libres[st.lp[i]] || libres[0] || 'N', [dx, dy] = DIRS[c], bx = x + dx * (R + 10), by = y + dy * (R + 10), horiz = dy !== 0;
      elems.push(<rect key={`r${i}`} x={bx - (horiz ? 11 : 6)} y={by - (horiz ? 6 : 11)} width={horiz ? 22 : 12} height={horiz ? 12 : 22} rx="2" fill="none" stroke={COL.liaison} strokeWidth="2.2" strokeDasharray="4 2.5"/>);
    }
    if (st.ch[i]) {
      const bx = x + R + 10, by = y - R - 11, w = Math.abs(st.ch[i]) > 1 ? 11 : 9;
      elems.push(<g key={`c${i}`}><circle cx={bx} cy={by} r={w} fill="#fff" stroke={COL.charge} strokeWidth="1.8"/>
        <text x={bx} y={by + fsC * 0.34} fontSize={fsC} fontWeight="800" textAnchor="middle" fill={COL.charge}>{chargeSigne(st.ch[i])}</text></g>);
    }
  });
  // couche interactive
  if (interactif) {
    const { outil, onAtome, onLien, sel } = interactif;
    if (outil === 'lien') for (let k = 1; k < n; k++) {
      const mx = (P[0][0] + P[k][0]) / 2, my = (P[0][1] + P[k][1]) / 2, vide = !st.liens[k];
      elems.push(<g key={`pad${k}`} role="button" tabIndex={0} aria-label={`Liaison entre ${ent.atomes[0]} et ${ent.atomes[k]} : ordre ${st.liens[k]}, touche pour changer`} style={{ cursor: 'pointer' }}
        onClick={() => onLien(k)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLien(k); } }}>
        <circle cx={mx} cy={my} r="19" fill="transparent"/>
        {vide && <><circle cx={mx} cy={my} r="11" fill="#fff7ed" stroke="#d97706" strokeWidth="1.8" strokeDasharray="3 2.5"/><text x={mx} y={my + 6} fontSize="17" fontWeight="800" textAnchor="middle" fill="#b45309">+</text></>}
      </g>);
    }
    ent.atomes.forEach((sym, i) => {
      const [x, y] = P[i];
      elems.push(<g key={`h${i}`} role="button" tabIndex={0} aria-label={`Atome ${sym}${n > 2 ? ` numéro ${i + 1}` : ''}`} style={{ cursor: outil === 'lien' ? 'default' : 'pointer' }}
        onClick={() => onAtome(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAtome(i); } }}>
        <circle cx={x} cy={y} r={R + 8} fill="transparent" stroke={sel === i ? '#f5a31a' : 'none'} strokeWidth="3" strokeDasharray="4 3"/>
      </g>);
    });
  }
  return <g>{elems}</g>;
}

// Dessin fixe (carte, exercice, schéma d'un énoncé) : un <svg> complet
export function SchemaFixe({ ent, st, titre, larg = 300, haut = 220, maxWidth = 300, s = 1, fsA = 20, fsC = 12.5 }) {
  return (
    <svg viewBox={`0 0 ${larg} ${haut}`} width="100%" role="img" aria-label={`${titre || ''} ${descriptionSchema(ent, st)}`.trim()}
      style={{ maxWidth, display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 }}>
      <DessinLewis ent={ent} st={st} cx={larg / 2} cy={haut / 2 - 2} s={s} fsA={fsA} fsC={fsC}/>
    </svg>);
}

const OUTILS = {
  lien: ['Liaison', 'Touche le « + » entre deux atomes : chaque touche ajoute un doublet liant (après trois, on revient à zéro).'],
  doublet: ['Doublet non liant', 'Touche un atome pour lui ajouter un doublet non liant (un tiret autour de lui).'],
  charge: ['Charge', 'Touche un atome pour lui donner une charge : +, −, puis 2−, 2+, puis plus de charge.'],
  lacune: ['Lacune', 'Touche un atome pour dessiner (ou effacer) un rectangle vide : un doublet manque autour de lui.'],
};
const CYCLE_CHARGE = [0, 1, -1, -2, 2];

// Éditeur : barre d'outils + dessin interactif. st et onChange sont tenus par le parent.
export function EditeurLewis({ ent, st, onChange, outils = ['lien', 'doublet'], erreurs = [], maxWidth = 420, message = null }) {
  const [outil, setOutil] = useState(outils[0]);
  const [aide, setAide] = useState('');
  const actif = outils.includes(outil) ? outil : outils[0];
  const maj = f => onChange(f({ ...st, liens: [...st.liens], lp: [...st.lp], ch: [...st.ch], lac: [...st.lac] }));
  const onLien = k => maj(x => { x.liens[k] = (x.liens[k] + 1) % 4; return x; });
  const onAtome = i => {
    if (actif === 'lien') { setAide('Pour tracer une liaison, touche le « + » situé entre deux atomes.'); return; }
    setAide('');
    maj(x => {
      if (actif === 'doublet') x.lp[i] = (x.lp[i] + 1) % 5;
      else if (actif === 'charge') x.ch[i] = CYCLE_CHARGE[(CYCLE_CHARGE.indexOf(x.ch[i]) + 1) % CYCLE_CHARGE.length];
      else if (actif === 'lacune') x.lac[i] = !x.lac[i];
      return x;
    });
  };
  const vide = ent.atomes.every((_, i) => liaisonsAtome(st, i) === 0 && st.lp[i] === 0 && !st.ch[i] && !st.lac[i]);
  return (
    <div>
      <div role="group" aria-label="Outils de dessin" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {outils.map(o => (
          <button key={o} onClick={() => { setOutil(o); setAide(''); }} aria-pressed={actif === o}
            style={{ minHeight: 42, padding: '6px 12px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
              border: `2px solid ${actif === o ? '#0369a1' : KIT.bord}`, background: actif === o ? '#e0f2fe' : 'white', color: KIT.txt }}>{OUTILS[o][0]}</button>))}
        <button onClick={() => { onChange(structureVide(ent)); setAide(''); }} disabled={vide}
          style={{ minHeight: 42, padding: '6px 12px', borderRadius: 12, cursor: vide ? 'default' : 'pointer', fontWeight: 600, fontSize: 14, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt2, opacity: vide ? 0.5 : 1 }}>Tout effacer</button>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.45 }}>{aide || OUTILS[actif][1]}</div>
      <svg viewBox="0 0 300 220" width="100%" role="group" aria-label={descriptionSchema(ent, st)}
        style={{ maxWidth, display: 'block', margin: '0 auto', background: 'white', borderRadius: 12, border: `1px solid ${KIT.bord}`, touchAction: 'manipulation' }}>
        <DessinLewis ent={ent} st={st} erreurs={erreurs} interactif={{ outil: actif, onAtome, onLien, sel: null }}/>
      </svg>
      {message}
    </div>);
}
