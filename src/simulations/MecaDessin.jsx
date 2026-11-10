// Atelier « Dessine les flèches » : l'élève clique sur la source d'un doublet puis sur sa destination ; la simulation vérifie.
// Les cibles cliquables sont calculées à partir du modèle (mecaModele.js), donc toujours alignées sur le dessin.
import { useState, useMemo, useEffect } from "react";
import { Mol2D, FlecheCourbe } from "./MecaVue2D";
import { atomes2D, doublets2D, VACANCE2D } from "./mecaModele";
import { KIT, styleBouton, stylePetitBouton } from "../commun";

const milieu = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const polaire = (c, r, deg) => [c[0] + r * Math.cos(deg * Math.PI / 180), c[1] + r * Math.sin(deg * Math.PI / 180)];

// Chaque étape : u de la scène, cibles cliquables, flèches attendues (fonction de comparaison).
//   cible = { id, nom, pos, role: 'doublet' | 'atome' | 'liaison' | 'lacune' }
//   les doublets et liaisons sont des SOURCES valables ; les atomes et la lacune sont des DESTINATIONS ; un atome cliqué en premier est une erreur instructive.
export function scene(etape) {
  const u = etape === 1 ? 0 : 0.62;
  const a = atomes2D(u), dbl = doublets2D(u, a);
  const cibles = [];
  const pi = milieu(a.C2, a.C3);
  if (etape === 1) {
    cibles.push({ id: 'pi', nom: 'la liaison π C=C', pos: [pi[0] + 3, pi[1] + 4], role: 'liaison' });
    cibles.push({ id: 'hbr', nom: 'la liaison H–Br', pos: milieu(a.Ht, a.Br), role: 'liaison' });
    cibles.push({ id: 'cc', nom: 'la liaison simple C–C', pos: milieu(a.C1, a.C2), role: 'liaison' });
  } else {
    cibles.push({ id: 'cc', nom: 'la liaison simple C–C', pos: milieu(a.C1, a.C2), role: 'liaison' });
  }
  dbl.filter(d => d.op > 0.5).forEach(d => cibles.push({ id: 'dbr' + d.k, nom: 'un doublet non liant de Br', pos: polaire(a.Br, 17, d.ang), role: 'doublet' }));
  cibles.push({ id: 'Br', nom: 'l\'atome de brome', pos: a.Br, role: 'atome' });
  if (etape === 1) {
    cibles.push({ id: 'H', nom: 'l\'atome d\'hydrogène de HBr', pos: a.Ht, role: 'atome' });
    cibles.push({ id: 'C3', nom: 'le carbone C3', pos: a.C3, role: 'atome' });
    cibles.push({ id: 'C2', nom: 'le carbone C2', pos: a.C2, role: 'atome' });
  } else {
    cibles.push({ id: 'C2', nom: 'le carbone C⁺', pos: a.C2, role: 'atome' });
    cibles.push({ id: 'lacune', nom: 'la lacune électronique de C⁺', pos: VACANCE2D, role: 'lacune' });
    cibles.push({ id: 'C3', nom: 'le carbone C3', pos: a.C3, role: 'atome' });
    cibles.push({ id: 'H2', nom: 'l\'atome d\'hydrogène de C⁺', pos: a.H2, role: 'atome' });
  }
  const bonne = etape === 1
    ? [(s, d) => s === 'pi' && d === 'H', (s, d) => s === 'hbr' && d === 'Br']
    : [(s, d) => s.startsWith('dbr') && (d === 'lacune' || d === 'C2')];
  const texte = etape === 1
    ? 'Dessine les deux flèches courbes de l\'étape 1 : le doublet π attaque l\'hydrogène de HBr, et la liaison H–Br se rompt.'
    : 'Dessine la flèche courbe de l\'étape 2 : Br⁻ attaque le carbocation.';
  return { u, cibles, bonne, texte, nbAttendu: bonne.length };
}

// Retour sur une flèche tracée (source → destination), jamais le résultat brut
function retour(sc, fl, cibles) {
  const S = cibles.find(c => c.id === fl.src), D = cibles.find(c => c.id === fl.dst);
  if (sc.bonne.some(f => f(fl.src, fl.dst))) return { ok: true, msg: 'Bien vu.' };
  if (S.role === 'atome') return { ok: false, msg: `Une flèche courbe ne part pas d'un atome (${S.nom}) : elle part d'un doublet d'électrons (liaison ou doublet non liant).` };
  if (S.role === 'lacune') return { ok: false, msg: 'Une lacune ne donne rien : la flèche part du doublet qui va combler la lacune, pas de la lacune.' };
  if (sc.bonne.some(f => f(fl.dst, fl.src))) return { ok: false, msg: 'Sens inversé : le doublet va du site riche en électrons vers le site pauvre en électrons.' };
  if (D.role === 'liaison' || D.role === 'doublet') return { ok: false, msg: `Une flèche pointe vers un atome ou un site pauvre en électrons, pas vers ${D.nom}.` };
  return { ok: false, msg: `Le doublet de ${S.nom} ne va pas vers ${D.nom}. Cherche le site pauvre en électrons (δ+ ou lacune).` };
}

