/* ==========================================================
   FRIDA BELLESA — interacciones
   ========================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
if (!hasGSAP || reduced) document.documentElement.classList.add('reduced');
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const Laser = window.FridaLaser || { fire() {}, burst() {}, snap() {}, sync() {} };

/* ----------------------------------------------------------
   DATOS DEL NEGOCIO
   ---------------------------------------------------------- */
const WA_NUMBER = '34672874616';
// minutos desde medianoche · 0 = domingo
const HOURS = { 0: null, 1: [600, 1140], 2: [600, 1140], 3: [600, 1140], 4: [600, 1140], 5: [600, 1140], 6: null };

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
    waLab: n => `Hola Frida Bellesa, me gustaría pedir una valoración para eliminar un tatuaje (${n}).`,
    waPlan: (n, sk, f) => `Hola Frida Bellesa, me interesa el ${n}${sk ? ` (piel ${sk.toLowerCase()})` : ''}${f ? ` · ${f}` : ''}. ¿Podemos concertar una valoración?`,
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
    },
    rEmpty: { k: 'Tu plan', n: 'Responde y lo creamos.', d: 'Elige una opción en cada paso: tu propuesta aparece aquí al instante.' },
    rHint: 'Ahora dinos qué te gustaría conseguir (paso 01).',
    rKicker: 'Tu plan a medida',
    noFirst: 'Dinos si es tu primera vez para afinar la propuesta.'
  },
  ca: {
    days: ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'],
    open: t => `Obert ara · fins a les ${t}`,
    closedToday: t => `Tancat · obre avui a les ${t}`,
    closedTomorrow: t => `Tancat · obre demà a les ${t}`,
    closedDay: (d, t) => `Tancat · obre ${d.toLowerCase()} a les ${t}`,
    closed: 'Tancat',
    wa: 'Hola Frida Bellesa, m’agradaria demanar cita.',
    waLab: n => `Hola Frida Bellesa, m’agradaria demanar una valoració per eliminar un tatuatge (${n}).`,
    waPlan: (n, sk, f) => `Hola Frida Bellesa, m’interessa el ${n}${sk ? ` (pell ${sk.toLowerCase()})` : ''}${f ? ` · ${f}` : ''}. Podem concertar una valoració?`,
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
    },
    rEmpty: { k: 'El teu pla', n: 'Respon i el creem.', d: 'Tria una opció a cada pas: la teva proposta apareix aquí a l’instant.' },
    rHint: 'Ara digues-nos què t’agradaria aconseguir (pas 01).',
    rKicker: 'El teu pla a mida',
    noFirst: 'Digues-nos si és la primera vegada per afinar la proposta.'
  },
  en: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    open: t => `Open now · until ${t}`,
    closedToday: t => `Closed · opens today at ${t}`,
    closedTomorrow: t => `Closed · opens tomorrow at ${t}`,
    closedDay: (d, t) => `Closed · opens ${d} at ${t}`,
    closed: 'Closed',
    wa: 'Hi Frida Bellesa, I’d like to book an appointment.',
    waLab: n => `Hi Frida Bellesa, I’d like to book a tattoo removal consultation (${n}).`,
    waPlan: (n, sk, f) => `Hi Frida Bellesa, I’m interested in the ${n}${sk ? ` (${sk.toLowerCase()} skin)` : ''}${f ? ` · ${f}` : ''}. Could we arrange a consultation?`,
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
    },
    rEmpty: { k: 'Your plan', n: 'Answer and we’ll build it.', d: 'Pick one option in each step: your proposal appears here instantly.' },
    rHint: 'Now tell us what you’d like to achieve (step 01).',
    rKicker: 'Your tailored plan',
    noFirst: 'Tell us if it’s your first time to fine-tune the proposal.'
  }
};

// velocidad a la que se aclara cada tinta (el negro es el que mejor responde)
const INK_RATE = { k: .42, r: .3, y: .26, g: .17 };
const DESIGNS = {
  vida:    { w: { k: 1 }, burst: ['#16100f'] },
  corazon: { w: { k: .3, r: .35, y: .15, g: .2 }, burst: ['#C2232F', '#16100f', '#F2B233', '#2E7A4E'] },
  mandala: { w: { k: 1 }, burst: ['#16100f'] }
};

