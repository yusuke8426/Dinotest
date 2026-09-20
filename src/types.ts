export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type ObstacleType = 'CACTUS_1' | 'CACTUS_2' | 'CACTUS_3' | 'LASER' | 'DRONE' | 'METEOR';

export type PowerUpType = 'SHIELD' | 'EMP' | 'SLOW';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  blinkSpeed: number;
}

export interface GameHUDState {
  score: number;
  hiScore: number;
  speedMultiplier: number;
  hasShield: boolean;
  isSlowmo: boolean;
  slowmoTimeLeft: number;
  state: GameState;
  isNewRecord: boolean;
}
