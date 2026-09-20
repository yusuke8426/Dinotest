import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';
import { sound } from './audio';
import { BackgroundRenderer } from './background';
import {
  drawPixelArt,
  DINO_PALETTE,
  DINO_RUN_1,
  DINO_RUN_2,
  DINO_JUMP,
  DINO_DUCK,
  CACTUS_PALETTE,
  CACTUS_SMALL,
  CACTUS_LARGE,
  BIRD_PALETTE,
  BIRD_WING_UP,
  BIRD_WING_DOWN,
  STAR_PALETTE,
  STAR_SPRITE,
} from './pixelSprites';

type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

interface Obstacle {
  id: number;
  type: 'CACTUS_S' | 'CACTUS_L' | 'BIRD';
  x: number;
  y: number;
  w: number;
  h: number;
  birdAltitude?: 'LOW' | 'HIGH';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('dino_hi_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);

  // Engine state refs for smooth 60fps loop
  const stateRef = useRef<GameState>('START');
  const scoreRef = useRef(0);
  const speedRef = useRef(7);
  const frameCountRef = useRef(0);

  // Player physics
  const dinoRef = useRef({
    x: 60,
    y: 0,
    vy: 0,
    isGrounded: true,
    isDucking: false,
    jumpCount: 0,
    baseY: 0,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const shieldTimerRef = useRef(0);
  const spawnCooldownRef = useRef(0);
  const bgRendererRef = useRef(new BackgroundRenderer());

  // Touch gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Jump action
  const handleJump = useCallback(() => {
    if (stateRef.current !== 'PLAYING') return;
    const dino = dinoRef.current;
    if (dino.isGrounded) {
      dino.vy = -14.5;
      dino.isGrounded = false;
      dino.jumpCount = 1;
      dino.isDucking = false;
      sound.jump();
      // Jump dust
      for (let i = 0; i < 6; i++) {
        particlesRef.current.push({
          x: dino.x + 20,
          y: dino.baseY + 45,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          color: '#34d399',
          size: 3,
          alpha: 1,
        });
      }
    } else if (dino.jumpCount === 1) {
      // Double jump
      dino.vy = -12.5;
      dino.jumpCount = 2;
      sound.jump();
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x: dino.x + 20,
          y: dino.y + 40,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 3,
          color: '#38bdf8',
          size: 3,
          alpha: 1,
        });
      }
    }
  }, []);

  // Duck action
  const handleDuck = useCallback((ducking: boolean) => {
    if (stateRef.current !== 'PLAYING') return;
    const dino = dinoRef.current;
    if (!dino.isGrounded && ducking) {
      // Fast drop down
      dino.vy = Math.max(dino.vy, 15);
    }
    if (dino.isDucking !== ducking) {
      dino.isDucking = ducking;
      if (ducking && dino.isGrounded) {
        sound.duck();
      }
    }
  }, []);

  const startGame = useCallback(() => {
    sound.init();
    scoreRef.current = 0;
    setScore(0);
    speedRef.current = 7.5;
    obstaclesRef.current = [];
    particlesRef.current = [];
    starRef.current = null;
    shieldTimerRef.current = 0;
    setShieldActive(false);

    const dino = dinoRef.current;
    dino.y = dino.baseY;
    dino.vy = 0;
    dino.isGrounded = true;
    dino.isDucking = false;
    dino.jumpCount = 0;

    setGameState('PLAYING');
  }, []);

  const togglePause = useCallback(() => {
    if (stateRef.current === 'PLAYING') {
      setGameState('PAUSED');
    } else if (stateRef.current === 'PAUSED') {
      setGameState('PLAYING');
    }
  }, []);

  const toggleSound = useCallback(() => {
    const next = sound.toggleMute();
    setIsMuted(next);
  }, []);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.imageSmoothingEnabled = false;

