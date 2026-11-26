// Vue 3D (three.js) d'un carbone et de ses 4 groupes : on saisit la molécule (souris ou doigt) pour la faire tourner,
// on place le groupe de priorité 4 derrière en un clic et on lit le sens de 1 → 2 → 3. Chargée à la demande (React.lazy).
// Tout le calcul (priorités, sens, lettre) vient de chiraliteModele.js et carbone3dModele.js (testés) ; ici, seulement le dessin.
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import * as M from "./chiraliteModele";
import * as V from "./carbone3dModele";
import { COUL_RANG } from "./ChiraliteSchema";
import { vec, COUL_EL, RAYON_EL, placerCylindre, etiquette, liberer, brancherGestes } from "./scene3d";
import { KIT, stylePetitBouton } from "../commun";

const L_LIAISON = 1.5;                                             // longueur de dessin d'une liaison C–X (non à l'échelle)
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const matriceDe = R => new THREE.Matrix4().set(R[0][0], R[0][1], R[0][2], 0, R[1][0], R[1][1], R[1][2], 0, R[2][0], R[2][1], R[2][2], 0, 0, 0, 0, 1);
const lignesDe = q => { const e = new THREE.Matrix4().makeRotationFromQuaternion(q).elements; return [0, 1, 2].map(r => [0, 1, 2].map(c => e[c * 4 + r])); };

