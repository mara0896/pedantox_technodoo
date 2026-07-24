import { useEffect, useMemo, useState } from 'react';
import { fetchLevels } from './services/levelsApi';
import Navbar from './components/Navbar';
import Home from './pages/Home/Home';
import LevelSelector from './pages/LevelSelector/LevelSelector';
import Game from './pages/Game/Game';

function App() {
  const [levels, setLevels] = useState([]);
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'selector', 'game'
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState('');

  useEffect(() => {
    async function initLevels() {
      try {
        const levelsData = await fetchLevels();
        setLevels(levelsData);
      } catch (error) {
        setErreurChargement("Les niveaux n'ont pas pu être chargés.");
      } finally {
        setChargement(false);
      }
    }
    initLevels();
  }, []);

  const levelData = useMemo(() => levels.find(l => l.id === currentLevelId), [levels, currentLevelId]);

  const handleSelectLevel = (id) => {
    setCurrentLevelId(id);
    setView('game');
  };

  const handleSelectGame = (gameId) => {
    if (gameId === 'pedentox') {
      setView('selector');
    }
  };

  const handleNextLevel = () => {
    const currentIndex = levels.findIndex(l => l.id === currentLevelId);
    if (currentIndex !== -1 && currentIndex < levels.length - 1) {
      setCurrentLevelId(levels[currentIndex + 1].id);
    } else {
      setView('selector');
    }
  };

  if (chargement) return <main className="min-h-screen flex items-center justify-center text-slate-500 bg-slate-50">Chargement...</main>;
  if (erreurChargement) return <main className="min-h-screen flex items-center justify-center text-rose-500 bg-slate-50">{erreurChargement}</main>;

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center">
      <Navbar onNavigate={setView} />
      <div className="w-full flex flex-col items-center p-4 md:p-8">
        {view === 'home' && <Home onSelectGame={handleSelectGame} />}
        {view === 'selector' && <LevelSelector levels={levels} onSelectLevel={handleSelectLevel} />}
        {view === 'game' && levelData && <Game levelData={levelData} onNextLevel={handleNextLevel} />}
      </div>
    </div>
  );
}

export default App;
