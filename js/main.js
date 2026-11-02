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
const hoverable = window.matchMedia('(hover: hover) and (min-width: 861px)');

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
