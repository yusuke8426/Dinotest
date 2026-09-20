import { FloatingText, ObstacleType, Particle, PowerUpType, Rect, Star } from '../types';
import { sound, triggerVibrate } from './sound';

export class CyberDino {
  public x: number = 60;
  public y: number = 0;
  public vy: number = 0;
  public standWidth: number = 52;
  public standHeight: number = 60;
  public duckWidth: number = 72;
  public duckHeight: number = 34;
  public width: number = 52;
  public height: number = 60;
  public isGrounded: boolean = true;
  public isDucking: boolean = false;
  public animTimer: number = 0;
  public legFrame: number = 0;
  public jumpStrength: number = -660;
  public gravity: number = 1750;
  public duckGravity: number = 3400; // dive down fast

  constructor() {
    this.width = this.standWidth;
    this.height = this.standHeight;
  }

  public reset(groundY: number) {
    this.x = 60;
    this.width = this.standWidth;
    this.height = this.standHeight;
    this.y = groundY - this.height;
    this.vy = 0;
    this.isGrounded = true;
    this.isDucking = false;
    this.animTimer = 0;
    this.legFrame = 0;
  }

  public jump(): boolean {
    if (this.isGrounded) {
      this.vy = this.jumpStrength;
      this.isGrounded = false;
      sound.playJump();
      triggerVibrate(15);
      return true;
    }
    return false;
  }

  public cutJump() {
    // Variable jump height: release early to jump shorter
    if (!this.isGrounded && this.vy < -240) {
      this.vy = -240;
    }
  }

  public startDuck() {
    this.isDucking = true;
    this.width = this.duckWidth;
    this.height = this.duckHeight;
    sound.playDuck();
  }

  public stopDuck(groundY: number) {
    this.isDucking = false;
    this.width = this.standWidth;
    this.height = this.standHeight;
    if (this.isGrounded) {
      this.y = groundY - this.height;
    }
  }

  public update(dt: number, groundY: number, createSparks: (x: number, y: number, color: string) => void) {
    // Animation frame for legs
    this.animTimer += dt * 14;
    this.legFrame = Math.floor(this.animTimer) % 2;

    // Apply gravity
    const currentGravity = (this.isDucking && !this.isGrounded) ? this.duckGravity : this.gravity;
    this.vy += currentGravity * dt;
    this.y += this.vy * dt;

    // Ground collision
    const targetY = groundY - this.height;
    if (this.y >= targetY) {
      this.y = targetY;
      this.vy = 0;
      if (!this.isGrounded) {
        // Landing dust/sparks
        createSparks(this.x + 20, groundY - 2, '#00f0ff');
      }
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
      // Air thruster trail
      if (this.vy < 0) {
        createSparks(this.x + 6, this.y + this.height - 10, '#00f0ff');
      }
    }
  }

  public getHitbox(): Rect {
    // Tight hitbox for fair retro gameplay
    const margin = 4;
    return {
      x: this.x + margin + 4,
      y: this.y + margin + 2,
      w: this.width - (margin * 2 + 6),
      h: this.height - (margin * 2 + 2),
    };
  }

  public draw(ctx: CanvasRenderingContext2D, hasShield: boolean) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Shield Aura
    if (hasShield) {
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (!this.isDucking) {
      // STANDING CYBER DINO
      this.drawStandingDino(ctx);
    } else {
      // DUCKING CYBER DINO
      this.drawDuckingDino(ctx);
    }

    ctx.restore();
  }