// Props :
//   mol, c, aff : molécule, carbone étudié et disposition (comme dans Chiralite.jsx)
//   rangs       : affiche les pastilles de priorité et les couleurs 1 à 4
//   miroir      : montre aussi l'image dans un miroir (plan vertical entre les deux molécules)
//   fleche      : trace la flèche 1 → 2 → 3 autour de l'axe
//   devoiler    : indique le sens lu et la lettre (sinon seulement « n°4 derrière / devant »)
//   onAxe       : appelé quand l'élève place le n°4 derrière (bouton)
//   autoAxe     : numéro qui, en augmentant, déclenche la mise en place du n°4 derrière (réinitialisation, étape suivante)
export default function Carbone3D({ mol, c, aff, rangs = false, miroir = false, fleche = false, devoiler = true, onAxe, nom }) {
  const hote = useRef(null);
  const etat = useRef({});
  const [erreur, setErreur] = useState(null);
  const [feuille, setFeuille] = useState(true);
  const [lec, setLec] = useState(null);
  const cl = useMemo(() => M.classementCIP(mol.g, c), [mol, c]);
  const distincts = cl.distincts;
  const rangDe = j => cl.ordre.findIndex(x => x.j === j) + 1;
  const affCle = `${aff.orient}:${M.EMPLACEMENTS.map(e => aff[e]).join(',')}`;     // la disposition est recréée à chaque rendu : on suit son contenu

  // Création de la scène (une seule fois)
  useEffect(() => {
    const el = hote.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { setErreur('Votre navigateur ne permet pas l’affichage 3D.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 11); camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const lum = new THREE.DirectionalLight(0xffffff, 1.0); lum.position.set(3, 5, 9); scene.add(lum);
    const racine = new THREE.Group(); scene.add(racine);
    const contenu = new THREE.Group(); racine.add(contenu);     // reconstruit à chaque changement de molécule
    etat.current = { renderer, scene, camera, racine, contenu, sale: true, anim: null };

    const demander = () => { etat.current.sale = true; };
    const taille = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.z = (etat.current.zBase || 11) * (etat.current.zf || 1) * Math.max(1, 1.12 / camera.aspect);      // écran étroit : on recule pour que les étiquettes ne soient pas coupées
      camera.updateProjectionMatrix(); demander();
    };
    etat.current.taille = taille;
    const ro = new ResizeObserver(taille); ro.observe(el); taille();

    // Rotation à la souris / au doigt : trackball simple autour des axes de l'écran
    const dessus = brancherGestes(el, {
      debut: () => { etat.current.anim = null; },
      tourner: (dx, dy) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.011).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.011)); racine.quaternion.premultiply(q).normalize(); demander(); etat.current.lire?.(); },
      zoomer: f => { etat.current.zf = Math.min(1.8, Math.max(0.5, (etat.current.zf || 1) * f)); taille(); demander(); } });

    let raf;
    const boucle = () => {
      raf = requestAnimationFrame(boucle);
      const s = etat.current;
      if (s.anim) {
        const t = Math.min(1, (performance.now() - s.anim.t0) / s.anim.duree), e = t * t * (3 - 2 * t);
        racine.quaternion.slerpQuaternions(s.anim.de, s.anim.vers, e);
        if (t >= 1) { s.anim = null; s.lire?.(); } else s.lire?.();
        s.sale = true;
      }
      if (s.sale) { renderer.render(scene, camera); s.sale = false; }
    };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      dessus();
      liberer(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  // Reconstruction de la molécule à chaque changement (molécule, carbone, disposition, options)
  useEffect(() => {
    const s = etat.current;
    if (!s.scene) return;
    const { contenu } = s;
    while (contenu.children.length) {
      liberer(contenu.children.pop());
    }
    s.zBase = miroir ? 13.5 : 11; s.taille?.();
    const js = M.EMPLACEMENTS.map(e => aff[e]);
    const construire = (refl, dx) => {
      const g = new THREE.Group(); g.position.x = dx;
      const noyau = new THREE.Mesh(new THREE.SphereGeometry(0.4, 28, 20), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
      g.add(noyau);
      js.forEach(j => {
        let v = M.vecteur3D(aff, j); if (refl) v = V.reflechi(v);
        const p = vec(v).multiplyScalar(L_LIAISON), el = mol.g.el[j], r = RAYON_EL[el] || 0.4;
        const at = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color: COUL_EL[el] || 0x64748b, roughness: 0.45 }));
        at.position.copy(p); g.add(at);
        const dir = vec(v).normalize();
        const liaison = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 }));
        placerCylindre(liaison, dir.clone().multiplyScalar(0.3), p.clone().sub(dir.clone().multiplyScalar(r * 0.6)), 0.075); g.add(liaison);
        const et = etiquette(M.etiquette(mol, c, j), rangs && distincts ? rangDe(j) : 0);
        et.position.copy(dir.clone().multiplyScalar(L_LIAISON + r + 0.62)); g.add(et);
      });
      return g;
    };
    const dx = miroir ? 3.6 : 0;
    const principal = construire(false, -dx);
    contenu.add(principal);
    if (miroir) {
      contenu.add(construire(true, dx));
      const plan = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
      plan.rotation.y = Math.PI / 2; contenu.add(plan);
      const bord = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(5.6, 5.6)), new THREE.LineBasicMaterial({ color: 0x0369a1 }));
      bord.rotation.y = Math.PI / 2; contenu.add(bord);
    } else {
      // feuille du dessin de Cram : plan qui contient les deux liaisons « dans le plan » (A et B)
      const f = new THREE.Group(); f.name = 'feuille'; f.rotation.y = 0.5;
      f.add(new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.8), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })));
      f.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.2, 4.8)), new THREE.LineBasicMaterial({ color: 0x64748b })));
      f.visible = feuille;
      principal.add(f);
      // flèche 1 → 2 → 3
      const fl = fleche && distincts ? V.fleche123(mol.g, c, aff) : null;
      if (fl) {
        const matF = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
        fl.arcs.forEach(arc => {
          const pts = arc.map(vec);
          principal.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.065, 8), matF));
          const fin = pts[pts.length - 1], tang = fin.clone().sub(pts[pts.length - 3]).normalize();
          const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.46, 16), matF);
          cone.position.copy(fin).addScaledVector(tang, -0.12); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang);
          principal.add(cone);
        });
      }
    }
    // lecture (n°4 derrière ? sens ?) recalculée à chaque rotation
    s.lire = () => {
      if (miroir || !distincts) { setLec(null); return; }
      const l = V.lecture(mol.g, c, aff, lignesDe(s.racine.quaternion));
      setLec(prec => (prec && prec.derriere === l.derriere && prec.sens === l.sens && prec.lettre === l.lettre ? prec : { derriere: l.derriere, sens: l.sens, lettre: l.lettre }));
    };
    s.lire(); s.sale = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mol, c, affCle, rangs, miroir, fleche, distincts]);

  // La feuille s'affiche ou se masque sans reconstruire la molécule
  useEffect(() => {
    const s = etat.current; if (!s.contenu) return;
    s.contenu.traverse(o => { if (o.name === 'feuille') o.visible = feuille; });
    s.sale = true;
  }, [feuille, mol, c, affCle, rangs, miroir, fleche]);

  const allerA = R => {
    const s = etat.current; if (!s.racine) return;
    const vers = new THREE.Quaternion().setFromRotationMatrix(matriceDe(R));
    s.anim = { de: s.racine.quaternion.clone(), vers, t0: performance.now(), duree: 750 };
  };
  const placerQuatre = () => { if (!distincts) return; allerA(V.matriceVueAxe(mol.g, c, aff)); onAxe?.(); };
  const vueFace = () => allerA(I3);

  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur} Le dessin reste disponible.</div>;
  const legende = rangs && distincts && !miroir && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
      {cl.ordre.map((x, k) => <span key={x.j} style={{ color: COUL_RANG[k + 1] }}>{k + 1} : {M.etiquette(mol, c, x.j)}</span>)}
    </div>);
  return (
    <div>
      <div ref={hote} role="img" aria-label={nom || `Vue 3D de ${mol.nom}, orientable à la souris ou au doigt`}
        style={{ width: '100%', height: miroir ? 300 : 340, borderRadius: 14, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none', cursor: 'grab' }} />
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, margin: '6px 0' }}>Faites glisser pour tourner la molécule.</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={vueFace} style={stylePetitBouton(false)}>Vue de face (dessin de Cram)</button>
        {!miroir && distincts && <button onClick={placerQuatre} style={stylePetitBouton(false, '#0f172a')}>Placer le n°4 derrière</button>}
        {!miroir && <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={feuille} onChange={e => setFeuille(e.target.checked)} />Montrer la feuille du dessin</label>}
      </div>
      {legende && <div style={{ marginTop: 8 }}>{legende}</div>}
      {lec && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, textAlign: 'center', fontWeight: 700, color: lec.derriere ? '#15803d' : '#b45309' }}>
        {lec.derriere
          ? (devoiler ? <>Le n°4 est derrière : 1 → 2 → 3 tourne dans le sens {lec.sens}, donc la configuration est {lec.lettre}.</> : <>Le n°4 est derrière : vous pouvez lire le sens de 1 → 2 → 3.</>)
          : <>Le n°4 est devant ou sur le côté : le sens lu serait à l’envers. Tournez la molécule pour mettre le n°4 derrière.</>}
      </div>}
    </div>
  );
}