const PLANS = {
  borrar: {
    es: { n: 'Plan Borrado Láser', d: 'Fragmentamos la tinta sesión a sesión hasta borrarla o aclararla lo suficiente para un cover-up.', s: ['Valoración del tatuaje: tinta, tamaño y antigüedad', 'Prueba en una zona pequeña', 'Sesiones láser cada 6–8 semanas', 'Cuidados posteriores y seguimiento'], t: ['Láser', 'Progresivo', 'Cover-up'], m: '≈ 6–10 sesiones según tinta y piel' },
    ca: { n: 'Pla Esborrat Làser', d: 'Fragmentem la tinta sessió a sessió fins a esborrar-la o aclarir-la prou per a un cover-up.', s: ['Valoració del tatuatge: tinta, mida i antiguitat', 'Prova en una zona petita', 'Sessions làser cada 6–8 setmanes', 'Cures posteriors i seguiment'], t: ['Làser', 'Progressiu', 'Cover-up'], m: '≈ 6–10 sessions segons tinta i pell' },
    en: { n: 'Laser Removal Plan', d: 'We break up the ink session by session until it is gone, or light enough for a cover-up.', s: ['Tattoo assessment: ink, size and age', 'Patch test on a small area', 'Laser sessions every 6–8 weeks', 'Aftercare and follow-up'], t: ['Laser', 'Progressive', 'Cover-up'], m: '≈ 6–10 sessions depending on ink and skin' }
  },
  cejas: {
    es: { n: 'Plan Micropigmentación', d: 'Un diseño a medida de tu rostro para despertarte cada día con cejas, labios o eyeliner perfectos.', s: ['Visagismo y diseño previo a mano', 'Elección del pigmento según tu tono', 'Sesión de micropigmentación', 'Retoque de perfeccionamiento a las 4–6 semanas'], t: ['Natural', 'Larga duración', 'A medida'], m: '1 sesión + retoque' },
    ca: { n: 'Pla Micropigmentació', d: 'Un disseny a mida del teu rostre per despertar-te cada dia amb celles, llavis o eyeliner perfectes.', s: ['Visagisme i disseny previ a mà', 'Elecció del pigment segons el teu to', 'Sessió de micropigmentació', 'Retoc de perfeccionament a les 4–6 setmanes'], t: ['Natural', 'Llarga durada', 'A mida'], m: '1 sessió + retoc' },
    en: { n: 'Permanent Make Up Plan', d: 'A design tailored to your face, so you wake up every day with perfect brows, lips or eyeliner.', s: ['Face mapping and hand-drawn design', 'Pigment chosen for your skin tone', 'Micropigmentation session', 'Perfecting touch-up after 4–6 weeks'], t: ['Natural', 'Long-lasting', 'Bespoke'], m: '1 session + touch-up' }
  },
  vello: {
    es: { n: 'Plan Piel Suave', d: 'Depilación láser progresiva y duradera, adaptada a tu fototipo y a cada zona.', s: ['Estudio de tu fototipo y la zona', 'Ajuste de parámetros y prueba', 'Sesiones cada 4–8 semanas', 'Mantenimiento ocasional'], t: ['Duradero', 'Todas las zonas', 'Confort'], m: '≈ 6–8 sesiones' },
    ca: { n: 'Pla Pell Suau', d: 'Depilació làser progressiva i duradora, adaptada al teu fototip i a cada zona.', s: ['Estudi del teu fototip i la zona', 'Ajust de paràmetres i prova', 'Sessions cada 4–8 setmanes', 'Manteniment ocasional'], t: ['Durador', 'Totes les zones', 'Confort'], m: '≈ 6–8 sessions' },
    en: { n: 'Smooth Skin Plan', d: 'Progressive, long-lasting laser hair removal tailored to your skin type and each area.', s: ['Skin type and area assessment', 'Parameter setting and patch test', 'Sessions every 4–8 weeks', 'Occasional maintenance'], t: ['Long-lasting', 'All areas', 'Comfort'], m: '≈ 6–8 sessions' }
  },
  piel: {
    es: { n: 'Plan Luz & Tono', d: 'Carbon Peel y láser para manchas: una piel más uniforme, luminosa y con los poros afinados.', s: ['Análisis de tu piel', 'Higiene facial profunda', 'Carbon Peel o láser para manchas', 'Rutina de cuidado en casa'], t: ['Luminosidad', 'Poros', 'Tono uniforme'], m: '≈ 3–5 sesiones' },
    ca: { n: 'Pla Llum & To', d: 'Carbon Peel i làser per a taques: una pell més uniforme, lluminosa i amb els porus afinats.', s: ['Anàlisi de la teva pell', 'Higiene facial profunda', 'Carbon Peel o làser per a taques', 'Rutina de cura a casa'], t: ['Lluminositat', 'Porus', 'To uniforme'], m: '≈ 3–5 sessions' },
    en: { n: 'Glow & Tone Plan', d: 'Carbon Peel and laser for pigmentation: more even, radiant skin with refined pores.', s: ['Skin analysis', 'Deep facial cleansing', 'Carbon Peel or pigmentation laser', 'At-home care routine'], t: ['Radiance', 'Pores', 'Even tone'], m: '≈ 3–5 sessions' }
  },
  detalles: {
    es: { n: 'Plan Detalles', d: 'Pestañas y uñas impecables: los pequeños detalles que transforman tu imagen.', s: ['Lifting o extensiones de pestañas', 'Tinte y acabado', 'Manicura y pedicura', 'Esmaltado semipermanente'], t: ['Mirada', 'Manos', 'Larga duración'], m: '≈ 60–120 min' },
    ca: { n: 'Pla Detalls', d: 'Pestanyes i ungles impecables: els petits detalls que transformen la teva imatge.', s: ['Lifting o extensions de pestanyes', 'Tint i acabat', 'Manicura i pedicura', 'Esmaltat semipermanent'], t: ['Mirada', 'Mans', 'Llarga durada'], m: '≈ 60–120 min' },
    en: { n: 'Details Plan', d: 'Flawless lashes and nails: the small details that transform your look.', s: ['Lash lift or extensions', 'Tint and finish', 'Manicure and pedicure', 'Gel polish'], t: ['Eyes', 'Hands', 'Long-lasting'], m: '≈ 60–120 min' }
  }
};

