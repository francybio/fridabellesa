/* ==========================================================
   FRIDA BELLESA — interacciones
   Telón FRIDA que corta el láser, carta de cápsulas que gira
   (el color indica la técnica), simulador de borrado y
   textos en ES / CA / EN.
   ========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const motion = hasGSAP && !reduced;
if (!motion) document.documentElement.classList.add('reduced');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (hasGSAP) {
  gsap.registerPlugin(ScrollTrigger);
  // ScrollTrigger guarda el valor previo ("auto") y lo repone en cada refresh
  ScrollTrigger.clearScrollMemory('manual');
}
const Laser = window.FridaLaser || { fire() {}, burst() {}, snap() {}, sync() {} };

/* ----------------------------------------------------------
   DATOS DEL NEGOCIO
   ---------------------------------------------------------- */
const WA_NUMBER = '34672874616';
// minutos desde medianoche · 0 = domingo
const HOURS = { 0: null, 1: [600, 1140], 2: [600, 1140], 3: [600, 1140], 4: [600, 1140], 5: [600, 1140], 6: null };

const FAM = {
  laser:   { es: 'Láser', ca: 'Làser', en: 'Laser' },
  micro:   { es: 'Micropigmentación', ca: 'Micropigmentació', en: 'Permanent make up' },
  mirada:  { es: 'Mirada y manos', ca: 'Mirada i mans', en: 'Eyes & hands' },
  cuidado: { es: 'Facial y corporal', ca: 'Facial i corporal', en: 'Face & body' }
};

const MICRO_META = { es: '1 sesión + retoque a las 4–6 semanas', ca: '1 sessió + retoc a les 4–6 setmanes', en: '1 session + touch-up after 4–6 weeks' };
const FEW = { es: '≈ 3–5 sesiones', ca: '≈ 3–5 sessions', en: '≈ 3–5 sessions' };

// la carta: cada cápsula es un tratamiento (s = etiqueta corta, n = nombre, d = descripción, m = sesiones o detalle)
const TREAT = [
  { fam: 'laser', icon: 'ph-lightning',
    s: { es: 'Tatuajes', ca: 'Tatuatges', en: 'Tattoos' },
    n: { es: 'Eliminación de tatuajes', ca: 'Eliminació de tatuatges', en: 'Tattoo removal' },
    d: { es: 'Tecnología láser que fragmenta la tinta sesión a sesión, para borrar o aclarar antes de un cover-up.', ca: 'Tecnologia làser que fragmenta la tinta sessió a sessió, per esborrar o aclarir abans d’un cover-up.', en: 'Laser technology that breaks up the ink session by session, to remove it or fade it before a cover-up.' },
    m: { es: '≈ 6–10 sesiones · cada 6–8 semanas', ca: '≈ 6–10 sessions · cada 6–8 setmanes', en: '≈ 6–10 sessions · every 6–8 weeks' } },
  { fam: 'micro', icon: 'ph-pen-nib',
    s: { es: 'Cejas', ca: 'Celles', en: 'Brows' },
    n: { es: 'Cejas pelo a pelo', ca: 'Celles pèl a pèl', en: 'Hair-stroke brows' },
    d: { es: 'Diseño previo a mano y trazos finos que imitan el pelo natural.', ca: 'Disseny previ a mà i traços fins que imiten el pèl natural.', en: 'A hand-drawn design first, then fine strokes that mimic natural hair.' },
    m: MICRO_META },
  { fam: 'mirada', icon: 'ph-eye-closed',
    n: { es: 'Pestañas', ca: 'Pestanyes', en: 'Lashes' },
    d: { es: 'Lifting, tinte y extensiones para una mirada intensa sin necesidad de máscara.', ca: 'Lifting, tint i extensions per a una mirada intensa sense necessitat de màscara.', en: 'Lift, tint and extensions for intense eyes without mascara.' },
    m: { es: 'Lifting · tinte · extensiones', ca: 'Lifting · tint · extensions', en: 'Lift · tint · extensions' } },
  { fam: 'cuidado', icon: 'ph-drop',
    s: { es: 'Facial', ca: 'Facial', en: 'Facial' },
    n: { es: 'Higiene facial', ca: 'Higiene facial', en: 'Deep facial' },
    d: { es: 'Limpieza profunda para una piel luminosa, con productos de primera calidad.', ca: 'Neteja profunda per a una pell lluminosa, amb productes de primera qualitat.', en: 'A deep cleanse for radiant skin, using top-quality products.' },
    m: { es: 'Limpieza · hidratación · luz', ca: 'Neteja · hidratació · llum', en: 'Cleanse · hydrate · glow' } },
  { fam: 'laser', icon: 'ph-feather',
    s: { es: 'Depilación', ca: 'Depilació', en: 'Hair removal' },
    n: { es: 'Depilación láser', ca: 'Depilació làser', en: 'Laser hair removal' },
    d: { es: 'Adiós al vello de forma progresiva y duradera, en cualquier zona del cuerpo.', ca: 'Adeu al pèl de manera progressiva i duradora, a qualsevol zona del cos.', en: 'Say goodbye to unwanted hair, progressively and for the long term, on any area.' },
    m: { es: '≈ 6–8 sesiones · cada 4–8 semanas', ca: '≈ 6–8 sessions · cada 4–8 setmanes', en: '≈ 6–8 sessions · every 4–8 weeks' } },
  { fam: 'micro', icon: 'ph-heart',
    n: { es: 'Labios', ca: 'Llavis', en: 'Lips' },
    d: { es: 'Color y contorno definidos con un acabado natural que dura.', ca: 'Color i contorn definits amb un acabat natural que dura.', en: 'Defined colour and contour with a natural, lasting finish.' },
    m: MICRO_META },
  { fam: 'mirada', icon: 'ph-hand',
    n: { es: 'Uñas', ca: 'Ungles', en: 'Nails' },
    d: { es: 'Manicura, pedicura y esmaltado semipermanente con un acabado impecable.', ca: 'Manicura, pedicura i esmaltat semipermanent amb un acabat impecable.', en: 'Manicure, pedicure and gel polish with a flawless finish.' },
    m: { es: 'Manicura · pedicura · semipermanente', ca: 'Manicura · pedicura · semipermanent', en: 'Manicure · pedicure · gel polish' } },
  { fam: 'cuidado', icon: 'ph-flower-lotus',
    s: { es: 'Corporal', ca: 'Corporal', en: 'Body' },
    n: { es: 'Corporal y masajes', ca: 'Corporal i massatges', en: 'Body & massage' },
    d: { es: 'Maderoterapia y masajes para cuidar cuerpo y mente.', ca: 'Maderoteràpia i massatges per cuidar cos i ment.', en: 'Wood therapy and massages for body and mind.' },
    m: { es: 'Maderoterapia · masaje', ca: 'Maderoteràpia · massatge', en: 'Wood therapy · massage' } },
  { fam: 'laser', icon: 'ph-sparkle',
    n: { es: 'Carbon Peel', ca: 'Carbon Peel', en: 'Carbon Peel' },
    d: { es: 'El peeling de Hollywood: poros afinados y una piel uniforme y luminosa desde la primera sesión.', ca: 'El peeling de Hollywood: porus afinats i una pell uniforme i lluminosa des de la primera sessió.', en: 'The Hollywood peel: refined pores and even, glowing skin from the very first session.' },
    m: FEW },
  { fam: 'micro', icon: 'ph-eye',
    n: { es: 'Eyeliner', ca: 'Eyeliner', en: 'Eyeliner' },
    d: { es: 'Una línea fina que realza tu mirada desde que te despiertas.', ca: 'Una línia fina que realça la teva mirada des que et despertes.', en: 'A fine line that defines your eyes from the moment you wake up.' },
    m: MICRO_META },
  { fam: 'laser', icon: 'ph-sun',
    s: { es: 'Manchas', ca: 'Taques', en: 'Spots' },
    n: { es: 'Manchas', ca: 'Taques', en: 'Pigmentation' },
    d: { es: 'Láser para atenuar manchas solares y de la edad y devolver a tu piel un tono homogéneo.', ca: 'Làser per atenuar taques solars i de l’edat i retornar a la teva pell un to homogeni.', en: 'Laser to fade sun and age spots and bring back an even skin tone.' },
    m: FEW },
  { fam: 'micro', icon: 'ph-dots-nine',
    s: { es: 'Trico', ca: 'Trico', en: 'Scalp' },
    n: { es: 'Tricopigmentación', ca: 'Tricopigmentació', en: 'Scalp pigmentation' },
    d: { es: 'Efecto de densidad o de cabello rasurado para disimular las zonas con menos pelo.', ca: 'Efecte de densitat o de cabell rapat per dissimular les zones amb menys cabell.', en: 'A density or shaved-look effect to conceal thinning areas.' },
    m: { es: 'Sesiones según valoración', ca: 'Sessions segons valoració', en: 'Sessions set after assessment' } }
];

