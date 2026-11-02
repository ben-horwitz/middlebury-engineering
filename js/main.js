// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}

// Dropdown: tap support for touch devices
document.querySelectorAll('.dropdown > button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dd = btn.parentElement;
    const open = dd.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// Contact forms: no server, so compose an email to the club instead.
// To collect submissions without email, swap the form's action for a
// service like Formspree and delete this block.
document.querySelectorAll('form.contact').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = `${data.get('first') || ''} ${data.get('last') || ''}`.trim();
    const subject = form.dataset.subject || 'Website inquiry';
    const body = `${data.get('message') || ''}\n\n— ${name}\n${data.get('email') || ''}`;
    window.location.href =
      `mailto:engineering@middlebury.edu?subject=${encodeURIComponent(subject + (name ? ` from ${name}` : ''))}` +
      `&body=${encodeURIComponent(body)}`;
  });
});

// Footer year
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
