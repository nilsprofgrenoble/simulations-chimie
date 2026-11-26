// Vue 3D (three.js) de l'élimination E2 : H et Br anti-périplanaires, la base arrache H, la double liaison C=C se forme dans le plan (x, z).
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { etat as etatE2 } from "./e23dModele";
import { vec, COUL_EL, RAYON_EL, placerCylindre, etiquette, liberer } from "./scene3d";
import { KIT, stylePetitBouton } from "../commun";

const DIST0 = 19, DIST_MIN = 8, DIST_MAX = 34;
const COUL_BASE = 0x2563eb;

export default function E23D({ u, base = 'HO⁻' }) {
  const hote = useRef(null);
  const s = useRef({});
  const [erreur, setErreur] = useState(null);
  const e = etatE2(u);

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
    racine.quaternion.setFromEuler(new THREE.Euler(0.35, -0.5, 0));
    const contenu = new THREE.Group(); racine.add(contenu);
    s.current = { renderer, scene, camera, racine, contenu, sale: true, dist: DIST0 };
    const taille = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.set(0, 0, s.current.dist * Math.max(1, 1.3 / camera.aspect)); camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix(); s.current.sale = true;
    };
    const ro = new ResizeObserver(taille); ro.observe(el); taille();
    let dernier = null;
    const bas = ev => { dernier = [ev.clientX, ev.clientY]; el.setPointerCapture?.(ev.pointerId); };
    const deplace = ev => {
      if (!dernier) return;
      const dx = ev.clientX - dernier[0], dy = ev.clientY - dernier[1]; dernier = [ev.clientX, ev.clientY];
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.011).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.011));
      racine.quaternion.premultiply(q).normalize(); s.current.sale = true;
    };
    const haut = () => { dernier = null; };
    const molette = ev => { ev.preventDefault(); s.current.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, s.current.dist * (ev.deltaY > 0 ? 1.1 : 0.9))); taille(); };
    el.addEventListener('wheel', molette, { passive: false });
    el.addEventListener('pointerdown', bas); el.addEventListener('pointermove', deplace); el.addEventListener('pointerup', haut); el.addEventListener('pointercancel', haut);
    let raf;
    const boucle = () => { raf = requestAnimationFrame(boucle); if (s.current.sale) { renderer.render(scene, camera); s.current.sale = false; } };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener('wheel', molette);
      el.removeEventListener('pointerdown', bas); el.removeEventListener('pointermove', deplace); el.removeEventListener('pointerup', haut); el.removeEventListener('pointercancel', haut);
      liberer(scene); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const st = s.current; if (!st.scene) return;
    const { contenu } = st;
    while (contenu.children.length) liberer(contenu.children.pop());
    const sphere = (p, r, coul, op = 1) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color: coul, roughness: 0.45, transparent: op < 1, opacity: op }));
      m.position.copy(vec(p)); contenu.add(m);
    };
    const lien = (a, b, op = 1, ep = 0.075, pointille = false) => {
      if (op < 0.03) return;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: pointille ? 0x94a3b8 : 0x64748b, roughness: 0.5, transparent: true, opacity: pointille ? Math.max(op, 0.45) : op }));
      placerCylindre(l, vec(a), vec(b), ep); contenu.add(l);
    };
    const nom = (p, texte, couleur, dir) => { const et = etiquette(texte, 0, couleur); et.position.copy(vec(p)).addScaledVector(vec(dir).normalize(), 0.95); contenu.add(et); };
    const partielle = o => o < 0.97;
    // carbones et liaison C–C (double quand la liaison π se forme)
    sphere(e.cb, RAYON_EL.C, COUL_EL.C); sphere(e.ca, RAYON_EL.C, COUL_EL.C);
    lien(e.cb, e.ca, 1, 0.09);
    if (e.opPi > 0.03) { const dz = [0, 0, 0.32]; lien(e.cb.map((t, i) => t + dz[i]), e.ca.map((t, i) => t + dz[i]), e.opPi, 0.05); }
    // groupes R
    for (const [c, rs] of [[e.cb, e.rb], [e.ca, e.rc]]) rs.forEach(r => { lien(c, r); sphere(r, 0.42, 0x475569); nom(r, 'R', '#475569', r.map((t, i) => t - c[i])); });
    // H : lié à Cβ puis à la base
    sphere(e.H, RAYON_EL.H, COUL_EL.H); lien(e.cb, e.H, e.opCH, 0.07, partielle(e.opCH));
    if (u < 0.6) nom(e.H, 'H', '#475569', [-0.6, 0.3, 0.8]);
    // base
    sphere(e.base, 0.42, COUL_BASE); lien(e.base, e.H, e.opBH, 0.07, partielle(e.opBH));
    nom(e.base, u > 0.6 ? base.replace('⁻', '') : base, '#1d4ed8', [0, 1, 0]);
    // Br
    sphere(e.br, RAYON_EL.Br, COUL_EL.Br); lien(e.ca, e.br, e.opBr, 0.075, partielle(e.opBr));
    nom(e.br, u > 0.55 ? 'Br⁻' : 'Br', '#9a3412', [0, -1, 0]);
    // plan de l'alcène une fois formé
    if (e.f > 0.5) {
      const plan = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16 * e.f, side: THREE.DoubleSide, depthWrite: false }));
      plan.rotation.x = Math.PI / 2; contenu.add(plan);
    }
    st.sale = true;
  }, [u, base]);   // eslint-disable-line react-hooks/exhaustive-deps

  const zoomer = f => { const st = s.current; if (!st.camera) return; st.dist = f === 0 ? DIST0 : Math.min(DIST_MAX, Math.max(DIST_MIN, st.dist * f)); st.camera.position.z = st.dist * Math.max(1, 1.3 / st.camera.aspect); st.camera.updateProjectionMatrix(); st.sale = true; };
  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur}</div>;
  const texte = u < 0.3 ? 'H (en haut) et Br (en bas) sont de part et d’autre de la liaison C–C : ils sont anti-périplanaires.'
    : u < 0.8 ? 'La base arrache H, Br part : les groupes R s’aplatissent, la liaison π se forme.'
      : 'La double liaison C=C est plane : les quatre groupes R sont dans le plan gris.';
  return (
    <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8 }}>
      <div ref={hote} role="img" aria-label="Vue 3D de l’élimination E2, à tourner à la souris ou au doigt"
        style={{ width: '100%', height: 320, borderRadius: 10, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none', cursor: 'grab' }} />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
        <button onClick={() => zoomer(0.8)} aria-label="Zoomer" style={stylePetitBouton(false, '#475569')}>＋ Zoom</button>
        <button onClick={() => zoomer(1.25)} aria-label="Dézoomer" style={stylePetitBouton(false, '#475569')}>－ Dézoom</button>
        <button onClick={() => zoomer(0)} aria-label="Vue d’ensemble" style={stylePetitBouton(false, '#475569')}>Vue d’ensemble</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, margin: '6px 0' }}>Faites glisser pour tourner, molette ou boutons pour zoomer ; avancez la réaction avec le curseur.</div>
      <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: KIT.txt }}>{texte}</div>
    </div>
  );
}