const SKIN_NOTES = {
  clara:    { es: 'Para piel clara: parámetros suaves y protección solar extra los días siguientes.', ca: 'Per a pell clara: paràmetres suaus i protecció solar extra els dies següents.', en: 'For fair skin: gentle settings and extra sun protection in the days after.' },
  media:    { es: 'Para piel media: ajustamos la energía para un resultado eficaz y seguro.', ca: 'Per a pell mitjana: ajustem l’energia per a un resultat eficaç i segur.', en: 'For medium skin: we adjust the energy for an effective, safe result.' },
  morena:   { es: 'Para piel morena u oscura: parámetros específicos que respetan tu fototipo.', ca: 'Per a pell morena o fosca: paràmetres específics que respecten el teu fototip.', en: 'For olive or dark skin: specific settings that respect your skin type.' },
  sensible: { es: 'Para piel sensible: prueba previa y un ritmo más pausado, para tu tranquilidad.', ca: 'Per a pell sensible: prova prèvia i un ritme més pausat, per a la teva tranquil·litat.', en: 'For sensitive skin: a patch test first and a gentler pace, for peace of mind.' }
};

const FIRST = {
  primera:    { es: { n: 'Primera visita', x: 'Empezamos con una valoración personal' }, ca: { n: 'Primera visita', x: 'Comencem amb una valoració personal' }, en: { n: 'First visit', x: 'We start with a personal consultation' } },
  retoque:    { es: { n: 'Retoque', x: 'Revisamos y reavivamos el trabajo' }, ca: { n: 'Retoc', x: 'Revisem i reavivem el treball' }, en: { n: 'Touch-up', x: 'We review and refresh the work' } },
  correccion: { es: { n: 'Corrección', x: 'Estudio del trabajo anterior y aclarado láser si hace falta' }, ca: { n: 'Correcció', x: 'Estudi del treball anterior i aclariment làser si cal' }, en: { n: 'Correction', x: 'Review of previous work, with laser fading if needed' } }
};

/* ----------------------------------------------------------
   TRADUCCIONES DE LA PÁGINA (ES = HTML original)
   ---------------------------------------------------------- */