      // Ground level placed around lower third
      const groundY = Math.min(height * 0.72, height - 120);
      dinoRef.current.baseY = groundY - 55;
      if (dinoRef.current.isGrounded) {
        dinoRef.current.y = dinoRef.current.baseY;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const groundY = dinoRef.current.baseY + 55;
      const isPlaying = stateRef.current === 'PLAYING';
      frameCountRef.current++;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Render Rich Multi-Layer Parallax Background
      bgRendererRef.current.render(
        ctx,
        width,
        height,
        groundY,
        isPlaying ? speedRef.current : 0,
        dt,
        isPlaying,
        scoreRef.current,
        frameCountRef.current
      );

      if (isPlaying) {
        // Speed up gradually
        speedRef.current += dt * 0.12;

        // Score update
        scoreRef.current += Math.round(dt * speedRef.current * 3);
        setScore(scoreRef.current);

        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
          try {
            localStorage.setItem('dino_hi_score', scoreRef.current.toString());
          } catch {
            // ignore
          }
        }

        // Shield countdown
        if (shieldTimerRef.current > 0) {
          shieldTimerRef.current -= dt;
          if (shieldTimerRef.current <= 0) {
            setShieldActive(false);
          }
        }

        // Dino Physics
        const dino = dinoRef.current;
        if (!dino.isGrounded) {
          dino.vy += 36 * dt; // gravity
          dino.y += dino.vy;
          if (dino.y >= dino.baseY) {
            dino.y = dino.baseY;
            dino.vy = 0;
            dino.isGrounded = true;
            dino.jumpCount = 0;
          }
        }

        // Spawn Star occasionally
        if (!starRef.current && Math.random() < 0.0015 && shieldTimerRef.current <= 0) {
          starRef.current = {
            x: width + 50,
            y: dino.baseY - 30,
            active: true,
          };
        }

        // Update Star
        if (starRef.current && starRef.current.active) {
          starRef.current.x -= speedRef.current;
          const dx = dino.x + 25 - starRef.current.x;
          const dy = dino.y + 25 - starRef.current.y;
          if (Math.hypot(dx, dy) < 40) {
            starRef.current.active = false;
            starRef.current = null;
            shieldTimerRef.current = 6;
            setShieldActive(true);
            sound.powerup();
          } else if (starRef.current.x < -50) {
            starRef.current = null;
          }
        }

        // Obstacle Spawning
        spawnCooldownRef.current -= dt;
        if (spawnCooldownRef.current <= 0) {
          const rand = Math.random();
          let type: Obstacle['type'] = 'CACTUS_S';
          let w = 36;
          let h = 48;
          let obsY = groundY - 48;
          let birdAltitude: 'LOW' | 'HIGH' = 'LOW';

          if (scoreRef.current > 200 && rand > 0.65) {
            type = 'BIRD';
            w = 51;
            h = 33;
            birdAltitude = Math.random() > 0.5 ? 'HIGH' : 'LOW';
            obsY = birdAltitude === 'HIGH' ? groundY - 88 : groundY - 45;
          } else if (rand > 0.35) {
            type = 'CACTUS_L';
            w = 48;
            h = 54;
            obsY = groundY - 54;
          }

          obstaclesRef.current.push({
            id: Date.now() + Math.random(),
            type,
            x: width + 30,
            y: obsY,
            w,
            h,
            birdAltitude,
          });

          const minGap = Math.max(1.1, 2.2 - (speedRef.current * 0.04));
          spawnCooldownRef.current = minGap + Math.random() * 0.8;
        }

        // Update Obstacles & Collision Check
        const dinoHitbox = dino.isDucking
          ? { x: dino.x + 8, y: dino.baseY + 20, w: 68, h: 32 }
          : { x: dino.x + 12, y: dino.y + 6, w: 42, h: 48 };

        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= speedRef.current;

          if (obs.type === 'BIRD') {
            obs.x -= 1.2;
          }

          const obsHitbox = {
            x: obs.x + 6,
            y: obs.y + 6,
            w: obs.w - 12,
            h: obs.h - 10,
          };

          const collides =
            dinoHitbox.x < obsHitbox.x + obsHitbox.w &&
            dinoHitbox.x + dinoHitbox.w > obsHitbox.x &&
            dinoHitbox.y < obsHitbox.y + obsHitbox.h &&
            dinoHitbox.y + dinoHitbox.h > obsHitbox.y;

          if (collides) {
            if (shieldTimerRef.current > 0) {
              obstaclesRef.current.splice(i, 1);
              sound.point();
              for (let p = 0; p < 12; p++) {
                particlesRef.current.push({
                  x: obs.x + obs.w / 2,
                  y: obs.y + obs.h / 2,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  color: '#fbbf24',
                  size: 4,
                  alpha: 1,
                });
              }
              continue;
            } else {
              sound.hit();
              setGameState('GAMEOVER');
              for (let p = 0; p < 20; p++) {
                particlesRef.current.push({
                  x: dino.x + 25,
                  y: dino.y + 25,
                  vx: (Math.random() - 0.5) * 10,
                  vy: (Math.random() - 0.5) * 10,
                  color: '#f43f5e',
                  size: 4,
                  alpha: 1,
                });
              }
              break;
            }
          }

          if (obs.x < -80) {
            obstaclesRef.current.splice(i, 1);
          }
        }
      }

      // Draw Star
      if (starRef.current && starRef.current.active) {
        drawPixelArt(ctx, STAR_SPRITE, STAR_PALETTE, starRef.current.x, starRef.current.y, 3);
      }

      // Draw Obstacles
      for (const obs of obstaclesRef.current) {
        if (obs.type === 'CACTUS_S') {
          drawPixelArt(ctx, CACTUS_SMALL, CACTUS_PALETTE, obs.x, obs.y, 3);
        } else if (obs.type === 'CACTUS_L') {
          drawPixelArt(ctx, CACTUS_LARGE, CACTUS_PALETTE, obs.x, obs.y, 3);
        } else if (obs.type === 'BIRD') {
          const wingUp = Math.floor(frameCountRef.current / 12) % 2 === 0;
          drawPixelArt(
            ctx,
            wingUp ? BIRD_WING_UP : BIRD_WING_DOWN,
            BIRD_PALETTE,
            obs.x,
            obs.y,
            3,
            true
          );
        }
      }

      // Draw Dino
      const dino = dinoRef.current;
      const isDucking = dino.isDucking;
      const isJumping = !dino.isGrounded;
      const runFrame = Math.floor(frameCountRef.current / 8) % 2 === 0;

      let dinoSprite = DINO_RUN_1;
      let dinoDrawY = dino.y;

      if (isDucking) {
        dinoSprite = DINO_DUCK;
        dinoDrawY = dino.baseY + 18;
      } else if (isJumping) {
        dinoSprite = DINO_JUMP;
      } else {
        dinoSprite = runFrame ? DINO_RUN_1 : DINO_RUN_2;
      }

      // Shield Aura
      if (shieldTimerRef.current > 0) {
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(dino.x + 30, dinoDrawY + 28, 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Dino Pixels
      drawPixelArt(ctx, dinoSprite, DINO_PALETTE, dino.x, dinoDrawY, 3);

      // Draw & Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= dt * 2.2;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [highScore]);

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
          startGame();
        } else {
          handleJump();
        }
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleDuck(true);
      } else if (e.code === 'KeyP') {
        togglePause();
      } else if (e.code === 'KeyM') {
        toggleSound();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleDuck(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleJump, handleDuck, startGame, togglePause, toggleSound]);

  // Touch gesture handler (tap anywhere to jump, swipe down to duck)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (stateRef.current !== 'PLAYING') return;
    if (!touchStartRef.current) {
      handleJump();
      return;
    }

    const touch = e.changedTouches[0];
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    // Swipe down detected -> duck / quick drop
    if (dy > 40 && dt < 400) {
      handleDuck(true);
      setTimeout(() => handleDuck(false), 350);
    } else {
      // Tap or swipe up -> Jump
      handleJump();
    }
    touchStartRef.current = null;
  };

  return (
    <div
      id="game-root"
      className="relative w-screen h-screen select-none overflow-hidden bg-[#060713]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Game Canvas */}
      <canvas
        id="dino-canvas"
        ref={canvasRef}
        className="block w-full h-full cursor-pointer"
        onClick={() => {
          if (stateRef.current === 'PLAYING') {
            handleJump();
          }
        }}
      />

      {/* Top HUD (Minimal, Clean) */}
      <header
        id="game-hud"
        className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between pointer-events-none z-20"
      >
        {/* Score & HI Score */}
        <div id="score-container" className="flex items-center gap-6 font-mono text-xs sm:text-sm tracking-wider">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold drop-shadow-sm">
            <span className="text-emerald-500/60 uppercase">Score</span>
            <span className="text-base sm:text-lg">{String(score).padStart(5, '0')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-slate-600 uppercase">HI</span>
            <span>{String(highScore).padStart(5, '0')}</span>
          </div>
          {shieldActive && (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
              <span>★</span>
              <span>SHIELD</span>
            </div>
          )}
        </div>

        {/* Action Controls (Sound & Pause) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="btn-sound-toggle"
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {gameState === 'PLAYING' && (
            <button
              id="btn-pause-toggle"
              onClick={togglePause}
              aria-label="Pause Game"
              className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Pause size={18} />
            </button>
          )}
        </div>
      </header>

      {/* START SCREEN (Centered Cute Icon + Title + START button) */}
      {gameState === 'START' && (
        <div
          id="screen-start"
          className="absolute inset-0 bg-[#060713]/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 z-30 pointer-events-auto"
        >
          {/* Cute Pixel Dino Icon */}
          <div id="start-dino-avatar" className="mb-6 relative flex items-center justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
              <svg width="60" height="60" viewBox="0 0 20 20" className="image-rendering-pixelated">
                <rect x="5" y="1" width="6" height="3" fill="#34d399" />
                <rect x="4" y="4" width="8" height="6" fill="#10b981" />
                <rect x="6" y="5" width="2" height="2" fill="#ffffff" />
                <rect x="7" y="6" width="1" height="1" fill="#0f172a" />
                <rect x="9" y="7" width="2" height="1" fill="#f43f5e" />
                <rect x="2" y="9" width="3" height="4" fill="#064e3b" />
                <rect x="5" y="10" width="7" height="4" fill="#10b981" />
                <rect x="6" y="14" width="2" height="4" fill="#047857" />
                <rect x="9" y="14" width="2" height="4" fill="#047857" />
              </svg>
            </div>
            <div className="absolute -inset-2 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Title */}
          <h1
            id="start-game-title"
            className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-8 font-mono"
          >
            DINO RUN
          </h1>

          {/* Start Button */}
          <button
            id="btn-start-game"
            onClick={startGame}
            className="w-48 sm:w-56 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold font-mono tracking-wider text-base sm:text-lg shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={20} fill="currentColor" />
            <span>START</span>
          </button>
        </div>
      )}

      {/* PAUSED SCREEN */}
      {gameState === 'PAUSED' && (
        <div
          id="screen-paused"
          className="absolute inset-0 bg-[#060713]/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 z-30 pointer-events-auto"
        >
          <h2 id="paused-title" className="text-3xl font-black text-white font-mono tracking-wider mb-8">
            PAUSED
          </h2>
          <button
            id="btn-resume-game"
            onClick={togglePause}
            className="w-48 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold font-mono tracking-wider text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={20} fill="currentColor" />
            <span>RESUME</span>
          </button>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'GAMEOVER' && (
        <div
          id="screen-gameover"
          className="absolute inset-0 bg-[#060713]/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 z-30 pointer-events-auto"
        >
          <h2 id="gameover-title" className="text-3xl sm:text-4xl font-black text-rose-500 font-mono tracking-wider mb-3">
            GAME OVER
          </h2>

          <div id="gameover-stats" className="font-mono text-center mb-8 space-y-1">
            <p className="text-slate-400 text-sm">
              SCORE: <span className="text-white font-bold text-lg">{score}</span>
            </p>
            <p className="text-slate-500 text-xs">
              BEST: <span className="text-emerald-400">{highScore}</span>
            </p>
          </div>

          <button
            id="btn-restart-game"
            onClick={startGame}
            className="w-48 sm:w-56 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold font-mono tracking-wider text-base sm:text-lg shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={20} />
            <span>RETRY</span>
          </button>
        </div>
      )}
    </div>
  );
}