/* ----------------------------------------------------------
   TEXTOS DINÁMICOS
   ---------------------------------------------------------- */
const STR = {
  es: {
    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    open: t => `Abierto ahora · hasta las ${t}`,
    closedToday: t => `Cerrado · abre hoy a las ${t}`,
    closedTomorrow: t => `Cerrado · abre mañana a las ${t}`,
    closedDay: (d, t) => `Cerrado · abre el ${d.toLowerCase()} a las ${t}`,
    closed: 'Cerrado',
    wa: 'Hola Frida Bellesa, me gustaría pedir cita.',
    waTreat: n => `Hola Frida Bellesa, me interesa: ${n}. ¿Podemos concertar una cita?`,
    waLab: n => `Hola Frida Bellesa, me gustaría pedir una valoración para eliminar un tatuaje (${n}).`,
    services: 'Servicios', book: 'Pedir cita',
    lab: {
      before: 'Antes del tratamiento', pct: p => `Aclarado ≈ ${p}%`,
      months: n => `≈ ${n} ${n === 1 ? 'mes' : 'meses'}`, label: 'Tatuaje',
      stages: [
        'Antes de empezar valoramos el tipo de tinta, la profundidad y tu fototipo.',
        'Las primeras sesiones rompen las capas más superficiales del pigmento.',
        'La tinta se fragmenta y tu cuerpo la va eliminando: el aclarado ya es visible.',
        'Quedan restos dispersos: el momento ideal si buscas un cover-up.',
        'Piel prácticamente limpia. Los colores como el verde son los más resistentes.'
      ]
    }
  },
  ca: {
    days: ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'],
    open: t => `Obert ara · fins a les ${t}`,
    closedToday: t => `Tancat · obre avui a les ${t}`,
    closedTomorrow: t => `Tancat · obre demà a les ${t}`,
    closedDay: (d, t) => `Tancat · obre ${d.toLowerCase()} a les ${t}`,
    closed: 'Tancat',
    wa: 'Hola Frida Bellesa, m’agradaria demanar cita.',
    waTreat: n => `Hola Frida Bellesa, m’interessa: ${n}. Podem concertar una cita?`,
    waLab: n => `Hola Frida Bellesa, m’agradaria demanar una valoració per eliminar un tatuatge (${n}).`,
    services: 'Serveis', book: 'Demanar cita',
    lab: {
      before: 'Abans del tractament', pct: p => `Aclarit ≈ ${p}%`,
      months: n => `≈ ${n} ${n === 1 ? 'mes' : 'mesos'}`, label: 'Tatuatge',
      stages: [
        'Abans de començar valorem el tipus de tinta, la profunditat i el teu fototip.',
        'Les primeres sessions trenquen les capes més superficials del pigment.',
        'La tinta es fragmenta i el teu cos la va eliminant: l’aclariment ja és visible.',
        'Queden restes disperses: el moment ideal si busques un cover-up.',
        'Pell pràcticament neta. Els colors com el verd són els més resistents.'
      ]
    }
  },
  en: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    open: t => `Open now · until ${t}`,
    closedToday: t => `Closed · opens today at ${t}`,
    closedTomorrow: t => `Closed · opens tomorrow at ${t}`,
    closedDay: (d, t) => `Closed · opens ${d} at ${t}`,
    closed: 'Closed',
    wa: 'Hi Frida Bellesa, I’d like to book an appointment.',
    waTreat: n => `Hi Frida Bellesa, I’m interested in: ${n}. Could we book an appointment?`,
    waLab: n => `Hi Frida Bellesa, I’d like to book a tattoo removal consultation (${n}).`,
    services: 'Services', book: 'Book now',
    lab: {
      before: 'Before treatment', pct: p => `≈ ${p}% faded`,
      months: n => `≈ ${n} month${n === 1 ? '' : 's'}`, label: 'Tattoo',
      stages: [
        'Before we start, we assess the ink type, depth and your skin type.',
        'The first sessions break up the most superficial layers of pigment.',
        'The ink shatters and your body clears it away: the fading is now visible.',
        'Only scattered traces remain: the perfect moment for a cover-up.',
        'Skin practically clear. Colours such as green are the most stubborn.'
      ]
    }
  }
};