  private drawStandingDino(ctx: CanvasRenderingContext2D) {
    const mainColor = '#00f0ff';
    const armorColor = '#0f172a';
    const accentColor = '#ff0080';

    // Body Armor Torso
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 4;

    // Torso block
    ctx.fillRect(10, 16, 26, 26);
    ctx.strokeRect(10, 16, 26, 26);

    // Cyber Tail
    ctx.beginPath();
    ctx.moveTo(10, 28);
    ctx.lineTo(0, 36);
    ctx.lineTo(10, 38);
    ctx.closePath();
    ctx.fillStyle = armorColor;
    ctx.fill();
    ctx.stroke();

    // Cyber Head
    ctx.fillRect(24, 2, 26, 18);
    ctx.strokeRect(24, 2, 26, 18);

    // Neon Visor / Eye
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(38, 6, 10, 4);
    ctx.shadowBlur = 4;

    // Cyber Jaw
    ctx.fillStyle = armorColor;
    ctx.fillRect(32, 20, 16, 6);
    ctx.strokeRect(32, 20, 20 - 4, 6);

    // Mechanical Tiny Hand
    ctx.beginPath();
    ctx.moveTo(34, 28);
    ctx.lineTo(42, 32);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Thruster Pack on Back
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, 20, 7, 12);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 20, 7, 12);

    // Legs
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    if (this.isGrounded) {
      if (this.legFrame === 0) {
        // Leg 1 down, Leg 2 bent
        ctx.beginPath();
        ctx.moveTo(18, 42);
        ctx.lineTo(18, 58);
        ctx.lineTo(26, 58);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(28, 42);
        ctx.lineTo(34, 50);
        ctx.lineTo(40, 48);
        ctx.stroke();
      } else {
        // Leg 1 bent, Leg 2 down
        ctx.beginPath();
        ctx.moveTo(18, 42);
        ctx.lineTo(12, 50);
        ctx.lineTo(6, 48);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(28, 42);
        ctx.lineTo(28, 58);
        ctx.lineTo(36, 58);
        ctx.stroke();
      }
    } else {
      // In-flight jumping pose
      ctx.beginPath();
      ctx.moveTo(18, 42);
      ctx.lineTo(12, 52);
      ctx.lineTo(20, 52);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(28, 42);
      ctx.lineTo(34, 52);
      ctx.lineTo(42, 52);
      ctx.stroke();
    }
  }

  private drawDuckingDino(ctx: CanvasRenderingContext2D) {
    const mainColor = '#00f0ff';
    const armorColor = '#0f172a';
    const accentColor = '#ff0080';

    ctx.fillStyle = armorColor;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 4;

    // Streamlined low Torso
    ctx.fillRect(8, 8, 42, 16);
    ctx.strokeRect(8, 8, 42, 16);

    // Tail extended back
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(0, 14);
    ctx.lineTo(8, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Streamlined Head extended forward
    ctx.fillRect(48, 6, 22, 14);
    ctx.strokeRect(48, 6, 22, 14);

    // Neon Eye Visor
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(58, 9, 10, 4);
    ctx.shadowBlur = 4;

    // Low Legs crawling/sliding
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    if (this.isGrounded) {
      if (this.legFrame === 0) {
        ctx.beginPath();
        ctx.moveTo(20, 24);
        ctx.lineTo(12, 32);
        ctx.lineTo(22, 32);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(38, 24);
        ctx.lineTo(46, 32);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(20, 24);
        ctx.lineTo(28, 32);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(38, 24);
        ctx.lineTo(32, 32);
        ctx.lineTo(42, 32);
        ctx.stroke();
      }
    } else {
      // Dive pose in air
      ctx.beginPath();
      ctx.moveTo(20, 24);
      ctx.lineTo(14, 32);
      ctx.moveTo(38, 24);
      ctx.lineTo(44, 32);
      ctx.stroke();
    }
  }
}

export class Obstacle {
  public type: ObstacleType;
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public animTimer: number = 0;
  public wingFrame: number = 0;
  public meteorSpeedY: number = 240;

  constructor(type: ObstacleType, x: number, groundY: number) {
    this.type = type;
    this.x = x;
    this.animTimer = 0;
    this.wingFrame = 0;

    switch (type) {
      case 'CACTUS_1':
        this.w = 26;
        this.h = 48;
        this.y = groundY - this.h;
        break;
      case 'CACTUS_2':
        this.w = 50;
        this.h = 52;
        this.y = groundY - this.h;
        break;
      case 'CACTUS_3':
        this.w = 72;
        this.h = 56;
        this.y = groundY - this.h;
        break;
      case 'LASER':
        this.w = 24;
        this.h = 68;
        this.y = groundY - this.h;
        break;
      case 'DRONE':
        this.w = 44;
        this.h = 28;
        // 3 heights: LOW (must jump), MID (can duck or jump), HIGH (can walk/duck under)
        const heights = [groundY - 32, groundY - 65, groundY - 95];
        this.y = heights[Math.floor(Math.random() * heights.length)];
        break;
      case 'METEOR':
        this.w = 32;
        this.h = 32;
        this.y = -40;
        break;
      default:
        this.w = 30;
        this.h = 45;
        this.y = groundY - this.h;
    }
  }

  public update(dt: number, speed: number) {
    this.x -= speed * dt;
    this.animTimer += dt * 8;
    this.wingFrame = Math.floor(this.animTimer) % 2;

    if (this.type === 'METEOR') {
      this.y += this.meteorSpeedY * dt;
    }
  }

  public getHitbox(): Rect {
    const pad = 4;
    return {
      x: this.x + pad,
      y: this.y + pad,
      w: Math.max(8, this.w - pad * 2),
      h: Math.max(8, this.h - pad * 2),
    };
  }

  public draw(ctx: CanvasRenderingContext2D, groundY: number) {
    ctx.save();
    switch (this.type) {
      case 'CACTUS_1':
      case 'CACTUS_2':
      case 'CACTUS_3':
        this.drawCactus(ctx);
        break;
      case 'LASER':
        this.drawLaser(ctx, groundY);
        break;
      case 'DRONE':
        this.drawDrone(ctx);
        break;
      case 'METEOR':
        this.drawMeteor(ctx);
        break;
    }
    ctx.restore();
  }

