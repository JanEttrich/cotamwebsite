/* Mobiles Menü: öffnet/schließt die Navigation, schließt nach Klick auf einen Link, mit Escape oder Klick daneben. */
(function () {
  'use strict';
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('hauptnav');
  if (!btn || !nav) return;

  function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }
  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    nav.toggleAttribute('data-open', open);
  }

  btn.addEventListener('click', function () { setOpen(!isOpen()); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (isOpen() && !e.target.closest('.top')) setOpen(false);
  });
})();