// velocidad a la que se aclara cada tinta (el negro es el que mejor responde)
const INK_RATE = { k: .42, r: .3, y: .26, g: .17 };
const DESIGNS = {
  vida:    { w: { k: 1 }, burst: ['#16100f'] },
  corazon: { w: { k: .3, r: .35, y: .15, g: .2 }, burst: ['#C2232F', '#16100f', '#F2B233', '#2E7A4E'] },
  mandala: { w: { k: 1 }, burst: ['#16100f'] }
};

/* ----------------------------------------------------------
   TRADUCCIONES DE LA PÁGINA (ES = HTML original)
   ---------------------------------------------------------- */
const I18N = {
  ca: {
    'nav.carta': 'Serveis', 'nav.micro': 'Micropigmentació', 'nav.laser': 'Làser', 'nav.sim': 'Simulador', 'nav.studio': 'Estudi', 'nav.visit': 'Visita’ns',
    'cta.book': 'Demanar cita', 'cta.bookLong': 'Demanar cita per WhatsApp', 'cta.carta': 'Veure serveis', 'cta.sim': 'Provar el simulador', 'cta.route': 'Com arribar-hi',
    'hero.eyebrow': 'Permanent make up · Làser · Estètica — Lloret de Mar',
    'hero.l1': 'El que estimes, es queda.', 'hero.l2': 'La resta, l’esborrem.',
    'hero.lead': 'Dissenyem la teva mirada, esborrem el que ja no et representa i cuidem la teva pell amb tecnologia d’última generació.',
    'hero.hours': 'Dilluns a divendres · 10:00 a 19:00',
    'hero.hint': 'Fes clic a qualsevol text: el nostre làser l’esborra', 'hero.hintTouch': 'Toca qualsevol text: el nostre làser l’esborra',
    'hero.reviews': '18 opinions a Google',
    'c.title': 'Els nostres <em>serveis</em>.',
    'c.lead': 'Cada pètal de la flor és un tractament i el seu color indica la tècnica. Passa el cursor per la flor per aturar-la i toca un pètal per veure’n els detalls.',
    'c.note': 'Sessions i durades orientatives: les ajustem amb tu en una valoració personal.',
    'fam.laser': 'Làser', 'fam.micro': 'Micropigmentació', 'fam.mirada': 'Mirada i mans', 'fam.cuidado': 'Facial i corporal',
    'm.title': 'Micropigmentació',
    'm.lead': 'Dibuixem cada traç sobre el teu rostre abans de començar. Mesurem, proposem i només pigmentem quan t’encanta.',
    'm.1.t': 'Celles pèl a pèl', 'm.1.d': 'Disseny previ a mà i traços fins que imiten el pèl natural.',
    'm.2.t': 'Llavis', 'm.2.d': 'Color i contorn definits amb un acabat natural que dura.',
    'm.3.t': 'Eyeliner', 'm.3.d': 'Una línia fina que realça la teva mirada des que et despertes.',
    'm.meta': '1 sessió + retoc',
    'l.title': 'Làser, sessió a sessió.',
    'l.lead': 'Esborrem tatuatges, eliminem el pèl i unifiquem el to de la teva pell amb paràmetres adaptats al teu fototip.',
    'svc.1.t': 'Eliminació de tatuatges', 'svc.3.t': 'Depilació làser', 'svc.4.t': 'Carbon Peel', 'svc.5.t': 'Taques',
    'l.unit': 'Nombre orientatiu de sessions: el confirmem a la teva valoració.',
    'lab.title': 'Mira com s’<em>esvaeix</em>.',
    'lab.lead': 'Cada sessió fragmenta la tinta en partícules diminutes que el teu cos elimina de manera natural. Tria un tatuatge, mou el control o dispara directament sobre la pell.',
    'lab.d1': 'Viva la vida', 'lab.d1s': 'Lettering · negre', 'lab.d2': 'Sagrat cor', 'lab.d2s': 'Color · tradicional', 'lab.d3': 'Mandala', 'lab.d3s': 'Línia fina · dotwork',
    'lab.hold': 'Mantén premut per veure l’abans', 'lab.badge': 'Simulació orientativa', 'lab.tip': 'Dispara sobre el tatuatge',
    'lab.sessions': 'Sessions', 'lab.f1': 'Interval', 'lab.f1v': '6–8 setmanes', 'lab.f2': 'Per sessió', 'lab.f2v': '10–30 min', 'lab.f3': 'Temps total', 'lab.cta': 'Demana la teva valoració',
    'std.title': 'Precisió tècnica, <em>tracte de casa</em>.',
    'man.text': 'A Frida creiem que la teva pell explica la teva història, i que tu decideixes com s’escriu. Dissenyem celles, llavis i mirades que t’acompanyen cada matí, i amb tecnologia làser esborrem el que ja no et representa. Tot en un estudi proper, on et sentiràs com a casa.',
    'std.1.t': 'Disseny a mida', 'std.1.d': 'Cada cella, cada llavi i cada línia es dibuixa abans sobre el teu rostre. Mesurem, proposem i només comencem quan t’encanta.',
    'std.2.t': 'Tecnologia làser', 'std.2.d': 'Equips actuals per eliminar tatuatges, pèl i taques amb resultats progressius, adaptats a la teva pell.',
    'std.3.t': 'Higiene sense concessions', 'std.3.d': 'Material d’un sol ús, protocols estrictes de neteja i productes de primera qualitat a cada tractament.',
    'std.4.t': 'Com a casa', 'std.4.d': 'Un espai proper i tranquil. Les nostres clientes ho repeteixen: aquí et sents còmoda des del primer minut.',
    'rev.title': 'Clientes que hi tornen.', 'rev.count': '18 opinions a Google', 'rev.note': 'Opinions reals publicades a Google Maps (en castellà).',
    'v.h': 'Horari', 'v.h.v': 'Dilluns a divendres, de 10:00 a 19:00<br>Dissabte i diumenge, tancat', 'v.r': 'Cites', 'v.only': 'Només per WhatsApp', 'v.a': 'Adreça',
    'foot.tag': 'Permanent make up, làser i estètica'
  },
  en: {
    'nav.carta': 'Services', 'nav.micro': 'Permanent make up', 'nav.laser': 'Laser', 'nav.sim': 'Simulator', 'nav.studio': 'Studio', 'nav.visit': 'Visit us',
    'cta.book': 'Book now', 'cta.bookLong': 'Book via WhatsApp', 'cta.carta': 'See services', 'cta.sim': 'Try the simulator', 'cta.route': 'Get directions',
    'hero.eyebrow': 'Permanent make up · Laser · Aesthetics — Lloret de Mar',
    'hero.l1': 'What you love, stays.', 'hero.l2': 'The rest, we erase.',
    'hero.lead': 'We design your look, erase what no longer represents you and care for your skin with state-of-the-art technology.',
    'hero.hours': 'Monday to Friday · 10:00 to 19:00',
    'hero.hint': 'Click any text: our laser erases it', 'hero.hintTouch': 'Tap any text: our laser erases it',
    'hero.reviews': '18 Google reviews',
    'c.title': 'Our <em>services</em>.',
    'c.lead': 'Each petal of the flower is a treatment and its colour shows the technique. Hover over the flower to stop it and tap a petal to see the details.',
    'c.note': 'Sessions and timings are approximate: we fine-tune them with you in a personal consultation.',
    'fam.laser': 'Laser', 'fam.micro': 'Permanent make up', 'fam.mirada': 'Eyes & hands', 'fam.cuidado': 'Face & body',
    'm.title': 'Permanent make up',
    'm.lead': 'We draw every stroke on your face before we begin. We measure, we suggest, and we only start once you love it.',
    'm.1.t': 'Hair-stroke brows', 'm.1.d': 'A hand-drawn design first, then fine strokes that mimic natural hair.',
    'm.2.t': 'Lips', 'm.2.d': 'Defined colour and contour with a natural, lasting finish.',
    'm.3.t': 'Eyeliner', 'm.3.d': 'A fine line that defines your eyes from the moment you wake up.',
    'm.meta': '1 session + touch-up',
    'l.title': 'Laser, session by session.',
    'l.lead': 'We remove tattoos and unwanted hair and even out your skin tone, with settings tailored to your skin type.',
    'svc.1.t': 'Tattoo removal', 'svc.3.t': 'Laser hair removal', 'svc.4.t': 'Carbon Peel', 'svc.5.t': 'Pigmentation',
    'l.unit': 'Approximate number of sessions, confirmed at your consultation.',
    'lab.title': 'Watch it <em>fade</em>.',
    'lab.lead': 'Each session shatters the ink into tiny particles that your body clears naturally. Pick a tattoo, move the slider or fire straight at the skin.',
    'lab.d1': 'Viva la vida', 'lab.d1s': 'Lettering · black', 'lab.d2': 'Sacred heart', 'lab.d2s': 'Colour · traditional', 'lab.d3': 'Mandala', 'lab.d3s': 'Fine line · dotwork',
    'lab.hold': 'Press and hold to see the before', 'lab.badge': 'Approximate preview', 'lab.tip': 'Fire at the tattoo',
    'lab.sessions': 'Sessions', 'lab.f1': 'Interval', 'lab.f1v': '6–8 weeks', 'lab.f2': 'Per session', 'lab.f2v': '10–30 min', 'lab.f3': 'Total time', 'lab.cta': 'Book a consultation',
    'std.title': 'Technical precision, <em>homely care</em>.',
    'man.text': 'At Frida we believe your skin tells your story, and that you decide how it is written. We design brows, lips and eyes that are with you every morning, and with laser technology we erase what no longer represents you. All in a warm studio where you will feel at home.',
    'std.1.t': 'Bespoke design', 'std.1.d': 'Every brow, lip and line is drawn on your face first. We measure, we suggest, and we only start once you love it.',
    'std.2.t': 'Laser technology', 'std.2.d': 'Modern equipment to remove tattoos, hair and spots with progressive results, tailored to your skin.',
    'std.3.t': 'Uncompromising hygiene', 'std.3.d': 'Single-use materials, strict cleaning protocols and top-quality products in every treatment.',
    'std.4.t': 'Just like home', 'std.4.d': 'A warm, quiet space. Our clients all say it: you feel comfortable from the very first minute.',
    'rev.title': 'Clients who keep coming back.', 'rev.count': '18 Google reviews', 'rev.note': 'Real reviews published on Google Maps (in Spanish).',
    'v.h': 'Opening hours', 'v.h.v': 'Monday to Friday, 10:00 to 19:00<br>Saturday and Sunday, closed', 'v.r': 'Appointments', 'v.only': 'WhatsApp only', 'v.a': 'Address',
    'foot.tag': 'Permanent make up, laser & aesthetics'
  }
};

