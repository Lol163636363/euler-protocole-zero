/* EULER / Protocole Zéro — original procedural flight scene. */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const COLORS = [
    { glow: '102,236,216', rim: '#8ef9df', enemy: '255,126,101' },
    { glow: '116,200,250', rim: '#a1dfff', enemy: '255,145,106' },
    { glow: '164,147,255', rim: '#c4b2ff', enemy: '255,114,139' },
    { glow: '255,189,112', rim: '#ffe0a6', enemy: '243,119,104' },
    { glow: '104,225,213', rim: '#a9fff0', enemy: '255,113,164' },
    { glow: '187,163,255', rim: '#d7bfff', enemy: '255,108,109' }
  ];

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function rgba(color, opacity) { return 'rgba(' + color + ',' + opacity + ')'; }
  function seeded(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function polygon(ctx, points, fill, stroke, lineWidth) {
    ctx.beginPath();
    points.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth || 1; ctx.stroke(); }
  }

  class EulerScene {
    constructor(canvas) {
      if (!canvas || !canvas.getContext) throw new TypeError('EulerScene needs a canvas.');
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.mode = 'map';
      this.sector = 0;
      this.boss = false;
      this.reducedMotion = false;
      this.width = 1;
      this.height = 1;
      this.time = 0;
      this.effects = [];
      this.particles = [];
      this.destroyed = false;
      this._last = 0;
      this._raf = 0;
      this._ambientTimer = 0;
      this._victoryAt = -100;
      const random = seeded(28471);
      this.stars = Array.from({ length: 145 }, function () {
        return { x: random(), y: random(), z: .2 + random() * .8, r: .3 + random() * 1.1, phase: random() * TAU };
      });
      this._onVisibility = () => {
        this._last = 0;
        if (document.hidden) this._stop();
        else this._start();
      };
      this._onResize = () => this.resize();
      this._frame = (stamp) => {
        this._raf = 0;
        if (this.destroyed || document.hidden) return;
        const dt = this._last ? Math.min((stamp - this._last) / 1000, .05) : 0;
        this._last = stamp;
        this.time += this.reducedMotion ? 0 : dt;
        this._update(dt);
        this.draw();
        if (!this.reducedMotion || this.effects.length || this.particles.length) {
          this._raf = requestAnimationFrame(this._frame);
        } else this._last = 0;
      };
      document.addEventListener('visibilitychange', this._onVisibility);
      window.addEventListener('resize', this._onResize, { passive: true });
      if (typeof ResizeObserver !== 'undefined') {
        this._observer = new ResizeObserver(this._onResize);
        this._observer.observe(canvas);
      }
      this.resize();
      this._start();
    }

    resize() {
      if (this.destroyed || !this.ctx) return;
      const box = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, box.width || this.canvas.clientWidth || 900);
      this.height = Math.max(1, box.height || this.canvas.clientHeight || 360);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    }

    setMode(mode) {
      if (!['map', 'battle', 'victory'].includes(mode)) return;
      if (mode !== this.mode) {
        this.effects = [];
        this.particles = [];
        if (mode === 'victory') {
          this._victoryAt = this.time;
          this._burst(.68, .47, COLORS[this.sector].glow, 48);
        }
      }
      this.mode = mode;
      this.draw();
      this._start();
    }

    setSector(index) {
      this.sector = clamp(Math.round(Number(index) || 0), 0, 5);
      this.draw();
    }

    setBoss(enabled) { this.boss = !!enabled; this.draw(); }

    setReducedMotion(enabled) {
      this.reducedMotion = !!enabled;
      this._last = 0;
      this._stop();
      this.draw();
      this._start();
    }

    fire(success) {
      if (this.destroyed) return;
      const isHit = !!success;
      this.effects.push({ kind: isHit ? 'hit' : 'damage', age: 0, duration: this.reducedMotion ? .48 : .9 });
      if (!this.reducedMotion) this._burst(isHit ? .755 : .265, .535, isHit ? COLORS[this.sector].glow : COLORS[this.sector].enemy, isHit ? 34 : 20);
      this._start();
    }

    destroy() {
      this.destroyed = true;
      this._stop();
      if (this._observer) this._observer.disconnect();
      document.removeEventListener('visibilitychange', this._onVisibility);
      window.removeEventListener('resize', this._onResize);
      this.effects = [];
      this.particles = [];
    }

    _start() {
      if (!this.destroyed && !document.hidden && !this._raf && this.ctx) this._raf = requestAnimationFrame(this._frame);
    }

    _stop() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
      this._last = 0;
    }

    _burst(x, y, color, count) {
      if (this.reducedMotion) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * TAU;
        const speed = 25 + Math.random() * 140;
        this.particles.push({ x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
          age: 0, duration: .45 + Math.random() * .65, size: .6 + Math.random() * 2, color });
      }
    }

    _update(dt) {
      this.effects.forEach(function (effect) { effect.age += dt; });
      this.effects = this.effects.filter(function (effect) { return effect.age < effect.duration; });
      const width = this.width, height = this.height;
      this.particles.forEach(function (p) {
        p.age += dt;
        p.x += p.dx * dt / width;
        p.y += p.dy * dt / height;
        p.dx *= Math.pow(.45, dt);
        p.dy *= Math.pow(.45, dt);
      });
      this.particles = this.particles.filter(function (p) { return p.age < p.duration; });
    }

    draw() {
      if (!this.ctx || this.destroyed) return;
      const ctx = this.ctx, w = this.width, h = this.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      this._space(ctx, w, h);
      if (this.mode === 'map') this._map(ctx, w, h);
      else if (this.mode === 'victory') this._victory(ctx, w, h);
      else this._battle(ctx, w, h);
      this._drawEffects(ctx, w, h);
      ctx.restore();
    }

    _space(ctx, w, h) {
      const palette = COLORS[this.sector];
      let glow = ctx.createRadialGradient(w * .7, h * .28, 0, w * .7, h * .28, Math.max(w * .58, h));
      glow.addColorStop(0, rgba(palette.glow, .055));
      glow.addColorStop(.5, 'rgba(12,27,45,.035)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      this.stars.forEach((star) => {
        const x = ((star.x * w - this.time * star.z * 1.3) % w + w) % w;
        const y = star.y * h;
        const alpha = (.22 + .4 * star.z) * (.8 + .2 * Math.sin(this.time * .55 + star.phase));
        ctx.fillStyle = rgba(star.z > .8 ? '191,226,238' : '140,168,182', alpha);
        ctx.beginPath(); ctx.arc(x, y, star.r, 0, TAU); ctx.fill();
        if (star.z > .97) {
          ctx.strokeStyle = rgba('171,216,231', alpha * .35); ctx.lineWidth = .6;
          ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
        }
      });
      this._planet(ctx, w, h);
      const shade = ctx.createLinearGradient(0, h * .58, 0, h);
      shade.addColorStop(0, 'rgba(3,8,14,0)'); shade.addColorStop(1, 'rgba(3,8,14,.36)');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
    }

    _planet(ctx, w, h) {
      const palette = COLORS[this.sector];
      const x = w * .75, y = -h * .48, radius = Math.min(w * .33, h * .94);
      ctx.save();
      let halo = ctx.createRadialGradient(x, y, radius * .94, x, y, radius * 1.28);
      halo.addColorStop(0, rgba(palette.glow, .075)); halo.addColorStop(.22, rgba(palette.glow, .055)); halo.addColorStop(1, rgba(palette.glow, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, radius * 1.28, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
      const sphere = ctx.createRadialGradient(x + radius * .58, y + radius * .62, 0, x + radius * .27, y + radius * .23, radius * 1.4);
      sphere.addColorStop(0, '#293e45'); sphere.addColorStop(.36, '#152831'); sphere.addColorStop(.64, '#0a1720'); sphere.addColorStop(1, '#060e17');
      ctx.fillStyle = sphere; ctx.fill();
      ctx.save(); ctx.clip();
      for (let i = 0; i < 9; i++) {
        ctx.beginPath(); ctx.ellipse(x - radius * .2, y + radius * (.22 + i * .09), radius * 1.08, radius * (.14 + i * .008), -.19, 0, TAU);
        ctx.strokeStyle = rgba(i % 2 ? '148,178,155' : palette.glow, i % 2 ? .026 : .035); ctx.lineWidth = 3 + i * 1.3; ctx.stroke();
      }
      let night = ctx.createLinearGradient(x - radius, y, x + radius, y + radius * .3);
      night.addColorStop(0, 'rgba(1,7,13,.9)'); night.addColorStop(.5, 'rgba(1,7,13,.32)'); night.addColorStop(1, 'rgba(1,7,13,0)');
      ctx.fillStyle = night; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, radius + .8, .28, 2.2);
      ctx.strokeStyle = rgba(palette.glow, .25); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, radius + 2.2, .55, 1.7);
      ctx.strokeStyle = rgba(palette.glow, .08); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }

    _map(ctx, w, h) {
      const palette = COLORS[this.sector];
      const orbitX = w * .55, orbitY = h * .57;
      ctx.save();
      ctx.translate(orbitX, orbitY);
      ctx.rotate(-.22);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, w * (.33 + i * .07), h * (.19 + i * .07), 0, 0, TAU);
        ctx.strokeStyle = rgba(palette.glow, i === 0 ? .16 : .055); ctx.lineWidth = .8;
        ctx.setLineDash(i === 1 ? [2, 8] : []); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        const angle = -.78 + i * .72;
        const x = Math.cos(angle) * w * .33, y = Math.sin(angle) * h * .19;
        ctx.beginPath(); ctx.arc(x, y, i === this.sector ? 5 : 2.5, 0, TAU);
        ctx.fillStyle = i <= this.sector ? palette.rim : '#516774'; ctx.fill();
        if (i === this.sector) {
          ctx.beginPath(); ctx.arc(x, y, 11 + Math.sin(this.time * 1.4) * 1.7, 0, TAU);
          ctx.strokeStyle = rgba(palette.glow, .3); ctx.lineWidth = 1; ctx.stroke();
          const pointGlow = ctx.createRadialGradient(x, y, 0, x, y, 32);
          pointGlow.addColorStop(0, rgba(palette.glow, .2)); pointGlow.addColorStop(1, rgba(palette.glow, 0));
          ctx.fillStyle = pointGlow; ctx.fillRect(x - 32, y - 32, 64, 64);
        }
      }
      ctx.restore();
      const shipSize = Math.min(1.25, w / 650, h / 280);
      ctx.save(); ctx.translate(w * .27, h * .56 + Math.sin(this.time * .55) * 3); ctx.rotate(-.055);
      this._player(ctx, shipSize, 0);
      ctx.restore();
      this._driftParticles(ctx, w, h, palette);
    }

    _battle(ctx, w, h) {
      const palette = COLORS[this.sector];
      let damage = 0, hit = 0;
      this.effects.forEach(function (effect) {
        if (effect.kind === 'damage') damage = Math.max(damage, Math.max(0, 1 - effect.age / .45));
        else hit = Math.max(hit, Math.max(0, 1 - effect.age / .55));
      });
      const size = Math.min(1.18, w / 620, h / 290);
      const bob = Math.sin(this.time * 1.4) * 3;
      const shake = this.reducedMotion ? 0 : Math.sin(this.time * 85) * damage * 3;
      ctx.save(); ctx.translate(w * .25 + shake, h * .535 + bob); this._player(ctx, size, damage); ctx.restore();
      ctx.save();
      ctx.translate(w * .77 + (this.reducedMotion ? 0 : Math.sin(this.time * 67) * hit * 4), h * .535 - bob);
      if (this.boss) this._boss(ctx, size, hit, palette);
      else this._enemy(ctx, size * .84, hit, palette);
      ctx.restore();
      // Quiet navigational horizon, broken before each craft.
      ctx.strokeStyle = rgba(palette.glow, .075); ctx.lineWidth = .7; ctx.setLineDash([2, 7]);
      ctx.beginPath(); ctx.moveTo(w * .37, h * .535); ctx.lineTo(w * .65, h * .535); ctx.stroke(); ctx.setLineDash([]);
      this._driftParticles(ctx, w, h, palette);
    }

    _player(ctx, scale, damage) {
      ctx.save(); ctx.scale(scale, scale);
      const pulse = .84 + Math.sin(this.time * 7) * .09 + Math.sin(this.time * 13) * .04;
      const exhaust = ctx.createLinearGradient(-126, 0, -37, 0);
      exhaust.addColorStop(0, 'rgba(80,224,220,0)'); exhaust.addColorStop(.55, 'rgba(68,220,212,.09)'); exhaust.addColorStop(.92, 'rgba(109,255,235,.55)'); exhaust.addColorStop(1, 'rgba(229,255,250,.9)');
      for (const y of [-20, 20]) {
        ctx.fillStyle = exhaust;
        ctx.beginPath(); ctx.moveTo(-44, y - 4); ctx.quadraticCurveTo(-78, y - 8 * pulse, -130 * pulse, y); ctx.quadraticCurveTo(-78, y + 8 * pulse, -44, y + 4); ctx.closePath(); ctx.fill();
      }
      const aura = ctx.createRadialGradient(-15, 0, 2, -15, 0, 85);
      aura.addColorStop(0, 'rgba(63,184,182,.08)'); aura.addColorStop(1, 'rgba(63,184,182,0)');
      ctx.fillStyle = aura; ctx.fillRect(-100, -85, 170, 170);
      polygon(ctx, [[43, 0], [-9, -17], [-48, -56], [-34, -19], [-53, -12], [-47, 0], [-53, 12], [-34, 19], [-48, 56], [-9, 17]], '#101d2a', '#4b6975', 1.1);
      polygon(ctx, [[18, -8], [-13, -18], [-48, -56], [-35, -18], [-20, -8]], '#31414c', '#627785', .65);
      polygon(ctx, [[18, 8], [-13, 18], [-48, 56], [-35, 18], [-20, 8]], '#1c2e3b', '#4f6977', .65);
      polygon(ctx, [[-10, -17], [-34, -43], [-28, -20], [-12, -9]], '#57646a', null);
      polygon(ctx, [[-10, 17], [-34, 43], [-28, 20], [-12, 9]], '#334854', null);
      polygon(ctx, [[68, 0], [16, -13], [-37, -10], [-43, 0], [-37, 10], [16, 13]], '#233846', '#82969d', 1);
      polygon(ctx, [[65, 0], [9, -5], [-26, -3], [-33, 0]], '#597580', null);
      polygon(ctx, [[64, 0], [9, 5], [-26, 3], [-33, 0]], '#182d3b', null);
      polygon(ctx, [[30, 0], [3, -7], [-12, -5], [-17, 0], [-12, 5], [3, 7]], '#07181f', '#71b9b8', .9);
      const cockpit = ctx.createLinearGradient(-12, -6, 18, 4);
      cockpit.addColorStop(0, '#3b838b'); cockpit.addColorStop(.4, '#a5ead9'); cockpit.addColorStop(.52, '#52b8b8'); cockpit.addColorStop(1, '#16444e');
      polygon(ctx, [[23, 0], [2, -4], [-10, -3], [-13, 0], [-10, 3], [2, 4]], cockpit, null);
      ctx.strokeStyle = 'rgba(177,228,219,.75)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-37, -39); ctx.lineTo(-18, -19); ctx.moveTo(-37, 39); ctx.lineTo(-18, 19); ctx.stroke();
      polygon(ctx, [[-51, -25], [-26, -24], [-18, -19], [-48, -16]], '#192a35', '#5d7980', .7);
      polygon(ctx, [[-51, 25], [-26, 24], [-18, 19], [-48, 16]], '#192a35', '#5d7980', .7);
      ctx.fillStyle = '#baffee'; ctx.shadowColor = '#6fffe5'; ctx.shadowBlur = 9;
      ctx.fillRect(-50, -23, 3, 5); ctx.fillRect(-50, 18, 3, 5);
      ctx.fillRect(-30, -35, 4, 1); ctx.fillRect(-30, 34, 4, 1);
      ctx.shadowBlur = 0;
      if (damage > 0) {
        ctx.beginPath(); ctx.ellipse(0, 0, 80, 65, 0, -.95, .95);
        ctx.strokeStyle = rgba('255,119,107', damage * .8); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, 85, 69, 0, -.65, .65);
        ctx.strokeStyle = rgba('255,119,107', damage * .25); ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.restore();
    }

    _enemy(ctx, scale, hit, palette) {
      ctx.save(); ctx.scale(scale, scale);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 85);
      glow.addColorStop(0, rgba(palette.enemy, .1)); glow.addColorStop(1, rgba(palette.enemy, 0));
      ctx.fillStyle = glow; ctx.fillRect(-85, -85, 170, 170);
      polygon(ctx, [[-55, 0], [-23, -13], [12, -48], [40, -57], [28, -15], [48, 0], [28, 15], [40, 57], [12, 48], [-23, 13]], '#2b202c', '#7d5860', 1);
      polygon(ctx, [[-38, -6], [12, -48], [40, -57], [20, -23], [12, -6]], '#49303b', '#a27575', .8);
      polygon(ctx, [[-38, 6], [12, 48], [40, 57], [20, 23], [12, 6]], '#322532', '#79525b', .8);
      polygon(ctx, [[-58, 0], [-12, -14], [28, -10], [42, 0], [28, 10], [-12, 14]], '#251e2b', '#87616d', 1);
      polygon(ctx, [[-39, 0], [-9, -5], [14, -4], [23, 0], [14, 4], [-9, 5]], '#1b111c', null);
      ctx.strokeStyle = rgba(palette.enemy, .9); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-27, 0); ctx.lineTo(4, 0); ctx.moveTo(10, -33); ctx.lineTo(28, -47); ctx.moveTo(10, 33); ctx.lineTo(28, 47); ctx.stroke();
      ctx.shadowColor = rgba(palette.enemy, 1); ctx.shadowBlur = 12; ctx.fillStyle = '#ffbba5';
      ctx.beginPath(); ctx.arc(-8, 0, 3.3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      if (hit > 0) this._shield(ctx, 70, 63, hit, palette);
      ctx.restore();
    }

    _boss(ctx, scale, hit, palette) {
      ctx.save(); ctx.scale(scale, scale);
      const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 120);
      glow.addColorStop(0, rgba(palette.enemy, .14)); glow.addColorStop(.5, rgba(palette.enemy, .04)); glow.addColorStop(1, rgba(palette.enemy, 0));
      ctx.fillStyle = glow; ctx.fillRect(-120, -120, 240, 240);
      ctx.save(); ctx.rotate(this.time * .055);
      ctx.strokeStyle = rgba(palette.enemy, .16); ctx.lineWidth = .8;
      ctx.beginPath(); ctx.arc(0, 0, 89, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * TAU / 6);
        polygon(ctx, [[62, -13], [78, -23], [86, -13], [86, 13], [78, 23], [62, 13]], '#281f30', '#7b526a', .9);
        ctx.strokeStyle = rgba(palette.enemy, .7); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(80, -12); ctx.lineTo(80, 12); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
      polygon(ctx, [[-73, 0], [-34, -31], [7, -67], [48, -50], [38, -21], [61, 0], [38, 21], [48, 50], [7, 67], [-34, 31]], '#211e2b', '#8c677b', 1.1);
      polygon(ctx, [[-65, 0], [-22, -16], [7, -57], [27, -39], [14, -11], [40, 0], [14, 11], [27, 39], [7, 57], [-22, 16]], '#3d2a42', '#674a61', .7);
      polygon(ctx, [[-48, 0], [-17, -19], [24, -17], [38, 0], [24, 17], [-17, 19]], '#171822', '#a17488', 1);
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fillStyle = '#100f1a'; ctx.fill();
      ctx.strokeStyle = rgba(palette.enemy, .85); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 6 + Math.sin(this.time * 2) * .5, 0, TAU);
      ctx.shadowColor = rgba(palette.enemy, 1); ctx.shadowBlur = 18; ctx.fillStyle = '#ffc4c0'; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = rgba(palette.enemy, .66); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-30, -17); ctx.lineTo(-9, -42); ctx.moveTo(-30, 17); ctx.lineTo(-9, 42); ctx.stroke();
      if (hit > 0) this._shield(ctx, 100, 100, hit, palette);
      ctx.restore();
    }

    _shield(ctx, rx, ry, strength, palette) {
      ctx.strokeStyle = rgba(palette.glow, strength * .8); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, Math.PI * .65, Math.PI * 1.35); ctx.stroke();
      ctx.strokeStyle = rgba(palette.glow, strength * .2); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(0, 0, rx + 3, ry + 3, 0, Math.PI * .8, Math.PI * 1.2); ctx.stroke();
    }

    _driftParticles(ctx, w, h, palette) {
      ctx.strokeStyle = rgba(palette.glow, .12); ctx.lineWidth = .8;
      for (let i = 0; i < 7; i++) {
        const x = ((i * .193 * w - this.time * (8 + i)) % (w + 60) + w + 60) % (w + 60) - 30;
        const y = h * (.22 + ((i * .137) % .64));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5 + i, y); ctx.stroke();
      }
    }

    _victory(ctx, w, h) {
      const palette = COLORS[this.sector];
      const size = Math.min(1.5, w / 520, h / 260);
      const x = w * .46, y = h * .54;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, h * .55);
      glow.addColorStop(0, rgba(palette.glow, .13)); glow.addColorStop(.55, rgba(palette.glow, .035)); glow.addColorStop(1, rgba(palette.glow, 0));
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(x, y);
      ctx.strokeStyle = rgba(palette.glow, .14); ctx.lineWidth = .7;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, 100 * size + i * 25, 70 * size + i * 20, -.22, .1 + i, 4.9 + i); ctx.stroke();
      }
      ctx.rotate(-.12); this._player(ctx, size, 0); ctx.restore();
      this._driftParticles(ctx, w, h, palette);
    }

    _drawEffects(ctx, w, h) {
      const palette = COLORS[this.sector];
      this.effects.forEach((effect) => {
        const hit = effect.kind === 'hit';
        const color = hit ? palette.glow : palette.enemy;
        const startX = w * (hit ? .31 : .71);
        const endX = w * (hit ? .755 : .265);
        const y = h * .535;
        const fade = Math.max(0, 1 - effect.age / effect.duration);
        ctx.save();
        if (effect.age < .23 || this.reducedMotion) {
          const beamAlpha = this.reducedMotion ? fade * .5 : clamp(1 - effect.age / .23, 0, 1);
          ctx.lineCap = 'round'; ctx.strokeStyle = rgba(color, beamAlpha * .09); ctx.lineWidth = 15;
          ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
          ctx.strokeStyle = rgba(color, beamAlpha * .55); ctx.lineWidth = 3.5; ctx.stroke();
          ctx.strokeStyle = 'rgba(232,255,249,' + beamAlpha * .9 + ')'; ctx.lineWidth = 1; ctx.stroke();
        }
        const radius = this.reducedMotion ? 30 : 8 + effect.age * 105;
        ctx.strokeStyle = rgba(color, fade * .42); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(endX, y, radius, 0, TAU); ctx.stroke();
        const glow = ctx.createRadialGradient(endX, y, 0, endX, y, Math.max(1, radius * 1.2));
        glow.addColorStop(0, rgba(color, fade * .19)); glow.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = glow; ctx.fillRect(endX - radius * 1.2, y - radius * 1.2, radius * 2.4, radius * 2.4);
        ctx.restore();
      });
      this.particles.forEach(function (p) {
        const fade = 1 - p.age / p.duration;
        const x = p.x * w, y = p.y * h;
        ctx.strokeStyle = rgba(p.color, fade * .8); ctx.lineWidth = p.size * fade;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.dx * .025, y - p.dy * .025); ctx.stroke();
      });
    }
  }

  window.EulerScene = EulerScene;
})();
