export function normaliserMot(mot) {
  return mot
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

export function decouperTexte(texte) {
  const regex = /[a-zA-Z0-9À-ÿœŒæÆÇḉ̀̂̈̌åÅøØ]+|\s+|./g;
  const morceaux = texte.match(regex) || [];

  return morceaux.map((morceau) => {
    if (morceau.trim() === '') {
      return { type: 'space', texte: morceau };
    }

    const motNettoye = normaliserMot(morceau);
    if (motNettoye.length > 0) {
      return { type: 'word', texteOriginal: morceau, motNettoye };
    }

    return { type: 'punctuation', texte: morceau };
  });
}