/* ----------------------------------------------------------
   IDIOMA
   ---------------------------------------------------------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
};
const originals = new Map();
$$('[data-i18n]').forEach(el => originals.set(el, el.innerHTML));

let lang = store.get('fb-lang');
if (!['es', 'ca', 'en'].includes(lang)) {
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  lang = nav === 'ca' ? 'ca' : nav === 'en' ? 'en' : 'es';
}
const fmtNum = n => lang === 'en' ? String(n) : String(n).replace('.', ',');
const waLink = msg => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

function applyLang(l, init = false) {
  lang = l;
  document.documentElement.lang = l;
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = l === 'es' ? originals.get(el) : (I18N[l] && I18N[l][key]) || originals.get(el);
    if (el.innerHTML !== val) el.innerHTML = val;
  });
  $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l ? 'true' : 'false'));
  $$('[data-num]').forEach(el => { el.textContent = fmtNum(el.dataset.num); });
  $$('[data-wa]').forEach(a => { a.href = waLink(STR[l].wa); });
  renderStatus();
  renderLab();
  labelPetals();
  showPick(picked, false);
  Laser.sync();
  if (!init) {
    store.set('fb-lang', l);
    if (hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  }
}
$$('[data-lang]').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ----------------------------------------------------------
   HORARIO · ABIERTO AHORA
   ---------------------------------------------------------- */
function madridNow() {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const o = {}; parts.forEach(p => { o[p.type] = p.value; });
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), min: (+o.hour % 24) * 60 + (+o.minute) };
  } catch (e) {
    const d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
  }
}
const fmtTime = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

