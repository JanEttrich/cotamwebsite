/*
 * Cô Tâm – rendert gemeinsame Inhalte aus site-data.js in jedes Design.
 * Markup-Hooks (data-Attribute):
 *   [data-announcement]  Banner-Container (Text kommt in [data-announcement-text])
 *   [data-status]        Live-Status "Jetzt geöffnet" (setzt data-state="open|pause|closed")
 *   [data-hours]         Öffnungszeiten-Liste (<dl>)
 *   [data-address]       Adresse   [data-maps]  Link zu Google Maps
 *   [data-phone] [data-email] [data-instagram] [data-menu-pdf] [data-year]
 * Test: ?now=2026-11-06T12:30 an die URL hängen, um eine Uhrzeit zu simulieren.
 */
(function () {
  'use strict';
  var D = window.COTAM;
  if (!D) return;

  var root = new URL('..', document.currentScript.src); // Hauptordner der Website
  var DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function toMin(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function fmt(hhmm) { return hhmm.replace(/^0/, '').replace(':00', ''); } // "11:00" -> "11", "17:30" -> "17:30"
  function slotText(s) { return fmt(s[0]) + '–' + fmt(s[1]) + ' Uhr'; }

  // Aktuelle Zeit in Europe/Berlin (oder ?now=... zum Testen)
  function berlinNow() {
    var q = new URLSearchParams(location.search).get('now');
    if (q) { var t = new Date(q); return { day: t.getDay(), min: t.getHours() * 60 + t.getMinutes(), date: q.slice(0, 10) }; }
    var parts = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    var get = function (type) { return (parts.find(function (p) { return p.type === type; }) || {}).value; };
    var wd = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 }[get('weekday').replace('.', '')];
    return { day: wd, min: +get('hour') * 60 + +get('minute'), date: get('year') + '-' + get('month') + '-' + get('day') };
  }

  function slotsFor(day) {
    var g = D.hours.find(function (h) { return h.days.indexOf(day) !== -1; });
    return g ? g.slots : [];
  }

  function status(now) {
    var today = slotsFor(now.day);
    for (var i = 0; i < today.length; i++) {
      var a = toMin(today[i][0]), b = toMin(today[i][1]);
      if (now.min >= a && now.min < b) return { state: 'open', text: 'Jetzt geöffnet', detail: 'bis ' + fmt(today[i][1]) + ' Uhr' };
      if (now.min < a) {
        return i > 0
          ? { state: 'pause', text: 'Mittagspause', detail: 'ab ' + fmt(today[i][0]) + ' Uhr wieder geöffnet' }
          : { state: 'closed', text: 'Geschlossen', detail: 'öffnet heute um ' + fmt(today[i][0]) + ' Uhr' };
      }
    }
    for (var d = 1; d <= 7; d++) {
      var day = (now.day + d) % 7, s = slotsFor(day);
      if (s.length) {
        var when = d === 1 ? 'morgen' : DAY_NAMES[day];
        return { state: 'closed', text: 'Geschlossen', detail: 'öffnet ' + when + ' um ' + fmt(s[0][0]) + ' Uhr' };
      }
    }
    return { state: 'closed', text: 'Geschlossen', detail: '' };
  }

  var now = berlinNow();

  // Ankündigung
  var a = D.announcement;
  var showBanner = a && a.active && a.text && (!a.until || now.date <= a.until);
  $all('[data-announcement]').forEach(function (el) {
    if (!showBanner) { el.hidden = true; return; }
    var t = el.querySelector('[data-announcement-text]') || el;
    t.textContent = a.text;
    el.hidden = false;
  });

  // Live-Status
  var st = status(now);
  $all('[data-status]').forEach(function (el) {
    el.setAttribute('data-state', st.state);
    var t = el.querySelector('[data-status-text]'), d = el.querySelector('[data-status-detail]');
    if (t) t.textContent = st.text; else el.textContent = st.text + (st.detail ? ' – ' + st.detail : '');
    if (d) d.textContent = st.detail;
  });

  // Öffnungszeiten
  $all('[data-hours]').forEach(function (el) {
    var useShort = el.hasAttribute('data-hours-short');
    el.innerHTML = '';
    D.hours.forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'hours-row';
      if (h.days.indexOf(now.day) !== -1) row.setAttribute('data-today', '');
      var dt = document.createElement('dt');
      dt.textContent = useShort ? h.short : h.label;
      var dd = document.createElement('dd');
      if (h.slots.length) {
        h.slots.forEach(function (s, i) {
          var span = document.createElement('span');
          span.textContent = slotText(s);
          dd.appendChild(span);
        });
      } else {
        dd.textContent = 'Ruhetag';
        row.setAttribute('data-closed', '');
      }
      row.appendChild(dt); row.appendChild(dd);
      el.appendChild(row);
    });
  });

  // Kontakt & Links
  var addr = D.address;
  $all('[data-address]').forEach(function (el) {
    el.innerHTML = '';
    el.appendChild(document.createTextNode(addr.street));
    el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(addr.zip + ' ' + addr.city));
  });
  $all('[data-maps]').forEach(function (el) { el.href = D.mapsUrl; });
  $all('[data-instagram]').forEach(function (el) { el.href = D.instagram; });
  $all('[data-instagram-handle]').forEach(function (el) { el.textContent = D.instagramHandle; });
  $all('[data-menu-pdf]').forEach(function (el) { el.href = new URL(D.menuPdf, root).href; });
  $all('[data-phone]').forEach(function (el) {
    if (D.phone) { el.textContent = D.phone; if (el.tagName === 'A') el.href = 'tel:' + D.phone.replace(/[^+\d]/g, ''); }
    else { el.textContent = 'Telefonnummer folgt'; el.removeAttribute('href'); el.setAttribute('data-missing', ''); }
  });
  $all('[data-email]').forEach(function (el) {
    if (D.email) { el.textContent = D.email; if (el.tagName === 'A') el.href = 'mailto:' + D.email; }
    else { el.textContent = 'E-Mail-Adresse folgt'; el.removeAttribute('href'); el.setAttribute('data-missing', ''); }
  });
  $all('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  // Strukturierte Daten für Suchmaschinen
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
    sameAs: [D.instagram], hasMenu: new URL(D.menuPdf, root).href, openingHoursSpecification: spec,
  };
  if (D.phone) ld.telephone = D.phone;
  if (D.email) ld.email = D.email;
  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
})();
