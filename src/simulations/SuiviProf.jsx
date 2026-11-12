import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { JeuxProf } from "./JeuxEscape";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite } from "../commun";
import { useSession, estProf, deconnexion, rest, toutLire, fonctionComptes } from "../serveur";
import { agreger, etiquettes, formatDuree, formatDate, TableauTempsSimulations, MotDePasse } from "./Compte";
import { ACCENT, ACCENT_CLAIR } from "../theme";
import { estSimulation, estDefi, etiquettesDefis, tempsParSimulation, MODES } from "../suivi";
import { tousLesExercices } from "./Entrainement";
import { DevoirsProf } from "./DevoirsProf";
import { AReprendreProf } from "./AReprendreProf";
import { chapitresDe } from "../chapitres";
import { SyntheseProf } from "./SyntheseProf";
import { ChapitreClasse } from "./ChapitreClasse";
import { PartageClasse } from "./PartageClasse";
import { EtablissementClasse } from "./EtablissementClasse";
import { synchroniserClesValides } from "../syncCles";
import { ComptesProf } from "./ComptesProf";
import { ApercuEleve } from "./ApercuEleve";
import { GuideProf } from "./GuideProf";
import { Pic } from "../Pictos";
import { ElevesProf } from "./ElevesProf";

const ROSE = ACCENT;   // une seule couleur d'action sur tout le site (voir ../theme.js)
const DETAILS = ['exos', 'defis', 'sims'];
// « TSTL 1 » → « tstl1 » (2 à 12 lettres minuscules ou chiffres, sans accent ni espace)
const prefixeDe = nom => nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
const th = { padding: '5px 8px', textAlign: 'left', color: KIT.txt2, fontWeight: 700, whiteSpace: 'nowrap' };
const td = { padding: '5px 8px', verticalAlign: 'top' };
const champ = { padding: '7px 9px', fontSize: 14, borderRadius: 12, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box' };
const mediane = t => { if (!t.length) return 0; const s = [...t].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const echapperHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Case de tableur : une valeur qui commence par = + - @ serait exécutée comme une formule par Excel ou LibreOffice
// (les clés d'exercices sont écrites par le navigateur de l'élève : on ne leur fait pas confiance).
const csvCase = v => {
  let s = typeof v === 'number' ? String(v) : String(v ?? '');
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function telecharger(nom, texte) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + texte], { type: 'text/csv;charset=utf-8' }));
  a.download = nom; document.body.appendChild(a); a.click(); a.remove();
}
// Fiches à imprimer : une par élève (identifiant + mot de passe + QR code qui ouvre la connexion avec l'identifiant rempli), à découper et distribuer
async function imprimerFiches(classe, comptes) {
  const w = window.open('', '_blank');        // ouvert tout de suite (avant l'attente) pour ne pas être bloqué par le navigateur
  if (!w) { alert('Le navigateur a bloqué la fenêtre d’impression : autorisez les fenêtres surgissantes pour ce site, puis recommencez.'); return; }
  const base = window.location.origin + window.location.pathname;
  let qrcode = null;
  try { qrcode = (await import('qrcode-generator')).default; } catch { /* sans QR : la fiche reste utilisable */ }
  const qr = id => { if (!qrcode) return ''; const q = qrcode(0, 'M'); q.addData(`${base}?sim=39&id=${encodeURIComponent(id)}`); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); };
  const fiches = comptes.filter(c => c.mot_de_passe).map(c => `
    <div class="f"><div class="q">${qr(c.identifiant)}</div><div class="c"><div class="t">Simulations de chimie — ${echapperHtml(classe)}</div>
    <div>Identifiant : <b>${echapperHtml(c.identifiant)}</b></div><div>Mot de passe : <b>${echapperHtml(c.mot_de_passe)}</b></div>
    <div class="s">Scanne le QR code (l’identifiant est déjà rempli) ou va sur ${echapperHtml(base)}<br>puis « Se connecter ». À garder pour toi, ne le donne à personne.</div></div></div>`).join('');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Identifiants ${echapperHtml(classe)}</title>
    <style>body{font-family:Arial,sans-serif;margin:12mm}.g{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
    .f{border:1px dashed #555;padding:5mm;font-size:12pt;line-height:1.6;break-inside:avoid;display:flex;gap:4mm;align-items:center}.q{width:26mm;flex:none}.q svg{width:100%;height:auto;display:block}.c{flex:1}
    .t{font-weight:bold;font-size:10.5pt;margin-bottom:2mm;color:#333}.s{font-size:8.5pt;color:#444;margin-top:2mm;line-height:1.4}
    b{font-family:monospace;font-size:13pt}</style><div class="g">${fiches}</div>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

function Comptes({ classe, comptes, onFermer }) {
  const avecMdp = comptes.filter(c => c.mot_de_passe), echecs = comptes.filter(c => c.erreur);
  const copier = () => navigator.clipboard?.writeText(avecMdp.map(c => `${c.identifiant}\t${c.mot_de_passe}`).join('\n'));
  return (
    <div style={{ ...styleBoite, border: '2px solid #f59e0b', background: '#fffbeb' }}>
      <div style={{ fontWeight: 800, color: '#92400e', marginBottom: 6 }}><Pic n="warn"/>Mots de passe affichés une seule fois : imprimez ou copiez-les maintenant.</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 14, marginBottom: 8 }}><tbody>
        {comptes.map(c => <tr key={c.identifiant}><td style={td}><b>{c.identifiant}</b></td>
          <td style={{ ...td, fontFamily: 'monospace' }}>{c.mot_de_passe || <span style={{ color: '#b91c1c' }}><Pic n="ko"/>{c.erreur}</span>}</td></tr>)}
      </tbody></table>
      {!!echecs.length && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 6 }}>Certains comptes n’ont pas pu être créés : relancez « Ajouter des élèves » pour compléter.</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => imprimerFiches(classe, comptes)} style={styleBouton(true, '#16a34a')}>🖨️ Imprimer les fiches</button>
        <button onClick={copier} style={styleBouton(false, '#475569')}><Pic n="clipboard"/>Copier (tableur)</button>
        <button onClick={onFermer} style={styleBouton(false, '#475569')}>J’ai noté les mots de passe, fermer</button>
      </div>
    </div>
  );
}

