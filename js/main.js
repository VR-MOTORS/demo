document.documentElement.classList.remove('no-js');

const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.site-nav a');

/* ---------- Menú móvil ---------- */
function setMenu(open) {
  header.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}

navToggle.addEventListener('click', () => {
  setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
});
navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setMenu(false);
});

/* ---------- Cabecera al hacer scroll ---------- */
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Enlace activo según la sección visible ---------- */
const sections = [...navLinks]
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a => {
      a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}` && !a.classList.contains('btn'));
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => sectionObserver.observe(s));

/* ---------- Aparición al hacer scroll + contadores ---------- */
// Separador de miles con punto también en números de 4 cifras (4.200)
const fmt = { format: n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) return;
  const start = performance.now();
  const duration = 1400;
  const tick = now => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt.format(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('[data-count]').forEach(countUp);
    obs.unobserve(entry.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- Pestañas de la ficha técnica ---------- */
const tabs = [...document.querySelectorAll('[role="tab"]')];

function selectTab(tab) {
  tabs.forEach(t => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  });
  tab.focus();
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', e => {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (dir) selectTab(tabs[(i + dir + tabs.length) % tabs.length]);
    if (e.key === 'Home') selectTab(tabs[0]);
    if (e.key === 'End') selectTab(tabs[tabs.length - 1]);
  });
});

/* ---------- Configurador y formulario ---------- */
const form = document.getElementById('reserve-form');
const modelInputs = form.querySelectorAll('input[name="modelo"]');
const summaryModel = document.getElementById('summary-model');
const summaryPrice = document.getElementById('summary-price');

function updateSummary() {
  const checked = form.querySelector('input[name="modelo"]:checked');
  summaryModel.textContent = checked.closest('.choice').querySelector('b').textContent.replace(/^TDS/, 'VR 525 TDS');
  summaryPrice.textContent = fmt.format(Number(checked.dataset.price));
}
modelInputs.forEach(input => input.addEventListener('change', updateSummary));

// Los botones «Configurar» de la gama preseleccionan el modelo
document.querySelectorAll('[data-model]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = form.querySelector(`input[name="modelo"][value="${btn.dataset.model}"]`);
    if (input) { input.checked = true; updateSummary(); }
  });
});

function setError(input, message) {
  const error = input.closest('.field')?.querySelector('.field-error') || document.getElementById(`${input.id}-error`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

function validate() {
  const nombre = form.nombre;
  const email = form.email;
  const privacidad = form.privacidad;
  let firstInvalid = null;

  const checks = [
    [nombre, nombre.value.trim().length < 3 ? 'Escribe tu nombre completo.' : ''],
    [email, !email.validity.valid || !email.value ? 'Escribe un correo electrónico válido.' : ''],
    [privacidad, !privacidad.checked ? 'Necesitamos tu consentimiento para responderte.' : ''],
  ];
  checks.forEach(([input, msg]) => {
    setError(input, msg);
    if (msg && !firstInvalid) firstInvalid = input;
  });
  return firstInvalid;
}

// Web de demostración: el envío se simula y los datos no salen del navegador
form.addEventListener('submit', e => {
  e.preventDefault();
  const invalid = validate();
  if (invalid) { invalid.focus(); return; }

  const message = document.getElementById('form-success');
  const submit = form.querySelector('button[type="submit"]');
  const nombre = form.nombre.value.trim().split(' ')[0];

  submit.disabled = true;
  submit.textContent = 'Enviando…';
  message.hidden = true;

  setTimeout(() => {
    message.textContent = `Gracias, ${nombre}. Hemos recibido tu solicitud para el ${summaryModel.textContent}. Un asesor de VR MOTORS te escribirá en las próximas 48 horas.`;
    message.hidden = false;
    submit.textContent = 'Solicitud enviada';
    form.querySelectorAll('input, select').forEach(el => { el.disabled = true; });
  }, 1200);
});

form.addEventListener('input', e => {
  if (e.target.getAttribute('aria-invalid') === 'true') validate();
});

document.getElementById('year').textContent = new Date().getFullYear();
