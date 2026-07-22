import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/levelsApi', () => ({
  fetchLevels: jest.fn().mockResolvedValue([
    {
      titre: 'Test Niveau',
      texte: 'Texte exemple pour le test.',
      indices: ['test'],
      variantes: { test: ['test'] },
    },
  ]),
}));

test('renders game title', async () => {
  render(<App />);
  const title = await screen.findByText(/Pédantox/i);
  expect(title).toBeInTheDocument();
});