const I18N = {
  ca: {
    'nav.services': 'Serveis', 'nav.laser': 'Làser', 'nav.plan': 'El teu pla', 'nav.studio': 'L’estudi', 'nav.reviews': 'Opinions', 'nav.visit': 'Visita’ns',
    'cta.book': 'Demanar cita', 'cta.bookLong': 'Demanar cita per WhatsApp', 'cta.lab': 'Simulador làser', 'cta.plan': 'Crea el teu pla',
    'hero.eyebrow': 'Permanent make up · Làser · Estètica — Lloret de Mar',
    'hero.l1': 'El que estimes, es queda.', 'hero.l2': 'La resta, l’esborrem.',
    'hero.hint': 'Fes clic a qualsevol text: el nostre làser l’esborra', 'hero.hintTouch': 'Toca qualsevol text: el nostre làser l’esborra',
    'hero.lead': 'Dissenyem la teva mirada, esborrem el que ja no et representa i cuidem la teva pell amb tecnologia d’última generació.',
    'hero.reviews': '· 18 opinions a Google', 'hero.cap1': 'Làser, micropigmentació', 'hero.cap2': 'i bellesa que es queda.',
    'man.kicker': 'La nostra filosofia',
    'man.text': 'A Frida creiem que la teva pell explica la teva història, i que tu decideixes com s’escriu. Dissenyem celles, llavis i mirades que t’acompanyen cada matí, i amb tecnologia làser esborrem el que ja no et representa. Tot en un estudi proper, on et sentiràs com a casa.',
    'man.sign': 'Lloret de Mar · Costa Brava',
    'svc.kicker': 'Serveis', 'svc.title': 'Tècnica, làser i <em>detall</em>.', 'svc.hint': 'Llisca per descobrir',
    'svc.1.t': 'Eliminació de tatuatges', 'svc.1.d': 'Tecnologia làser que fragmenta la tinta sessió a sessió, per esborrar o aclarir abans d’un cover-up.',
    'svc.2.t': 'Micropigmentació', 'svc.2.d': 'Celles pèl a pèl, llavis i eyeliner amb un disseny pensat per al teu rostre.',
    'svc.3.t': 'Depilació làser', 'svc.3.d': 'Adeu al pèl de manera progressiva i duradora, a qualsevol zona del cos.',
    'svc.4.t': 'Carbon Peel', 'svc.4.d': 'El peeling de Hollywood: porus afinats i una pell uniforme i lluminosa des de la primera sessió.',
    'svc.5.t': 'Taques', 'svc.5.d': 'Làser per atenuar taques solars i de l’edat i retornar a la teva pell un to homogeni.',
    'svc.6.t': 'Pestanyes', 'svc.6.d': 'Lifting, tint i extensions per a una mirada intensa sense necessitat de màscara.',
    'svc.7.t': 'Ungles', 'svc.7.d': 'Manicura, pedicura i esmaltat semipermanent amb un acabat impecable.',
    'svc.8.t': 'Tricopigmentació', 'svc.8.d': 'Efecte de densitat o de cabell rapat per dissimular les zones amb menys cabell.',
    'svc.9.t': 'Facial &amp; corporal', 'svc.9.d': 'Higiene facial profunda, maderoteràpia i massatges per cuidar cos i ment.',
    'svc.end.t': 'No saps què necessites?', 'svc.end.d': 'Respon tres preguntes i et proposem un pla a la teva mida.',
    'lab.hold': 'Mantén premut per veure l’abans', 'lab.badge': 'Simulació orientativa', 'lab.tip': 'Dispara sobre el tatuatge',
    'lab.kicker': 'Simulador làser', 'lab.title': 'Mira com s’<em>esvaeix</em>.',
    'lab.lead': 'Cada sessió fragmenta la tinta en partícules diminutes que el teu cos elimina de manera natural. Tria un tatuatge, mou el control o dispara directament sobre la pell.',
    'lab.d1': 'Viva la vida', 'lab.d1s': 'Lettering · negre', 'lab.d2': 'Sagrat cor', 'lab.d2s': 'Color · tradicional', 'lab.d3': 'Mandala', 'lab.d3s': 'Línia fina · dotwork',
    'lab.sessions': 'Sessions', 'lab.f1': 'Interval', 'lab.f1v': '6–8 setmanes', 'lab.f2': 'Per sessió', 'lab.f2v': '10–30 min', 'lab.f3': 'Temps total', 'lab.cta': 'Demana la teva valoració',
    'plan.kicker': 'El teu pla', 'plan.title': 'Crea el teu <em>pla</em> en tres passos.',
    'plan.lead': 'Explica’ns què busques i et proposem un pla orientatiu que afinarem amb tu en una valoració personal.',
    'plan.q1': 'Què t’agradaria aconseguir?', 'plan.goal.borrar': 'Esborrar o aclarir un tatuatge', 'plan.goal.cejas': 'Celles, llavis o eyeliner', 'plan.goal.vello': 'Pell lliure de pèl', 'plan.goal.piel': 'Pell lluminosa i sense taques', 'plan.goal.detalles': 'Pestanyes i ungles impecables',
    'plan.q2': 'Com és la teva pell?', 'plan.skin.clara': 'Clara', 'plan.skin.media': 'Mitjana', 'plan.skin.morena': 'Morena o fosca', 'plan.skin.sensible': 'Sensible',
    'plan.q3': 'És la primera vegada?', 'plan.first.primera': 'Sí, és la primera vegada', 'plan.first.retoque': 'Busco un retoc', 'plan.first.correccion': 'Corregir un treball anterior',
    'plan.cta': 'Reservar valoració',
    'std.kicker': 'L’estudi', 'std.title': 'Precisió tècnica, <em>tracte de casa</em>.',
    'std.1.t': 'Disseny a mida', 'std.1.d': 'Cada cella, cada llavi i cada línia es dibuixa abans sobre el teu rostre. Mesurem, proposem i només comencem quan t’encanta.',
    'std.2.t': 'Tecnologia làser', 'std.2.d': 'Equips actuals per eliminar tatuatges, pèl i taques amb resultats progressius, adaptats a la teva pell.',
    'std.3.t': 'Higiene sense concessions', 'std.3.d': 'Material d’un sol ús, protocols estrictes de neteja i productes de primera qualitat a cada tractament.',
    'std.4.t': 'Com a casa', 'std.4.d': 'Un espai proper i tranquil. Les nostres clientes ho repeteixen: aquí et sents còmoda des del primer minut.',
    'team.kicker': 'Les mans al darrere',
    'team.lead': 'Micropigmentació, làser, ungles i estètica amb cura. Qui passa per l’estudi repeteix el mateix: professionalitat, empatia i un tracte que fa que tornis.',
    'rev.google': 'Opinió a Google', 'team.t1': 'Micropigmentació', 'team.t2': 'Làser', 'team.t3': 'Ungles &amp; pestanyes', 'team.t4': 'Facial &amp; corporal',
    'rev.kicker': 'Opinions', 'rev.count': '18 opinions a Google', 'rev.note': 'Opinions reals publicades a Google Maps (en castellà).',
    'gal.title': 'Fet a <em>Frida</em>',
    'vis.kicker': 'Visita’ns', 'vis.title': 'T’esperem a <em>Lloret</em>.', 'vis.addr': 'Adreça', 'vis.phone': 'Cites', 'vis.onlyWa': 'Només per WhatsApp', 'vis.route': 'Com arribar-hi',
    'foot.small': 'Comencem?', 'foot.big': 'Demana la teva cita', 'foot.tag': 'Permanent make up, làser i estètica'
  },
  en: {
    'nav.services': 'Services', 'nav.laser': 'Laser', 'nav.plan': 'Your plan', 'nav.studio': 'The studio', 'nav.reviews': 'Reviews', 'nav.visit': 'Visit us',
    'cta.book': 'Book now', 'cta.bookLong': 'Book via WhatsApp', 'cta.lab': 'Laser simulator', 'cta.plan': 'Build your plan',
    'hero.eyebrow': 'Permanent make up · Laser · Aesthetics — Lloret de Mar',
    'hero.l1': 'What you love, stays.', 'hero.l2': 'The rest, we erase.',
    'hero.hint': 'Click any text: our laser erases it', 'hero.hintTouch': 'Tap any text: our laser erases it',
    'hero.lead': 'We design your look, erase what no longer represents you and care for your skin with state-of-the-art technology.',
    'hero.reviews': '· 18 Google reviews', 'hero.cap1': 'Laser, permanent make up', 'hero.cap2': 'and beauty that stays.',
    'man.kicker': 'Our philosophy',
    'man.text': 'At Frida we believe your skin tells your story, and that you decide how it is written. We design brows, lips and eyes that are with you every morning, and with laser technology we erase what no longer represents you. All in a warm studio where you will feel at home.',
    'man.sign': 'Lloret de Mar · Costa Brava',
    'svc.kicker': 'Services', 'svc.title': 'Technique, laser and <em>detail</em>.', 'svc.hint': 'Scroll to explore',
    'svc.1.t': 'Tattoo removal', 'svc.1.d': 'Laser technology that breaks up the ink session by session, to remove it or fade it before a cover-up.',
    'svc.2.t': 'Permanent make up', 'svc.2.d': 'Hair-stroke brows, lips and eyeliner, designed around your face.',
    'svc.3.t': 'Laser hair removal', 'svc.3.d': 'Say goodbye to unwanted hair, progressively and for the long term, on any area.',
    'svc.4.t': 'Carbon Peel', 'svc.4.d': 'The Hollywood peel: refined pores and even, glowing skin from the very first session.',
    'svc.5.t': 'Pigmentation', 'svc.5.d': 'Laser to fade sun and age spots and bring back an even skin tone.',
    'svc.6.t': 'Lashes', 'svc.6.d': 'Lift, tint and extensions for intense eyes without mascara.',
    'svc.7.t': 'Nails', 'svc.7.d': 'Manicure, pedicure and gel polish with a flawless finish.',
    'svc.8.t': 'Scalp pigmentation', 'svc.8.d': 'A density or shaved-look effect to conceal thinning areas.',
    'svc.9.t': 'Face &amp; body', 'svc.9.d': 'Deep facial cleansing, wood therapy and massages for body and mind.',
    'svc.end.t': 'Not sure what you need?', 'svc.end.d': 'Answer three questions and we’ll suggest a plan made for you.',
    'lab.hold': 'Press and hold to see the before', 'lab.badge': 'Approximate preview', 'lab.tip': 'Fire at the tattoo',
    'lab.kicker': 'Laser simulator', 'lab.title': 'Watch it <em>fade</em>.',
    'lab.lead': 'Each session shatters the ink into tiny particles that your body clears naturally. Pick a tattoo, move the slider or fire straight at the skin.',
    'lab.d1': 'Viva la vida', 'lab.d1s': 'Lettering · black', 'lab.d2': 'Sacred heart', 'lab.d2s': 'Colour · traditional', 'lab.d3': 'Mandala', 'lab.d3s': 'Fine line · dotwork',
    'lab.sessions': 'Sessions', 'lab.f1': 'Interval', 'lab.f1v': '6–8 weeks', 'lab.f2': 'Per session', 'lab.f2v': '10–30 min', 'lab.f3': 'Total time', 'lab.cta': 'Book a consultation',
    'plan.kicker': 'Your plan', 'plan.title': 'Build your <em>plan</em> in three steps.',
    'plan.lead': 'Tell us what you’re looking for and we’ll suggest an approximate plan, fine-tuned with you during a personal consultation.',
    'plan.q1': 'What would you like to achieve?', 'plan.goal.borrar': 'Remove or fade a tattoo', 'plan.goal.cejas': 'Brows, lips or eyeliner', 'plan.goal.vello': 'Hair-free skin', 'plan.goal.piel': 'Glowing, spot-free skin', 'plan.goal.detalles': 'Flawless lashes and nails',
    'plan.q2': 'What is your skin like?', 'plan.skin.clara': 'Fair', 'plan.skin.media': 'Medium', 'plan.skin.morena': 'Olive or dark', 'plan.skin.sensible': 'Sensitive',
    'plan.q3': 'Is it your first time?', 'plan.first.primera': 'Yes, first time', 'plan.first.retoque': 'I need a touch-up', 'plan.first.correccion': 'Correct previous work',
    'plan.cta': 'Book a consultation',
    'std.kicker': 'The studio', 'std.title': 'Technical precision, <em>homely care</em>.',
    'std.1.t': 'Bespoke design', 'std.1.d': 'Every brow, lip and line is drawn on your face first. We measure, we suggest, and we only start once you love it.',
    'std.2.t': 'Laser technology', 'std.2.d': 'Modern equipment to remove tattoos, hair and spots with progressive results, tailored to your skin.',
    'std.3.t': 'Uncompromising hygiene', 'std.3.d': 'Single-use materials, strict cleaning protocols and top-quality products in every treatment.',
    'std.4.t': 'Just like home', 'std.4.d': 'A warm, quiet space. Our clients all say it: you feel comfortable from the very first minute.',
    'team.kicker': 'The hands behind it',
    'team.lead': 'Permanent make up, laser, nails and aesthetics, done with care. Everyone who visits says the same: professionalism, empathy and a warmth that brings you back.',
    'rev.google': 'Google review', 'team.t1': 'Permanent make up', 'team.t2': 'Laser', 'team.t3': 'Nails &amp; lashes', 'team.t4': 'Face &amp; body',
    'rev.kicker': 'Reviews', 'rev.count': '18 Google reviews', 'rev.note': 'Real reviews published on Google Maps (in Spanish).',
    'gal.title': 'Made at <em>Frida</em>',
    'vis.kicker': 'Visit us', 'vis.title': 'See you in <em>Lloret</em>.', 'vis.addr': 'Address', 'vis.phone': 'Appointments', 'vis.onlyWa': 'WhatsApp only', 'vis.route': 'Get directions',
    'foot.small': 'Shall we start?', 'foot.big': 'Book your visit', 'foot.tag': 'Permanent make up, laser & aesthetics'
  }
};