const css = `
  .sp { max-width: 1100px; margin: 0 auto; text-align: left; }
  .sp-hero { border-radius: 28px; padding: 24px 26px; background: #0b4f94; color: #fff; }
  .sp-etiq { font: 700 13px Inter, system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: #cfe3f7; }
  .sp-hero h2 { margin: 4px 0 14px; font: 800 clamp(26px, 5vw, 36px)/1.1 Outfit, Inter, sans-serif; letter-spacing: -.02em; color: #fff; }
  .sp-ligne { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .sp-select { padding: 10px 14px; border-radius: 14px; border: 0; font: 800 16px Inter, system-ui, sans-serif; color: #0c1a2e; background: #fff; max-width: 100%; }
  .sp-cta { border: 0; border-radius: 14px; padding: 11px 18px; font: 800 15px Inter, system-ui, sans-serif; cursor: pointer; color: #3a2500; background: #f5a31a; }
  .sp-cta:hover { background: #ffb83d; }
  .sp-sec { border: 0; border-radius: 14px; padding: 11px 18px; font: 800 15px Inter, system-ui, sans-serif; cursor: pointer; color: #fff; background: rgba(255,255,255,.18); }
  .sp-sec:hover { background: rgba(255,255,255,.3); }
  .sp-onglets { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0 6px; }
  .sp-onglet { border: 2px solid #cbd5e1; background: #fff; color: #0c1a2e; border-radius: 999px; min-height: 44px; padding: 8px 17px; font: 800 15px Inter, system-ui, sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
  .sp-onglet:hover { border-color: #0b4f94; }
  .sp-onglet[aria-selected="true"] { background: #f5a31a; border-color: #f5a31a; color: #3a2500; }
  .sp-onglet:focus-visible, .sp-cta:focus-visible, .sp-sec:focus-visible, .sp-select:focus-visible { outline: 3px solid #0b4f94; outline-offset: 2px; }
  .sp-aide { margin: 0 2px 14px; color: #3d4d63; font-size: 14.5px; line-height: 1.5; }
  .sp-carte { background: #fff; border: 1px solid #d5dfeb; border-radius: 22px; padding: 20px 22px; margin-bottom: 14px; }
  .sp-carte > h3 { margin: 0 0 4px; font: 800 20px Outfit, Inter, sans-serif; color: #0c1a2e; }
  .sp-carte > .sp-sous { margin: 0 0 12px; color: #3d4d63; font-size: 14px; }
  .sp-danger { border-color: #fecaca; }
  @media (max-width: 480px) { .sp-hero { border-radius: 22px; padding: 20px; } .sp-onglet { padding: 8px 13px; font-size: 14px; } }
`;

const AIDES = {
  synthese: 'Le point sur la classe : qui a travaillé cette semaine, ce qui a été le plus raté, les élèves à relancer.',
  reprendre: 'Les exercices que plusieurs élèves ont ratés : de quoi préparer une reprise en classe, ou un devoir ciblé.',
  devoirs: 'Donnez un devoir (une liste d’exercices et de simulations avec une date limite) et suivez qui l’a fait.',
  eleves: 'Un élève par ligne : ses résultats, ses séances, et les actions sur son compte (mot de passe perdu, suppression).',
  stats: 'Les chiffres détaillés : par exercice, par défi de simulation, et le temps passé sur chaque simulation.',
  reglages: 'Tout ce qui se règle une fois pour la classe : élèves, chapitre en cours, vie de classe, classement, partage.',
  compte: 'Votre mot de passe, la déconnexion, le guide de prise en main et les jeux.',
};

