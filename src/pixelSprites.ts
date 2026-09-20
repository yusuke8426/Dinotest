// Cute Pixel Art Sprites & Renderer for Dino Runner

// Helper to draw a pixel grid
// '.' = transparent, letters = color key
export type PixelMap = string[];
export type Palette = Record<string, string>;

export function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  grid: PixelMap,
  palette: Palette,
  x: number,
  y: number,
  pixelSize: number = 3,
  flipX: boolean = false
) {
  const height = grid.length;
  const width = grid[0].length;

  for (let r = 0; r < height; r++) {
    const row = grid[r];
    for (let c = 0; c < width; c++) {
      const char = row[c];
      if (char && char !== ' ' && char !== '.' && palette[char]) {
        ctx.fillStyle = palette[char];
        const drawX = flipX ? x + (width - 1 - c) * pixelSize : x + c * pixelSize;
        const drawY = y + r * pixelSize;
        ctx.fillRect(Math.round(drawX), Math.round(drawY), pixelSize, pixelSize);
      }
    }
  }
}

// Cute Dino Palette: Emerald / Cyan vibrant cyber-chibi palette
export const DINO_PALETTE: Palette = {
  G: '#10b981', // Main body green
  L: '#34d399', // Highlight light green
  D: '#047857', // Dark belly / shadow green
  C: '#064e3b', // Outline / deepest green
  W: '#ffffff', // Eye sclera & highlight
  B: '#0f172a', // Eye pupil
  P: '#f43f5e', // Cute blush pink
  Y: '#fbbf24', // Belly highlight
};

// 1. Cute Standing Dino (Leg 1)
export const DINO_RUN_1: PixelMap = [
  '.......LLLL.........',
  '......LGGGGGLL......',
  '.....LGGGGGGLLC.....',
  '.....LGGGGGGLLCC....',
  '.....LGGWWGGLLCC....',
  '.....LGBBWPPLLC.....',
  '.....LGGWWGGLL......',
  '.....LGGGGGGLL......',
  '..C..LGGGGGL........',
  '.CCC.LGGDDLL........',
  'CCCCLLGGDDGLL.......',
  '.CCCLLGGDDGGLL......',
  '..CCLLGGDDGGGLL.....',
  '...CLLGGDDGGGGLL....',
  '....LLGGDDGGGGL.....',
  '.....LGGGGGGLL......',
  '......GG...GG.......',
  '......CC...CC.......',
  '......CCC..CCC......',
];

// 2. Cute Running Dino (Leg 2)
export const DINO_RUN_2: PixelMap = [
  '.......LLLL.........',
  '......LGGGGGLL......',
  '.....LGGGGGGLLC.....',
  '.....LGGGGGGLLCC....',
  '.....LGGWWGGLLCC....',
  '.....LGBBWPPLLC.....',
  '.....LGGWWGGLL......',
  '.....LGGGGGGLL......',
  '..C..LGGGGGL........',
  '.CCC.LGGDDLL........',
  'CCCCLLGGDDGLL.......',
  '.CCCLLGGDDGGLL......',
  '..CCLLGGDDGGGLL.....',
  '...CLLGGDDGGGGLL....',
  '....LLGGDDGGGGL.....',
  '.....LGGGGGGLL......',
  '.......GG...GG......',
  '.......CC...CC......',
  '......CCC...CCC.....',
];

// 3. Cute Jumping Dino (Legs tucked)
export const DINO_JUMP: PixelMap = [
  '.......LLLL.........',
  '......LGGGGGLL......',
  '.....LGGGGGGLLC.....',
  '.....LGGGGGGLLCC....',
  '.....LGGWWGGLLCC....',
  '.....LGBBWPPLLC.....',
  '.....LGGWWGGLL......',
  '.....LGGGGGGLL......',
  '..C..LGGGGGL........',
  '.CCC.LGGDDLL........',
  'CCCCLLGGDDGLL.......',
  '.CCCLLGGDDGGLL......',
  '..CCLLGGDDGGGLL.....',
  '...CLLGGDDGGGGLL....',
  '....LLGGDDGGGGL.....',
  '.....LGGGGGGLL......',
  '......CCCCCCC.......',
  '......CCCCCCC.......',
  '....................',
];