function getStatus() {
  const { day, min } = madridNow(); const s = STR[lang]; const h = HOURS[day];
  if (h && min >= h[0] && min < h[1]) return { open: true, text: s.open(fmtTime(h[1])) };
  if (h && min < h[0]) return { open: false, text: s.closedToday(fmtTime(h[0])) };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (HOURS[d]) return { open: false, text: i === 1 ? s.closedTomorrow(fmtTime(HOURS[d][0])) : s.closedDay(s.days[d], fmtTime(HOURS[d][0])) };
  }
  return { open: false, text: s.closed };
}
function renderStatus() {
  const st = getStatus();
  $$('[data-status]').forEach(el => {
    el.classList.toggle('is-open', st.open);
    $('.status__text', el).textContent = st.text;
  });
}
setInterval(renderStatus, 60000);

/* ----------------------------------------------------------
   SERVICIOS · la flor: cada pétalo es un tratamiento
   Gira despacio, los pétalos respiran, florece al entrar en
   pantalla y por detrás caen pétalos sueltos.
   ---------------------------------------------------------- */
const NS = 'http://www.w3.org/2000/svg';
const flower = $('#flower');
const fSvg = $('.flora__svg', flower);
const fBtns = $('.flora__btns', flower);
const fCore = $('.flora__core', flower);
const pickBox = $('#pick');
const STEP = 360 / TREAT.length;
const PETAL = 'M0 -136 C 62 -200, 94 -330, 0 -490 C -94 -330, -62 -200, 0 -136 Z';
const VEIN = 'M0 -170 C 7 -260, 7 -380, 0 -455';
const LEAF = 'M0 -290 C 46 -340, 56 -415, 0 -482 C -56 -415, -46 -340, 0 -290 Z';
const TONES = { laser: ['#E0305B', '#FF9DB5'], micro: ['#8F5236', '#DDA67F'], mirada: ['#7F6CD6', '#D8CEFF'], cuidado: ['#BFA9A4', '#FCF5F3'] };
const BTN_R = 330;   // radio (unidades del SVG) donde se coloca el icono de cada pétalo
const ROT_SPEED = 3; // grados por segundo

const svgEl = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k]));
  if (parent) parent.appendChild(n);
  return n;
};

const fDefs = svgEl('defs', {}, fSvg);
Object.keys(TONES).forEach(f => {
  const g = svgEl('linearGradient', { id: `pg-${f}`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: -136, x2: 0, y2: -490 }, fDefs);
  svgEl('stop', { offset: 0, 'stop-color': TONES[f][0] }, g);
  svgEl('stop', { offset: 1, 'stop-color': TONES[f][1] }, g);
});
const leafGrad = svgEl('linearGradient', { id: 'lg', gradientUnits: 'userSpaceOnUse', x1: 0, y1: -290, x2: 0, y2: -482 }, fDefs);
svgEl('stop', { offset: 0, 'stop-color': '#1E3B30' }, leafGrad);
svgEl('stop', { offset: 1, 'stop-color': '#4C8063' }, leafGrad);
const discGrad = svgEl('radialGradient', { id: 'dg', cx: 0, cy: 0, r: 160, gradientUnits: 'userSpaceOnUse' }, fDefs);
svgEl('stop', { offset: 0, 'stop-color': '#3D2733' }, discGrad);
svgEl('stop', { offset: 1, 'stop-color': '#160D12' }, discGrad);

// pétalos sueltos que caen por detrás
const fFall = svgEl('g', {}, fSvg);
const tones = Object.keys(TONES);
const falling = Array.from({ length: 9 }, (_, i) => ({
  el: svgEl('path', { d: PETAL, fill: `url(#pg-${tones[i % 4]})`, opacity: .5 }, fFall),
  x: -470 + i * 117 + (i % 2 ? 30 : -20), speed: 38 + (i * 13) % 34, off: (i * 397) % 1200,
  ph: i * 1.7, spin: (i % 2 ? 1 : -1) * (20 + i * 4), s: .09 + (i % 3) * .025
}));