  private drawCactus(ctx: CanvasRenderingContext2D) {
    const color = '#ff0055';
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    const count = this.type === 'CACTUS_1' ? 1 : this.type === 'CACTUS_2' ? 2 : 3;
    const singleW = this.w / count;

    for (let i = 0; i < count; i++) {
      const cx = this.x + i * singleW + singleW * 0.1;
      const cw = singleW * 0.8;
      const ch = this.h;
      const cy = this.y;

      // Stem
      ctx.fillRect(cx + cw * 0.35, cy, cw * 0.3, ch);
      ctx.strokeRect(cx + cw * 0.35, cy, cw * 0.3, ch);

      // Left cyber branch
      ctx.beginPath();
      ctx.moveTo(cx + cw * 0.35, cy + ch * 0.5);
      ctx.lineTo(cx, cy + ch * 0.5);
      ctx.lineTo(cx, cy + ch * 0.25);
      ctx.stroke();

      // Right cyber branch
      ctx.beginPath();
      ctx.moveTo(cx + cw * 0.65, cy + ch * 0.4);
      ctx.lineTo(cx + cw, cy + ch * 0.4);
      ctx.lineTo(cx + cw, cy + ch * 0.15);
      ctx.stroke();
    }
  }

  private drawLaser(ctx: CanvasRenderingContext2D, groundY: number) {
    const pulse = (Math.sin(this.animTimer * 4) + 1) * 0.5;
    const color = '#38bdf8';

    // Base emitter
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillRect(this.x + 2, groundY - 10, this.w - 4, 10);
    ctx.strokeRect(this.x + 2, groundY - 10, this.w - 4, 10);

    // Laser vertical beam
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.5})`;
    ctx.fillRect(this.x + this.w * 0.35, this.y, this.w * 0.3, this.h - 8);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + this.w * 0.45, this.y, this.w * 0.1, this.h - 8);
  }

  private drawDrone(ctx: CanvasRenderingContext2D) {
    const color = '#a855f7';
    ctx.strokeStyle = color;
    ctx.fillStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Drone Body
    ctx.fillRect(this.x + 10, this.y + 8, this.w - 20, 12);
    ctx.strokeRect(this.x + 10, this.y + 8, this.w - 20, 12);

    // Glowing Red/Cyan Drone Sensor
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(this.x + 4, this.y + 11, 6, 6);

    // Wings (animated flapping/rotor)
    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    if (this.wingFrame === 0) {
      // Wings tilted up
      ctx.beginPath();
      ctx.moveTo(this.x + 12, this.y + 8);
      ctx.lineTo(this.x + 2, this.y - 2);
      ctx.lineTo(this.x + 22, this.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.x + 22, this.y + 8);
      ctx.lineTo(this.x + 42, this.y - 2);
      ctx.lineTo(this.x + 32, this.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Wings tilted down
      ctx.beginPath();
      ctx.moveTo(this.x + 12, this.y + 18);
      ctx.lineTo(this.x + 2, this.y + 26);
      ctx.lineTo(this.x + 22, this.y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.x + 22, this.y + 18);
      ctx.lineTo(this.x + 42, this.y + 26);
      ctx.lineTo(this.x + 32, this.y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawMeteor(ctx: CanvasRenderingContext2D) {
    const color = '#fb923c';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Tail Flame
    ctx.beginPath();
    ctx.moveTo(this.x + this.w * 0.5, this.y);
    ctx.lineTo(this.x + this.w + 14, this.y - 30);
    ctx.lineTo(this.x, this.y + this.h * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(251, 146, 60, 0.5)';
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x + this.w * 0.5, this.y + this.h * 0.5, this.w * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export class PowerUp {
  public type: PowerUpType;
  public x: number;
  public y: number;
  public size: number = 30;
  public timer: number = 0;

  constructor(type: PowerUpType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
  }

  public update(dt: number, speed: number) {
    this.x -= speed * dt;
    this.timer += dt * 4;
  }

  public getHitbox(): Rect {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      w: this.size,
      h: this.size,
    };
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const bob = Math.sin(this.timer) * 4;
    ctx.translate(this.x, this.y + bob);

    let color = '#00f0ff';
    let icon = '🛡️';

    if (this.type === 'SHIELD') {
      color = '#00f0ff';
      icon = '🛡️';
    } else if (this.type === 'EMP') {
      color = '#facc15';
      icon = '⚡';
    } else if (this.type === 'SLOW') {
      color = '#ba55d3';
      icon = '⏳';
    }

    // Outer spinning diamond
    ctx.rotate(this.timer * 0.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';

    ctx.beginPath();
    ctx.rect(-14, -14, 28, 28);
    ctx.fill();
    ctx.stroke();

    // Reset rotation for inner symbol
    ctx.rotate(-this.timer * 0.5);
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }
}

export function checkCollision(boxA: Rect, boxB: Rect): boolean {
  return (
    boxA.x < boxB.x + boxB.w &&
    boxA.x + boxA.w > boxB.x &&
    boxA.y < boxB.y + boxB.h &&
    boxA.y + boxA.h > boxB.y
  );
}