/* ----------------------------------------------------------
   IDIOMA
   ---------------------------------------------------------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
};
// duplicamos las opiniones para que el carrusel sea infinito y sin saltos
const mTrack = $('.marquee__track');
if (mTrack) [...mTrack.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); mTrack.appendChild(k); });

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
  $$('[data-lang]').forEach(b => b.classList.toggle('is-active', b.dataset.lang === l));
  $$('[data-num]').forEach(el => { el.textContent = fmtNum(el.dataset.num); });
  $$('[data-wa]').forEach(a => { a.href = waLink(STR[l].wa); });
  splitManifesto();
  renderStatus();
  renderHours();
  renderLab();
  renderPlan(false);
  Laser.sync();
  if (!init) {
    store.set('fb-lang', l);
    if (hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
    updateManifesto();
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
function renderHours() {
  const ul = $('.hours'); if (!ul) return;
  const s = STR[lang]; const today = madridNow().day;
  ul.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => {
    const h = HOURS[d];
    return `<li class="${d === today ? 'is-today' : ''}"><span>${s.days[d]}</span><span class="${h ? '' : 'closed'}">${h ? `${fmtTime(h[0])} – ${fmtTime(h[1])}` : s.closed}</span></li>`;
  }).join('');
}
setInterval(renderStatus, 60000);

/* ----------------------------------------------------------
   MANIFIESTO · palabras que se iluminan
   ---------------------------------------------------------- */
