/*
 * Cô Tâm – füllt die Seite mit den Daten aus site-data.js.
 * Markup-Hooks (data-Attribute):
 *   [data-announcement]  Banner-Container (Text kommt in [data-announcement-text])
 *   [data-hours]         Öffnungszeiten-Liste (<dl>), der heutige Tag wird markiert
 *   [data-address]       Adresse   [data-maps]  Link zu Google Maps
 *   [data-phone] [data-email] [data-instagram] [data-instagram-handle] [data-menu-pdf] [data-year]
 * Test: ?now=2026-11-06 an die URL hängen, um ein anderes Datum zu simulieren.
 */
(function () {
  'use strict';
  var D = window.COTAM;
  if (!D) return;

  var root = new URL('..', document.currentScript.src); // Hauptordner der Website (Skript liegt in assets/)
  var menuUrl = new URL(D.menuPdf, root).href;

  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function fmt(hhmm) { return hhmm.replace(/^0/, '').replace(':00', ''); } // "11:00" -> "11", "17:30" -> "17:30"

  // Heutiges Datum und Wochentag in Europe/Berlin (oder ?now=JJJJ-MM-TT zum Testen)
  function berlinToday() {
    var q = new URLSearchParams(location.search).get('now');
    if (q) return { day: new Date(q).getDay(), date: q.slice(0, 10) };
    var parts = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    var get = function (type) { return (parts.find(function (p) { return p.type === type; }) || {}).value; };
    return {
      day: { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 }[get('weekday').replace('.', '')],
      date: get('year') + '-' + get('month') + '-' + get('day'),
    };
  }
  var today = berlinToday();

  // Ankündigung – ausgeblendet, wenn inaktiv oder nach dem Datum "until"
  var a = D.announcement;
  var showBanner = a && a.active && a.text && (!a.until || today.date <= a.until);
  each('[data-announcement]', function (el) {
    el.hidden = !showBanner;
    if (showBanner) (el.querySelector('[data-announcement-text]') || el).textContent = a.text;
  });

  // Öffnungszeiten
  each('[data-hours]', function (el) {
    el.innerHTML = '';
    D.hours.forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'hours-row';
      if (h.days.indexOf(today.day) !== -1) row.setAttribute('data-today', '');
      var dt = document.createElement('dt');
      dt.textContent = h.label;
      var dd = document.createElement('dd');
      if (h.slots.length) {
        h.slots.forEach(function (s) {
          var span = document.createElement('span');
          span.textContent = fmt(s[0]) + '–' + fmt(s[1]) + ' Uhr';
          dd.appendChild(span);
        });
      } else {
        dd.textContent = 'Ruhetag';
        row.setAttribute('data-closed', '');
      }
      row.appendChild(dt);
      row.appendChild(dd);
      el.appendChild(row);
    });
  });

  // Kontakt & Links
  var addr = D.address;
  each('[data-address]', function (el) {
    el.innerHTML = '';
    el.appendChild(document.createTextNode(addr.street));
    el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(addr.zip + ' ' + addr.city));
  });
  each('[data-maps]', function (el) { el.href = D.mapsUrl; });
  each('[data-instagram]', function (el) { el.href = D.instagram; });
  each('[data-instagram-handle]', function (el) { el.textContent = D.instagramHandle; });
  each('[data-menu-pdf]', function (el) { el.href = menuUrl; });
  each('[data-phone]', function (el) {
    if (D.phone) { el.textContent = D.phone; el.href = 'tel:' + D.phone.replace(/[^+\d]/g, ''); }
    else { el.textContent = 'Telefonnummer folgt'; el.removeAttribute('href'); el.setAttribute('data-missing', ''); }
  });
  each('[data-email]', function (el) {
    if (D.email) { el.textContent = D.email; el.href = 'mailto:' + D.email; }
    else { el.textContent = 'E-Mail-Adresse folgt'; el.removeAttribute('href'); el.setAttribute('data-missing', ''); }
  });
  each('[data-year]', function (el) { el.textContent = String(new Date().getFullYear()); });

  // Strukturierte Daten für Suchmaschinen (schema.org/Restaurant)
  var dayCodes = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var spec = [];
  D.hours.forEach(function (h) {
    h.slots.forEach(function (s) {
      spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days.map(function (d) { return dayCodes[d]; }), opens: s[0], closes: s[1] });
    });
  });
  var ld = {
    '@context': 'https://schema.org', '@type': 'Restaurant', name: D.name,
    servesCuisine: ['Vietnamesisch', 'Thailändisch'],
    address: { '@type': 'PostalAddress', streetAddress: addr.street, postalCode: addr.zip, addressLocality: addr.city, addressCountry: 'DE' },
    sameAs: [D.instagram], hasMenu: menuUrl, openingHoursSpecification: spec,
  };
  if (D.phone) ld.telephone = D.phone;
  if (D.email) ld.email = D.email;
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
})();
