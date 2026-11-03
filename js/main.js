// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  // Close the mobile menu after picking a link (matters for same-page #anchors)
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  }));
}

// Dropdown menus: open on click (and hover on desktop), close on outside click or Escape
const dropdowns = [...document.querySelectorAll('.dropdown')];
const hoverable = window.matchMedia('(hover: hover) and (min-width: 881px)');

function setOpen(dd, open) {
  dd.classList.toggle('open', open);
  dd.querySelector('button').setAttribute('aria-expanded', open);
}

dropdowns.forEach((dd) => {
  const btn = dd.querySelector('button');
  let closeTimer;
  btn.addEventListener('click', () => {
    // With a mouse, hover already opened it; a click shouldn't immediately close it
    const open = hoverable.matches || !dd.classList.contains('open');
    dropdowns.forEach((other) => { if (other !== dd) setOpen(other, false); });
    setOpen(dd, open);
  });
  dd.addEventListener('mouseenter', () => {
    if (!hoverable.matches) return;
    clearTimeout(closeTimer);
    dropdowns.forEach((other) => setOpen(other, other === dd));
  });
  dd.addEventListener('mouseleave', () => {
    if (!hoverable.matches) return;
    closeTimer = setTimeout(() => setOpen(dd, false), 150);
  });
  dd.addEventListener('focusout', (e) => {
    if (!dd.contains(e.relatedTarget)) setOpen(dd, false);
  });
});

document.addEventListener('click', (e) => {
  dropdowns.forEach((dd) => { if (!dd.contains(e.target)) setOpen(dd, false); });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = dropdowns.find((dd) => dd.classList.contains('open'));
  if (open) { setOpen(open, false); open.querySelector('button').focus(); }
});

