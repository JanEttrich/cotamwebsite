/*
 * Cô Tâm – zentrale Daten der Website.
 * Hier (und nur hier) Öffnungszeiten, Kontakt und Ankündigungen pflegen.
 * Alle Designs lesen diese Datei.
 */
window.COTAM = {
  name: 'Cô Tâm',
  claim: 'Authentic Vietnamese and Thai Cuisine',

  address: {
    street: 'Karl-Marx-Straße 20',
    zip: '67655',
    city: 'Kaiserslautern',
  },
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=C%C3%B4+T%C3%A2m+Karl-Marx-Stra%C3%9Fe+20+67655+Kaiserslautern',

  // TODO: echte Telefonnummer und E-Mail eintragen (leer = "folgt" wird angezeigt)
  phone: '',          // z. B. '+49 631 1234567'
  email: '',          // z. B. 'hallo@co-tam-kl.de'
  instagram: 'https://www.instagram.com/cotam.kl/',
  instagramHandle: '@cotam.kl',

  // Pfad relativ zum Hauptordner der Website
  // TODO: komprimierte PDF (< 5 MB) aus Canva exportieren und hier verlinken
  menuPdf: 'resources/Speisekarte.pdf',

  /*
   * Öffnungszeiten. Wochentage: 1 = Montag … 6 = Samstag, 0 = Sonntag.
   * Tage, die nicht vorkommen, gelten als Ruhetag.
   */
  hours: [
    { label: 'Montag – Donnerstag', short: 'Mo – Do', days: [1, 2, 3, 4], slots: [['11:00', '15:00'], ['17:00', '21:00']] },
    { label: 'Freitag & Samstag', short: 'Fr & Sa', days: [5, 6], slots: [['11:00', '15:00'], ['17:00', '22:00']] },
    // TODO: Sonntag bestätigen
    { label: 'Sonntag', short: 'So', days: [0], slots: [] },
  ],

  /*
   * Ankündigungs-Banner (z. B. Betriebsurlaub).
   * active: true/false – until: letzter Tag, an dem der Banner sichtbar ist (JJJJ-MM-TT).
   */
  announcement: {
    active: true,
    text: 'Platz für Ankündigungen – z. B. „Betriebsurlaub vom 24.12. bis 01.01. – ab 02.01. sind wir wieder für Sie da.“',
    until: '2026-12-31',
  },
};
