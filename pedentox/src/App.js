import { useEffect, useMemo, useState } from 'react';
import { fetchLevels } from './services/levelsApi';
import { decouperTexte, normaliserMot } from './utils/textUtils';

const CLE_SAUVEGARDE_NIVEAU = 'pedantox_campagne_idx';

function lireNiveauSauvegarde() {
  try {
    return localStorage.getItem(CLE_SAUVEGARDE_NIVEAU);
  } catch (error) {
    return null;
  }
}

function sauvegarderNiveau(indexNiveau) {
  try {
    localStorage.setItem(CLE_SAUVEGARDE_NIVEAU, indexNiveau);
  } catch (error) {
    // Le jeu doit rester utilisable meme si le navigateur bloque localStorage.
  }
}

function App() {
  const [levels, setLevels] = useState([]);
  const [niveauActuelIdx, setNiveauActuelIdx] = useState(0);
  const [motsTrouves, setMotsTrouves] = useState(new Set());
  const [historiqueEssais, setHistoriqueEssais] = useState([]);
  const [jeuGagne, setJeuGagne] = useState(false);
  const [saisieMot, setSaisieMot] = useState('');
  const [toast, setToast] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState('');

  useEffect(() => {
    let timeoutId;
    if (toast) {
      timeoutId = setTimeout(() => setToast(null), 3200);
    }
    return () => clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    async function initLevels() {
      try {
        const levelsData = await fetchLevels();
        if (!Array.isArray(levelsData) || levelsData.length === 0) {
          throw new Error('Les niveaux sont vides.');
        }

        const sauvegardeIdx = lireNiveauSauvegarde();
        const parsedIndex = Number.parseInt(sauvegardeIdx, 10);
        const nextIndex = Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= levelsData.length ? 0 : parsedIndex;

        setLevels(levelsData);
        setNiveauActuelIdx(nextIndex);
      } catch (error) {
        setErreurChargement("Les niveaux n'ont pas pu être chargés.");
      } finally {
        setChargement(false);
      }
    }

    initLevels();
  }, []);

  const niveauDonnees = levels[niveauActuelIdx] || null;
  const motsDuTitre = useMemo(() => (niveauDonnees ? decouperTexte(niveauDonnees.titre) : []), [niveauDonnees]);
  const motsDuTexte = useMemo(() => (niveauDonnees ? decouperTexte(niveauDonnees.texte) : []), [niveauDonnees]);
  const motsClesDuTitreSolution = useMemo(() => {
    if (!niveauDonnees) {
      return [];
    }
    return (niveauDonnees.titre.match(/[a-zA-Z0-9À-ÿ]+/g) || []).map(normaliserMot).filter((m) => m.length > 0);
  }, [niveauDonnees]);

  useEffect(() => {
    setMotsTrouves(new Set());
    setHistoriqueEssais([]);
    setJeuGagne(false);
    setSaisieMot('');
  }, [niveauActuelIdx, levels]);

  useEffect(() => {
    const aTrouveToutLeTitre = motsClesDuTitreSolution.every((motCle) => motsTrouves.has(motCle));
    if (aTrouveToutLeTitre && !jeuGagne && niveauDonnees) {
      setJeuGagne(true);
      if (typeof window.confetti === 'function') {
        const fin = Date.now() + 5 * 1000;
        (function frame() {
          window.confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.6 } });
          window.confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } });
          if (Date.now() < fin) {
            requestAnimationFrame(frame);
          }
        })();
      }
    }
  }, [jeuGagne, motsClesDuTitreSolution, motsTrouves, niveauDonnees]);

  function notifier(message, type = 'error') {
    setToast({ message, type });
  }

  function verifierMot(event) {
    event.preventDefault();
    if (jeuGagne || !niveauDonnees) {
      return;
    }

    const motSaisi = saisieMot.trim();
    if (!motSaisi) {
      return;
    }

    const motNormalise = normaliserMot(motSaisi);
    setSaisieMot('');

    if (historiqueEssais.some((e) => e.mot === motNormalise)) {
      notifier('Vous avez déjà testé ce mot !');
      return;
    }

    let listeMotsAValider = [motNormalise];
    if (niveauDonnees.variantes) {
      if (niveauDonnees.variantes[motNormalise]) {
        listeMotsAValider = listeMotsAValider.concat(niveauDonnees.variantes[motNormalise].map(normaliserMot));
      }

      // Comportement conservé pour compatibilité stricte
      for (const cle in niveauDonnees.variantes) {
        if (cle === motNormalise) {
          listeMotsAValider = listeMotsAValider.concat(niveauDonnees.variantes[cle].map(normaliserMot));
        }
      }
    }

    let occurrencesTotales = 0;
    const motsTrouvesDansCetteSaisie = new Set();

    listeMotsAValider.forEach((motDeLaListe) => {
      let trouveDansTitre = false;
      let trouveDansTexte = false;

      motsDuTitre.forEach((item) => {
        if (item.type === 'word' && item.motNettoye === motDeLaListe) {
          occurrencesTotales += 1;
          trouveDansTitre = true;
        }
      });

      motsDuTexte.forEach((item) => {
        if (item.type === 'word' && item.motNettoye === motDeLaListe) {
          occurrencesTotales += 1;
          trouveDansTexte = true;
        }
      });

      if (trouveDansTitre || trouveDansTexte || motsClesDuTitreSolution.includes(motDeLaListe)) {
        motsTrouvesDansCetteSaisie.add(motDeLaListe);
      }
    });

    setMotsTrouves((prev) => {
      const next = new Set(prev);
      motsTrouvesDansCetteSaisie.forEach((mot) => next.add(mot));
      return next;
    });

    setHistoriqueEssais((prev) => [{ mot: motSaisi, occurrences: occurrencesTotales }, ...prev]);
  }

  function donnerIndices() {
    if (!niveauDonnees) {
      return;
    }

    const indicesDisponibles = niveauDonnees.indices.map(normaliserMot).filter((mot) => !motsTrouves.has(mot));
    if (indicesDisponibles.length === 0) {
      notifier("Plus d'indices disponibles pour cette session !");
      return;
    }

    const motIndice = indicesDisponibles[Math.floor(Math.random() * indicesDisponibles.length)];
    setMotsTrouves((prev) => {
      const next = new Set(prev);
      next.add(motIndice);
      return next;
    });
    setHistoriqueEssais((prev) => [{ mot: `💡 Indice: ${motIndice}`, occurrences: 'Bonus' }, ...prev]);
    notifier(`Indice révélé : ${motIndice}`, 'info');
  }

  function passerAuNiveauSuivant() {
    if (!levels.length) {
      return;
    }
    const nextIndex = niveauActuelIdx + 1 >= levels.length ? 0 : niveauActuelIdx + 1;
    sauvegarderNiveau(nextIndex);
    setNiveauActuelIdx(nextIndex);
  }

  function renderTokens(tokens, prefix) {
    return tokens.map((item, index) => {
      if (item.type === 'space' || item.type === 'punctuation') {
        return <span key={`${prefix}-${index}`}>{item.texte}</span>;
      }

      const revealed = motsTrouves.has(item.motNettoye) || jeuGagne;
      return (
        <span
          key={`${prefix}-${index}`}
          className={`word-block ${revealed ? 'revealed-word' : 'hidden-word'}`}
          data-count={item.texteOriginal.length}
        >
          {revealed ? item.texteOriginal : '■'.repeat(item.texteOriginal.length)}
        </span>
      );
    });
  }

  if (chargement) {
    return <main className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</main>;
  }

  if (erreurChargement || !niveauDonnees) {
    return <main className="min-h-screen flex items-center justify-center text-rose-500">{erreurChargement}</main>;
  }

  const progressionPourcent = Math.round((niveauActuelIdx / levels.length) * 100);
  const isDernierNiveau = niveauActuelIdx === levels.length - 1;

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center p-4 md:p-8">
      <div className={`toast-notification ${toast ? 'show' : ''} bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700`}>
        <span>{toast?.type === 'error' ? '⚠️' : '💡'}</span>
        <span className="text-sm font-medium">{toast?.message || 'Message de notification'}</span>
      </div>

      <header className="text-center max-w-2xl mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3 mb-2">
          🕵️‍♂️ Pédantox <span className="text-sky-600">Technodoo</span>
        </h1>
        <p className="text-slate-500 font-medium">Trouvez les concepts clés de notre formation en décodant le texte! GLHF mais please allez pas dans le script c'est hardcodé, je viens seulement d'apprendre le code </p>
      </header>

      <main className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-slate-500">Niveau {niveauActuelIdx + 1} / {levels.length}</span>
              <span className="text-sm font-extrabold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">{progressionPourcent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all duration-500 rounded-full" style={{ width: `${progressionPourcent}%` }} />
            </div>
          </div>

          <div className={`${jeuGagne ? '' : 'hidden'} bg-emerald-500 text-white p-6 rounded-2xl shadow-lg text-center transform transition duration-500 scale-100`}>
            <h2 className="text-2xl font-bold mb-2"> Niveau Réussi !</h2>
            <p className="text-emerald-100 mb-4 font-medium">
              {isDernierNiveau
                ? '🏆 FÉLICITATIONS ! Vous avez brillamment décodé tous les niveaux de la formation !'
                : `🎉 VICTOIRE ! La solution était bien : "${niveauDonnees.titre}"`}
            </p>
            <button onClick={passerAuNiveauSuivant} className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-xl font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0">
              {isDernierNiveau ? 'Recommencer au Début 🔄' : 'Niveau Suivant ➡️'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <form onSubmit={verifierMot} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Proposez un mot (ex: Robin, code, bug...)"
                autoComplete="off"
                autoFocus
                value={saisieMot}
                disabled={jeuGagne}
                onChange={(e) => setSaisieMot(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 outline-none focus:border-sky-500 transition font-medium text-slate-700"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={jeuGagne} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition disabled:opacity-50">
                  Tester
                </button>
                <button type="button" onClick={donnerIndices} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition">
                  Indice
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="title-zone border-b-2 border-slate-100 pb-4 mb-6 text-xl md:text-2xl tracking-wide leading-relaxed">{renderTokens(motsDuTitre, 'title')}</div>
            <div className="text-base md:text-lg leading-relaxed text-slate-700">{renderTokens(motsDuTexte, 'body')}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Découvertes</p>
              <span className="text-2xl font-black text-slate-700">{motsTrouves.size}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Essais</p>
              <span className="text-2xl font-black text-slate-700">{historiqueEssais.length}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[300px] max-h-[500px]">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Historique des tentatives</h3>
            <div className="overflow-y-auto flex-1 pr-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase">
                    <th className="pb-2">N°</th>
                    <th className="pb-2">Mot</th>
                    <th className="pb-2 text-right">Occurrences</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-600 divide-y divide-slate-50">
                  {historiqueEssais.map((essai, index) => {
                    const colorClass = essai.occurrences > 0 || essai.occurrences === 'Bonus' ? 'text-emerald-600' : 'text-rose-500';
                    return (
                      <tr key={`${essai.mot}-${index}`} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="py-3 px-2 text-slate-400 font-mono">{historiqueEssais.length - index}</td>
                        <td className="py-3 px-2 font-semibold text-slate-700">{essai.mot}</td>
                        <td className={`py-3 px-2 text-right font-bold ${colorClass}`}>{essai.occurrences}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