// Footer year
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header gets a shadow once the page scrolls
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Scroll reveal: content eases in as it enters the screen
if (!reduceMotion && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll(
    'main > section:not(.marquee) > .container > *:not(.grid):not(.gallery), .grid > *, .gallery > *, .step'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((el) => {
    const siblings = el.parentElement ? [...el.parentElement.children] : [];
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
    el.classList.add('reveal');
    io.observe(el);
  });
}

// Cards tilt slightly toward the cursor
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('a.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// Live truss: a Warren truss solved by the method of joints as a load moves across the deck.
// Members are coloured by tension/compression and drawn thicker the more force they carry.
document.querySelectorAll('[data-truss]').forEach((box) => {
  const svg = box.querySelector('svg');
  const readout = box.querySelector('.truss-readout');
  const NS = 'http://www.w3.org/2000/svg';
  const PANELS = 6, X0 = 40, SPAN = 560, YB = 200, H = 130, LOAD = 100; // LOAD in newtons
  const L = SPAN / PANELS;

  // Joints: bottom chord B0..B6, top chord T0..T5 (Warren, top joints over panel midpoints)
  const nodes = [];
  for (let i = 0; i <= PANELS; i++) nodes.push({ x: X0 + i * L, y: YB, bottom: true });
  for (let i = 0; i < PANELS; i++) nodes.push({ x: X0 + (i + 0.5) * L, y: YB - H, bottom: false });
  const B = (i) => i, T = (i) => PANELS + 1 + i;

  const members = [];
  for (let i = 0; i < PANELS; i++) members.push([B(i), B(i + 1), 'bottom chord']);
  for (let i = 0; i < PANELS - 1; i++) members.push([T(i), T(i + 1), 'top chord']);
  for (let i = 0; i < PANELS; i++) { members.push([B(i), T(i), 'diagonal']); members.push([T(i), B(i + 1), 'diagonal']); }

  // Unknowns: one force per member + reactions (pin at B0: Rx, Ry; roller at B6: Ry)
  const nUnknown = members.length + 3;
  const nEq = nodes.length * 2;

  function solve(loadX) {
    const A = Array.from({ length: nEq }, () => new Float64Array(nUnknown));
    const b = new Float64Array(nEq);
    members.forEach(([i, j], m) => {
      const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y, len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      A[2 * i][m] += ux; A[2 * i + 1][m] += uy;     // tension pulls joint i toward j
      A[2 * j][m] -= ux; A[2 * j + 1][m] -= uy;
    });
    const r = members.length;
    A[2 * B(0)][r] = 1; A[2 * B(0) + 1][r + 1] = 1; A[2 * B(PANELS) + 1][r + 2] = 1;
    // Load shared between the two deck joints either side of it (screen y points down, so +LOAD)
    const p = Math.min(Math.max((loadX - X0) / L, 0), PANELS - 1e-6);
    const k = Math.floor(p), t = p - k;
    b[2 * B(k) + 1] -= LOAD * (1 - t);
    b[2 * B(k + 1) + 1] -= LOAD * t;
    // Gaussian elimination with partial pivoting
    for (let c = 0; c < nUnknown; c++) {
      let piv = c;
      for (let rr = c + 1; rr < nEq; rr++) if (Math.abs(A[rr][c]) > Math.abs(A[piv][c])) piv = rr;
      [A[c], A[piv]] = [A[piv], A[c]]; [b[c], b[piv]] = [b[piv], b[c]];
      for (let rr = c + 1; rr < nEq; rr++) {
        const f = A[rr][c] / A[c][c];
        if (!f) continue;
        for (let cc = c; cc < nUnknown; cc++) A[rr][cc] -= f * A[c][cc];
        b[rr] -= f * b[c];
      }
    }
    const x = new Float64Array(nUnknown);
    for (let c = nUnknown - 1; c >= 0; c--) {
      let s = b[c];
      for (let cc = c + 1; cc < nUnknown; cc++) s -= A[c][cc] * x[cc];
      x[c] = s / A[c][c];
    }
    return x; // member forces: + tension, - compression
  }

  // Static scenery: supports and ground
  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    parent.appendChild(e);
    return e;
  };
  el('path', { d: `M${X0 - 14} ${YB + 26} l14 -24 l14 24 z`, fill: 'none', stroke: '#8fa3bb', 'stroke-width': 2 });
  el('circle', { cx: X0 + SPAN, cy: YB + 12, r: 9, fill: 'none', stroke: '#8fa3bb', 'stroke-width': 2 });
  el('line', { x1: X0 - 30, y1: YB + 28, x2: X0 + 22, y2: YB + 28, stroke: '#8fa3bb', 'stroke-width': 2 });
  el('line', { x1: X0 + SPAN - 24, y1: YB + 28, x2: X0 + SPAN + 30, y2: YB + 28, stroke: '#8fa3bb', 'stroke-width': 2 });
  const memberEls = members.map(() => el('line', { 'stroke-linecap': 'round' }));
  const nodeEls = nodes.map(() => el('circle', { r: 4.5, fill: '#0d1b2a', stroke: '#e6edf6', 'stroke-width': 2 }));
  const arrow = el('g', {});
  el('line', { x1: 0, y1: -(H + 12), x2: 0, y2: -12, stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '6 5' }, arrow);
  el('path', { d: 'M-9 -16 L0 0 L9 -16 Z', fill: '#ffffff' }, arrow);
  const label = el('text', { x: 0, y: -(H + 22), 'text-anchor': 'middle', fill: '#ffffff', 'font-family': 'IBM Plex Mono, monospace', 'font-size': 14 }, arrow);
  label.textContent = `P = ${LOAD} N`;

  let target = X0 + SPAN / 2, current = target, auto = !reduceMotion, autoT = 0, idleTimer;

  function draw(loadX) {
    const f = solve(loadX);
    let max = 1e-9;
    for (let m = 0; m < members.length; m++) max = Math.max(max, Math.abs(f[m]));
    // Exaggerated sag so the deck visibly bends under the load (simply supported beam shape)
    const a = loadX - X0, bb = SPAN - a;
    const sag = (x) => {
      const u = x - X0;
      const d = u <= a ? bb * u * (SPAN * SPAN - bb * bb - u * u) : a * (SPAN - u) * (SPAN * SPAN - a * a - (SPAN - u) * (SPAN - u));
      return (d / (SPAN * SPAN * SPAN * SPAN)) * 140;
    };
    const pos = nodes.map((n) => ({ x: n.x, y: n.y + sag(n.x) }));
    members.forEach(([i, j], m) => {
      const v = f[m], mag = Math.abs(v) / max;
      const e = memberEls[m];
      e.setAttribute('x1', pos[i].x); e.setAttribute('y1', pos[i].y);
      e.setAttribute('x2', pos[j].x); e.setAttribute('y2', pos[j].y);
      e.setAttribute('stroke-width', (2 + mag * 11).toFixed(2));
      e.setAttribute('stroke', mag < 0.03 ? '#5b6b80' : v > 0 ? '#5aa9ff' : '#ff6a2b');
    });
    nodeEls.forEach((e, i) => { e.setAttribute('cx', pos[i].x); e.setAttribute('cy', pos[i].y); });
    arrow.setAttribute('transform', `translate(${loadX} ${YB + sag(loadX) - 6})`);

    let maxT = 0, maxC = 0, tName = '', cName = '';
    members.forEach((mm, m) => {
      if (f[m] > maxT) { maxT = f[m]; tName = mm[2]; }
      if (-f[m] > maxC) { maxC = -f[m]; cName = mm[2]; }
    });
    if (readout) readout.textContent = `Max tension ${maxT.toFixed(0)} N (${tName}) · max compression ${maxC.toFixed(0)} N (${cName})`;
  }

  function toSvgX(clientX) {
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = 0;
    return pt.matrixTransform(svg.getScreenCTM().inverse()).x;
  }
  box.addEventListener('pointermove', (e) => {
    auto = false; clearTimeout(idleTimer);
    target = Math.min(Math.max(toSvgX(e.clientX), X0 + 4), X0 + SPAN - 4);
  });
  box.addEventListener('pointerleave', () => {
    clearTimeout(idleTimer);
    if (!reduceMotion) idleTimer = setTimeout(() => { auto = true; }, 2500);
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (auto) { autoT += dt; target = X0 + SPAN / 2 + Math.sin(autoT * 0.6) * SPAN * 0.42; }
    current += (target - current) * Math.min(dt * 8, 1);
    draw(current);
    requestAnimationFrame(frame);
  }
  draw(current);
  if (!reduceMotion) requestAnimationFrame(frame);
  else box.addEventListener('pointermove', () => draw(target));
});
