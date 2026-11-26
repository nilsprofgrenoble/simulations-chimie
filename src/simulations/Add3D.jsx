// Vue 3D (three.js) d'une addition sur la double liaison C=C : Br₂ (anti), OsO₄ (syn) ou H₂/Pd (syn). L'avancement u vient de la simulation ;
// l'élève tourne la molécule pour voir de côté si les deux groupes ajoutés sont du même côté du plan de l'alcène (syn) ou de part et d'autre (anti).
// Tout le calcul (positions, lettres R/S, cis / trans) vient de addition3dModele.js (testé) ; ici, seulement le dessin.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { etat as etatAdd, bilan } from "./addition3dModele";
import { REACTIFS } from "./seleModele";
import { vec, COUL_EL, RAYON_EL, placerCylindre, etiquette, liberer, ajouterCharge, brancherGestes } from "./scene3d";
import { KIT, stylePetitBouton } from "../commun";

const DIST0 = 16, DIST_MIN = 7, DIST_MAX = 34;
const COUL = { Os: 0x7c3aed };

export default function Add3D({ alc, re, u }) {
  const hote = useRef(null);
  const s = useRef({});
  const [erreur, setErreur] = useState(null);
  const [face, setFace] = useState('dessus');
  const e = etatAdd(alc, re, face, u);
  const zoomer = f => { const st = s.current; if (!st.camera) return; st.dist = f === 0 ? DIST0 : Math.min(DIST_MAX, Math.max(DIST_MIN, st.dist * f)); st.camera.position.z = st.dist * Math.max(1, 1.3 / st.camera.aspect); st.camera.updateProjectionMatrix(); st.sale = true; };

  useEffect(() => {
    const el = hote.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { Promise.resolve().then(() => setErreur('Votre navigateur ne permet pas l’affichage 3D.')); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const lum = new THREE.DirectionalLight(0xffffff, 1.0); lum.position.set(3, 6, 9); scene.add(lum);
    const racine = new THREE.Group(); scene.add(racine);
    racine.quaternion.setFromEuler(new THREE.Euler(0.18, -0.35, 0));      // presque de côté : on voit les deux faces du plan de l'alcène
    const contenu = new THREE.Group(); racine.add(contenu);
    s.current = { renderer, scene, camera, racine, contenu, sale: true, dist: DIST0 };
    const taille = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.set(0, 0, s.current.dist * Math.max(1, 1.3 / camera.aspect)); camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix(); s.current.sale = true;
    };
    const ro = new ResizeObserver(taille); ro.observe(el); taille();
    const dessus = brancherGestes(el, {
      tourner: (dx, dy) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.011).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.011)); racine.quaternion.premultiply(q).normalize(); s.current.sale = true; },
      zoomer: f => zoomer(f) });
    let raf;
    const boucle = () => { raf = requestAnimationFrame(boucle); if (s.current.sale) { renderer.render(scene, camera); s.current.sale = false; } };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); dessus();
      liberer(scene); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const st = s.current; if (!st.scene) return;
    const { contenu } = st;
    while (contenu.children.length) liberer(contenu.children.pop());
    const sphere = (p, el, r, coul, op = 1) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r ?? RAYON_EL[el] ?? 0.5, 28, 20), new THREE.MeshStandardMaterial({ color: coul ?? COUL_EL[el], roughness: 0.45, transparent: op < 1, opacity: op }));
      m.position.copy(vec(p)); contenu.add(m);
    };
    const lien = (a, b, op = 1, ep = 0.075) => {
      if (op < 0.03) return;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, transparent: true, opacity: op }));
      placerCylindre(l, vec(a), vec(b), ep); contenu.add(l);
    };
    const nom = (p, texte, couleur, dir = [0, 0.95, 0]) => { const et = etiquette(texte, 0, couleur); et.position.copy(vec(p)).add(vec(dir)); contenu.add(et); };
    contenu.position.y = -e.s * 0.5;
    // plan de l'alcène
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.6), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    plan.rotation.x = Math.PI / 2; contenu.add(plan);
    const cy = alc === 'cyc', nomA = cy ? 'CH₂' : 'CH₃', nomB = cy ? 'CH₃' : 'H';
    e.carbones.forEach((c, k) => {
      sphere(c, 'C');
      [['a', 'C', nomA], ['b', cy ? 'C' : 'H', nomB]].forEach(([cle, elt, txt]) => {
        const p = e.subs[k][cle]; lien(c, p); sphere(p, elt);
        const d = vec(p).sub(vec(c)).normalize(); const et = etiquette(txt); et.position.copy(vec(p)).addScaledVector(d, 0.95); contenu.add(et);
      });
    });
    lien(e.carbones[0], e.carbones[1], 1, 0.09);
    if (!e.sp3) lien(vec(e.carbones[0]).add(new THREE.Vector3(0, 0, 0.22)).toArray(), vec(e.carbones[1]).add(new THREE.Vector3(0, 0, 0.22)).toArray(), 1 - u / 0.6 * 0.6, 0.05);
    if (cy) {      // le cycle : lien entre les deux groupes CH₂
      const a = vec(e.subs[0].a), b = vec(e.subs[1].a), m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0, 2.6));
      contenu.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, m, b]), 24, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })));
    }
    if (e.surface) {      // surface du palladium
      const dalle = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 })); dalle.position.y = e.surface.y; contenu.add(dalle);
      nom([3.4, e.surface.y, 0], 'Pd', '#475569', [0, 0.9, 0]);
    }
    const pos = v => (typeof v === 'string' ? e.carbones[+v[1]] : typeof v === 'number' ? e.atomes[v].p : v.surface);
    e.atomes.forEach(a => {
      if ((a.op ?? 1) < 0.05) return;
      sphere(a.p, a.el, a.el === 'Os' ? 0.62 : a.el === 'O' ? 0.4 : a.el === 'H' ? 0.3 : undefined, COUL[a.el], a.op ?? 1);
      if (a.nom) nom(a.p, a.nom, a.el === 'Br' ? '#9a3412' : a.el === 'Os' ? '#6d28d9' : '#0f172a', [0, a.p[1] >= 0 ? 0.95 : -0.95, 0]);
      if (a.charge) ajouterCharge(contenu, a.p, a.charge, 0.85);
    });
    e.liaisons.forEach(l => lien(l.de >= 0 || typeof l.de === 'number' ? e.atomes[l.de].p : pos(l.de), pos(l.vers), (l.op ?? 1) * (typeof l.de === 'number' ? (e.atomes[l.de].op ?? 1) : 1)));
    st.sale = true;
  }, [alc, re, face, u]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur}</div>;
  const R = REACTIFS[re], fini = u >= 0.999, b = bilan(alc, re, face);
  return (
    <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8 }}>
      <div ref={hote} role="img" aria-label={`Vue 3D de l’addition de ${R.court} sur l’alcène, à tourner à la souris ou au doigt`}
        style={{ width: '100%', height: 340, borderRadius: 10, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none', cursor: 'grab' }} />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        {[['dessus', 'Face du dessus'], ['dessous', 'Face du dessous']].map(([v, l]) => <button key={v} onClick={() => setFace(v)} aria-pressed={face === v} style={stylePetitBouton(face === v, '#0369a1')}>{l}</button>)}
        <button onClick={() => zoomer(0.8)} aria-label="Zoomer" style={stylePetitBouton(false, '#475569')}>＋ Zoom</button>
        <button onClick={() => zoomer(1.25)} aria-label="Dézoomer" style={stylePetitBouton(false, '#475569')}>－ Dézoom</button>
        <button onClick={() => zoomer(0)} aria-label="Vue d’ensemble" style={stylePetitBouton(false, '#475569')}>Vue d’ensemble</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, margin: '6px 0' }}>Faites glisser pour tourner (ou pincez pour zoomer) ; le plan gris est celui de l’alcène. Avancez la réaction avec le curseur. L’autre face donnerait l’image dans un miroir.</div>
      {fini && <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
        {R.mode === 'syn' ? 'Les deux groupes ajoutés sont du même côté du plan : addition syn' : 'Un groupe au-dessus du plan, l’autre en dessous : addition anti'}
        {' — '}{b.texte}
      </div>}
    </div>
  );
}
