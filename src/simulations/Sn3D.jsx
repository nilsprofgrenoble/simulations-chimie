// Vue 3D (three.js) de la substitution nucléophile sur le (R)-2-bromobutane : SN2 (inversion de Walden) ou SN1 (carbocation plan).
// L'avancement u vient de la simulation (curseur ou lecture) ; l'élève tourne la molécule pour voir l'attaque par l'arrière.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { etat as etatSN, configuration } from "./sn3dModele";
import { vec, COUL_EL, RAYON_EL, placerCylindre, etiquette, liberer } from "./scene3d";
import { KIT, stylePetitBouton } from "../commun";

const COUL_NU = 0x2563eb;

export default function Sn3D({ meca, u }) {
  const hote = useRef(null);
  const s = useRef({});
  const [erreur, setErreur] = useState(null);
  const [face, setFace] = useState('droite');
  const e = etatSN(meca, u, face), conf = configuration(e);

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
    const lum = new THREE.DirectionalLight(0xffffff, 1.0); lum.position.set(3, 5, 9); scene.add(lum);
    const racine = new THREE.Group(); scene.add(racine);
    racine.quaternion.setFromEuler(new THREE.Euler(0.35, -0.5, 0));
    const contenu = new THREE.Group(); racine.add(contenu);
    s.current = { renderer, scene, camera, racine, contenu, sale: true };
    const taille = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.set(0, 0, 14 * Math.max(1, 1.45 / camera.aspect)); camera.lookAt(0, 0, 0);
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
    el.addEventListener('pointerdown', bas); el.addEventListener('pointermove', deplace); el.addEventListener('pointerup', haut); el.addEventListener('pointercancel', haut);
    let raf;
    const boucle = () => { raf = requestAnimationFrame(boucle); if (s.current.sale) { renderer.render(scene, camera); s.current.sale = false; } };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener('pointerdown', bas); el.removeEventListener('pointermove', deplace); el.removeEventListener('pointerup', haut); el.removeEventListener('pointercancel', haut);
      liberer(scene); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  // Reconstruction à chaque changement d'avancement (la scène est petite : 6 sphères, 5 liaisons, 5 étiquettes)
  useEffect(() => {
    const st = s.current; if (!st.scene) return;
    const { contenu } = st;
    while (contenu.children.length) liberer(contenu.children.pop());
    const sphere = (p, el, coul, r) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r ?? RAYON_EL[el], 28, 20), new THREE.MeshStandardMaterial({ color: coul ?? COUL_EL[el], roughness: 0.45 }));
      m.position.copy(vec(p)); contenu.add(m); return m;
    };
    const liaison = (p, op, ep = 0.075) => {
      if (op < 0.03) return;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, transparent: true, opacity: op }));
      const d = vec(p).normalize();
      placerCylindre(l, d.clone().multiplyScalar(0.3), vec(p).sub(d.clone().multiplyScalar(0.3)), ep); contenu.add(l);
    };
    const noyau = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    contenu.add(noyau);
    const groupes = [['CH₂CH₃', 'C'], ['CH₃', 'C'], ['H', 'H']];
    e.subs.forEach((p, k) => {
      sphere(p, groupes[k][1]); liaison(p, 1);
      const et = etiquette(groupes[k][0]); const d = vec(p).normalize(); et.position.copy(vec(p).addScaledVector(d, 0.95)); contenu.add(et);
    });
    // groupe partant : Br
    sphere(e.lg, 'Br'); liaison(e.lg, e.lgOp);
    const eb = etiquette('Br', 0, '#9a3412'); eb.position.copy(vec(e.lg)).add(new THREE.Vector3(0, 0.95, 0)); contenu.add(eb);
    // nucléophile
    sphere(e.nu, 'O', COUL_NU, 0.4); liaison(e.nu, e.nuOp);
    const en = etiquette(e.nuOp > 0.7 ? 'OH' : 'Nu', 0, '#1d4ed8'); en.position.copy(vec(e.nu)).add(new THREE.Vector3(0, 0.95, 0)); contenu.add(en);
    // plan des trois groupes quand ils sont dans un plan perpendiculaire à l'axe
    if (e.plan) {
      const pl = new THREE.Mesh(new THREE.CircleGeometry(2.0, 40), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
      pl.rotation.y = Math.PI / 2; contenu.add(pl);
    }
    st.sale = true;
  }, [e.xSub, e.lg[0], e.nu[0], e.lgOp, e.nuOp, e.plan]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur}</div>;
  const texte = conf ? (e.lgLie ? `(${conf})-2-bromobutane` : `(${conf})-butan-2-ol`)
    : e.plan ? (meca === 'SN2' ? 'État de transition : les trois groupes sont dans un plan' : 'Carbocation : les trois groupes sont dans un plan')
      : 'Le carbone est en cours de transformation…';
  return (
    <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8 }}>
      <div ref={hote} role="img" aria-label={`Vue 3D de la ${meca} sur le 2-bromobutane, à tourner à la souris ou au doigt`}
        style={{ width: '100%', height: 280, borderRadius: 10, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none', cursor: 'grab' }} />
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, margin: '6px 0' }}>Faites glisser pour tourner la molécule ; avancez la réaction avec le curseur.</div>
      {meca === 'SN1' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, alignSelf: 'center' }}>Le nucléophile attaque :</span>
        <button onClick={() => setFace('gauche')} aria-pressed={face === 'gauche'} style={stylePetitBouton(face === 'gauche', '#0891b2')}>du côté où Br est parti</button>
        <button onClick={() => setFace('droite')} aria-pressed={face === 'droite'} style={stylePetitBouton(face === 'droite', '#0891b2')}>de l’autre côté</button>
      </div>}
      <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: conf ? '#0f172a' : '#b45309' }}>{texte}</div>
      {meca === 'SN2' && u >= 0.99 && <div style={{ textAlign: 'center', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>Le nucléophile est arrivé par l’arrière : la configuration est <strong>inversée</strong>, comme un parapluie retourné par le vent.</div>}
      {meca === 'SN1' && u >= 0.99 && <div style={{ textAlign: 'center', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>Les deux faces du carbocation sont attaquées avec la même probabilité : on obtient les <strong>deux énantiomères</strong> (mélange racémique). Changez de face pour voir l’autre.</div>}
    </div>
  );
}
