// Vue 3D (three.js) de l'addition de Br₂ sur un alcène : pont bromonium d'un côté du plan, Br⁻ qui attaque de l'autre côté (addition anti).
// L'avancement u, la face attaquée et le choix « anti / syn » viennent de la simulation ; l'élève tourne la molécule pour voir de côté.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { etat as etatBr } from "./br3dModele";
import { vec, COUL_EL, RAYON_EL, placerCylindre, etiquette, liberer, ajouterCharge, brancherGestes } from "./scene3d";
import { KIT, stylePetitBouton } from "../commun";

const DIST0 = 24, DIST_MIN = 9, DIST_MAX = 40;

export default function Br3D({ alc, face, syn, u, devoiler = true }) {
  const hote = useRef(null);
  const s = useRef({});
  const [erreur, setErreur] = useState(null);
  const e = etatBr(alc, face, u, syn);
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
    racine.quaternion.setFromEuler(new THREE.Euler(0.22, -0.55, 0));      // vue de trois quarts : on voit l'alcène « de côté »
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
      zoomer: f => { s.current.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, s.current.dist * f)); taille(); } });
    let raf;
    const boucle = () => { raf = requestAnimationFrame(boucle); if (s.current.sale) { renderer.render(scene, camera); s.current.sale = false; } };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      dessus();
      liberer(scene); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const st = s.current; if (!st.scene) return;
    const { contenu } = st;
    while (contenu.children.length) liberer(contenu.children.pop());
    contenu.position.y = -(face === 'dessus' ? 1 : -1) * 0.9 * (u < 0.55 ? 1 : 0.5);   // centre la vue entre l'alcène et le dibrome qui arrive
    const sphere = (p, el, r, coul) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r ?? RAYON_EL[el], 28, 20), new THREE.MeshStandardMaterial({ color: coul ?? COUL_EL[el], roughness: 0.45 }));
      m.position.copy(vec(p)); contenu.add(m);
    };
    const lien = (a, b, op = 1, ep = 0.075) => {
      if (op < 0.03) return;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, transparent: true, opacity: op }));
      placerCylindre(l, vec(a), vec(b), ep); contenu.add(l);
    };
    const nom = (p, texte, couleur, dy = 0.95) => { const et = etiquette(texte, 0, couleur); et.position.copy(vec(p)).add(new THREE.Vector3(0, dy, 0)); contenu.add(et); };
    // plan de l'alcène
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.4), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    plan.rotation.x = Math.PI / 2; contenu.add(plan);
    const R = alc === 'cyclo' ? 'CH₂' : 'CH₃';
    e.carbones.forEach((c, i) => {
      sphere(c, 'C'); lien(c, e.groupes[i].R); lien(c, e.groupes[i].H);
      sphere(e.groupes[i].R, 'C'); sphere(e.groupes[i].H, 'H');
      const dR = vec(e.groupes[i].R).sub(vec(c)).normalize();
      const et = etiquette(R); et.position.copy(vec(e.groupes[i].R).addScaledVector(dR, 0.95)); contenu.add(et);
      const dH = vec(e.groupes[i].H).sub(vec(c)).normalize();
      const eh = etiquette('H'); eh.position.copy(vec(e.groupes[i].H).addScaledVector(dH, 0.7)); contenu.add(eh);
    });
    lien(e.carbones[0], e.carbones[1], 1, 0.09);                 // liaison C–C (double liaison tant que u < 0,55)
    if (u < 0.55) lien(vec(e.carbones[0]).add(new THREE.Vector3(0, 0, 0.22)).toArray(), vec(e.carbones[1]).add(new THREE.Vector3(0, 0, 0.22)).toArray(), 1 - u / 0.55 * 0.6, 0.05);
    if (alc === 'cyclo') {      // le cycle : lien entre les deux groupes CH₂
      const a = vec(e.groupes[0].R), b = vec(e.groupes[1].R), m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0, 2.6));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, m, b]), 24, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 }));
      contenu.add(tube);
    }
    // bromes
    const brnPont = u >= 0.35 && !e.brnLie;
    sphere(e.brn, 'Br'); nom(e.brn, u < 0.35 ? 'Br' : brnPont ? 'Br⁺' : 'Br', '#9a3412');
    if (u < 0.35) { sphere(e.brf, 'Br'); lien(e.brn, e.brf, 1); nom(e.brf, 'Br', '#9a3412'); }
    else { sphere(e.brf, 'Br'); nom(e.brf, 'Br⁻', '#9a3412'); }
    lien(e.brn, e.carbones[0], e.opPont[0]); lien(e.brn, e.carbones[1], e.opPont[1]);
    // charges : Br⁺ du pont bromonium, Br⁻ parti, Br⁻ qui attaque
    if (u >= 0.4 && !e.brnLie) ajouterCharge(contenu, e.brn, '+', 0.85);
    if (u >= 0.4) ajouterCharge(contenu, e.brf, '−', 0.85);
    if (e.brm) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(RAYON_EL.Br, 28, 20), new THREE.MeshStandardMaterial({ color: COUL_EL.Br, roughness: 0.45, transparent: true, opacity: syn ? 0.6 : 1 }));
      m.position.copy(vec(e.brm)); contenu.add(m);
      nom(e.brm, 'Br⁻', '#9a3412', e.brm[1] > 0 ? 0.95 : -0.95);
      const ca = e.carbones[e.attaque === 'C2' ? 0 : 1];
      lien(e.brm, ca, e.opBrm);
      if (e.opBrm < 0.9) ajouterCharge(contenu, e.brm, '−', 0.85);
    }
    st.sale = true;
  }, [alc, face, syn, u]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur}</div>;
  const nums = alc === 'cyclo' ? ['1', '2'] : ['2', '3'];
  const fini = !syn && u >= 0.999;
  return (
    <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8 }}>
      <div ref={hote} role="img" aria-label="Vue 3D de l’addition de Br₂ sur l’alcène, à tourner à la souris ou au doigt"
        style={{ width: '100%', height: 340, borderRadius: 10, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none', cursor: 'grab' }} />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
        <button onClick={() => zoomer(0.8)} aria-label="Zoomer" style={stylePetitBouton(false, '#475569')}>＋ Zoom</button>
        <button onClick={() => zoomer(1.25)} aria-label="Dézoomer" style={stylePetitBouton(false, '#475569')}>－ Dézoom</button>
        <button onClick={() => zoomer(0)} aria-label="Vue d’ensemble" style={stylePetitBouton(false, '#475569')}>Vue d’ensemble</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, margin: '6px 0' }}>Faites glisser pour tourner, molette ou boutons pour zoomer (le plan gris est celui de l’alcène) ; avancez la réaction avec le curseur. Le Br⁻ qui attaque est un autre ion Br⁻ de la solution : celui formé à la première étape est du côté du pont et ne peut pas attaquer de ce côté.</div>
      {fini && <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
        {devoiler ? <>Produit : ({nums[0]}{e.lettres[0]},{nums[1]}{e.lettres[1]}) — </> : null}un Br au-dessus du plan, l’autre en dessous : addition anti
      </div>}
      {syn && u > 0.5 && <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#b91c1c' }}>Br⁻ ne peut pas arriver du côté du pont : il reste à distance.</div>}
    </div>
  );
}