// 4. Cute Ducking / Sliding Dino
export const DINO_DUCK: PixelMap = [
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..............LLLL........',
  '.............LGGGGGLL.....',
  '............LGGWWGGLLC....',
  '............LGBBWPPLLCC...',
  '..CCCC......LGGWWGGLLCC...',
  '.CCCCCC.....LGGGGGGLL.....',
  'CCCCCCCCLLLLGGGGGGLL......',
  '.CCCCCCCLGGDDDDDGLL.......',
  '..CCCCCCLGGDDDDDGLL.......',
  '....CC..CCCC...CCCC.......',
];

// 5. Cute Cactus
export const CACTUS_PALETTE: Palette = {
  G: '#06b6d4', // Cyan neon cactus
  L: '#67e8f9',
  D: '#0891b2',
  C: '#164e63',
  F: '#f43f5e', // Flower on top!
};

export const CACTUS_SMALL: PixelMap = [
  '.....FF.....',
  '....FFFF....',
  '.....LL.....',
  '....LGG.....',
  '..LL.GG.....',
  '.LGG.GG.LL..',
  '.LGG.GG.GGL.',
  '.LGG.GG.GGL.',
  '..DD.GG.DD..',
  '....LGG.....',
  '....LGG.....',
  '....LGG.....',
  '....LGG.....',
  '....LGG.....',
  '....LGG.....',
  '....CDD.....',
];

export const CACTUS_LARGE: PixelMap = [
  '.......FF.......',
  '......FFFF......',
  '.......LL.......',
  '......LGG.......',
  '......LGG.......',
  '..LL..LGG.......',
  '.LGG..LGG...LL..',
  '.LGG..LGG..LGGL.',
  '.LGG..LGG..LGGL.',
  '..DD..LGG..LGGL.',
  '......LGG...DD..',
  '......LGG.......',
  '......LGG.......',
  '......LGG.......',
  '......LGG.......',
  '......LGG.......',
  '......LGG.......',
  '......CDD.......',
];

// 6. Flying Bird / Cyber Pterodactyl
export const BIRD_PALETTE: Palette = {
  P: '#a855f7', // Purple body
  L: '#c084fc',
  D: '#7e22ce',
  W: '#ffffff',
  B: '#0f172a',
  Y: '#fbbf24', // Beak
};

export const BIRD_WING_UP: PixelMap = [
  '....LL...........',
  '...LPP...........',
  '..LPP............',
  '.LPP.............',
  '.LP..LPPP........',
  '.LP.LPPWWP.......',
  '..D.LPBBWP..YYY..',
  '....DPWWP..YYYYY.',
  '.....DPPP..YY....',
  '......DPP........',
  '.......DD........',
];

export const BIRD_WING_DOWN: PixelMap = [
  '........LPPP.....',
  '.......LPPWWP....',
  '.......LPBBWP.YYY',
  '.......DPWWP.YYYY',
  '....LL..DPPP.YY..',
  '...LPP...DPP.....',
  '..LPP.....DD.....',
  '.LPP.............',
  '.LP..............',
  '..D..............',
];

// 7. Power-Up Star (Invincible Shield)
export const STAR_PALETTE: Palette = {
  Y: '#facc15',
  L: '#fef08a',
  D: '#ca8a04',
  W: '#ffffff',
};

export const STAR_SPRITE: PixelMap = [
  '.....LL.....',
  '....LYYL....',
  '....LYYL....',
  'LLLLLYYLLLLL',
  '.LYYYYYYYYL.',
  '..LYYYYYYL..',
  '...LYYYYL...',
  '..LYYYYYYL..',
  '.LYYL..LYYL.',
  '.DD......DD.',
];
