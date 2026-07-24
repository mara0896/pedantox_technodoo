const CLE_COMPLETION = 'pedantox_completed_levels';

export function lireNiveauxCompletes() {
  try {
    const data = localStorage.getItem(CLE_COMPLETION);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

export function sauvegarderNiveauComplete(levelId) {
  try {
    const completed = lireNiveauxCompletes();
    if (!completed.includes(levelId)) {
      completed.push(levelId);
      localStorage.setItem(CLE_COMPLETION, JSON.stringify(completed));
    }
  } catch (error) {
    // Le jeu doit rester utilisable meme si le navigateur bloque localStorage.
  }
}
