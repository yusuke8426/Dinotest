// Background renderer for Dino Runner
// Multi-layer parallax pixel & synthwave atmosphere

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  phase: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
  type: number;
}

interface Building {
  x: number;
  width: number;
  height: number;
  windows: { rx: number; ry: number; color: string }[];
  antenna: boolean;
}

export class BackgroundRenderer {
  private stars: Star[] = [];
  private clouds: Cloud[] = [];
  private farOffset = 0;
  private midOffset = 0;
  private nearGroundOffset = 0;

  // Cached mountains points
  private mountainPoints: number[] = [];
  // Cached buildings
  private buildings: Building[] = [];
  private totalCityWidth = 2400;

  constructor() {
    this.initStars();
    this.initClouds();
    this.initMountains();
    this.initBuildings();
  }

  private initStars() {
    this.stars = [];
    const colors = ['#ffffff', '#bae6fd', '#fed7aa', '#fbcfe8', '#a7f3d0'];
    for (let i = 0; i < 48; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() > 0.8 ? 3 : Math.random() > 0.4 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: 1 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initClouds() {
    this.clouds = [
      { x: 100, y: 50, speed: 0.3, width: 80, type: 0 },
      { x: 380, y: 90, speed: 0.2, width: 110, type: 1 },
      { x: 720, y: 40, speed: 0.25, width: 95, type: 0 },
      { x: 1100, y: 80, speed: 0.18, width: 130, type: 1 },
      { x: 1500, y: 60, speed: 0.28, width: 90, type: 0 },
    ];
  }

  private initMountains() {
    // Height map for far mountains loop
    const count = 30;
    this.mountainPoints = [];
    for (let i = 0; i < count; i++) {
      const h = 50 + Math.sin(i * 0.8) * 35 + Math.cos(i * 1.7) * 20;
      this.mountainPoints.push(Math.max(25, h));
    }
  }

  private initBuildings() {
    this.buildings = [];
    let curX = 0;
    const windowColors = ['#fef08a', '#38bdf8', '#f472b6', '#4ade80'];

    while (curX < this.totalCityWidth) {
      const width = 45 + Math.floor(Math.random() * 60);
      const height = 45 + Math.floor(Math.random() * 85);
      const antenna = Math.random() > 0.55;

      const windows: { rx: number; ry: number; color: string }[] = [];
      const cols = Math.floor(width / 12);
      const rows = Math.floor(height / 14);

      for (let r = 1; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
          if (Math.random() > 0.45) {
            windows.push({
              rx: c * 12,
              ry: r * 14,
              color: windowColors[Math.floor(Math.random() * windowColors.length)],
            });
          }
        }
      }

      this.buildings.push({
        x: curX,
        width,
        height,
        windows,
        antenna,
      });

      curX += width + 6 + Math.floor(Math.random() * 14);
    }
  }

  // Draw pixel cloud
  private drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, isDark = false) {
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(51, 65, 85, 0.55)';
    const scale = w / 80;
    const h = 18 * scale;

    // Base cloud blocks
    ctx.fillRect(Math.round(x), Math.round(y + h * 0.4), Math.round(w), Math.round(h * 0.6));
    ctx.fillRect(Math.round(x + w * 0.2), Math.round(y + h * 0.15), Math.round(w * 0.6), Math.round(h * 0.4));
    ctx.fillRect(Math.round(x + w * 0.35), Math.round(y), Math.round(w * 0.3), Math.round(h * 0.3));

    // Pixel highlight rim on top
    ctx.fillStyle = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(148, 163, 184, 0.4)';
    ctx.fillRect(Math.round(x + w * 0.35), Math.round(y), Math.round(w * 0.3), 2);
    ctx.fillRect(Math.round(x + w * 0.2), Math.round(y + h * 0.15), Math.round(w * 0.18), 2);
    ctx.fillRect(Math.round(x + w * 0.62), Math.round(y + h * 0.15), Math.round(w * 0.18), 2);

    ctx.restore();
  }

