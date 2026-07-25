// The 8 unique images for the Memory game (each appears twice on the 16-slot
// board). Files live in frontend/public/memory/<name>.png, served at /memory.
const MEMORY_IMAGES = ['Floonleef', 'Venomgear', 'Aloebud', 'Babybara', 'Baklavaff', 'Batakaze', 'Dewmo', 'Dodolet'];

function generateShuffledBoard() {
  const board = [...MEMORY_IMAGES, ...MEMORY_IMAGES];
  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}

module.exports = { MEMORY_IMAGES, generateShuffledBoard };
