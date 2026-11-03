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

// 3D bridge: the club's Onshape model (images/bridge.glb), loaded only on pages that show it.
//   data-bridge3d="float"  turns and drifts as the page scrolls, leaning toward the cursor
//   data-bridge3d="orbit"  drag to spin, slow auto-rotation when idle
const bridgeMounts = document.querySelectorAll('[data-bridge3d]');
if (bridgeMounts.length) {
  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'))
    .then(() => new THREE.GLTFLoader().loadAsync('images/bridge.glb'))
    .then((gltf) => bridgeMounts.forEach((mount) => mountBridge(mount, gltf.scene.clone(true))))
    .catch(() => { /* keep the static fallback */ });
}

function mountBridge(mount, model) {
  const mode = mount.dataset.bridge3d;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  mount.appendChild(renderer.domElement);
  mount.classList.add('live');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x1f3550, mode === 'float' ? 0.55 : 0.75));
  const sun = new THREE.DirectionalLight(0xfff6ec, mode === 'float' ? 0.85 : 0.8);
  sun.position.set(220, 400, 300);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff6a2b, mode === 'float' ? 0.9 : 0.35);
  rim.position.set(-300, 120, -260);
  scene.add(rim);

  // Plywood material plus crisp dark edges so it reads like a CAD model
  const ply = new THREE.MeshStandardMaterial({ color: 0xa8683a, roughness: 0.75, metalness: 0 });
  const edgeMat = new THREE.LineBasicMaterial({ color: mode === 'float' ? 0x2a1a0e : 0x3a2414, transparent: true, opacity: 0.55 });
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.material = ply;
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), edgeMat));
  });

  // CAD is Z-up in millimetres; stand it up and centre it
  const pivot = new THREE.Group();
  model.rotation.x = -Math.PI / 2;
  pivot.add(model);
  const box = new THREE.Box3().setFromObject(pivot);
  model.position.sub(box.getCenter(new THREE.Vector3()));
  scene.add(pivot);
  const radius = box.getSize(new THREE.Vector3()).length() / 2;

  function resize() {
    const w = mount.clientWidth, h = mount.clientHeight || w * 0.75;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, radius * 0.55, radius * (mode === 'float' ? 4.4 : 4.8) / Math.min(camera.aspect, 1.4));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let spin = -0.6, tilt = 0.18, dragging = false, lastX = 0, idle = 0;
  const mouse = { x: 0, y: 0 };

  if (mode === 'orbit') {
    mount.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; mount.setPointerCapture(e.pointerId); });
    mount.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      spin += (e.clientX - lastX) * 0.01; lastX = e.clientX; idle = 0;
    });
    const stop = () => { dragging = false; };
    mount.addEventListener('pointerup', stop);
    mount.addEventListener('pointercancel', stop);
  } else {
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(mount);

  let last = performance.now(), t = 0, curRotY = spin, curRotX = tilt, curY = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!visible) return;
    t += dt;
    let rotY, rotX, posY = 0;
    if (mode === 'float') {
      // Scroll through the header: the bridge turns about half a revolution and drifts down
      const hero = mount.closest('.hero') || document.body;
      const p = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1.2);
      rotY = -0.75 + p * Math.PI * 0.9 + mouse.x * 0.35 + (reduceMotion ? 0 : Math.sin(t * 0.4) * 0.06);
      rotX = 0.22 - p * 0.18 + mouse.y * 0.12;
      posY = -p * radius * 0.35 + (reduceMotion ? 0 : Math.sin(t * 0.8) * radius * 0.015);
    } else {
      idle += dt;
      if (!dragging && idle > 1.5 && !reduceMotion) spin += dt * 0.35;
      rotY = spin; rotX = tilt;
    }
    curRotY += (rotY - curRotY) * Math.min(dt * 6, 1);
    curRotX += (rotX - curRotX) * Math.min(dt * 6, 1);
    curY += (posY - curY) * Math.min(dt * 6, 1);
    pivot.rotation.set(curRotX, curRotY, 0);
    pivot.position.y = curY;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