const manifesto = $('.manifesto__text');
function splitManifesto() {
  if (!manifesto) return;
  const words = manifesto.textContent.trim().split(/\s+/);
  manifesto.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
}
function updateManifesto() {
  if (!manifesto) return;
  const ws = $$('.w', manifesto);
  const r = manifesto.getBoundingClientRect();
  const vh = innerHeight;
  const p = clamp((vh * .82 - r.top) / (r.height + vh * .35));
  const pos = p * (ws.length + 6) - 3;
  ws.forEach((w, i) => { w.style.opacity = (0.14 + 0.86 * clamp(pos - i)).toFixed(3); });
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
  if (animate && hasGSAP && !reduced) gsap.to(lab, { v: lab.s, duration: .9, ease: 'power2.out', overwrite: true, onUpdate: () => applyInk(lab.v) });
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
   CREA TU PLAN
   ---------------------------------------------------------- */
const form = $('.ritual__steps');
const rOut = $('.ritual__out');
const rCta = $('.ritual__cta');
const val = name => { const el = form.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; };
const label = name => { const el = form.querySelector(`input[name="${name}"]:checked`); return el ? el.nextElementSibling.textContent.trim() : ''; };

function renderPlan(animate = true) {
  const s = STR[lang];
  const goal = val('goal'), skin = val('skin'), first = val('first');
  $$('.ritual__progress i').forEach((d, i) => d.classList.toggle('is-on', [goal, skin, first][i] !== ''));
  let html;
  if (!goal) {
    html = `<p class="ritual__kicker">${s.rEmpty.k}</p><h3 class="ritual__name">${s.rEmpty.n}</h3><p class="ritual__desc">${(skin || first) ? s.rHint : s.rEmpty.d}</p>`;
    rCta.classList.add('is-disabled');
    rCta.href = '#';
  } else {
    const P = PLANS[goal][lang];
    const F = first ? FIRST[first][lang] : null;
    const steps = [...P.s];
    if (first === 'correccion') steps.splice(1, 0, F.x);
    const note = skin ? ` ${SKIN_NOTES[skin][lang]}` : '';
    html = `<p class="ritual__kicker">${s.rKicker}</p>
      <h3 class="ritual__name">${P.n}</h3>
      <p class="ritual__desc">${P.d}${note}</p>
      <ol class="ritual__list">${steps.map(x => `<li>${x}</li>`).join('')}</ol>
      <div class="ritual__tags">${P.t.map(x => `<span>${x}</span>`).join('')}</div>
      <p class="ritual__meta">${F ? `${F.n} · ${first === 'correccion' ? P.m : `${F.x} · ${P.m}`}` : `${P.m} · ${s.noFirst}`}</p>`;
    rCta.classList.remove('is-disabled');
    rCta.href = waLink(s.waPlan(P.n, label('skin'), F ? F.n : ''));
  }
  rOut.innerHTML = html;
  if (animate && !reduced) { rOut.classList.remove('is-swap'); void rOut.offsetWidth; rOut.classList.add('is-swap'); }
}
form.addEventListener('change', e => {
  renderPlan(true);
  // en móvil, al completar los tres pasos llevamos a la propuesta
  if (innerWidth < 900 && val('goal') && val('skin') && val('first') && e.target.name === 'first') {
    const card = $('.ritual__card');
    if (lenis) lenis.scrollTo(card, { offset: -90, duration: 1.2 }); else card.scrollIntoView({ behavior: 'smooth' });
  }
});

/* ----------------------------------------------------------
   MENÚ MÓVIL + NAVEGACIÓN
   ---------------------------------------------------------- */
let lenis = null;
const burger = $('.burger');
const menu = $('.menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (lenis) open ? lenis.stop() : lenis.start();
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));

