import { useState, useEffect, useRef } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { ECHANTILLONS, POS, STRUCT, METAUX_PAR_STRUCT, compacite, masseVol, fermer, denombrer, cleLigne, FR, SITES, formSite, rSite,
  HOTES, INSERES, IONIQUES, coordPrevue } from "./maillesModele";
import { fr } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, GRIS, VERT, alea } from "./elecOutils";
import { Curseur, VoletDefiGen } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 74 — MAILLES CRISTALLINES : motif, dénombrement, compacité, sites interstitiels, cristaux ioniques
//  (BTS Métiers de la chimie, analyse cristallographique). Structures cubiques CS, CC, CFC ; fer α / γ ; NaCl, CsCl, ZnS blende.
//  Hypothèses : atomes et ions = sphères dures indéformables ; métaux : contact selon la direction la plus dense ; rayons déduits du
//  paramètre de maille a des tables ; rayons ioniques et covalents arrondis (valeurs usuelles) ; pas de maille hexagonale.
// ====================================================

const SIM = 74;
declarerDefis(SIM, [
  ['rayon', 'Rayon atomique et coordinence'],
  ['compacite', 'Dénombrement et compacité'],
  ['insertion', 'Insertion dans un site'],
  ['ionique', 'Cristal ionique : Z et masse volumique'],
]);
const TITRES = { rayon: 'Rayon atomique', compacite: 'Compacité', insertion: 'Site interstitiel', ionique: 'Cristal ionique' };
const rad = d => d * Math.PI / 180;
const nb = x => String(Math.round(x * 1000) / 1000).replace('.', ',');
const COUL_W = { 0.125: BLEU, 0.25: VIOLET, 0.5: VERMILLON, 1: VERT };
const NOM_W = { 0.125: 'sommets', 0.25: 'milieux d’arêtes', 0.5: 'centres de faces', 1: 'à l’intérieur' };
const NOM_W_SITE = { 0.25: 'milieux d’arêtes', 0.5: 'sur les faces', 1: 'à l’intérieur' };
const GRIS_HOTE = '#94a3b8';
const METAUX = ['Po', 'W', 'Fe', 'Cr', 'Cu', 'Al', 'Ni', 'Ag'];
const rMetal = cle => { const e = ECHANTILLONS[cle]; return STRUCT[e.type].R(e.a); };
const NOM_SITE = { oct: 'octaédrique', tet: 'tétraédrique' };

// ---------- scènes (listes de sphères à dessiner) ----------
function sceneMaille(met) {
  const e = ECHANTILLONS[met], t = e.type, st = STRUCT[t], a = e.a, R = st.R(a);
  const atomes = fermer(POS[t].map(p => ({ p, esp: 0 })));
  return { atomes, e, t, st, a, R, seg: st.seg, lignes: denombrer(atomes), especes: [{ nom: e.formule }], noms: NOM_W,
    sph: atomes.map(x => ({ p: x.p, r: R / a, col: COUL_W[x.w], k: cleLigne(0, x.w), label: FR[x.w] })) };
}
function sceneSites(hote, site, ins) {
  const h = HOTES[hote], t = h.type, st = STRUCT[t], a = h.a, R = st.R(a), rs = rSite(t, site, a, R);
  const hotes = fermer(POS[t].map(p => ({ p, esp: 0 })));
  const sites = fermer(SITES[t][site].map(p => ({ p, esp: 1 })));
  const rIns = ins ? INSERES[ins].r : rs;
  return { h, t, st, a, R, rs, rIns, seg: null, lignes: denombrer(sites), noms: NOM_W_SITE, especes: [{ nom: 'atomes hôtes' }, { nom: `sites ${NOM_SITE[site]}s` }],
    atomes: sites, nSites: sites.reduce((s, x) => s + x.w, 0),
    sph: [...hotes.map(x => ({ p: x.p, r: R / a, col: GRIS_HOTE, k: 'h', label: '' })),
      ...sites.map(x => ({ p: x.p, r: rIns / a, col: ins ? VERMILLON : (site === 'oct' ? VIOLET : VERT), k: cleLigne(1, x.w), label: ins ? ins : FR[x.w], trop: !!ins && rIns > rs + 1e-9, marque: true }))] };
}
function sceneIon(cle) {
  const c = IONIQUES[cle], a = c.a;
  const an = fermer(c.anions.map(p => ({ p, esp: 0 }))), ca = fermer(c.cations.map(p => ({ p, esp: 1 })));
  return { c, a, atomes: [...an, ...ca], seg: c.seg, lignes: denombrer([...an, ...ca]), noms: NOM_W, especes: [{ nom: c.an.nom }, { nom: c.cat.nom }],
    sph: [...an.map(x => ({ p: x.p, r: c.an.r / a, col: BLEU, k: cleLigne(0, x.w), label: c.an.nom })), ...ca.map(x => ({ p: x.p, r: c.cat.r / a, col: VERMILLON, k: cleLigne(1, x.w), label: c.cat.nom }))] };
}

// ---------- maille en 3D (projection orthographique, glisser pour tourner) ----------
function Vue3D({ sph, seg, vue, setVue, echelle, surlig, parts, titre }) {
  const W = 460, H = 420, S = 160, cx = 230, cy = 212, drag = useRef(null);
  const ya = rad(vue.yaw), pi = rad(vue.pitch);
  const P = p => { const x = p[0] - 0.5, y = p[1] - 0.5, z = p[2] - 0.5, x1 = x * Math.cos(ya) - y * Math.sin(ya), y1 = x * Math.sin(ya) + y * Math.cos(ya);
    return { X: cx + S * x1, Y: cy - S * (z * Math.cos(pi) + y1 * Math.sin(pi)), D: -y1 * Math.cos(pi) + z * Math.sin(pi) }; };
  const aretes = []; for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) { const j = i | (1 << b); if (j !== i) aretes.push([i, j]); }
  const coin = i => P([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
  const items = sph.map(s => ({ ...s, ...P(s.p) })).sort((u, v) => u.D - v.D);
  const fin = e => { drag.current = null; if (e.currentTarget.releasePointerCapture) { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* sans effet */ } } };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={titre} data-testid="vue3d"
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: W, cursor: 'grab', touchAction: 'pan-y', userSelect: 'none' }}
      onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY, v: vue }; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { const d = drag.current; if (!d) return; let yaw = (d.v.yaw + (e.clientX - d.x) * 0.6) % 360; if (yaw > 180) yaw -= 360; if (yaw < -180) yaw += 360;
        setVue({ yaw, pitch: Math.max(0, Math.min(85, d.v.pitch + (e.clientY - d.y) * 0.4)) }); }}
      onPointerUp={fin} onPointerCancel={fin}>
      {aretes.map(([i, j]) => { const A = coin(i), B = coin(j); return <line key={`${i}-${j}`} x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke="#64748b" strokeWidth="1.6"/>; })}
      {items.map((s, i) => { const r = Math.max(2, s.r * S * echelle), actif = surlig == null || s.k === surlig;
        return <g key={i} opacity={actif ? 1 : 0.15}>
          <circle cx={s.X} cy={s.Y} r={r} fill={s.col} fillOpacity={s.marque ? 0.8 : 0.9} stroke={s.trop ? '#b91c1c' : '#fff'} strokeWidth={s.trop ? 3 : 1.2} strokeDasharray={s.trop ? '5 3' : undefined}/>
          {parts && s.label && r > 9 && <text x={s.X} y={s.Y + 4} fontSize={Math.min(13, r * 0.8)} fontWeight="800" textAnchor="middle" fill="#fff" stroke="#0f172a" strokeWidth="0.4" paintOrder="stroke">{s.label}</text>}</g>; })}
      {seg && (() => { const A = P(seg[0]), B = P(seg[1]); return <line x1={A.X} y1={A.Y} x2={B.X} y2={B.Y} stroke="#0f172a" strokeWidth="3.4" strokeDasharray="7 4" strokeLinecap="round"/>; })()}
    </svg>);
}