const fRot = svgEl('g', {}, fSvg);
const fLeaves = svgEl('g', {}, fRot);
const leaves = TREAT.map(() => svgEl('path', { d: LEAF, fill: 'url(#lg)' }, fLeaves));
const fPetals = svgEl('g', {}, fRot);
const petals = TREAT.map((t, i) => {
  const g = svgEl('g', { class: 'petal', 'data-i': i }, fPetals);
  svgEl('path', { class: 'petal__shape', d: PETAL, fill: `url(#pg-${t.fam})` }, g);
  svgEl('path', { d: VEIN, fill: 'none', stroke: 'rgba(18,11,15,.16)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
  return g;
});
const fDisc = svgEl('g', {}, fRot);
svgEl('circle', { r: 150, fill: 'url(#dg)', stroke: 'rgba(232,181,157,.35)', 'stroke-width': 2 }, fDisc);
for (let i = 0; i < 32; i++) {
  const a = i / 32 * Math.PI * 2;
  svgEl('circle', { cx: (Math.cos(a) * 124).toFixed(1), cy: (Math.sin(a) * 124).toFixed(1), r: 4.2, fill: '#E8B59D', opacity: .85 }, fDisc);
}
for (let i = 0; i < 20; i++) {
  const a = (i + .5) / 20 * Math.PI * 2;
  svgEl('circle', { cx: (Math.cos(a) * 100).toFixed(1), cy: (Math.sin(a) * 100).toFixed(1), r: 2.6, fill: '#FF4D79', opacity: .7 }, fDisc);
}

const pBtns = TREAT.map((t, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'petal-btn';
  b.dataset.i = i;
  b.innerHTML = `<i class="ph-light ${t.icon}" aria-hidden="true"></i><small></small>`;
  b.addEventListener('mouseenter', () => petals[i].classList.add('is-hover'));
  b.addEventListener('mouseleave', () => petals[i].classList.remove('is-hover'));
  fBtns.appendChild(b);
  return b;
});

let picked = 0;
let angle = 0, fPaused = false, fVisible = false, fRunning = false, fLast = 0, fSize = 0;
let bloomT0 = motion ? null : -1e9;
const easeBack = p => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const bloomAt = (now, delay, dur) => bloomT0 === null ? 0 : easeBack(clamp((now - bloomT0 - delay) / dur));

function drawFlower(now) {
  const t = now / 1000;
  const live = motion ? 1 : 0;
  const k = fSize / 1000, c = fSize / 2;
  fRot.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
  fDisc.setAttribute('transform', `scale(${bloomAt(now, 0, 700).toFixed(4)})`);
  leaves.forEach((p, i) => {
    const b = bloomAt(now, 450 + i * 40, 1100);
    p.setAttribute('transform', `rotate(${(i * STEP + STEP / 2 + Math.sin(t * .8 + i) * 2.4 * live).toFixed(2)}) scale(${b.toFixed(4)})`);
  });
  petals.forEach((g, i) => {
    const b = bloomAt(now, 120 + i * 75, 1000);
    const sway = Math.sin(t * 1.05 + i * .9) * 1.5 * live;
    const s = b * (i === picked ? 1.06 : 1) * (1 + Math.sin(t * 1.4 + i) * .016 * live);
    g.setAttribute('transform', `rotate(${(i * STEP + sway).toFixed(2)}) scale(${s.toFixed(4)})`);
    const th = (angle + i * STEP + sway) * Math.PI / 180;
    const r = BTN_R * s * k;
    pBtns[i].style.transform = `translate3d(${(c + r * Math.sin(th)).toFixed(1)}px,${(c - r * Math.cos(th)).toFixed(1)}px,0) scale(${clamp(b).toFixed(3)})`;
  });
  falling.forEach(f => {
    if (!live) { f.el.setAttribute('opacity', 0); return; }
    const y = ((t * f.speed + f.off) % 1200) - 600;
    const x = f.x + Math.sin(t * .7 + f.ph) * 34;
    f.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(t * f.spin + f.ph * 40).toFixed(1)}) scale(${f.s})`);
  });
}
function flowerLoop(now) {
  const dt = fLast ? Math.min(.05, (now - fLast) / 1000) : 0;
  fLast = now;
  if (!fPaused) angle = (angle + ROT_SPEED * dt) % 360;
  drawFlower(now);
  if (fVisible) requestAnimationFrame(flowerLoop);
  else { fRunning = false; fLast = 0; }
}
function measureFlower() {
  fSize = flower.clientWidth;
  drawFlower(performance.now());
}
if (motion && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => {
    fVisible = e.isIntersecting;
    if (e.intersectionRatio >= .3 && bloomT0 === null) bloomT0 = performance.now();
    if (fVisible && !fRunning) { fRunning = true; requestAnimationFrame(flowerLoop); }
  }, { threshold: [0, .3] }).observe(flower);
} else {
  bloomT0 = -1e9;
}
flower.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') fPaused = true; });
flower.addEventListener('pointerleave', () => { fPaused = false; });
flower.addEventListener('focusin', () => { fPaused = true; });
flower.addEventListener('focusout', () => { fPaused = false; });
flower.addEventListener('click', e => {
  const hit = e.target.closest('.petal-btn, .petal');
  if (hit) showPick(+hit.getAttribute('data-i'));
});

function labelPetals() {
  pBtns.forEach((b, i) => {
    const t = TREAT[i];
    $('small', b).textContent = (t.s || t.n)[lang];
    b.setAttribute('aria-label', `${t.n[lang]} · ${FAM[t.fam][lang]}`);
  });
  fBtns.setAttribute('aria-label', STR[lang].services);
}

function showPick(i, animate = true) {
  picked = i;
  petals.forEach((g, k) => g.classList.toggle('is-on', k === i));
  pBtns.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
  const s = STR[lang];
  const t = TREAT[i];
  const n = t.n[lang];
  fCore.className = `flora__core fam--${t.fam}`;
  fCore.innerHTML = `<i class="ph-light ${t.icon}"></i><small>${(t.s || t.n)[lang]}</small>`;
  pickBox.innerHTML = `<div class="pick__card fam--${t.fam}">
    <p class="pick__cat">${FAM[t.fam][lang]}</p>
    <p class="pick__name">${n}</p>
    <p class="pick__desc">${t.d[lang]}</p>
    <p class="pick__meta">${t.m[lang]}</p>
    <a class="btn btn--laser btn--sm" href="${waLink(s.waTreat(n))}" target="_blank" rel="noopener">${s.book}</a>
  </div>`;
  if (!motion) drawFlower(performance.now());
  if (animate && motion) {
    gsap.from('.pick__card > *', { y: 14, opacity: 0, filter: 'blur(4px)', duration: .5, ease: 'expo.out', stagger: .05 });
    gsap.from(fCore.children, { scale: .4, opacity: 0, duration: .6, ease: 'back.out(2)', stagger: .05 });
  }
}

/* ----------------------------------------------------------
   SIMULADOR LÁSER
   ---------------------------------------------------------- */
const labImg = $('#labImg');
const labStage = $('.lab__stage');
const labRange = $('#labRange');
const erodeFn = $('#erodeFn');
const erodeBlur = $('#erodeBlur');
const frost = $('.lab__frost');
const lab = { design: 'vida', s: 0, v: 0 };

(function buildMandala() {
  const g = $('#mandalaInk'); if (!g) return;
  const NS = 'http://www.w3.org/2000/svg', C = '#16100f';
  const add = attrs => { const el = document.createElementNS(NS, attrs.tag); delete attrs.tag; Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k])); g.appendChild(el); };
  add({ tag: 'circle', r: 5, fill: C });
  add({ tag: 'circle', r: 13, fill: 'none', stroke: C, 'stroke-width': 1.4 });
  for (let i = 0; i < 8; i++) add({ tag: 'path', d: 'M0 -15 C 6 -24, 6 -34, 0 -42 C -6 -34, -6 -24, 0 -15 Z', fill: C, transform: `rotate(${i * 45})` });
  for (let i = 0; i < 8; i++) add({ tag: 'path', d: 'M0 -18 L0 -38', stroke: C, 'stroke-width': .8, transform: `rotate(${i * 45 + 22.5})` });
  add({ tag: 'circle', r: 46, fill: 'none', stroke: C, 'stroke-width': 1.3 });
  for (let i = 0; i < 16; i++) add({ tag: 'path', d: 'M0 -47 C 9 -56, 9 -70, 0 -80 C -9 -70, -9 -56, 0 -47 Z', fill: 'none', stroke: C, 'stroke-width': 1.3, transform: `rotate(${i * 22.5 + 11.25})` });
  for (let i = 0; i < 16; i++) add({ tag: 'circle', cx: 0, cy: -62, r: 1.7, fill: C, transform: `rotate(${i * 22.5 + 11.25})` });
  add({ tag: 'circle', r: 84, fill: 'none', stroke: C, 'stroke-width': 1.1, 'stroke-dasharray': '1 4', 'stroke-linecap': 'round' });
  for (let i = 0; i < 32; i++) add({ tag: 'circle', cx: 0, cy: -92, r: i % 2 ? 1.4 : 2.5, fill: C, transform: `rotate(${i * 11.25})` });
  // sombreado en puntos (dotwork)
  for (let i = 0; i < 140; i++) {
    const a = Math.random() * Math.PI * 2, rr = 17 + Math.pow(Math.random(), .7) * 27;
    add({ tag: 'circle', cx: (Math.cos(a) * rr).toFixed(1), cy: (Math.sin(a) * rr).toFixed(1), r: (.45 + Math.random() * .7).toFixed(2), fill: C });
  }
})();

// v = sesiones (continuo, para animar entre valores)
function applyInk(v) {
  if (!labImg) return;
  $$('.ink', labImg).forEach(g => {
    const type = (g.className.baseVal.match(/ink--(\w)/) || [])[1] || 'k';
    g.style.opacity = Math.exp(-INK_RATE[type] * v).toFixed(3);
  });
  erodeFn.setAttribute('intercept', (1 - v * .5).toFixed(3));
  erodeBlur.setAttribute('stdDeviation', (.45 + v * .12).toFixed(2));
}
function fadedPct(design, s) {
  const w = DESIGNS[design].w;
  let left = 0;
  Object.keys(w).forEach(k => { left += w[k] * Math.exp(-INK_RATE[k] * s * 1.15); });
  return Math.round((1 - left) * 100);
}
function renderLab() {
  if (!labImg) return;
  const L = STR[lang].lab;
  const s = lab.s;
  $$('[data-design]', labImg).forEach(g => g.classList.toggle('is-on', g.dataset.design === lab.design));
  $$('.design').forEach(b => b.setAttribute('aria-checked', b.dataset.d === lab.design ? 'true' : 'false'));
  $('.lab__index').textContent = `${String(s).padStart(2, '0')} / 10`;
  $('.lab__name').textContent = s === 0 ? L.before : L.pct(fadedPct(lab.design, s));
  const stage = s === 0 ? 0 : s <= 2 ? 1 : s <= 5 ? 2 : s <= 8 ? 3 : 4;
  $('.lab__desc').textContent = L.stages[stage];
  $('.lab__months').textContent = s === 0 ? '—' : L.months(Math.max(1, Math.round(s * 7 / 4.35)));
  labRange.value = s;
  labRange.style.setProperty('--p', `${s * 10}%`);
  const name = $(`.design[data-d="${lab.design}"] b`);
  $('#labCta').href = waLink(STR[lang].waLab(name ? name.textContent : L.label));
}
function setSessions(s, animate = true) {
  lab.s = clamp(Math.round(s), 0, 10);
  renderLab();
  if (animate && motion) gsap.to(lab, { v: lab.s, duration: .9, ease: 'power2.out', overwrite: true, onUpdate: () => applyInk(lab.v) });
  else { lab.v = lab.s; applyInk(lab.v); }
}
if (labImg) {
  labRange.addEventListener('input', () => setSessions(+labRange.value));
  $$('.design').forEach(b => b.addEventListener('click', () => { lab.design = b.dataset.d; setSessions(0); }));

  // disparar sobre la piel = una sesión más
  labStage.addEventListener('click', e => {
    if (e.target.closest('.lab__hold')) return;
    const r = labImg.getBoundingClientRect();
    frost.style.setProperty('--fx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    frost.style.setProperty('--fy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    frost.classList.remove('is-on'); void frost.offsetWidth; frost.classList.add('is-on');
    if (lab.s < 10) Laser.burst(e.clientX, e.clientY, DESIGNS[lab.design].burst, 70);
    setSessions(lab.s >= 10 ? 0 : lab.s + 1);
  });

  const hold = $('.lab__hold');
  const holdOn = e => { e.preventDefault(); e.stopPropagation(); if (hasGSAP) gsap.killTweensOf(lab); applyInk(0); };
  const holdOff = () => { lab.v = lab.s; applyInk(lab.s); };
  hold.addEventListener('pointerdown', holdOn);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, holdOff));
  hold.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') holdOn(e); });
  hold.addEventListener('keyup', holdOff);
}

/* ----------------------------------------------------------
   NAV · MENÚ MÓVIL · ANCLAS
   ---------------------------------------------------------- */
let lenis = null;
const nav = $('#nav');
const burger = $('.burger');
const menu = $('#menu');
const fab = $('.wa-fab');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) nav.classList.remove('is-hidden');
  if (lenis) open ? lenis.stop() : lenis.start();
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

function scrollToTarget(hash) {
  const target = hash === '#top' ? 0 : document.querySelector(hash);
  if (target === null) return;
  if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: 0 });
  else if (target === 0) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href');
  e.preventDefault();
  if (hash.length < 2) return;
  const wasOpen = document.body.classList.contains('menu-open');
  if (wasOpen) setMenu(false);
  setTimeout(() => scrollToTarget(hash), wasOpen ? 300 : 0);
});

let lastY = 0, ticking = false;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-solid', y > 60);
  if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 700);
  lastY = y;
  fab.classList.toggle('is-on', y > innerHeight * .9 && y < document.documentElement.scrollHeight - innerHeight * 1.6);
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', measureFlower);

/* ----------------------------------------------------------
   INTRO · el telón FRIDA y el corte láser
   ---------------------------------------------------------- */
const intro = $('#intro');

function heroIn() {
  document.body.classList.remove('is-locked');
  if (lenis) lenis.start();
  if (!motion) return;
  gsap.timeline()
    .from('.hero__title span', { yPercent: 100, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .12 })
    .from('.hero__kicker, .hero__tag, .hero__sub, .hero__cta, .hero__hours, .hero__hint, .hero__rating', { y: 20, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07 }, '-=.95')
    .from('.hero__media img', { scale: 1.2, duration: 2.2, ease: 'expo.out' }, 0)
    .from(nav, { y: -20, opacity: 0, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity' }, .15);
}

function runIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem('fb-intro') === '1'; sessionStorage.setItem('fb-intro', '1'); } catch (e) { /* sin almacenamiento */ }
  if (!motion || seen) { intro.remove(); heroIn(); return; }

  document.body.classList.add('is-locked');
  const panels = $('.intro__panels', intro);
  const ps = $$('.intro__p', intro);
  const tops = $$('.intro__h--t', intro);
  const bots = $$('.intro__h--b', intro);
  const beam = $('.intro__beam', intro);
  const spark = $('.intro__spark', intro);
  const cut = { p: 0 };
  const done = new Set();

  function sweep() {
    const r = panels.getBoundingClientRect();
    const ext = innerWidth * .01;
    const span = r.width + ext * 2;
    const x = r.left - ext + cut.p * span;
    beam.style.transform = `scaleX(${cut.p.toFixed(4)})`;
    spark.style.transform = `translate3d(${(cut.p * span).toFixed(1)}px,0,0)`;
    ps.forEach((p, i) => {
      if (done.has(i)) return;
      const pr = p.getBoundingClientRect();
      if (x < pr.left + pr.width / 2) return;
      done.add(i);
      Laser.fire(pr.left + pr.width / 2, pr.top + pr.height * .55, .75);
      gsap.to(tops[i], { y: -7, duration: .35, ease: 'power2.out' });
      gsap.to(bots[i], { y: 9, rotate: i % 2 ? 1.5 : -1.5, duration: .35, ease: 'power2.out' });
    });
  }

  const tl = gsap.timeline({ onComplete: () => intro.remove() });
  tl.from(ps, { scaleY: 0, duration: .9, ease: 'expo.out', stagger: .06 })
    .set(spark, { opacity: 1 }, '+=.15')
    .to(cut, { p: 1, duration: .9, ease: 'power2.inOut', onUpdate: sweep })
    .to(spark, { opacity: 0, duration: .2 })
    .to(bots, { y: () => innerHeight * .8, rotate: i => [-9, 6, -5, 8, -7][i % 5], opacity: 0, duration: 1, ease: 'power3.in', stagger: .05 }, '+=.1')
    .to(tops, { scaleY: 0, duration: .9, ease: 'expo.inOut', stagger: .05 }, '<.15')
    .to(beam, { opacity: 0, duration: .4 }, '<')
    .to('.intro__rail', { opacity: 0, duration: .4 }, '-=.5')
    .to(intro, { backgroundColor: 'rgba(18,11,15,0)', duration: .5 }, '-=.8')
    .add(heroIn, '-=.8');
  intro.addEventListener('click', () => tl.progress(1));
}

/* ----------------------------------------------------------
   ANIMACIONES DE SCROLL
   ---------------------------------------------------------- */
function scrollFx() {
  if (!motion) return;
  const st = (trigger, start = 'top 85%') => ({ trigger, start, once: true });

  $$('main .h2').forEach(h => gsap.from(h, { y: 28, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: st(h, 'top 88%') }));
  $$('.lead, .flora__note, .lz__unit, .reviews__note, .score').forEach(el => gsap.from(el, { y: 18, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: st(el, 'top 90%') }));

  // servicios (la flor florece sola al entrar en pantalla)
  gsap.from('.flora__pick', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: st('.flora__pick', 'top 92%') });
  gsap.from('.legend li', { y: 10, opacity: 0, duration: .6, ease: 'expo.out', stagger: .05, scrollTrigger: st('.legend') });

  // micropigmentación
  gsap.from('.micro__a', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: st('.micro', 'top 75%') });
  gsap.from('.micro__list li', { x: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .1, scrollTrigger: st('.micro__list') });
  gsap.from('.micro blockquote', { x: 30, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: st('.micro blockquote', 'top 90%') });
  gsap.from('.micro__b, .micro__c', { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, scrollTrigger: st('.micro__b', 'top 92%') });

  // láser
  gsap.from('.lz__a, .lz__b', { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'expo.inOut', stagger: .15, scrollTrigger: st('.lz', 'top 75%') });
  gsap.from('.lz__list li', { x: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: st('.lz__list') });

  // simulador
  gsap.from('.lab__stage', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: st('.sim__grid', 'top 78%') });
  gsap.from('.designs .design, .lab__info, .sim__ctrl > *', { x: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .07, scrollTrigger: st('.sim__grid', 'top 75%') });
  if (labImg) {
    // el simulador hace una pequeña demo al entrar en pantalla
    ScrollTrigger.create({
      trigger: labImg, start: 'top 55%', once: true,
      onEnter: () => {
        if (lab.s !== 0) return;
        gsap.timeline().add(() => setSessions(3), .5).add(() => setSessions(0), 2.1);
      }
    });
  }

  // estudio
  gsap.from('.studio__fig', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: st('.studio', 'top 75%') });
  gsap.from('.studio__list li', { y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: st('.studio__list') });

  // opiniones
  gsap.set('.rv', { y: 30, opacity: 0 });
  ScrollTrigger.batch('.rv', { start: 'top 92%', once: true, onEnter: els => gsap.to(els, { y: 0, opacity: 1, duration: .9, ease: 'expo.out', stagger: .1 }) });

  // visítanos
  gsap.from('.visit dl > div', { x: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .08, scrollTrigger: st('.visit dl') });
  gsap.from('.visit__fig', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: st('.visit', 'top 70%') });

  // paralaje suave
  gsap.to('.hero__media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.matchMedia().add('(min-width: 921px)', () => {
    ['.micro__a img', '.studio__fig img'].forEach(sel => {
      gsap.fromTo(sel, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: $(sel).parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  // enlace activo en la navegación
  ['servicios', 'micropigmentacion', 'laser', 'simulador', 'estudio', 'visitanos'].forEach(id => {
    const link = $(`.nav__links a[href="#${id}"]`);
    const sec = document.getElementById(id);
    if (!link || !sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: self => link.classList.toggle('is-active', self.isActive) });
  });
}

/* ----------------------------------------------------------
   INICIO
   ---------------------------------------------------------- */
scrollTo(0, 0);
applyLang(lang, true);
setSessions(0, false);
measureFlower();

if (motion && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

scrollFx();
runIntro();

if (document.fonts) document.fonts.ready.then(() => { measureFlower(); if (hasGSAP) ScrollTrigger.refresh(); });
addEventListener('load', () => { measureFlower(); if (hasGSAP) ScrollTrigger.refresh(); });
})();