function scrollToTarget(hash) {
  const target = hash === '#top' ? 0 : document.querySelector(hash);
  if (target === null) return;
  if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: 0 });
  else if (target === 0) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href');
  if (hash === '#' || hash.length < 2) { e.preventDefault(); return; }
  e.preventDefault();
  const wasOpen = document.body.classList.contains('menu-open');
  if (wasOpen) setMenu(false);
  setTimeout(() => scrollToTarget(hash), wasOpen ? 350 : 0);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ----------------------------------------------------------
   HERO · el arco que se abre
   ---------------------------------------------------------- */
const hero = $('.hero');
const sticky = $('.hero__sticky');
const media = $('.hero__media');
const mediaImg = $('.hero__media img');
const shade = $('.hero__shade');
const head = $('.hero__head');
const cols = $$('.hero__col');
const colL = $('.hero__col--l');
const caption = $('.hero__caption');
const heroState = { intro: hasGSAP && !reduced ? 0 : 1, p: 0 };
let geom = null;

function measureHero() {
  const w = innerWidth, h = sticky.clientHeight, mob = w < 760;
  const ref = mob ? colL : head;
  const top = Math.min(ref.offsetTop + ref.offsetHeight + (mob ? 26 : 34), h * .74);
  const side = mob ? w * .07 : w * .355;
  const bottom = mob ? 14 : h * .045;
  geom = { w, h, top, side, bottom, r: (w - side * 2) / 2 };
}
function renderHero() {
  if (!geom) measureHero();
  const { w, h, top, side, bottom, r } = geom;
  const i = easeOut(heroState.intro);
  const e = easeIO(clamp(heroState.p / .78));
  const k = 1 - e;
  const iTop = h - (h - top) * i;
  const iSide = (w / 2 - 1) - ((w / 2 - 1) - side) * i;
  const t = iTop * k, sd = iSide * k, b = bottom * k, rad = r * k;
  media.style.clipPath = `inset(${t.toFixed(1)}px ${sd.toFixed(1)}px ${b.toFixed(1)}px ${sd.toFixed(1)}px round ${rad.toFixed(1)}px ${rad.toFixed(1)}px 0px 0px)`;
  mediaImg.style.transform = `scale(${(1.2 - .2 * e).toFixed(4)})`;
  shade.style.opacity = e.toFixed(3);
  const fade = clamp(1 - heroState.p * 3.2);
  head.style.opacity = fade.toFixed(3);
  head.style.transform = `translateY(${(-heroState.p * 140).toFixed(1)}px)`;
  cols.forEach(c => { c.style.opacity = fade.toFixed(3); c.style.transform = `translateY(${(heroState.p * 60).toFixed(1)}px)`; });
  const cp = clamp((heroState.p - .7) / .2);
  caption.style.opacity = cp.toFixed(3);
  caption.style.transform = `translateY(${((1 - cp) * 40).toFixed(1)}px)`;
  caption.classList.toggle('is-on', cp > .5);
}
function heroProgress() {
  const r = hero.getBoundingClientRect();
  const span = hero.offsetHeight - innerHeight;
  heroState.p = span > 0 ? clamp(-r.top / span) : 0;
}

/* ----------------------------------------------------------
   SCROLL GLOBAL (nav, fab, hero, manifesto)
   ---------------------------------------------------------- */
const nav = $('#nav');
const fab = $('.wa-fab');
let lastY = 0, ticking = false;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 30);
  if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * .9);
  lastY = y;
  fab.classList.toggle('is-on', y > innerHeight * 1.6 && y < document.documentElement.scrollHeight - innerHeight * 1.9);
  heroProgress(); renderHero();
  updateManifesto();
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', () => { measureHero(); renderHero(); updateManifesto(); });

/* ----------------------------------------------------------
   BOTONES MAGNÉTICOS
   ---------------------------------------------------------- */
if (finePointer && !reduced) {
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(dx * .18).toFixed(1)}px,${(dy * .3).toFixed(1)}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ----------------------------------------------------------
   ANIMACIONES GSAP
   ---------------------------------------------------------- */