// ---------- tableau de dénombrement ----------
function TableDenombrement({ lignes, especes, noms, surlig, setSurlig, unite = 'atomes' }) {
  const cell = { padding: '3px 6px', textAlign: 'right', fontSize: 13 };
  const tot = e => lignes.filter(l => l.esp === e).reduce((s, l) => s + l.nb * l.w, 0);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }} data-testid="denombrement">
        <thead><tr>{['Position', 'Nombre', 'Part dans la maille', `${unite} en propre`].map((h, i) => <th key={h} style={{ ...cell, textAlign: i ? 'right' : 'left', color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}` }}>{h}</th>)}</tr></thead>
        <tbody>{lignes.map(l => { const k = cleLigne(l.esp, l.w), on = surlig === k;
          return <tr key={k} onClick={() => setSurlig(on ? null : k)} style={{ cursor: 'pointer', background: on ? '#fef3c7' : 'white' }} title="Cliquez pour repérer ces positions sur la maille">
            <td style={{ ...cell, textAlign: 'left' }}>{especes.length > 1 ? `${especes[l.esp].nom} ` : ''}{noms[l.w]}</td><td style={cell}>{l.nb}</td><td style={cell}>× {FR[l.w]}</td><td style={{ ...cell, fontWeight: 700 }}>{nb(l.nb * l.w)}</td></tr>; })}
          {especes.map((e, i) => lignes.some(l => l.esp === i) && <tr key={`t${i}`} style={{ borderTop: `1.5px solid ${KIT.bord}` }}>
            <td style={{ ...cell, textAlign: 'left', fontWeight: 700 }} colSpan={3}>Total{especes.length > 1 ? ` ${e.nom}` : ''} par maille</td><td style={{ ...cell, fontWeight: 800, color: VERT }}>{nb(tot(i))}</td></tr>)}
        </tbody></table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>👆 Cliquez sur une ligne pour repérer ces positions sur la maille.</div>
    </div>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'rayon' || type === 'compacite') return { ...base, cle: alea(METAUX) };
  if (type === 'insertion') return { ...base, h: alea(Object.keys(HOTES)), site: alea(['oct', 'tet']), ins: alea(Object.keys(INSERES)) };
  return { ...base, cle: alea(Object.keys(IONIQUES)) };
}
const nombreIons = (c, esp) => fermer((esp ? c.cations : c.anions).map(p => ({ p, esp }))).reduce((s, x) => s + x.w, 0);
function evaluer(d) {
  if (d.type === 'rayon') {
    const e = ECHANTILLONS[d.cle], st = STRUCT[e.type], R = st.R(e.a), x = lireNombre(d.reps.v);
    const okR = isFinite(x) && proche(x, R, 0.01), okC = d.reps.c === String(st.coord);
    const autre = Object.values(STRUCT).find(s => s !== st && isFinite(x) && proche(x, s.R(e.a), 0.01));
    return { ok: okR && okC, lignes: [
      [okR, okR ? 'Rayon correct.' : autre ? `Cette valeur correspond à la relation d’une maille ${autre.nom} (${autre.rel}). Quelle est ici la direction de contact ?` : 'Cherchez la direction où les atomes se touchent, écrivez la relation entre a et R, puis isolez R.'],
      [okC, okC ? 'Coordinence correcte.' : 'La coordinence est le nombre de plus proches voisins : 6 (CS), 8 (CC) ou 12 (CFC).']] };
  }
  if (d.type === 'compacite') {
    const e = ECHANTILLONS[d.cle], st = STRUCT[e.type], R = rMetal(d.cle), n = lireNombre(d.reps.n), c0 = lireNombre(d.reps.v);
    const c = isFinite(c0) ? (c0 <= 1.2 ? c0 * 100 : c0) : NaN, okN = n === st.n, okC = isFinite(c) && proche(c, st.C * 100, 0.02);
    return { ok: okN && okC, lignes: [
      [okN, okN ? 'Nombre d’atomes correct.' : 'Un sommet est partagé par 8 mailles (1/8), un centre de face par 2 mailles (1/2), le centre n’est partagé avec personne.'],
      [okC, okC ? 'Compacité correcte.' : isFinite(c) && proche(c, compacite(1, R, e.a) * 100, 0.03) ? 'Vous avez pris le volume d’un seul atome : multipliez par le nombre d’atomes de la maille.' : 'C = n × (4/3)πR³ / a³ (volume des atomes divisé par le volume de la maille).']] };
  }
  if (d.type === 'insertion') {
    const h = HOTES[d.h], R = STRUCT[h.type].R(h.a), rs = rSite(h.type, d.site, h.a, R), autre = rSite(h.type, d.site === 'oct' ? 'tet' : 'oct', h.a, R), x = lireNombre(d.reps.v);
    const okV = isFinite(x) && proche(x, rs, 0.03), loge = INSERES[d.ins].r <= rs, okF = d.reps.f === (loge ? 'oui' : 'non');
    return { ok: okV && okF, lignes: [
      [okV, okV ? 'Rayon du site correct.' : isFinite(x) && proche(x, autre, 0.03) ? 'Vous avez calculé le rayon de l’autre type de site.' : `Écrivez la tangence entre l’atome inséré et les atomes hôtes : ${formSite[h.type][d.site]}, avec R = ${STRUCT[h.type].formR}.`],
      [okF, okF ? 'Conclusion correcte.' : 'Comparez le rayon de l’atome inséré au rayon maximal du site : il se loge sans déformation seulement si r ≤ r du site.']] };
  }
  const c = IONIQUES[d.cle], Z = nombreIons(c, 1), x = lireNombre(d.reps.v), z = lireNombre(d.reps.z), rho = masseVol(Z, c.M, c.a);
  const okZ = z === Z, okV = isFinite(x) && proche(x, rho, 0.02);
  return { ok: okZ && okV, lignes: [
    [okZ, okZ ? 'Z correct.' : 'Comptez séparément les cations et les anions avec leur part dans la maille (sommets 1/8, arêtes 1/4, faces 1/2, intérieur 1).'],
    [okV, okV ? 'Masse volumique correcte.' : isFinite(x) && proche(x, rho / Z, 0.03) ? `Multipliez par Z = ${Z} : la maille contient ${Z} unités ${c.formule}.` : 'ρ = Z × M / (N_A × a³), avec a converti en cm (1 nm = 10⁻⁷ cm).']] };
}
const enonce = (d, { champ, choix }) => {
  if (d.type === 'rayon') { const e = ECHANTILLONS[d.cle], st = STRUCT[e.type];
    return <><Pic n="target"/>Le métal « {e.nom} » cristallise dans le système {st.nom} ; son paramètre de maille est <strong>a = {fr(e.a, 4)} nm</strong>. Les atomes sont assimilés à des sphères dures tangentes.
      <div style={{ marginTop: 6 }}><strong>1.</strong> Rayon atomique R : {champ('v', 'nm')}</div>
      <div style={{ marginTop: 6 }}><strong>2.</strong> Coordinence : {choix('c', [['6', '6'], ['8', '8'], ['12', '12']])}</div></>; }
  if (d.type === 'compacite') { const e = ECHANTILLONS[d.cle], st = STRUCT[e.type];
    return <><Pic n="target"/>Le métal « {e.nom} » cristallise dans le système {st.nom} : a = {fr(e.a, 4)} nm et R = {fr(rMetal(d.cle), 4)} nm.
      <div style={{ marginTop: 6 }}><strong>1.</strong> Nombre d’atomes par maille : {champ('n', '')}</div>
      <div style={{ marginTop: 6 }}><strong>2.</strong> Compacité (en %) : {champ('v', '%')}</div></>; }
  if (d.type === 'insertion') { const h = HOTES[d.h], st = STRUCT[h.type], i = INSERES[d.ins];
    return <><Pic n="target"/>Le {h.nom} est de structure {st.nom} (<strong>a = {fr(h.a, 4)} nm</strong>). On y insère l’élément {i.nom} (rayon atomique {fr(i.r, 3)} nm) dans un site <strong>{NOM_SITE[d.site]}</strong>.
      <div style={{ marginTop: 6 }}><strong>1.</strong> Rayon maximal de ce site : {champ('v', 'nm')}</div>
      <div style={{ marginTop: 6 }}><strong>2.</strong> L’atome s’y loge-t-il sans déformer la maille ? {choix('f', [['oui', 'oui'], ['non', 'non']])}</div></>; }
  const c = IONIQUES[d.cle];
  return <><Pic n="target"/>Cristal de {c.nom} ({c.formule}, M = {fr(c.M, 2)} g/mol) : {c.desc}. Paramètre de maille : <strong>a = {fr(c.a, 4)} nm</strong>. N<sub>A</sub> = 6,022 × 10²³ mol⁻¹.
    <div style={{ marginTop: 6 }}><strong>1.</strong> Nombre Z d’unités formulaires {c.formule} par maille : {champ('z', '')}</div>
    <div style={{ marginTop: 6 }}><strong>2.</strong> Masse volumique : {champ('v', 'g/cm³')}</div></>;
};
const solution = d => {
  if (d.type === 'rayon') { const e = ECHANTILLONS[d.cle], st = STRUCT[e.type];
    return <>Contact selon {st.contact} : <strong>{st.rel}</strong>, donc R = {st.formR} = <strong>{fr(st.R(e.a), 4)} nm</strong>. Coordinence : {st.coord}.</>; }
  if (d.type === 'compacite') { const e = ECHANTILLONS[d.cle], st = STRUCT[e.type], R = rMetal(d.cle);
    return <>n = {st.n}. C = n × (4/3)πR³ / a³ = {st.n} × (4/3) × π × {fr(R, 4)}³ / {fr(e.a, 4)}³ = <strong>{fr(compacite(st.n, R, e.a) * 100, 1)} %</strong> (la même pour tous les métaux de cette structure).</>; }
  if (d.type === 'insertion') { const h = HOTES[d.h], t = h.type, R = STRUCT[t].R(h.a), rs = rSite(t, d.site, h.a, R), r = INSERES[d.ins].r;
    return <>R = {STRUCT[t].formR} = {fr(R, 4)} nm. r<sub>site</sub> = {formSite[t][d.site]} = <strong>{fr(rs, 4)} nm</strong>. L’atome ({fr(r, 3)} nm) {r <= rs ? 'est plus petit que le site : il se loge sans déformation.' : 'est plus gros que le site : il ne peut s’insérer qu’en déformant la maille.'}</>; }
  const c = IONIQUES[d.cle], Z = nombreIons(c, 1);
  return <>Z = {Z} (cations : {Z}, anions : {nombreIons(c, 0)}). ρ = Z M / (N<sub>A</sub> a³) = {Z} × {fr(c.M, 2)} / (6,022 × 10²³ × ({fr(c.a, 4)} × 10⁻⁷)³) = <strong>{fr(masseVol(Z, c.M, c.a), 2)} g/cm³</strong> (tables : {fr(c.rho, 2)} g/cm³).</>;
};

// ====================================================
export function SimulationMailles() {
  const [mode, setMode] = useState(() => modeOuverture('mail-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('mail-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('maille');
  const [met, setMet] = useState('Cu');
  const [hote, setHote] = useState('FeG');
  const [site, setSite] = useState('oct');
  const [ins, setIns] = useState(null);
  const [ion, setIon] = useState('NaCl');
  const [vue, setVue] = useState({ yaw: 28, pitch: 22 });
  const [echelle, setEchelle] = useState(0.5);
  const [contact, setContact] = useState(false);
  const [parts, setParts] = useState(true);
  const [corrige, setCorrige] = useState(true);
  const [surlig, setSurlig] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';

  const sc = atelier === 'maille' ? sceneMaille(met) : atelier === 'sites' ? sceneSites(hote, site, ins) : sceneIon(ion);
  const voir = o => {
    if (o.atelier !== undefined) setAtelier(o.atelier); if (o.met !== undefined) setMet(o.met); if (o.hote !== undefined) setHote(o.hote);
    if (o.site !== undefined) setSite(o.site); if (o.ins !== undefined) setIns(o.ins); if (o.ion !== undefined) setIon(o.ion);
    if (o.echelle !== undefined) setEchelle(o.echelle); if (o.contact !== undefined) setContact(o.contact);
    setCorrige(!!o.corrige); setSurlig(null);
  };
  const Cu = ECHANTILLONS.Cu, RCu = rMetal('Cu'), FeG = HOTES.FeG, RFeG = STRUCT.F.R(FeG.a), NaCl = IONIQUES.NaCl;

  const ETAPES = [
    { id: 'contexte', titre: 'Réseau, nœuds, motif et maille', depart: () => voir({ atelier: 'maille', met: 'Cu', echelle: 0.4, contact: false, corrige: false }),
      texte: <>Un cristal est un empilement périodique en 3 dimensions. On le décrit avec trois idées :
        <ul style={{ margin: '4px 0', paddingLeft: 18 }}><li>le <strong>réseau</strong> : un ensemble de points, les <strong>nœuds</strong>, qui se déduisent les uns des autres par translation ;</li>
          <li>le <strong>motif</strong> : l’atome (ou le groupe d’atomes) placé sur chaque nœud ;</li>
          <li>la <strong>maille</strong> : le petit volume (ici un cube d’arête <strong>a</strong>) qui, répété par translation, reconstruit tout le cristal.</li></ul>
        Faites tourner la maille du cuivre (glissez avec la souris ou le doigt, ou utilisez les curseurs). Les couleurs indiquent la position des atomes : sommets, centres de faces.</>,
      tache: { type: 'qcm', q: 'Le cuivre est cubique à faces centrées, avec un atome de cuivre sur chaque nœud. Quel est son motif ?', options: ['un seul atome de cuivre', 'quatre atomes de cuivre', 'la maille cubique entière', 'un nœud du réseau'], bonne: 0,
        expl: 'Le motif est un atome Cu. La maille contient 4 atomes parce qu’elle contient 4 nœuds (et non parce que le motif en comporte 4).' } },
    { id: 'cs', titre: 'Compter les atomes : la maille cubique simple', depart: () => voir({ atelier: 'maille', met: 'Po', echelle: 0.45, contact: false, corrige: false }),
      texte: <>Les atomes situés sur un <strong>sommet</strong> sont partagés entre 8 mailles voisines : seule <strong>1/8</strong> de chacun appartient en propre à la maille. Cliquez sur « Afficher le dénombrement » pour vérifier vos comptes. Exemple en cubique simple (polonium) : 8 sommets × 1/8 = 1 atome par maille.
        <ExempleResolu>Règle générale : sommet <strong>1/8</strong> ; milieu d’arête <strong>1/4</strong> ; centre de face <strong>1/2</strong> ; intérieur de la maille <strong>1</strong>.</ExempleResolu>
        Passez à la maille cubique centrée (tungstène, bouton CC) et comptez avant de répondre.</>,
      tache: { type: 'num', q: 'Nombre d’atomes en propre dans une maille cubique centrée', unite: '', vrai: 2, tol: 0.001, affiche: x => String(x),
        pieges: [[9, 'Vous avez compté les 8 sommets en entier : chaque sommet n’appartient à la maille que pour 1/8.'], [1, 'N’oubliez pas l’atome du centre : il appartient entièrement à la maille.']], expl: '8 × 1/8 + 1 = 2.' } },
    { id: 'cfc', titre: 'La maille cubique à faces centrées', depart: () => voir({ atelier: 'maille', met: 'Cu', echelle: 0.45, contact: false, corrige: false }),
      texte: <>En CFC (cuivre), il y a un atome sur chaque sommet et un au centre de chaque face. Un atome de face est partagé entre <strong>2</strong> mailles. Cliquez sur une ligne du tableau pour repérer les positions concernées.</>,
      tache: { type: 'num', q: 'Nombre d’atomes en propre dans une maille cubique à faces centrées', unite: '', vrai: 4, tol: 0.001, affiche: x => String(x),
        pieges: [[14, 'Vous avez compté 8 sommets + 6 faces en entier : sommets 1/8, faces 1/2.'], [7, 'Les atomes des faces sont partagés entre 2 mailles : 1/2 chacun (et non 1).']], expl: '8 × 1/8 + 6 × 1/2 = 1 + 3 = 4.' } },
    { id: 'contact', titre: 'Des sphères qui se touchent', depart: () => voir({ atelier: 'maille', met: 'Cu', echelle: 0.5, contact: true, corrige: false }),
      texte: <>On assimile les atomes à des <strong>sphères dures</strong>. Dans un métal, elles se touchent le long de la direction où elles sont le plus proches (trait pointillé). Augmentez la taille des atomes avec le curseur « Taille des sphères » jusqu’à ce qu’elles se touchent (100 %). Le trait pointillé montre alors une longueur de <strong>4 R</strong>.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'maille' && echelle >= 0.97, consigne: 'Réglez la taille des sphères à 100 % (atomes en contact).' } },
    { id: 'rayon', titre: 'Relier a et R', depart: () => voir({ atelier: 'maille', met: 'Cu', echelle: 1, contact: true, corrige: false }),
      texte: <>Le pointillé est la <strong>diagonale d’une face</strong> du cube : sa longueur est a√2 (théorème de Pythagore) et elle porte 4 rayons (R + 2R + R). Donc <strong>a√2 = 4 R</strong>.
        <ExempleResolu>Les autres structures : cubique simple a = 2R (arête) ; cubique centré a√3 = 4R (diagonale du cube).</ExempleResolu>
        Pour le cuivre, a = {fr(Cu.a, 5)} nm.</>,
      tache: { type: 'num', q: 'Rayon atomique du cuivre (en nm)', unite: 'nm', vrai: RCu, tol: 0.01, affiche: x => fr(x, 4),
        pieges: [[Cu.a / 2, 'a / 2 correspond à la relation a = 2R du cubique simple : ici les atomes se touchent sur la diagonale d’une face.'], [Cu.a * Math.sqrt(3) / 4, 'a√3 / 4 est la relation du cubique centré (diagonale du cube).']], expl: 'R = a√2 / 4 = 0,36149 × 1,4142 / 4 = 0,1278 nm.' } },
    { id: 'coord', titre: 'La coordinence', depart: () => voir({ atelier: 'maille', met: 'W', echelle: 0.6, contact: true, corrige: false }),
      texte: <>La <strong>coordinence</strong> d’un atome est le nombre de ses plus proches voisins (ceux qu’il touche). Dans le tungstène (cubique centré), regardez l’atome du centre et le trait pointillé.</>,
      tache: { type: 'qcm', q: 'Quelle est la coordinence du cubique centré ?', options: ['6', '8', '12', '14'], bonne: 1, expl: 'L’atome central touche les 8 atomes des sommets. (Cubique simple : 6 ; cubique à faces centrées : 12.)' } },
    { id: 'compacite', titre: 'La compacité', depart: () => voir({ atelier: 'maille', met: 'Cu', echelle: 1, contact: true, corrige: false }),
      texte: <>La <strong>compacité</strong> C est la fraction du volume de la maille réellement occupée par les atomes :
        <div style={{ textAlign: 'center', fontSize: 16, margin: '6px 0' }}><strong>C = n × (4/3)πR³ / a³</strong></div>
        <ExempleResolu>Cubique simple : a = 2R et n = 1, donc C = (4/3)πR³ / (2R)³ = π/6 = <strong>0,52</strong>.</ExempleResolu>
        À vous pour le cuivre (n = 4, R = {fr(RCu, 4)} nm, a = {fr(Cu.a, 5)} nm). Donnez C entre 0 et 1.</>,
      tache: { type: 'num', q: 'Compacité du cuivre (nombre entre 0 et 1)', unite: '', vrai: compacite(4, RCu, Cu.a), tol: 0.02, affiche: x => fr(x, 3),
        pieges: [[compacite(1, RCu, Cu.a), 'Vous avez pris le volume d’un seul atome : la maille en contient 4.']], expl: 'C = 4 × (4/3) × π × 0,1278³ / 0,36149³ = 0,74. Cette valeur est la même pour tous les métaux CFC.' } },
    { id: 'masse', titre: 'La masse volumique', depart: () => voir({ atelier: 'maille', met: 'Cu', echelle: 0.5, contact: false, corrige: false }),
      texte: <>La masse d’une maille est n M / N<sub>A</sub> et son volume a³ : <strong>ρ = n M / (N<sub>A</sub> a³)</strong>, avec a en cm (1 nm = 10⁻⁷ cm). M(Cu) = {fr(Cu.M, 3)} g/mol. N<sub>A</sub> = 6,022 × 10²³ mol⁻¹.</>,
      tache: { type: 'num', q: 'Masse volumique du cuivre (en g/cm³)', unite: 'g/cm³', vrai: masseVol(4, Cu.M, Cu.a), tol: 0.02, affiche: x => fr(x, 2),
        pieges: [[masseVol(1, Cu.M, Cu.a), 'Il y a 4 atomes dans la maille CFC, pas 1.']], expl: 'ρ = 4 × 63,546 / (6,022 × 10²³ × (0,36149 × 10⁻⁷)³) = 8,94 g/cm³ (tables : 8,96).' } },
    { id: 'oct', titre: 'Les vides : sites octaédriques', depart: () => voir({ atelier: 'sites', hote: 'FeG', site: 'oct', ins: null, echelle: 0.45, contact: false, corrige: false }),
      texte: <>Entre les atomes de la maille il reste des vides, les <strong>sites interstitiels</strong>, où l’on peut loger de petits atomes (H, C, N, O). Dans le <strong>site octaédrique</strong> (violet), l’atome inséré est entouré de 6 atomes hôtes aux sommets d’un octaèdre. Ici : le fer γ (CFC), à l’échelle réduite pour voir l’intérieur. Pour les compter, utilisez le tableau (comme pour les atomes) : centre du cube et milieux des arêtes.</>,
      tache: { type: 'num', q: 'Nombre de sites octaédriques par maille CFC', unite: '', vrai: 4, tol: 0.001, affiche: x => String(x),
        pieges: [[13, 'Vous avez compté le centre et les 12 arêtes en entier : une arête est partagée entre 4 mailles (1/4).'], [1, 'N’oubliez pas les sites situés au milieu des arêtes : 12 × 1/4 = 3.']], expl: '1 (centre) + 12 × 1/4 (arêtes) = 4 : autant que d’atomes.' } },
    { id: 'tet', titre: 'Sites tétraédriques', depart: () => voir({ atelier: 'sites', hote: 'FeG', site: 'tet', ins: null, echelle: 0.45, contact: false, corrige: false }),
      texte: <>Le <strong>site tétraédrique</strong> (vert) est entouré de 4 atomes hôtes aux sommets d’un tétraèdre. Il se trouve au quart de chaque diagonale du cube (positions ¼ ¼ ¼ et leurs équivalents).</>,
      tache: { type: 'num', q: 'Nombre de sites tétraédriques par maille CFC', unite: '', vrai: 8, tol: 0.001, affiche: x => String(x),
        pieges: [[4, 'C’est le nombre de sites octaédriques. Les sites tétraédriques sont tous à l’intérieur de la maille : comptez-les.']], expl: '8 sites, tous à l’intérieur de la maille : 2 par atome.' } },
    { id: 'rsite', titre: 'Quelle taille pour le site ?', depart: () => voir({ atelier: 'sites', hote: 'FeG', site: 'oct', ins: null, echelle: 0.45, contact: false, corrige: false }),
      texte: <>Un atome inséré dans un site octaédrique du CFC touche deux atomes hôtes alignés le long de l’arête : <strong>a = 2R + 2r</strong>, donc <strong>r = a/2 − R</strong>.
        Fer γ : a = {fr(FeG.a, 4)} nm, donc R = a√2 / 4 = {fr(RFeG, 4)} nm.</>,
      tache: { type: 'num', q: 'Rayon maximal d’un atome logé dans un site octaédrique du fer γ (en nm)', unite: 'nm', vrai: FeG.a / 2 - RFeG, tol: 0.03, affiche: x => fr(x, 4),
        pieges: [[FeG.a * Math.sqrt(3) / 4 - RFeG, 'Ce rayon est celui du site tétraédrique (a√3/4 − R).'], [FeG.a / 2, 'a/2 est la distance entre les centres des deux atomes hôtes : il faut retrancher R.']], expl: 'r = a/2 − R = 0,18235 − 0,12894 = 0,0534 nm.' } },
    { id: 'carbone', titre: 'Pourquoi l’acier est-il fait de fer γ ?', depart: () => voir({ atelier: 'sites', hote: 'FeG', site: 'oct', ins: 'C', echelle: 0.45, contact: false, corrige: true }),
      texte: <>Le carbone (r = {fr(INSERES.C.r, 3)} nm) est plus gros que le site octaédrique du fer γ ({fr(FeG.a / 2 - RFeG, 4)} nm) : son contour rouge en pointillés signale qu’il ne rentre pas sans déformer la maille. Changez d’hôte (fer α, palladium) et d’atome inséré, puis comparez.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure pour le carbone dans le fer γ ?', options: ['Il s’insère en déformant la maille : la solubilité est limitée, mais bien plus grande que dans le fer α dont les sites sont plus petits', 'Il rentre exactement dans le site octaédrique', 'Il ne peut pas s’insérer du tout dans le fer', 'Le site octaédrique du fer γ est plus petit que celui du fer α'], bonne: 0,
        expl: 'Plus le site est grand, plus la déformation est faible. Fer α : sites de 0,019 et 0,036 nm ; fer γ : 0,053 nm. La solubilité maximale du carbone est d’environ 2 % en masse dans γ contre 0,02 % dans α.' } },
    { id: 'nacl', titre: 'Un cristal ionique : NaCl', depart: () => voir({ atelier: 'ionique', ion: 'NaCl', echelle: 0.8, contact: false, corrige: false }),
      texte: <>Dans NaCl, les ions Cl⁻ (bleu) forment un réseau <strong>cubique à faces centrées</strong> et les ions Na⁺ (rouge) occupent tous les <strong>sites octaédriques</strong> : ceux que vous avez comptés à l’étape précédente ! Dénombrez les ions Na⁺ de la maille (tableau, ligne par ligne).</>,
      tache: { type: 'num', q: 'Nombre d’ions Na⁺ par maille de NaCl', unite: '', vrai: 4, tol: 0.001, affiche: x => String(x),
        pieges: [[13, 'Vous avez compté 1 + 12 en entier : les ions des arêtes sont partagés entre 4 mailles.']], expl: '12 × 1/4 + 1 = 4 Na⁺ et 8 × 1/8 + 6 × 1/2 = 4 Cl⁻ : Z = 4 unités NaCl par maille.' } },
    { id: 'ioncontact', titre: 'Où les ions se touchent-ils ?', depart: () => voir({ atelier: 'ionique', ion: 'NaCl', echelle: 0.8, contact: true, corrige: false }),
      texte: <>Dans un cristal ionique, ce sont un cation et un anion voisins qui se touchent (les anions ne se touchent pas entre eux). Dans NaCl, le contact a lieu le long de l’<strong>arête</strong> : a = 2 (r<sub>+</sub> + r<sub>−</sub>). Avec r(Na⁺) = {fr(NaCl.cat.r, 3)} nm et r(Cl⁻) = {fr(NaCl.an.r, 3)} nm, comparez au paramètre mesuré a = {fr(NaCl.a, 4)} nm.</>,
      tache: { type: 'num', q: 'Paramètre de maille prévu par les rayons ioniques (en nm)', unite: 'nm', vrai: 2 * (NaCl.cat.r + NaCl.an.r), tol: 0.01, affiche: x => fr(x, 3),
        pieges: [[NaCl.cat.r + NaCl.an.r, 'C’est a / 2 : l’arête porte 2 fois r₊ + r₋ (Cl⁻, Na⁺, Cl⁻).']], expl: 'a = 2 × (0,102 + 0,181) = 0,566 nm, à 0,4 % du paramètre mesuré (0,5640 nm).' } },
    { id: 'regle', titre: 'Prévoir la coordinence', depart: () => voir({ atelier: 'ionique', ion: 'CsCl', echelle: 0.8, contact: true, corrige: true }),
      texte: <>Un cation s’entoure d’autant d’anions que possible, à condition de les toucher. Le rapport <strong>r<sub>+</sub> / r<sub>−</sub></strong> permet de prévoir : de 0,225 à 0,414 → 4 voisins ; de 0,414 à 0,732 → 6 ; de 0,732 à 1 → 8.
        Pour CsCl : r(Cs⁺) = {fr(IONIQUES.CsCl.cat.r, 3)} nm et r(Cl⁻) = {fr(IONIQUES.CsCl.an.r, 3)} nm.</>,
      tache: { type: 'qcm', q: 'Coordinence prévue pour Cs⁺ dans CsCl (r₊ / r₋ = 0,96)', options: ['4', '6', '8', '12'], bonne: 2, expl: '0,96 est compris entre 0,732 et 1 : le cation est entouré de 8 anions (maille cubique simple d’anions, cation au centre).' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Cristal = réseau + motif ; atomes en propre : sommet 1/8, arête 1/4, face 1/2, intérieur 1 (CS 1 ; CC 2 ; CFC 4).</li>
        <li>Contact : CS a = 2R ; CC a√3 = 4R ; CFC a√2 = 4R. Coordinences 6, 8, 12.</li>
        <li>C = n (4/3)πR³ / a³ : 0,52 ; 0,68 ; 0,74. ρ = n M / (N<sub>A</sub> a³).</li>
        <li>CFC : 4 sites octaédriques (r = a/2 − R = 0,414 R) et 8 tétraédriques (r = a√3/4 − R = 0,225 R).</li>
        <li>Cristal ionique : anions et cations comptés séparément ; contact cation–anion ; r<sub>+</sub> / r<sub>−</sub> prévoit la coordinence.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'rayon'); else if (md === 'explore') setCorrige(true); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Atomes et ions = sphères dures</strong> indéformables, sans agitation thermique. Un cristal réel a des défauts et des liaisons qui ne sont pas toutes « de contact » (ZnS est en partie covalent).</li>
      <li><strong>Métaux</strong> : les atomes se touchent selon la direction la plus dense. Le rayon R est <strong>déduit</strong> de a (valeurs des tables à 20 °C, sauf le fer γ, dont la valeur correspond à son domaine de stabilité, au-dessus de 912 °C) : ce n’est pas une mesure indépendante.</li>
      <li><strong>Structures cubiques seulement</strong> : CS, CC, CFC, puis NaCl, CsCl et ZnS blende. La maille hexagonale compacte n’est pas traitée (elle a la même compacité que le CFC, 0,74).</li>
      <li><strong>Rayons ioniques</strong> (Shannon, arrondis) et <strong>rayons covalents</strong> des atomes insérés (H 0,032 ; C 0,077 ; N 0,071 ; O 0,066 nm) sont des valeurs usuelles approchées : selon les tables, elles varient de quelques pour cent, ce qui peut changer la conclusion pour un atome proche de la taille du site.</li>
      <li><strong>« S’y loge »</strong> signifie r ≤ r<sub>site</sub> (tangence). Un atome plus gros n’est pas interdit : il déforme la maille, ce qui limite sa solubilité.</li>
      <li><strong>Règle des rapports de rayons</strong> : critère géométrique approché. Elle se trompe parfois : KCl (r<sub>+</sub> / r<sub>−</sub> = 0,76) devrait avoir la coordinence 8 et cristallise pourtant avec la structure de NaCl (coordinence 6).</li>
      <li><strong>Représentation</strong> : le curseur de taille réduit toutes les sphères dans la même proportion (les tailles relatives restent exactes) ; à 100 %, les atomes d’un métal se touchent.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  // ----- panneaux de résultats -----
  const ligne = (nom, contenu) => <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.65, marginTop: 4 }}><strong>{nom}</strong> {contenu}</div>;
  const resMaille = atelier === 'maille' && (() => { const { e, st, a, R } = sc, n = st.n, C = compacite(n, R, a), rho = masseVol(n, e.M, a);
    return <div>
      {ligne('Contact', <>les atomes se touchent le long de {st.contact} : <strong>{st.rel}</strong>, donc R = {st.formR} = {st.cle === 'P' ? `${fr(a, 4)} / 2` : `${fr(a, 4)} × √${st.cle === 'I' ? 3 : 2} / 4`} = <strong>{fr(R, 4)} nm</strong>.</>)}
      {ligne('Coordinence', <>{st.coord} plus proches voisins.</>)}
      {ligne('Compacité', <>C = n × (4/3)πR³ / a³ = {n} × (4/3) × π × {fr(R, 4)}³ / {fr(a, 4)}³ = <strong>{fr(C, 3)}</strong> ({fr(C * 100, 1)} %) : indépendante du métal, elle ne dépend que de la structure.</>)}
      {ligne('Masse volumique', <>ρ = n M / (N<sub>A</sub> a³) = {n} × {fr(e.M, 2)} / (6,022 × 10²³ × ({fr(a, 4)} × 10⁻⁷)³) = <strong>{fr(rho, 2)} g/cm³</strong> ; tables : {fr(e.rho, 2)} g/cm³.</>)}
    </div>; })();
  const resSites = atelier === 'sites' && (() => { const { h, t, a, R, rs, rIns, nSites } = sc, f = formSite[t][site];
    return <div>
      {ligne('Hôte', <>{h.nom}, structure {STRUCT[t].nom}, a = {fr(a, 4)} nm, R = {STRUCT[t].formR} = <strong>{fr(R, 4)} nm</strong>.</>)}
      {ligne(`Site ${NOM_SITE[site]}`, <>{nb(nSites)} par maille ; rayon maximal r = {f} = {site === 'oct' ? `${fr(a, 4)} / 2 − ${fr(R, 4)}` : `${fr(a, 4)} × ${t === 'F' ? '√3' : '√5'} / 4 − ${fr(R, 4)}`} = <strong>{fr(rs, 4)} nm</strong>, soit {fr(rs / R, 3)} R.</>)}
      {ins && ligne('Atome inséré', <>{INSERES[ins].nom}, r = {fr(rIns, 3)} nm {rIns <= rs + 1e-9 ? <strong style={{ color: VERT }}>≤ {fr(rs, 4)} nm : il se loge sans déformation ✅</strong> : <strong style={{ color: '#b91c1c' }}>&gt; {fr(rs, 4)} nm (rapport {fr(rIns / rs, 2)}) : il déforme la maille ❌</strong>}.</>)}
      {ins && <div style={{ overflowX: 'auto', marginTop: 8 }}><table style={{ borderCollapse: 'collapse', background: 'white', fontSize: 13 }}>
        <thead><tr>{['Hôte', 'Site octaédrique : r (nm)', `r(${ins}) / r du site`, 'Site tétraédrique : r (nm)', `r(${ins}) / r du site`].map(x => <th key={x} style={{ padding: '3px 8px', textAlign: 'right', color: KIT.txt2, borderBottom: `1px solid ${KIT.bord}` }}>{x}</th>)}</tr></thead>
        <tbody>{Object.entries(HOTES).map(([k, hh]) => { const Rh = STRUCT[hh.type].R(hh.a), ri = INSERES[ins].r, cell = { padding: '2px 8px', textAlign: 'right' };
          const duo = r => [<td key="r" style={cell}>{fr(r, 4)}</td>, <td key="q" style={{ ...cell, fontWeight: 700, color: ri <= r ? VERT : '#b91c1c' }}>{fr(ri / r, 2)} {ri <= r ? '✅' : '❌'}</td>];
          return <tr key={k} style={{ background: k === hote ? '#f0f9ff' : 'white' }}><td style={cell}>{hh.nom}</td>{duo(rSite(hh.type, 'oct', hh.a, Rh))}{duo(rSite(hh.type, 'tet', hh.a, Rh))}</tr>; })}</tbody></table>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Rapport ≤ 1 : l’atome se loge sans déformation. Plus il dépasse 1, plus la maille est déformée.</div></div>}
    </div>; })();
  const resIon = atelier === 'ionique' && (() => { const { c, a } = sc, Z = nombreIons(c, 1), s = c.cat.r + c.an.r, q = c.cat.r / c.an.r, prev = coordPrevue(q), aCalc = c.aDe(s), rho = masseVol(Z, c.M, a);
    return <div>
      {ligne('Composition', <>{nb(nombreIons(c, 0))} {c.an.nom} + {nb(Z)} {c.cat.nom} par maille : Z = <strong>{Z}</strong> unité(s) {c.formule}.</>)}
      {ligne('Contact', <>cation et anion voisins se touchent le long de {c.contact} : <strong>{c.rel}</strong>. Avec r₊ + r₋ = {fr(c.cat.r, 3)} + {fr(c.an.r, 3)} = {fr(s, 3)} nm, on prévoit a = {fr(aCalc, 4)} nm (mesuré : {fr(a, 4)} nm, écart {fr(Math.abs(aCalc - a) / a * 100, 1)} %).</>)}
      {ligne('Coordinence', <>{c.coord} anions autour de chaque cation. Rapport r₊ / r₋ = {fr(c.cat.r, 3)} / {fr(c.an.r, 3)} = <strong>{fr(q, 2)}</strong> → coordinence prévue : {prev} {prev === c.coord ? '✅' : '❌'}.</>)}
      {ligne('Masse volumique', <>ρ = Z M / (N<sub>A</sub> a³) = {Z} × {fr(c.M, 2)} / (6,022 × 10²³ × ({fr(a, 4)} × 10⁻⁷)³) = <strong>{fr(rho, 2)} g/cm³</strong> ; tables : {fr(c.rho, 2)} g/cm³.</>)}
    </div>; })();

  const lignesTab = sc.lignes;
  const selecteur = (liste, val, set, couleur) => liste.map(([k, l]) => <button key={k} onClick={() => { set(k); setSurlig(null); }} style={stylePetitBouton(val === k, couleur)}>{l}</button>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {selecteur([['maille', '🧊 Mailles métalliques'], ['sites', '🕳️ Sites interstitiels'], ['ionique', '🧂 Cristaux ioniques']], atelier, setAtelier, '#16a34a')}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        {atelier === 'maille' && <>
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Structure :</span>
          {Object.values(STRUCT).map(s => <button key={s.cle} onClick={() => { setMet(METAUX_PAR_STRUCT[s.cle][0]); setSurlig(null); }} style={stylePetitBouton(sc.t === s.cle, '#1d4ed8')}>{s.court}</button>)}
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginLeft: 6 }}>Métal :</span>
          {METAUX_PAR_STRUCT[sc.t].map(k => <button key={k} onClick={() => { setMet(k); setSurlig(null); }} style={stylePetitBouton(met === k, '#0f766e')}>{ECHANTILLONS[k].formule}</button>)}</>}
        {atelier === 'sites' && <>
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Hôte :</span>{selecteur(Object.entries(HOTES).map(([k, h]) => [k, h.nom]), hote, setHote, '#1d4ed8')}
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginLeft: 6 }}>Site :</span>{selecteur([['oct', 'octaédrique'], ['tet', 'tétraédrique']], site, setSite, VIOLET)}
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginLeft: 6 }}>Atome inséré :</span>
          <button onClick={() => setIns(null)} style={stylePetitBouton(ins === null, VERMILLON)}>aucun</button>{selecteur(Object.keys(INSERES).map(k => [k, k]), ins, setIns, VERMILLON)}</>}
        {atelier === 'ionique' && <>
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Cristal :</span>{selecteur(Object.entries(IONIQUES).map(([k, c]) => [k, c.formule]), ion, setIon, '#1d4ed8')}
          <span style={{ fontSize: 13, color: KIT.txt2 }}>({sc.c.nom})</span></>}
      </div>
      <div className={`mail-vue${enExplore ? ' large' : ''}`}><div>
      <Vue3D sph={sc.sph} seg={contact ? sc.seg : null} vue={vue} setVue={setVue} echelle={echelle} surlig={surlig} parts={parts}
        titre={`Maille ${atelier === 'maille' ? sc.st.nom + ' du ' + sc.e.nom : atelier === 'sites' ? 'du ' + sc.h.nom : 'de ' + sc.c.formule}`}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Rotation" val={vue.yaw} min={-180} max={180} pas={1} set={v => setVue(o => ({ ...o, yaw: v }))} unite="°" fmt={v => String(Math.round(v))}/>
        <Curseur nom="Inclinaison" val={vue.pitch} min={0} max={85} pas={1} set={v => setVue(o => ({ ...o, pitch: v }))} unite="°" fmt={v => String(Math.round(v))}/>
        <Curseur nom="Taille des sphères" val={echelle * 100} min={20} max={100} pas={1} set={v => setEchelle(v / 100)} unite=" %" fmt={v => String(Math.round(v))}/></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => setEchelle(1)} style={stylePetitBouton(false, '#334155')}>Sphères en contact (100 %)</button>
        {sc.seg && <button onClick={() => setContact(c => !c)} style={stylePetitBouton(contact, '#334155')}>{contact ? '✓ ' : ''}Direction de contact</button>}
        <button onClick={() => setParts(p => !p)} style={stylePetitBouton(parts, '#334155')}>{parts ? '✓ ' : ''}Étiquettes</button></div>
      {atelier !== 'sites' || ins === null ? null : <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Contour rouge pointillé : l’atome est plus gros que le site.</div>}
      </div>
      <div style={{ marginTop: enExplore ? 0 : 10, minWidth: 0 }}>
        {!corrige && <button onClick={() => setCorrige(true)} style={styleBouton(true, '#0ea5e9')}><Pic n="eye"/>Afficher le dénombrement et les calculs</button>}
        {corrige && <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{atelier === 'sites' ? `Dénombrement des sites ${NOM_SITE[site]}s` : 'Dénombrement par maille'}</div>
          <TableDenombrement lignes={lignesTab} especes={atelier === 'sites' ? [{ nom: 'hôtes' }, { nom: 'sites' }] : sc.especes} noms={sc.noms} surlig={surlig} setSurlig={setSurlig} unite={atelier === 'ionique' ? 'ions' : atelier === 'sites' ? 'sites' : 'atomes'}/>
          <div style={{ marginTop: 8 }}>{resMaille}{resSites}{resIon}</div></div>}
      </div></div>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Comparez CS, CC et CFC : nombre d’atomes, coordinence, compacité. Changez de métal : la compacité change-t-elle ?</li>
        <li>Mettez les sphères à 100 % : la direction de contact (pointillé) est-elle bien celle annoncée ?</li>
        <li>Fer α et fer γ : dans quelle phase les sites sont-ils les plus grands ? Pourquoi le carbone est-il plus soluble dans γ ?</li>
        <li>Palladium : dans quel site l’hydrogène se loge-t-il sans déformation ?</li>
        <li>Cristaux ioniques : le rapport r₊ / r₋ prévoit-il bien la coordinence de NaCl, CsCl, ZnS ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>sommet 1/8 ; arête 1/4 ; face 1/2 ; intérieur 1</li><li>CS a = 2R ; CC a√3 = 4R ; CFC a√2 = 4R</li><li>C = n (4/3)πR³ / a³ ; ρ = n M / (N<sub>A</sub> a³)</li><li>CFC : 4 sites octaédriques, 8 tétraédriques</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mail-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mail-l1.cote { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); }
        .mail-vue { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 1000px) { .mail-vue.large { grid-template-columns: minmax(0, 470px) minmax(0, 1fr); } }
        .mail-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .mail-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mailles cristallines : motif, compacité et sites</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Comment décrire un cristal avec une seule maille ? En comptant ses atomes, en mesurant la place qu’ils occupent, puis en cherchant les <strong>vides</strong> où l’on peut loger d’autres atomes (acier, hydrures) ou les ions d’un sel.</div>
      <div className={`mail-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="mail-l2">{panneauHypo}</div>}
      {enExplore && <div className="mail-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