export function SimulationSuiviProf({ naviguer }) {
  const sess = useSession();
  const prof = estProf(sess);
  const [classes, setClasses] = useState([]), [classeId, setClasseId] = useState('');
  const [eleves, setEleves] = useState([]), [lignes, setLignes] = useState([]);
  // « Donner en devoir » (bouton en haut d'une simulation) dépose un devoir à pré-remplir : on ouvre directement l'onglet Devoirs
  const [presetInit] = useState(() => { try { const v = window.sessionStorage.getItem('devoir-preset'); window.sessionStorage.removeItem('devoir-preset'); return v ? JSON.parse(v) : null; } catch { return null; } });
  const [onglet, setOnglet] = useState(presetInit ? 'devoirs' : 'synthese'), [ouvert, setOuvert] = useState(null);
  const [msg, setMsg] = useState(''), [erreur, setErreur] = useState(''), [occupe, setOccupe] = useState(false);
  const [comptes, setComptes] = useState(null), [formClasse, setFormClasse] = useState(false);
  const [siteDispo, setSiteDispo] = useState(false), [etabDispo, setEtabDispo] = useState(false), [vieDispo, setVieDispo] = useState(true), [chapDispo, setChapDispo] = useState(true), [apercu, setApercu] = useState(false), [preset, setPreset] = useState(presetInit);
  const [nc, setNc] = useState({ nom: '', prefixe: '', nombre: 30 }), [prefixeSaisi, setPrefixeSaisi] = useState(false), [ajout, setAjout] = useState(5);
  const etq = useMemo(() => etiquettes(), []), exos = useMemo(() => tousLesExercices(), []), defis = useMemo(() => etiquettesDefis(), []);

  const chargerClasses = useCallback(async (choisir) => {
    let c;
    try { c = await rest('classes?select=id,nom,prefixe,prof_id,vie_classe,chapitres&order=cree_le'); setVieDispo(true); setChapDispo(true); }
    catch {
      setChapDispo(false);                                                                          // supabase/07-chapitre-et-ciblage.sql pas encore appliqué
      try { c = await rest('classes?select=id,nom,prefixe,prof_id,vie_classe&order=cree_le'); setVieDispo(true); }
      catch { c = await rest('classes?select=id,nom,prefixe,prof_id&order=cree_le'); setVieDispo(false); }   // supabase/05-vie-de-classe.sql pas encore appliqué
    }
    // « site » de la classe (supabase/11-energy-at-school.sql) : lecture facultative, sans ce script on garde « paillasse »
    try { const sites = await rest('classes?select=id,site'); c = c.map(x => ({ ...x, site: sites.find(t => t.id === x.id)?.site || 'paillasse' })); setSiteDispo(true); } catch { setSiteDispo(false); }
    // « établissement » de la classe (supabase/13-classement.sql) : lecture facultative
    try { const et = await rest('classes?select=id,etablissement'); c = c.map(x => ({ ...x, etablissement: et.find(t => t.id === x.id)?.etablissement || '' })); setEtabDispo(true); } catch { setEtabDispo(false); }
    setClasses(c);
    setClasseId(cur => choisir || (c.some(x => x.id === cur) ? cur : c[0]?.id || ''));
  }, []);
  const chargerClasse = useCallback(async id => {
    if (!id) { setEleves([]); setLignes([]); return; }
    const el = await rest(`eleves?select=user_id,identifiant&classe_id=eq.${id}&order=identifiant`);
    setEleves(el);
    setLignes(el.length ? await toutLire(`activites?select=user_id,cle,reussi,essais,corrections_vues,duree_s,maj&user_id=in.(${el.map(e => e.user_id).join(',')})`) : []);
  }, []);
  const proteger = useCallback(async f => { setErreur(''); setOccupe(true); try { await f(); } catch (e) { setErreur(e.message); } setOccupe(false); }, []);

  useEffect(() => { if (prof) proteger(() => chargerClasses()); }, [prof, proteger, chargerClasses]);
  useEffect(() => { if (prof) proteger(() => chargerClasse(classeId)); }, [prof, classeId, proteger, chargerClasse]);
  // met à jour la liste des exercices valides du classement public (supabase/14-classement-durci.sql) : sans bruit, une fois par visite
  useEffect(() => { if (prof) synchroniserClesValides([...exos.map(e => e.cle), ...defis.map(d => d.cle)]); }, [prof, exos, defis]);

  if (!prof) {
    return (
      <div style={{ ...cardStyle, maxWidth: 700, margin: '0 auto' }}>
        <p>Cette page est réservée aux professeurs connectés.</p>
        <button onClick={() => naviguer(39)} style={styleBouton(true, ROSE)}>Aller à la connexion</button>
      </div>);
  }

  if (apercu) {
    return (
      <div style={{ ...cardStyle, maxWidth: 1100, margin: '0 auto' }}>
        <ApercuEleve naviguer={naviguer} onFermer={() => setApercu(false)} classe={classes.find(c => c.id === classeId)} eleves={eleves} eleveInitial={typeof apercu === 'string' ? apercu : undefined} />
      </div>);
  }

  const classe = classes.find(c => c.id === classeId);
  const moiId = sess.user?.id, proprio = !classe?.prof_id || !moiId || classe.prof_id === moiId;   // co-professeur : ni suppression, ni partage (09-partage-classe.sql)
  // exercices « je m'entraîne » seuls (pour les compteurs), et exercices + défis des simulations (pour le détail et l'export)
  const parEleve = new Map(eleves.map(e => [e.user_id, agreger(lignes.filter(l => l.user_id === e.user_id && !estSimulation(l.cle) && !estDefi(l.cle)))]));
  const parEleveTout = new Map(eleves.map(e => [e.user_id, agreger(lignes.filter(l => l.user_id === e.user_id && !estSimulation(l.cle)))]));
  const parEleveDefis = new Map(eleves.map(e => [e.user_id, agreger(lignes.filter(l => l.user_id === e.user_id && estDefi(l.cle)))]));

  const creerClasse = e => {
    e.preventDefault();
    proteger(async () => {
      const r = await fonctionComptes('creer_classe', { nom: nc.nom, prefixe: nc.prefixe, nombre: Number(nc.nombre) });
      await chargerClasses(r.classe.id); setComptes({ classe: r.classe.nom, liste: r.comptes }); setFormClasse(false); setNc({ nom: '', prefixe: '', nombre: 30 }); setPrefixeSaisi(false);
    });
  };
  const ajouter = () => proteger(async () => {
    const r = await fonctionComptes('ajouter_eleves', { classe_id: classeId, nombre: Number(ajout) });
    setComptes({ classe: classe.nom, liste: r.comptes }); await chargerClasse(classeId);
  });
  const reinitialiser = id => {
    if (!window.confirm(`Générer un nouveau mot de passe pour ${id} ? L’ancien ne fonctionnera plus.`)) return;
    proteger(async () => { const r = await fonctionComptes('reinitialiser', { identifiant: id }); setComptes({ classe: classe.nom, liste: r.comptes }); });
  };
  const supprimerEleve = id => {
    if (!window.confirm(`Supprimer le compte ${id} et toutes ses données ? Cette action est définitive.`)) return;
    proteger(async () => { await fonctionComptes('supprimer_eleve', { identifiant: id }); await chargerClasse(classeId); setMsg(`${id} supprimé.`); });
  };
  const basculerVie = actif => proteger(async () => {
    await rest(`classes?id=eq.${classeId}`, { method: 'PATCH', corps: { vie_classe: actif } });
    setClasses(cs => cs.map(c => (c.id === classeId ? { ...c, vie_classe: actif } : c)));
    setMsg(actif ? 'Vie de classe activée : les élèves voient l’objectif collectif et les prouesses.' : 'Vie de classe désactivée.');
  });
  const enregistrerEtab = etablissement => proteger(async () => {
    await rest(`classes?id=eq.${classeId}`, { method: 'PATCH', corps: { etablissement: etablissement || null } });
    setClasses(cs => cs.map(c => (c.id === classeId ? { ...c, etablissement } : c)));
    setMsg(etablissement ? `Établissement enregistré : « ${etablissement} ». Les élèves de cette classe qui l’ont choisi peuvent apparaître dans le classement public.` : 'Établissement effacé : plus aucun élève de cette classe n’apparaît dans le classement public.');
  });
  const choisirSite = site => proteger(async () => {
    await rest(`classes?id=eq.${classeId}`, { method: 'PATCH', corps: { site } });
    setClasses(cs => cs.map(c => (c.id === classeId ? { ...c, site } : c)));
    setMsg(site === 'energy' ? 'Classe réservée à Energy@School : ses élèves se connectent sur le site Energy@School.' : 'Classe de la Paillasse virtuelle.');
  });
  const choisirChapitres = liste => proteger(async () => {
    await rest(`classes?id=eq.${classeId}`, { method: 'PATCH', corps: { chapitres: liste } });
    setClasses(cs => cs.map(c => (c.id === classeId ? { ...c, chapitres: liste } : c)));
    setMsg(liste.length ? `Chapitre en cours : ${chapitresDe(liste).map(c => c.label).join(' · ')}. Les élèves de la classe le voient dans « Je m’entraîne ».` : 'Aucun chapitre en cours : les élèves voient la liste complète.');
  });
  const ouvrir = o => { setPreset(null); setOnglet(o); };
  const supprimerClasse = () => {
    const saisie = window.prompt(`Supprimer la classe « ${classe.nom} », ses ${eleves.length} comptes et toutes leurs données ? Définitif.\nPour confirmer, tapez le préfixe : ${classe.prefixe}`);
    if (saisie !== classe.prefixe) return;
    proteger(async () => { await fonctionComptes('supprimer_classe', { classe_id: classeId }); setClasseId(''); await chargerClasses(); setMsg('Classe supprimée.'); });
  };
  const exporter = () => {
    const en = ['identifiant', 'exercice', 'compétence', 'titre', 'réussi', 'essais', 'corrections vues', 'temps (s)', 'séances', 'dernière activité'];
    const rows = [];
    eleves.forEach(e => parEleveTout.get(e.user_id).forEach(a => rows.push([e.identifiant, a.cle, etq[a.cle]?.comp || '', etq[a.cle]?.titre || '', a.reussi ? 'oui' : 'non', a.essais, a.vues, a.duree, a.seances, a.derniere])));
    eleves.forEach(e => tempsParSimulation(lignes.filter(l => l.user_id === e.user_id)).forEach(a => rows.push([e.identifiant, `simulation ${a.id}`, 'simulation', a.nom, '', '', '', a.total, '', `guidé ${a.guide} s ; exploration ${a.explore} s ; défi ${a.defi} s`])));
    telecharger(`suivi-${classe.prefixe}.csv`, [en, ...rows].map(r => r.map(csvCase).join(';')).join('\n'));
  };

  // Vue par exercice
  const parExo = exos.map(x => {
    const lignesX = eleves.map(e => parEleve.get(e.user_id).get(x.cle)).filter(Boolean);
    return { ...x, travailles: lignesX.length, reussis: lignesX.filter(a => a.reussi).length,
      essaisMoy: lignesX.length ? lignesX.reduce((t, a) => t + a.essais, 0) / lignesX.length : 0,
      vues: lignesX.filter(a => a.vues > 0).length, tempsMed: mediane(lignesX.map(a => a.duree)) };
  });
  // Vue par défi de simulation
  const parDefi = defis.map(x => {
    const lignesX = eleves.map(e => parEleveDefis.get(e.user_id).get(x.cle)).filter(Boolean);
    return { ...x, travailles: lignesX.length, reussis: lignesX.filter(a => a.reussi).length,
      essaisMoy: lignesX.length ? lignesX.reduce((t, a) => t + a.essais, 0) / lignesX.length : 0,
      vues: lignesX.filter(a => a.vues > 0).length, tempsMed: mediane(lignesX.map(a => a.duree)),
      qui: eleves.map(e => ({ id: e.identifiant, a: parEleveDefis.get(e.user_id).get(x.cle) })).filter(o => o.a) };
  });

  const ongletsListe = [
    { id: 'synthese', label: 'Vue d’ensemble', icone: '🏠' },
    { id: 'devoirs', label: 'Devoirs', icone: '📌' },
    { id: 'eleves', label: `Élèves (${eleves.length})`, icone: '👥' },
    { id: 'stats', label: 'Statistiques', icone: '📈' },
    { id: 'reglages', label: 'Réglages de la classe', icone: '⚙️' },
    { id: 'compte', label: 'Mon compte', icone: '👤' },
  ];
  const actif = DETAILS.includes(onglet) ? 'stats' : onglet === 'reprendre' ? 'synthese' : onglet;
  const choisirOnglet = id => ouvrir(id === 'stats' ? (DETAILS.includes(onglet) ? onglet : 'exos') : id);
  const clavier = e => {
    const k = ongletsListe.findIndex(o => o.id === actif), pas = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!pas) return;
    e.preventDefault();
    const sv = ongletsListe[(k + pas + ongletsListe.length) % ongletsListe.length];
    choisirOnglet(sv.id);
    document.getElementById(`sp-onglet-${sv.id}`)?.focus();
  };
  const carteMonCompte = (
      <section className="sp-carte" data-compte aria-label="Mon compte">
        <h3>👤 Mon compte</h3>
        <p className="sp-sous">Connecté·e : <b>{sess.profil.nom}</b></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <MotDePasse />
          <button onClick={deconnexion} style={{ ...styleBouton(false, '#475569'), fontSize: 14 }}>Se déconnecter</button>
        </div>
        {sess.profil.admin && <div style={{ marginTop: 12 }}><ComptesProf occupe={occupe} proteger={proteger} setMsg={setMsg} /></div>}
      </section>);
  const carteCompte = (
    <>
      {carteMonCompte}
      <GuideProf ouvertParDefaut={false} />
      <JeuxProf naviguer={naviguer} />
    </>);

  return (
    <div className="sp">
      <style>{css}</style>
      <section className="sp-hero" aria-label="Espace professeur">
        <div className="sp-etiq">Espace professeur</div>
        <h2>Suivi de mes classes</h2>
        <div className="sp-ligne">
          <select className="sp-select" aria-label="Classe" value={classeId} onChange={e => { setClasseId(e.target.value); setOuvert(null); setMsg(''); }}>
            {!classes.length && <option value="">Aucune classe</option>}
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.prefixe}){moiId && c.prof_id && c.prof_id !== moiId ? ' · partagée' : ''}</option>)}
          </select>
          <button className="sp-cta" onClick={() => setFormClasse(v => !v)} disabled={occupe}>＋ Nouvelle classe</button>
          <button className="sp-sec" onClick={() => setApercu(true)}><Pic n="eye"/>Voir comme un élève</button>
        </div>
      </section>

      {erreur && <div role="alert" style={{ color: '#b91c1c', fontWeight: 600, margin: '10px 2px' }}><Pic n="ko"/>{erreur}</div>}
      {msg && <div role="status" style={{ color: '#15803d', fontWeight: 600, margin: '10px 2px' }}><Pic n="ok"/>{msg}</div>}
      {comptes && <div style={{ margin: '10px 0' }}><Comptes classe={comptes.classe} comptes={comptes.liste} onFermer={() => setComptes(null)} /></div>}


      {!classes.length && !occupe && <p data-bienvenue style={{ fontSize: 16, color: KIT.txt, margin: '10px 0 0' }}>👋 <b>Bienvenue !</b> Mettons en route votre première classe : donnez-lui un nom, c’est tout ce qu’il faut pour commencer.</p>}
      {!classes.length && <GuideProf ouvertParDefaut />}


      {(formClasse || (!classes.length && !occupe)) && (
        <form onSubmit={creerClasse} style={{ ...styleBoite, margin: '14px 0 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Nom de la classe<br />
            <input value={nc.nom} onChange={e => setNc({ ...nc, nom: e.target.value, prefixe: prefixeSaisi ? nc.prefixe : prefixeDe(e.target.value) })} placeholder="TSTL 1" style={champ} aria-label="Nom de la classe" /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Préfixe des identifiants<br />
            <input value={nc.prefixe} onChange={e => { setPrefixeSaisi(true); setNc({ ...nc, prefixe: e.target.value.toLowerCase() }); }} placeholder="tstl1" style={champ} aria-label="Préfixe" /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Nombre d’élèves<br />
            <input type="number" min={1} max={40} value={nc.nombre} onChange={e => setNc({ ...nc, nombre: e.target.value })} style={{ ...champ, width: 80 }} aria-label="Nombre d’élèves" /></label>
          <button type="submit" style={styleBouton(true, '#16a34a')} disabled={occupe || !nc.nom.trim() || !nc.prefixe.trim()}>Créer la classe et les comptes</button>
          <div style={{ fontSize: 12.5, color: KIT.txt2, flexBasis: '100%' }}>Les identifiants seront <b>{nc.prefixe || 'tstl1'}-01, {nc.prefixe || 'tstl1'}-02…</b> (préfixe : 2 à 12 lettres minuscules ou chiffres, sans espace ni accent).
            Aucun nom d’élève n’est saisi ici : gardez vous-même la correspondance identifiant ↔ élève.</div>
        </form>)}


      {!classe && <>{carteMonCompte}<JeuxProf naviguer={naviguer} /></>}

      {classe && (
        <>
          <div className="sp-onglets" role="tablist" aria-label="Suivi de la classe" onKeyDown={clavier}>
            {ongletsListe.map(o => (
              <button key={o.id} id={`sp-onglet-${o.id}`} type="button" role="tab" className="sp-onglet" aria-selected={actif === o.id} aria-controls="sp-panneau"
                tabIndex={actif === o.id ? 0 : -1} onClick={() => choisirOnglet(o.id)}><span aria-hidden="true">{o.icone}</span>{o.label}</button>))}
          </div>
          <p className="sp-aide">{AIDES[onglet === 'reprendre' ? 'reprendre' : actif]}</p>
          {onglet === 'reprendre' && <p style={{ margin: '0 2px 12px' }}><button onClick={() => ouvrir('synthese')} style={{ background: 'none', border: 0, padding: 0, color: '#0b4f94', fontWeight: 800, fontSize: 15, cursor: 'pointer', textDecoration: 'underline' }}>← Retour à la vue d’ensemble</button></p>}
          {actif === 'stats' && (
            <div style={{ display: 'flex', gap: 6, margin: '0 0 12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 13.5, color: KIT.txt2 }}>
              Afficher :
              <button onClick={() => ouvrir('exos')} style={stylePetitBouton(onglet === 'exos', '#475569')}>Par exercice</button>
              <button onClick={() => ouvrir('defis')} style={stylePetitBouton(onglet === 'defis', '#475569')}>Défis des simulations</button>
              <button onClick={() => ouvrir('sims')} style={stylePetitBouton(onglet === 'sims', '#475569')}>Temps par simulation</button>
            </div>)}

          <div id="sp-panneau" role="tabpanel" aria-labelledby={`sp-onglet-${actif}`}>
          {onglet === 'synthese' && <SyntheseProf classe={classe} eleves={eleves} lignes={lignes} allerA={ouvrir} onApercu={() => setApercu(true)} />}
          {onglet === 'devoirs' && <DevoirsProf key={`${classe.id}|${(classe.chapitres || []).join()}|${preset ? JSON.stringify(preset) : ''}`} classe={classe} eleves={eleves} lignes={lignes} preset={preset} />}
          {onglet === 'reprendre' && <AReprendreProf eleves={eleves} lignes={lignes} naviguer={naviguer} onDevoir={p => { setPreset(p); setOnglet('devoirs'); }} />}
          {onglet === 'eleves' && <ElevesProf onApercu={setApercu} classe={classe} eleves={eleves} lignes={lignes} exos={exos} defis={defis} etq={etq} proprio={proprio} onReinitialiser={reinitialiser} onSupprimer={supprimerEleve} />}

          {onglet === 'reglages' && (
            <div data-reglages>
              <section className="sp-carte">
                <h3>👥 Élèves et comptes</h3>
                <p className="sp-sous">Ajoutez des comptes si un élève arrive en cours d’année, ou téléchargez les résultats de la classe.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>Ajouter</span>
                  <input type="number" min={1} max={40} value={ajout} onChange={e => setAjout(e.target.value)} style={{ ...champ, width: 64 }} aria-label="Nombre d’élèves à ajouter" />
                  <button onClick={ajouter} style={styleBouton(false, '#475569')} disabled={occupe}>élèves</button>
                  <button onClick={exporter} style={styleBouton(false, '#475569')}>⬇️ Télécharger les résultats (CSV)</button>
                </div>
              </section>
              <section className="sp-carte">
                <h3>📚 Ce que voient les élèves de « {classe.nom} »</h3>
                <p className="sp-sous">Ces réglages sont modifiables à tout moment, sans effet sur les résultats.</p>
                <ChapitreClasse classe={classe} dispo={chapDispo} occupe={occupe} onChoix={choisirChapitres} />
        <div style={{ ...styleBoite, margin: '6px 0 8px', fontSize: 13.5 }}>
          {vieDispo ? (
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!classe.vie_classe} disabled={occupe} onChange={e => basculerVie(e.target.checked)} style={{ marginTop: 3, accentColor: '#0b4f94' }} />
              <span><b><Pic n="trophy"/>Vie de classe</b> (désactivée par défaut) : les élèves de « {classe.nom} » voient un objectif collectif de la semaine et des « prouesses »
                (pas de classement). Les pseudos sont tirés d’une liste fixe, et chaque élève décide s’il apparaît.</span>
            </label>
          ) : (
            <span><Pic n="trophy"/><b>Vie de classe</b> : disponible après avoir exécuté <code>supabase/05-vie-de-classe.sql</code> dans Supabase (SQL Editor → Run).</span>
          )}
        </div>
                <EtablissementClasse key={`${classe.id}|${classe.etablissement || ''}`} classe={classe} dispo={etabDispo} occupe={occupe} onEnregistrer={enregistrerEtab} />
              </section>
              <section className="sp-carte">
                <h3>🌐 Site des élèves</h3>
              {siteDispo && (
          <div style={{ ...styleBoite, margin: '6px 0 8px', fontSize: 13.5 }}>
            <b>🌐 Site des élèves</b> : les élèves de « {classe.nom} » se connectent sur
            <label style={{ margin: '0 10px 0 8px', cursor: 'pointer' }}><input type="radio" name="site-classe" checked={classe.site !== 'energy'} disabled={occupe} onChange={() => choisirSite('paillasse')} style={{ accentColor: '#0b4f94' }} /> la Paillasse virtuelle</label>
            <label style={{ cursor: 'pointer' }}><input type="radio" name="site-classe" checked={classe.site === 'energy'} disabled={occupe} onChange={() => choisirSite('energy')} style={{ accentColor: '#ea580c' }} /> Energy@School</label>
            <div style={{ color: KIT.txt2, marginTop: 3 }}>Les comptes sont les mêmes ; ce réglage sépare les deux sites. Le suivi de l’avancement Energy@School se consulte sur le site Energy@School (avec votre compte professeur).</div>
          </div>)}
              </section>
              <section className="sp-carte">
                <h3>🤝 Partager la classe avec un collègue</h3>
                <PartageClasse classe={classe} proprio={proprio} occupe={occupe} proteger={proteger} setMsg={setMsg} onQuitte={async () => { setClasseId(''); await chargerClasses(); }} />
              </section>
              {proprio && (
                <section className="sp-carte sp-danger">
                  <h3>🗑️ Supprimer la classe</h3>
                  <p className="sp-sous">Efface la classe, ses comptes élèves et toutes leurs données. Définitif.</p>
                  <button onClick={supprimerClasse} style={styleBouton(false, '#b91c1c')} disabled={occupe}><Pic n="trash"/>Supprimer « {classe.nom} »</button>
                </section>)}
            </div>)}

          {onglet === 'compte' && carteCompte}

          {onglet === 'sims' && (
            <div>
              <p style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0 8px' }}>Temps actif cumulé de la classe ({eleves.length} élèves) sur chaque simulation, par mode. Cliquez sur un élève ci-dessous pour son détail.</p>
              <TableauTempsSimulations lignes={lignes} />
              <h4 style={{ margin: '14px 0 6px' }}>Par élève</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
                  <thead><tr><th style={th}>Identifiant</th><th style={th}>Total</th>{MODES.map(([k, l]) => <th key={k} style={th}>{l}</th>)}</tr></thead>
                  <tbody>{eleves.map(e => {
                    const t = tempsParSimulation(lignes.filter(l => l.user_id === e.user_id)), som = k => t.reduce((x, a) => x + a[k], 0);
                    return (<tr key={e.user_id} style={{ borderTop: `1px solid ${KIT.bord}` }}><td style={td}><b>{e.identifiant}</b></td><td style={td}>{formatDuree(som('total'))}</td>
                      {MODES.map(([k]) => <td key={k} style={td}>{som(k) ? formatDuree(som(k)) : '—'}</td>)}</tr>);
                  })}</tbody>
                </table>
              </div>
            </div>)}

          {onglet === 'defis' && (
            <div style={{ overflowX: 'auto' }}>
              <p style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0 8px' }}>Défis des simulations : essais = clics sur « Vérifier » ; « solution vue » = l’élève a affiché la solution après un échec. Cliquez sur un défi pour voir chaque élève.</p>
              <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
                <thead><tr><th style={th}>Défi</th><th style={th}>Réussi par</th><th style={th}>Tenté par</th><th style={th}>Essais (moyenne)</th><th style={th}>Ont vu la solution</th><th style={th}>Temps (médiane)</th></tr></thead>
                <tbody>{parDefi.map(x => (
                  <Fragment key={x.cle}>
                    <tr style={{ borderTop: `1px solid ${KIT.bord}`, opacity: x.travailles ? 1 : 0.5, cursor: x.travailles ? 'pointer' : 'default', background: ouvert === x.cle ? ACCENT_CLAIR : 'transparent' }}
                      onClick={() => x.travailles && setOuvert(ouvert === x.cle ? null : x.cle)}>
                      <td style={td}>{x.titre}</td><td style={td}>{x.reussis} / {eleves.length}</td><td style={td}>{x.travailles}</td>
                      <td style={td}>{x.travailles ? x.essaisMoy.toFixed(1).replace('.', ',') : '—'}</td><td style={td}>{x.travailles ? x.vues : '—'}</td>
                      <td style={td}>{x.travailles ? formatDuree(x.tempsMed) : '—'}</td></tr>
                    {ouvert === x.cle && (
                      <tr><td colSpan={6} style={{ padding: '4px 8px 10px 24px', background: ACCENT_CLAIR }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}><tbody>{x.qui.map(({ id, a }) => (
                          <tr key={id}><td style={td}>{a.reussi ? '✅' : '⬜'}</td><td style={td}><b>{id}</b></td>
                            <td style={td}>{a.essais} essai{a.essais > 1 ? 's' : ''}</td><td style={td}>{a.vues ? 'solution vue' : ''}</td>
                            <td style={td}>{formatDuree(a.duree)}</td><td style={td}>{formatDate(a.derniere)}</td></tr>))}</tbody></table>
                      </td></tr>)}
                  </Fragment>))}</tbody>
              </table>
              {!defis.length && <div style={{ color: KIT.txt2, padding: 8 }}>Aucune simulation n’a encore de défi suivi.</div>}
            </div>)}

          {onglet === 'exos' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
                <thead><tr><th style={th}>Exercice</th><th style={th}>Réussi par</th><th style={th}>Travaillé par</th><th style={th}>Essais (moyenne)</th><th style={th}>Ont vu la correction</th><th style={th}>Temps (médiane)</th></tr></thead>
                <tbody>{parExo.map(x => (
                  <tr key={x.cle} style={{ borderTop: `1px solid ${KIT.bord}`, opacity: x.travailles ? 1 : 0.5 }}>
                    <td style={td}><b>{x.comp}</b> {x.titre}</td><td style={td}>{x.reussis} / {eleves.length}</td><td style={td}>{x.travailles}</td>
                    <td style={td}>{x.travailles ? x.essaisMoy.toFixed(1).replace('.', ',') : '—'}</td><td style={td}>{x.travailles ? x.vues : '—'}</td>
                    <td style={td}>{x.travailles ? formatDuree(x.tempsMed) : '—'}</td></tr>))}</tbody>
              </table>
            </div>)}
          </div>
        </>)}
    </div>
  );
}