  // Draw pixel moon
  private drawPixelMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, timeSec: number) {
    ctx.save();

    // Soft outer glow
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    grad.addColorStop(0.5, 'rgba(167, 139, 250, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();

    // Pixelated Moon body (Crescent or full stylized retro sphere)
    const r = 24;
    ctx.fillStyle = '#f8fafc';
    for (let dy = -r; dy <= r; dy += 3) {
      for (let dx = -r; dx <= r; dx += 3) {
        const dist = Math.hypot(dx, dy);
        if (dist <= r) {
          // Subtract inner shadow to make it a crescent with glowing crater spots
          const shadowDist = Math.hypot(dx - 10, dy - 6);
          if (shadowDist > 16 || dist < 8) {
            // Crater variation
            if ((dx * 3 + dy * 7) % 11 === 0 && dist > 10) {
              ctx.fillStyle = '#94a3b8';
            } else if ((dx + dy) % 5 === 0) {
              ctx.fillStyle = '#e2e8f0';
            } else {
              ctx.fillStyle = '#f8fafc';
            }
            ctx.fillRect(cx + dx, cy + dy, 3, 3);
          }
        }
      }
    }

    ctx.restore();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundY: number,
    speed: number,
    dt: number,
    isPlaying: boolean,
    score: number,
    frameCount: number
  ) {
    const timeSec = frameCount * 0.016;

    // Advance parallax layers if playing
    if (isPlaying) {
      this.farOffset += speed * 0.12;
      this.midOffset += speed * 0.4;
      this.nearGroundOffset += speed;
    } else {
      // Gentle idle drift
      this.farOffset += 0.2;
      this.midOffset += 0.4;
    }

    // 1. SKY GRADIENT (Subtle shift based on score: deep midnight -> synthwave dusk)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    const cycle = Math.floor(score / 800) % 3;

    if (cycle === 0) {
      // Deep cyber midnight
      skyGrad.addColorStop(0, '#040510');
      skyGrad.addColorStop(0.55, '#0a0d24');
      skyGrad.addColorStop(1, '#13193a');
    } else if (cycle === 1) {
      // Synthwave twilight violet
      skyGrad.addColorStop(0, '#060317');
      skyGrad.addColorStop(0.6, '#180e38');
      skyGrad.addColorStop(1, '#2c124d');
    } else {
      // Emerald cyber dawn
      skyGrad.addColorStop(0, '#020d12');
      skyGrad.addColorStop(0.6, '#062024');
      skyGrad.addColorStop(1, '#0c353a');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // 2. STARS
    ctx.save();
    for (const star of this.stars) {
      const sx = (star.x * width + frameCount * 0.03) % width;
      const sy = star.y * (groundY - 90);
      const twinkle = 0.4 + 0.6 * Math.sin(timeSec * star.twinkleSpeed + star.phase);

      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.15, twinkle);
      ctx.fillRect(Math.round(sx), Math.round(sy), star.size, star.size);

      // Cross star shimmer for large stars
      if (star.size >= 3 && twinkle > 0.8) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(sx - 1), Math.round(sy + 1), 1, 1);
        ctx.fillRect(Math.round(sx + 3), Math.round(sy + 1), 1, 1);
        ctx.fillRect(Math.round(sx + 1), Math.round(sy - 1), 1, 1);
        ctx.fillRect(Math.round(sx + 1), Math.round(sy + 3), 1, 1);
      }
    }
    ctx.restore();

    // 3. MOON
    const moonX = width > 700 ? width * 0.78 : width * 0.82;
    const moonY = Math.min(groundY * 0.32, 90);
    this.drawPixelMoon(ctx, moonX, moonY, timeSec);

    // 4. PARALLAX CLOUDS
    ctx.save();
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      if (isPlaying) {
        c.x -= c.speed + (speed * 0.05);
      } else {
        c.x -= c.speed * 0.6;
      }
      if (c.x < -c.width - 20) {
        c.x = width + 50 + Math.random() * 100;
      }
      this.drawPixelCloud(ctx, c.x, c.y, c.width, i % 2 === 1);
    }
    ctx.restore();

    // 5. FAR LAYER: DISTANT NEON MOUNTAINS (Parallax Far)
    ctx.save();
    const mountainBaseY = groundY - 10;
    const segWidth = 80;
    const mCount = this.mountainPoints.length;
    const farOffsetWrapped = this.farOffset % (mCount * segWidth);

    ctx.beginPath();
    ctx.moveTo(0, groundY);

    for (let x = -segWidth; x <= width + segWidth * 2; x += segWidth) {
      const globalIdx = Math.floor((x + farOffsetWrapped) / segWidth);
      const idx = ((globalIdx % mCount) + mCount) % mCount;
      const nextIdx = (idx + 1) % mCount;
      const progress = ((x + farOffsetWrapped) % segWidth) / segWidth;

      const h1 = this.mountainPoints[idx];
      const h2 = this.mountainPoints[nextIdx];
      const peakH = h1 + (h2 - h1) * progress;

      ctx.lineTo(x, mountainBaseY - peakH);
    }

    ctx.lineTo(width, groundY);
    ctx.closePath();

    // Far mountain gradient
    const mtnGrad = ctx.createLinearGradient(0, mountainBaseY - 110, 0, groundY);
    mtnGrad.addColorStop(0, 'rgba(30, 27, 75, 0.7)');
    mtnGrad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
    ctx.fillStyle = mtnGrad;
    ctx.fill();

    // Mountain Neon Rim
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 6. MID LAYER: CYBER CITY SKYLINE (Parallax Mid)
    ctx.save();
    const cityOffsetWrapped = this.midOffset % this.totalCityWidth;

    // Draw buildings twice to ensure continuous loop
    for (let pass = 0; pass < 2; pass++) {
      const shiftX = pass * this.totalCityWidth - cityOffsetWrapped;
      if (shiftX > width || shiftX + this.totalCityWidth < 0) continue;

      for (const b of this.buildings) {
        const bx = shiftX + b.x;
        if (bx + b.width < 0 || bx > width) continue;

        const by = groundY - b.height;

        // Building block
        ctx.fillStyle = '#090d1f';
        ctx.fillRect(Math.round(bx), Math.round(by), b.width, b.height);

        // Subtle building edge highlight
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, b.width, b.height);

        // Antenna with blinking red beacon
        if (b.antenna) {
          const antX = Math.round(bx + b.width * 0.5);
          ctx.strokeStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(antX, by);
          ctx.lineTo(antX, by - 14);
          ctx.stroke();

          // Blinking tip
          const blink = (Math.sin(timeSec * 4 + b.x) > 0.3);
          if (blink) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(antX - 1, by - 16, 3, 3);
          }
        }

        // Glowing pixel windows
        for (const w of b.windows) {
          const wx = Math.round(bx + w.rx);
          const wy = Math.round(by + w.ry);
          // Windows subtle twinkle
          const winLight = ((frameCount + b.x + w.rx) % 240 > 20);
          if (winLight) {
            ctx.fillStyle = w.color;
            ctx.globalAlpha = 0.75;
            ctx.fillRect(wx, wy, 4, 5);
            ctx.globalAlpha = 1.0;
          }
        }
      }
    }
    ctx.restore();

    // 7. GROUND & UNDER-GROUND GRID
    ctx.save();

    // Ground line - glowing multi-color retro runner track
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, groundY - 2, width, 2);

    // Bright Neon Horizon Beam
    const beamGrad = ctx.createLinearGradient(0, 0, width, 0);
    beamGrad.addColorStop(0, '#10b981');
    beamGrad.addColorStop(0.3, '#34d399');
    beamGrad.addColorStop(0.7, '#38bdf8');
    beamGrad.addColorStop(1, '#10b981');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, groundY, width, 3);

    // Soft ground glow
    ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
    ctx.fillRect(0, groundY - 8, width, 8);

    // Lower Underground Space
    const underGroundH = height - (groundY + 3);
    if (underGroundH > 0) {
      const underGrad = ctx.createLinearGradient(0, groundY + 3, 0, height);
      underGrad.addColorStop(0, '#060a17');
      underGrad.addColorStop(1, '#020308');
      ctx.fillStyle = underGrad;
      ctx.fillRect(0, groundY + 3, width, underGroundH);

      // Horizontal perspective grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      for (let y = groundY + 12; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Moving retro dots / pixel stones beneath the ground
      const pebbleSpacing = 42;
      const pebbleOffset = (this.nearGroundOffset) % pebbleSpacing;
      ctx.fillStyle = '#047857';
      for (let x = -pebbleSpacing; x < width + pebbleSpacing; x += pebbleSpacing) {
        const px = Math.round(x - pebbleOffset);
        ctx.fillRect(px, groundY + 7, 4, 2);
        ctx.fillRect(px + 20, groundY + 15, 3, 2);
        ctx.fillRect(px + 9, groundY + 26, 5, 2);
      }
    }

    ctx.restore();
  }
}
