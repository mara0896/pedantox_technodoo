const DEFAULT_API_BASE_URL = 'http://127.0.0.1:5000';

export async function fetchLevels() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;
  const response = await fetch(`${baseUrl}/api/levels`);

  if (!response.ok) {
    throw new Error('Impossible de charger les niveaux.');
  }

  return response.json();
}