export function DessinFleches({ etape, setEtape, onReussite }) {
  const sc = useMemo(() => scene(etape), [etape]);
  const [fleches, setFleches] = useState([]);
  const [sel, setSel] = useState(null);
  const [verifie, setVerifie] = useState(false);
  const [solution, setSolution] = useState(false);
  useEffect(() => { setFleches([]); setSel(null); setVerifie(false); setSolution(false); }, [etape]);
  const cible = id => sc.cibles.find(c => c.id === id);
  const clic = c => {
    setVerifie(false);
    if (!sel) { setSel(c.id); return; }
    if (sel === c.id) { setSel(null); return; }
    if (c.role === 'doublet' || c.role === 'liaison') { setSel(c.id); return; }   // un autre doublet ou une autre liaison : on change de source
    setFleches(f => [...f, { src: sel, dst: c.id }]);
    setSel(null);
  };
  const analyses = fleches.map(f => retour(sc, f, sc.cibles));
  const tousBons = fleches.length === sc.nbAttendu && analyses.every(a => a.ok) && sc.bonne.every(g => fleches.some(f => g(f.src, f.dst)));
  const verifier = () => { setVerifie(true); if (tousBons) onReussite && onReussite(etape); };
  const dir = (f) => {   // flèche tracée : s'arrête avant l'atome visé
    const S = cible(f.src), D = cible(f.dst), dx = D.pos[0] - S.pos[0], dy = D.pos[1] - S.pos[1], d = Math.hypot(dx, dy) || 1;
    const r = D.role === 'atome' ? 11 : 4;
    return { de: S.pos, vers: [D.pos[0] - dx / d * r, D.pos[1] - dy / d * r] };
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setEtape(1)} style={stylePetitBouton(etape === 1, '#b91c1c')}>Étape 1</button>
        <button onClick={() => setEtape(2)} style={stylePetitBouton(etape === 2, '#b91c1c')}>Étape 2</button>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, lineHeight: 1.5 }}>{sc.texte}</div>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Clique d'abord sur le <strong>début</strong> de la flèche (une liaison ou un doublet non liant), puis sur sa <strong>destination</strong> (un atome ou la lacune).</div>
      <div style={{ position: 'relative', maxWidth: 560, touchAction: 'manipulation' }}>
        <Mol2D u={sc.u} face={1} avecFleches={solution} />
        <svg viewBox="-125 -105 300 285" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {fleches.map((f, i) => { const { de, vers } = dir(f); return <FlecheCourbe key={i} de={de} vers={vers} courbe={1} couleur={verifie ? (analyses[i].ok ? '#15803d' : '#dc2626') : '#2563eb'} id={'u' + i} />; })}
          {[...sc.cibles].sort((x, y) => (x.role === 'atome' || x.role === 'lacune' ? 0 : 1) - (y.role === 'atome' || y.role === 'lacune' ? 0 : 1)).map(c => {
            const actif = sel === c.id, r = c.role === 'atome' || c.role === 'lacune' ? 12 : 8;
            return (
              <g key={c.id} onClick={() => clic(c)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label={c.nom}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clic(c); } }}>
                <title>{c.nom}</title>
                <circle cx={c.pos[0]} cy={c.pos[1]} r={r} fill={actif ? 'rgba(37,99,235,0.25)' : 'transparent'} stroke={actif ? '#2563eb' : '#94a3b8'} strokeWidth={actif ? 2 : 1} strokeDasharray={actif ? undefined : '2 3'} />
              </g>);
          })}
        </svg>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt, minHeight: 20 }}>
        {sel ? <>Début choisi : <strong>{cible(sel).nom}</strong>. Clique maintenant sur la destination.</> : fleches.length === 0 ? 'Aucune flèche pour l\'instant.' : null}
      </div>
      {fleches.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
          {fleches.map((f, i) => (
            <li key={i}>De <strong>{cible(f.src).nom}</strong> vers <strong>{cible(f.dst).nom}</strong>
              {verifie && <span style={{ color: analyses[i].ok ? '#15803d' : '#b91c1c' }}> — {analyses[i].ok ? '✅' : '❌'} {analyses[i].msg}</span>}
            </li>))}
        </ul>)}
      {verifie && !tousBons && analyses.every(a => a.ok) && <div style={{ fontSize: 13.5, color: '#b45309' }}>Il manque encore {sc.nbAttendu - fleches.length} flèche{sc.nbAttendu - fleches.length > 1 ? 's' : ''}.</div>}
      {verifie && tousBons && <div style={{ fontSize: 14, color: '#15803d', fontWeight: 700 }}>Bravo : toutes les flèches sont justes !</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={verifier} disabled={fleches.length === 0} style={styleBouton(fleches.length > 0, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => { setFleches(f => f.slice(0, -1)); setVerifie(false); setSel(null); }} disabled={fleches.length === 0} style={styleBouton(false)}>Annuler la dernière</button>
        <button onClick={() => { setFleches([]); setVerifie(false); setSel(null); }} style={styleBouton(false)}>Tout effacer</button>
        <button onClick={() => setSolution(s => !s)} style={styleBouton(solution, '#b45309')}>{solution ? 'Masquer la solution' : 'Voir la solution'}</button>
      </div>
    </div>
  );
}
