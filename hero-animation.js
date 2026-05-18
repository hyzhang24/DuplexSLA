(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.Path2D) return;

  const SVG_PATH =
    'M47.24.3C24.08-2.46,3.07,14.07.3,37.23c-2.76,23.16,13.77,44.17,36.92,46.94,23.16,2.76,44.17-13.77,46.94-36.92C86.93,24.08,70.4,3.07,47.24.3Zm-16.36,68.73h-15.44v-15.44h15.44v15.44Zm19.07,0h-15.44v-15.44h15.44v15.44Zm0-19.08h-15.44v-15.44h15.44v15.44Zm0-19.07h-15.44v-15.44h15.44v15.44Zm19.07,0h-15.44v-15.44h15.44v15.44Z';
  const VIEWBOX = 84.47;
  const PARTICLE_STEP = 5;
  const SAMPLE_RES = 460;
  const START_DELAY = 120;
  const DURATION = 1800;
  const PARTICLE_ALPHA = 0.76;
  const HORIZONTAL_FLIP = true;

  const ctx = canvas.getContext('2d', { alpha: true });
  const pointer = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
    active: false,
    lastMove: 0,
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let startTime = performance.now() + START_DELAY;
  let lastFrame = performance.now();

  function easeOutCubic(t) {
    const v = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - v, 3);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function sampleLogo() {
    const source = document.createElement('canvas');
    source.width = SAMPLE_RES;
    source.height = SAMPLE_RES;
    const sourceCtx = source.getContext('2d');
    sourceCtx.scale(SAMPLE_RES / VIEWBOX, SAMPLE_RES / VIEWBOX);
    sourceCtx.fill(new Path2D(SVG_PATH));

    const image = sourceCtx.getImageData(0, 0, SAMPLE_RES, SAMPLE_RES).data;
    const points = [];

    for (let y = 0; y < SAMPLE_RES; y += PARTICLE_STEP) {
      for (let x = 0; x < SAMPLE_RES; x += PARTICLE_STEP) {
        const jx = Math.min(SAMPLE_RES - 1, x + Math.floor(Math.random() * PARTICLE_STEP));
        const jy = Math.min(SAMPLE_RES - 1, y + Math.floor(Math.random() * PARTICLE_STEP));
        const alpha = image[(jy * SAMPLE_RES + jx) * 4 + 3];
        if (alpha > 128) {
          points.push({
            x: (jx / SAMPLE_RES) * 2 - 1,
            y: -((jy / SAMPLE_RES) * 2 - 1),
          });
        }
      }
    }

    return points;
  }

  function buildParticles() {
    particles = sampleLogo().map((pt) => {
      const tx = HORIZONTAL_FLIP ? -pt.x : pt.x;
      const ty = pt.y;
      const angle = Math.atan2(ty, tx);
      let sweep = 0.65 + Math.random() * 1.35;
      if (Math.random() < 0.18) sweep *= -1;
      return {
        tx,
        ty,
        targetAngle: angle,
        targetRadius: Math.hypot(tx, ty),
        initAngle: angle + sweep,
        initRadius: 2.5 + Math.random() * 1.1,
        delay: Math.random() * 0.5,
        size: 0.85 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
      };
    });
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function centerAndScale() {
    const wide = width >= 900;
    return {
      cx: wide ? width * 0.76 : width * 0.5,
      cy: wide ? height * 0.36 : height * 0.3,
      scale: Math.min(width, height) * (wide ? 0.17 : 0.2),
      startRadius: Math.max(width, height) * 0.62,
    };
  }

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      pointer.active = false;
      return;
    }

    const now = performance.now();
    const dt = Math.max(16, now - (pointer.lastMove || now)) / 1000;
    pointer.vx = pointer.vx * 0.45 + ((x - pointer.lastX) / dt) * 0.55;
    pointer.vy = pointer.vy * 0.45 + ((y - pointer.lastY) / dt) * 0.55;
    pointer.lastX = pointer.x = x;
    pointer.lastY = pointer.y = y;
    pointer.active = true;
    pointer.lastMove = now;
  }

  function updatePhysics(particle, x, y, dt, progressDone) {
    if (!progressDone) return;

    const spring = 42;
    const damping = Math.exp(-7.5 * dt);
    let fx = -spring * particle.dx;
    let fy = -spring * particle.dy;

    if (pointer.active && performance.now() - pointer.lastMove < 180) {
      const rx = x + particle.dx - pointer.x;
      const ry = y + particle.dy - pointer.y;
      const radius = Math.min(130, Math.max(78, width * 0.09));
      const dist2 = rx * rx + ry * ry;
      if (dist2 < radius * radius) {
        const dist = Math.max(0.001, Math.sqrt(dist2));
        const falloff = Math.pow(1 - dist / radius, 2);
        fx += (rx / dist) * 430 * falloff + pointer.vx * 0.65 * falloff;
        fy += (ry / dist) * 430 * falloff + pointer.vy * 0.65 * falloff;
      }
    }

    particle.vx = (particle.vx + fx * dt) * damping;
    particle.vy = (particle.vy + fy * dt) * damping;
    particle.dx += particle.vx * dt;
    particle.dy += particle.vy * dt;
  }

  function draw(now) {
    const dt = Math.min(1 / 30, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;

    const elapsed = Math.max(0, now - startTime);
    const progress = Math.min(1, elapsed / DURATION);
    const time = elapsed / 1000;
    const box = centerAndScale();

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      const local = Math.max(0, Math.min(1, (progress - p.delay) / Math.max(0.001, 1 - p.delay)));
      const eased = easeOutCubic(local);
      const targetRadius = p.targetRadius * box.scale;
      const radius = lerp(p.initRadius * box.startRadius, targetRadius, eased);
      const angle = lerp(p.initAngle, p.targetAngle, eased);
      const breathe = 1 + Math.sin(time * 1.2 + p.phase) * 0.025 * eased;
      let x = box.cx + Math.cos(angle) * radius * breathe;
      let y = box.cy + Math.sin(angle) * radius * breathe + Math.sin(time * 0.8 + p.phase * 2) * 3 * eased;

      updatePhysics(p, x, y, dt, progress >= 1);
      x += p.dx;
      y += p.dy;

      const alpha = PARTICLE_ALPHA * Math.min(1, local / 0.08);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    pointer.vx *= 0.9;
    pointer.vy *= 0.9;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }

  function restart() {
    layout();
    startTime = performance.now() + START_DELAY;
    lastFrame = performance.now();
  }

  buildParticles();
  layout();
  window.addEventListener('resize', restart);
  window.addEventListener('mousemove', updatePointer, { passive: true });
  window.addEventListener('mouseleave', () => {
    pointer.active = false;
  });
  requestAnimationFrame(draw);
})();