function setupScrollAnimations() {
  if (!hasGSAP || reduced) return;

  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: .09, overwrite: true })
  });

  // servicios en horizontal (escritorio)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.services__track');
    const bar = $('.services__progress span');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.services', start: 'top top', end: () => `+=${dist()}`,
        pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => { bar.style.transform = `scaleX(${self.progress.toFixed(4)})`; }
      }
    });
    $$('.svc:not(.svc--end)').forEach(card => {
      const img = $('img', card);
      gsap.fromTo(img, { xPercent: -6 }, {
        xPercent: 6, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });
    gsap.from('.svc', { y: 80, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: '.services', start: 'top 70%', once: true } });
  });
  mm.add('(max-width: 900px)', () => {
    const vp = $('.services__viewport');
    gsap.from('.svc', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: vp, start: 'top 85%', once: true } });
  });

  // flor de línea
  const paths = $$('.eco__draw .draw');
  paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  gsap.to(paths, {
    strokeDashoffset: 0, ease: 'none', stagger: .1,
    scrollTrigger: { trigger: '.eco', start: 'top 65%', end: 'bottom 75%', scrub: 1 }
  });

  // parallax de imágenes
  $$('.pillar__img img, .team__img img').forEach(img => {
    gsap.fromTo(img, { yPercent: -14 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.pillar__img').forEach(box => {
    gsap.fromTo(box, { clipPath: 'inset(12% 8% 12% 8% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: box, start: 'top 95%', end: 'top 45%', scrub: true } });
  });

  // el simulador hace una "demo" al entrar en pantalla
  if (labImg) {
    ScrollTrigger.create({
      trigger: labImg, start: 'top 55%', once: true,
      onEnter: () => {
        if (lab.s !== 0) return;
        gsap.timeline()
          .add(() => setSessions(3), .3)
          .add(() => setSessions(0), 1.9);
      }
    });
  }

  gsap.from('.g', { y: 90, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.gallery__grid', start: 'top 85%', once: true } });

  const num = $('.score__num');
  ScrollTrigger.create({
    trigger: '.reviews', start: 'top 70%', once: true,
    onEnter: () => {
      const o = { v: 0 };
      gsap.to(o, { v: +num.dataset.count, duration: 2, ease: 'power3.out', onUpdate: () => { num.textContent = fmtNum(o.v.toFixed(1)); } });
      $('.score__fill').style.width = `${(+num.dataset.count / 5) * 100}%`;
    }
  });

  gsap.from('.footer__mark > *', { yPercent: 60, opacity: 0, duration: 1.4, ease: 'power4.out', stagger: .1, scrollTrigger: { trigger: '.footer__mark', start: 'top 92%', once: true } });

  ['servicios', 'laser', 'plan', 'estudio', 'opiniones', 'visitanos'].forEach(id => {
    const link = $(`.nav__links a[href="#${id}"]`);
    const sec = document.getElementById(id);
    if (!link || !sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: self => link.classList.toggle('is-active', self.isActive) });
  });
}

function staticFallback() {
  const num = $('.score__num');
  num.textContent = fmtNum(num.dataset.count);
  $('.score__fill').style.width = `${(+num.dataset.count / 5) * 100}%`;
}

/* ----------------------------------------------------------
   PRELOADER · el láser escribe el logo
   ---------------------------------------------------------- */
function heroIntro() {
  document.body.classList.remove('is-loading');
  if (lenis) lenis.start();
  if (!hasGSAP || reduced) { heroState.intro = 1; renderHero(); return; }
  gsap.to(heroState, { intro: 1, duration: 1.8, ease: 'power3.inOut', onUpdate: renderHero });
  gsap.to('.hero .mask > *', { y: 0, duration: 1.4, ease: 'power4.out', stagger: .12, delay: .15 });
  gsap.from('.hero .eyebrow', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', delay: .1 });
  gsap.from('.hero__hint', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', delay: .7 });
  gsap.from('.hero__col > *', { opacity: 0, y: 24, duration: 1.2, ease: 'power3.out', stagger: .1, delay: .6 });
  gsap.from('.nav > *', { opacity: 0, y: -16, duration: 1, ease: 'power3.out', stagger: .08, delay: .3 });
}

function runLoader() {
  const loader = $('.loader');
  if (!hasGSAP || reduced) { loader.remove(); heroIntro(); return; }
  const num = $('.loader__num');
  const counter = { v: 0 };
  const img = mediaImg;
  const imgReady = img.complete ? Promise.resolve() : new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise(r => setTimeout(r, 4000));
  const ready = Promise.race([Promise.all([imgReady, fontsReady]), timeout]);

  const intro = gsap.timeline({ delay: .2 });
  intro.to('.loader__beam', { opacity: 1, duration: .2 })
    .to('.loader__ink', { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power2.inOut' }, '<')
    .to('.loader__beam', { left: '100%', duration: 1.4, ease: 'power2.inOut' }, '<')
    .to('.loader__beam', { opacity: 0, duration: .25 })
    .to('.loader__box', { clipPath: 'inset(0 0% 0 0)', duration: .8, ease: 'power4.inOut' }, '-=.4')
    .to(counter, { v: 100, duration: 2, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(counter.v)).padStart(2, '0'); } }, 0)
    .to('.loader__bar span', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)
    .to('.loader__sub', { opacity: 1, duration: .6 }, '-=.8');

  Promise.all([ready, new Promise(r => intro.eventCallback('onComplete', r))]).then(() => {
    measureHero(); renderHero();
    gsap.timeline({ onComplete: () => loader.remove() })
      .to('.loader__logo, .loader__sub, .loader__num', { y: -30, opacity: 0, duration: .6, ease: 'power3.in' })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power4.inOut' }, '-=.2')
      .add(heroIntro, '-=.75');
  });
}

/* ----------------------------------------------------------
   INICIO
   ---------------------------------------------------------- */
scrollTo(0, 0);
applyLang(lang, true);
setSessions(0, false);

if (hasGSAP && !reduced && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

measureHero(); renderHero(); updateManifesto();
setupScrollAnimations();
if (!hasGSAP || reduced) staticFallback();
runLoader();

if (document.fonts) document.fonts.ready.then(() => { measureHero(); renderHero(); if (hasGSAP) ScrollTrigger.refresh(); });
addEventListener('load', () => { if (hasGSAP) ScrollTrigger.refresh(); });
})();
