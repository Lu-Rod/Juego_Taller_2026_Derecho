'use strict';
/* ═══════════════════════════════════════════════════════════
   Detective Legal — game.js
   Detective legal con mapas, personajes animados,
   modo oscuro (noche con luces) y modo claro (día).
═══════════════════════════════════════════════════════════ */

/* ───────────── CONSTANTES ───────────── */
const TS = 32, COLS = 20, ROWS = 12;   // tamaño de tile y de mapa
const S = 2;                            // factor de nitidez del canvas
const W = COLS * TS, H = ROWS * TS;     // 640 x 384 lógicos
const SOLID = new Set(['#','W','f','o','O','P','F','L','B','D','T','S','K','J','g','U']);
const TALL  = new Set(['B','O','P','F','L']);
const REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ───────────── UTILIDADES ───────────── */
const $ = (id) => document.getElementById(id);
const music = $('background-music');
const rnd = (a, b) => a + Math.random() * (b - a);
function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = cl((n >> 16) & 255), g = cl((n >> 8) & 255), b = cl(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function hash(a, b) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/* ═══════════════════════════════════════════════════════════
   DATOS: NIVELES, MAPAS Y PERSONAJES
   Leyenda de mapa:
   #pared  W ventana  f estandarte  o pilastra  . piso  R alfombra
   X salida  D escritorio  T mesa  S banco  K celda  J estrado
   B biblioteca  O columna  P planta  F bandera  L lámpara
   g pizarrón (en la pared)  U urna de votación
═══════════════════════════════════════════════════════════ */
const LEVELS = [
  /* ───────── NIVEL 0: LICEO (práctica) ───────── */
  {
    id: 0, short: 'LICEO', title: 'Salón de convivencia', theme: 'school', icon: '🏫', practice: true,
    desc: 'Antes de llegar a la comisaría empezamos por lo social: ¿qué es un conflicto, cómo se resuelve y de qué maneras participamos en la sociedad?',
    start: { x: 9.5, y: 9.6 },
    map: [
      '####W##gg##gg##W####',
      '#B...............P.#',
      '#F......TT.....U..F#',
      '#..................#',
      '#..DD..DD....DD..DD#',
      '#..................#',
      '#..DD..DD....DD..DD#',
      '#..................#',
      '#..DD..DD....DD..DD#',
      '#L......RRRR......L#',
      '#........XX........#',
      '####################',
    ],
    npcs: [
      { id: 'n0a', tx: 7, ty: 2, name: 'PROFESOR MASARES', role: 'DOCENTE',
        look: { skin: '#e8b88a', hair: '#5a3a2a', hs: 'bald', baldByChoice: true, top: '#2878c8', bottom: '#171717', shoes: '#654321', build: 'robust' },
        say: 'Hoy hicimos una dinámica: una sola caja para todo el curso y todos querían encestar sus bollitos de papel al mismo tiempo. Empezaron a discutir por los turnos.',
        question: '¿Qué está pasando en el aula?',
        opts: ['Un conflicto: hay intereses que chocan por un mismo recurso', 'Un delito, porque hay una discusión', 'Se creó una norma jurídica nueva', 'Nada, porque nadie se golpeó'], ans: 0,
        exp: 'Un conflicto aparece cuando personas o grupos tienen intereses, necesidades o ideas opuestas. No requiere violencia: es parte normal de la vida en sociedad. Lo importante es cómo lo resolvemos.',
        norma: 'Sociología: el conflicto social', link: null },
      { id: 'n0b', tx: 12, ty: 5, name: 'ADSCRIPTA MORALES', role: 'ADSCRIPTA',
        look: { skin: '#d9a679', hair: '#2a1a12', hs: 'long', top: '#2f7a6e', bottom: '#2a3340', acc: 'folder' },
        say: 'Dos grupos discuten por quién usa la cancha en el recreo. Cada uno dice que llegó primero y nadie quiere ceder.',
        question: '¿Qué camino ayuda a resolver el conflicto respetando a todos?',
        opts: ['Dialogar y negociar un acuerdo, con ayuda de una tercera persona si hace falta', 'Que decida el grupo más fuerte', 'Evitar el tema hasta que se olviden', 'Resolverlo a los empujones para terminar rápido'], ans: 0,
        exp: 'El diálogo, la negociación y la mediación permiten llegar a acuerdos sin violencia. Las normas de convivencia existen para regular cómo nos relacionamos y resolver los conflictos respetando los derechos de todas las personas.',
        norma: 'Sociología: convivencia y resolución pacífica', link: null },
      { id: 'n0c', tx: 15, ty: 3, name: 'CAMILA', role: 'ESTUDIANTE',
        look: { skin: '#c99068', hair: '#1c1c22', hs: 'long', top: '#e8742f', bottom: '#2d3a5a' },
        say: 'Mi abuela dice que en las elecciones hay que ir a votar sí o sí, y que nadie puede saber por quién votó.',
        question: '¿Qué establece la Constitución uruguaya sobre el voto?',
        opts: ['El voto es secreto y obligatorio', 'El voto es público y voluntario', 'Solo pueden votar quienes pertenecen a un partido', 'Cada persona decide si su voto es secreto o no'], ans: 0,
        exp: 'La Constitución establece que el voto es secreto y obligatorio. Votar es una forma de participación individual que, sumada a la de todas las personas, decide cómo se gobierna el país.',
        norma: 'Constitución — art. 77', link: 'https://impo.com.uy/bases/constitucion/1967-1967/77' },
      { id: 'n0d', tx: 5, ty: 7, name: 'BRUNO', role: 'ESTUDIANTE',
        look: { skin: '#f0c090', hair: '#7a4a22', hs: 'short', top: '#3a7a4a', bottom: '#2c2c3a', acc: 'cap', cap: '#7a3fb0' },
        say: 'Con mis compañeros queremos formar un centro de estudiantes para defender intereses comunes. ¿Tenemos derecho a organizarnos?',
        question: '¿Qué derecho reconoce la Constitución para que las personas se organicen en grupos?',
        opts: ['El derecho de asociación', 'El derecho de propiedad', 'La legítima defensa', 'La obligación de votar'], ans: 0,
        exp: 'La Constitución reconoce el derecho de asociación: las personas pueden agruparse para perseguir fines comunes, siempre que no constituyan una asociación ilícita declarada por la ley. Es una forma de participación colectiva.',
        norma: 'Constitución — art. 39', link: 'https://www.impo.com.uy/bases/constitucion/1967-1967/39' },
    ],
  },

  /* ───────── NIVEL 1: COMISARÍA ───────── */
  {
    id: 1, short: 'COMISARÍA', title: 'Comisaría central', theme: 'police', icon: '🚔',
    desc: 'Tres personas esperan para hacer su denuncia. Hablá con cada una y ayudalas a reconocer el delito.',
    start: { x: 9.5, y: 9.6 },
    map: [
      '####W####ff####W####',
      '#BB.............KK.#',
      '#..................#',
      '#..DD.....RRRR..KK.#',
      '#..................#',
      '#.P....DDDD....P...#',
      '#..................#',
      '#..DD..........DD..#',
      '#..................#',
      '#.L..............L.#',
      '#........XX........#',
      '####################',
    ],
    npcs: [
      { id: 'n1', tx: 4, ty: 4, name: 'ROSA', role: 'VÍCTIMA',
        look: { skin: '#f1c27d', hair: '#6b3a1e', hs: 'long', top: '#d65a7a', bottom: '#3b3f66' },
        say: 'Una persona tomó mi celular y se lo llevó para quedárselo. ¡Necesito hacer la denuncia!',
        question: '¿Qué norma jurídica corresponde?',
        opts: ['Hurto', 'Lesiones personales', 'Legítima defensa', 'Testimonio'], ans: 0,
        exp: 'Apoderarse de un bien ajeno y conservarlo corresponde al hurto. El Código Penal brinda la normativa aplicable al caso.',
        norma: 'Hurto — art. 340', link: 'https://www.impo.com.uy/bases/codigo-penal/9155-1933/340' },
      { id: 'n2', tx: 9, ty: 6, name: 'DON CARLOS', role: 'TESTIGO',
        look: { skin: '#e0b08a', hair: '#d4d4d4', hs: 'bald', top: '#5f8a5a', bottom: '#4a4036', acc: 'glasses' },
        say: 'Vi una discusión en la calle. Alguien salió lastimado y necesitó atención médica.',
        question: '¿Qué norma jurídica está siendo evaluada?',
        opts: ['Hurto', 'Lesiones personales', 'Legítima defensa', 'Testimonio'], ans: 1,
        exp: 'Las lesiones personales se investigan según la conducta que produjo el daño y sus consecuencias.',
        norma: 'Lesiones — art. 316', link: 'https://www.impo.com.uy/bases/codigo-penal/9155-1933/316' },
      { id: 'n3', tx: 15, ty: 4, name: 'TOMÁS', role: 'DENUNCIANTE',
        look: { skin: '#c68642', hair: '#1c1c22', hs: 'short', top: '#4a7bd0', bottom: '#2d2d3a', acc: 'cap', cap: '#d9822b' },
        say: 'Me atacaron de golpe y usé la fuerza para defenderme de esa agresión injusta.',
        question: '¿Qué norma jurídica debe analizarse?',
        opts: ['Hurto', 'Lesiones personales', 'Legítima defensa', 'Testimonio'], ans: 2,
        exp: 'La legítima defensa exige analizar la agresión, la necesidad del medio y la proporción de la respuesta.',
        norma: 'Legítima defensa — art. 26', link: 'https://www.impo.com.uy/bases/codigo-penal/9155-1933/26' },
    ],
  },

  /* ───────── NIVEL 2: TRIBUNAL ───────── */
  {
    id: 2, short: 'TRIBUNAL', title: 'Oficina del tribunal', theme: 'court', icon: '🏛️',
    desc: 'Los casos se parecen entre sí. Relacioná cada situación con la norma adecuada y analizá qué elementos las distinguen.',
    start: { x: 9.5, y: 9.6 },
    map: [
      '##W##o##W##W##o##W##',
      '#F................F#',
      '#.O..TT......TT..O.#',
      '#.......RRRRRR.....#',
      '#.SS....RRRRRR..SS.#',
      '#.......RRRRRR.....#',
      '#.SS....RRRRRR..SS.#',
      '#.......RRRRRR.....#',
      '#.O..TT..RR..TT..O.#',
      '#........RR........#',
      '#........XX........#',
      '####################',
    ],
    npcs: [
      { id: 'n4', tx: 7, ty: 3, name: 'JUEZA RAMÍREZ', role: 'JUEZA',
        look: { skin: '#e8b88a', hair: '#4a2a18', hs: 'bun', top: '#1c1c28', bottom: '#111', acc: 'robe' },
        say: 'CASO A: Martín toma una bicicleta ajena y se la lleva para quedársela. CASO B: Lucía golpea a otra persona y le provoca una lesión.',
        question: '¿Qué combinación corresponde?',
        opts: ['Caso A → Hurto; Caso B → Lesiones personales', 'Caso A → Lesiones; Caso B → Hurto', 'Caso A → Defensa; Caso B → Testimonio', 'Caso A → Testimonio; Caso B → Defensa'], ans: 0,
        exp: 'El caso de Martín se relaciona con el hurto por la apropiación de un bien ajeno. El caso de Lucía requiere evaluar las lesiones personales.',
        norma: 'Hurto — art. 340', link: 'https://www.impo.com.uy/bases/codigo-penal/9155-1933/340' },
      { id: 'n5', tx: 11, ty: 6, name: 'INVESTIGADOR SILVA', role: 'POLICÍA',
        look: { skin: '#d9a679', hair: '#222', hs: 'short', top: '#3b4f6e', bottom: '#222a3a', acc: 'cap', cap: '#1d3a8a', badge: true },
        say: 'CASO C: Ana recibe una agresión inesperada y responde con una fuerza que considera necesaria para retirarse.',
        question: '¿Qué punto debe analizarse antes de decidir?',
        opts: ['La apariencia de la persona agresora', 'La agresión ilegítima, la necesidad racional del medio y la falta de provocación suficiente', 'Si la víctima tiene antecedentes', 'Si el caso fue publicado en redes sociales'], ans: 1,
        exp: 'La legítima defensa no se establece solo por decir que se defendía. Deben analizarse los elementos exigidos por la normativa.',
        norma: 'Legítima defensa — art. 26', link: 'https://www.impo.com.uy/bases/codigo-penal/9155-1933/26' },
      { id: 'n6', tx: 15, ty: 3, name: 'FISCAL TORRES', role: 'FISCAL',
        look: { skin: '#f0c090', hair: '#8a8a8a', hs: 'short', top: '#27324f', bottom: '#1b2238', acc: 'folder' },
        say: 'CASO D: Un objeto ajeno fue llevado sin autorización, pero no se encontró una intención de apropiación permanente.',
        question: '¿Qué conclusión es más prudente?',
        opts: ['Confirmar automáticamente el hurto', 'Analizar el hecho y la intención según la norma aplicable', 'Ignorar el caso', 'Declarar que no existe delito'], ans: 1,
        exp: 'La intención y las circunstancias deben evaluarse con la normativa aplicable. No se puede concluir sin una investigación suficiente.',
        norma: 'Hurto — art. 340', link: 'https://www.impo.com.uy/bases/codigo-penal/9155-1933/340' },
    ],
  },

  /* ───────── NIVEL 3: AUDIENCIA ───────── */
  {
    id: 3, short: 'AUDIENCIA', title: 'Sala de audiencia', theme: 'hearing', icon: '⚖️',
    desc: 'Llegó un expediente completo. Decidí qué régimen corresponde y construí una conclusión con hechos, pruebas y norma aplicable.',
    start: { x: 9.5, y: 9.6 },
    map: [
      '###W###W####W###W###',
      '#B..............B..#',
      '#......JJJJJJ......#',
      '#.F............F...#',
      '#..SS........SS....#',
      '#..................#',
      '#..SS...RRRR...SS..#',
      '#..................#',
      '#..SS...RRRR...SS..#',
      '#.......RRRR.......#',
      '#........XX........#',
      '####################',
    ],
    npcs: [
      { id: 'n7', tx: 5, ty: 5, name: 'ABOGADA LÓPEZ', role: 'DEFENSORA',
        look: { skin: '#c99068', hair: '#2a1a12', hs: 'long', top: '#7a2a4a', bottom: '#2a2030', acc: 'folder' },
        say: 'EXPEDIENTE 01: Un adolescente de 16 años es señalado como autor de una conducta que podría constituir una infracción penal.',
        question: '¿Qué régimen corresponde analizar?',
        opts: ['Se aplica automáticamente el mismo procedimiento que a un adulto', 'No existe responsabilidad penal para adolescentes', 'Existe un régimen especial previsto por el Código de la Niñez y la Adolescencia', 'La víctima decide la sanción'], ans: 2,
        exp: 'El Código de la Niñez y la Adolescencia establece un régimen especial para adolescentes. La responsabilidad se determina mediante sentencia definitiva.',
        norma: 'Código de la Niñez y la Adolescencia — art. 74', link: 'https://www.impo.com.uy/bases/codigo-ninez-adolescencia/17823-2004/74' },
      { id: 'n8', tx: 9, ty: 7, name: 'SECRETARIO PÉREZ', role: 'SECRETARIO',
        look: { skin: '#e0b08a', hair: '#3a2a1a', hs: 'short', top: '#6a7a8a', bottom: '#2c3340', acc: 'glasses' },
        say: 'HECHOS: el joven fue identificado en un lugar donde se encontró un objeto. PRUEBAS: una grabación y un testimonio. NORMA: régimen especial para adolescentes.',
        question: '¿Qué debe hacer el juez antes de decidir?',
        opts: ['Concluir por la edad del acusado', 'Analizar los hechos y las pruebas con la norma aplicable', 'Ignorar la grabación', 'Imponer la sanción por opinión pública'], ans: 1,
        exp: 'La decisión debe basarse en los hechos, las pruebas y la norma aplicable, sin sustituir el análisis por suposiciones.',
        norma: 'Código de la Niñez y la Adolescencia — art. 74', link: 'https://www.impo.com.uy/bases/codigo-ninez-adolescencia/17823-2004/74' },
      { id: 'n9', tx: 10, ty: 3, name: 'JUEZ MENDOZA', role: 'JUEZ',
        look: { skin: '#f0c090', hair: '#bdbdbd', hs: 'short', top: '#15151f', bottom: '#111', acc: 'robe' },
        say: 'DECISIÓN FINAL: este expediente debe culminar con una conclusión fundada.',
        question: '¿Qué formato conviene?',
        opts: ['Hechos → pruebas → norma → decisión', 'Hechos → opinión → conclusión', 'Solo el nombre del acusado', 'Decisión de la víctima'], ans: 0,
        exp: 'Una conclusión jurídica sólida relaciona los hechos, las pruebas, la norma aplicable y la decisión adoptada.',
        norma: 'Código de la Niñez y la Adolescencia — art. 74', link: 'https://www.impo.com.uy/bases/codigo-ninez-adolescencia/17823-2004/74' },
    ],
  },
];
const NPC_BY_ID = {};
const SCENARIO_VARIANTS = {
  n0a: [
    { say: 'En el laboratorio hay una sola computadora disponible y dos equipos necesitan usarla para preparar sus presentaciones antes de clase. Ambos dicen que su trabajo debe ir primero.', question: '¿Qué situación se presenta entre los equipos?' },
    { say: 'Durante una actividad, varios estudiantes quieren ocupar el mismo espacio del patio para propuestas distintas. Cada grupo considera que su actividad es prioritaria.', question: '¿Qué concepto ayuda a describir esta situación?' },
  ],
  n0b: [
    { say: 'Dos grupos quieren presentar sus proyectos en primer lugar en la feria del liceo. Ninguno acepta cambiar el horario y la discusión empieza a afectar la organización.', question: '¿Qué camino podría ayudar a resolver este desacuerdo de forma respetuosa?' },
    { say: 'En un trabajo grupal, dos compañeros discrepan sobre cómo repartir las tareas y no logran avanzar. El resto del equipo propone pedir ayuda para conversar.', question: '¿Qué respuesta permite buscar un acuerdo sin imponerlo por la fuerza?' },
  ],
  n0c: [
    { say: 'Se acercan las elecciones nacionales y en clase conversamos sobre las garantías del sufragio. Una compañera pregunta si otras personas pueden exigirle que revele su elección.', question: '¿Qué garantías constitucionales caracterizan el voto en Uruguay?' },
    { say: 'Un estudiante escuchó que puede votar en una elección, pero cree que su decisión se registra con su nombre para que todos sepan qué eligió.', question: '¿Qué establece la Constitución uruguaya sobre el voto?' },
  ],
  n0d: [
    { say: 'Un grupo de estudiantes quiere crear una asociación para organizar actividades culturales y representar intereses comunes dentro del centro educativo.', question: '¿Qué derecho permite organizarse para perseguir fines comunes?' },
    { say: 'Varias familias del barrio quieren formar una organización para impulsar una biblioteca comunitaria y coordinar actividades abiertas.', question: '¿Qué derecho constitucional ampara la organización de este grupo?' },
  ],
  n1: [
    { say: 'Al salir de una tienda, una persona nota que ya no tiene la bicicleta que había dejado junto a la entrada. Un testigo vio a alguien llevársela sin permiso.', question: '¿Qué norma jurídica corresponde analizar ante la apropiación de un bien ajeno?' },
    { say: 'Durante un descuido, alguien tomó la mochila de otra persona del banco de una plaza y se marchó con ella.', question: '¿Qué norma jurídica debe investigarse en esta situación?' },
  ],
  n2: [
    { say: 'Presencié un choque entre dos ciclistas. Una de las personas cayó y tuvo que recibir atención médica; todavía se están aclarando las circunstancias.', question: '¿Qué norma jurídica podría evaluarse a partir del daño físico?' },
    { say: 'En una discusión, una persona resultó con una lesión y fue trasladada para recibir asistencia. No conozco todos los detalles de lo ocurrido.', question: '¿Qué norma jurídica corresponde investigar, sin adelantar una conclusión?' },
  ],
  n3: [
    { say: 'Una persona cuenta que, ante una agresión que estaba ocurriendo, reaccionó para protegerse y poder alejarse. La investigación debe establecer qué pasó exactamente.', question: '¿Qué norma jurídica debe analizarse junto con las circunstancias de la respuesta?' },
    { say: 'Alguien afirma que intervino para detener un ataque contra otra persona. Aún hay que determinar si existía una agresión y qué medios se utilizaron.', question: '¿Qué norma jurídica puede considerarse, sujeta al análisis de los hechos?' },
  ],
  n4: [
    { say: 'CASO A: Valentina encuentra una billetera ajena y se la lleva con intención de quedársela. CASO B: Durante una pelea, una persona golpea a otra y le causa una lesión.', question: '¿Qué combinación identifica las normas que deben analizarse en ambos casos?' },
    { say: 'CASO A: Alguien toma una bicicleta ajena para conservarla. CASO B: Una discusión termina con una persona lastimada que requiere atención médica.', question: '¿Qué combinación relaciona correctamente cada hecho con la norma correspondiente?' },
  ],
  n5: [
    { say: 'Una persona relata que empujó a otra para detener una agresión que estaba ocurriendo. Hay testigos con versiones distintas y se investiga si la respuesta era necesaria.', question: '¿Qué elementos deben valorarse antes de concluir que hubo legítima defensa?' },
    { say: 'Tras una amenaza inmediata, alguien utilizó la fuerza para protegerse. El expediente aún debe aclarar quién inició la agresión y si había otra forma razonable de evitarla.', question: '¿Qué debe analizarse para determinar si se cumplen los requisitos de la legítima defensa?' },
  ],
  n6: [
    { say: 'Una persona guardó por unos minutos un objeto ajeno para evitar que se dañara y luego lo devolvió. Un testigo lo interpretó como un intento de apropiación.', question: '¿Qué conclusión es prudente antes de calificar jurídicamente el hecho?' },
    { say: 'Una cámara muestra a alguien llevando un objeto que no era suyo, pero las imágenes no permiten saber por qué lo tomó ni qué pensaba hacer con él.', question: '¿Cómo corresponde proceder antes de afirmar que se cometió hurto?' },
  ],
  n7: [
    { say: 'EXPEDIENTE 02: Una adolescente de 15 años es investigada por una conducta que podría constituir una infracción a la ley penal.', question: '¿Qué régimen jurídico debe considerarse para analizar este expediente?' },
    { say: 'EXPEDIENTE 03: Un joven de 17 años es señalado en una denuncia. La investigación recién comienza y todavía no se ha determinado su responsabilidad.', question: '¿Qué marco jurídico corresponde aplicar al analizar la situación de un adolescente?' },
  ],
  n8: [
    { say: 'HECHOS: una adolescente estaba cerca del lugar donde ocurrió un daño. PRUEBAS: hay un video parcial y dos testimonios que no coinciden. NORMA: se trata de un proceso con régimen especial para adolescentes.', question: '¿Qué debe hacer el juez antes de resolver el caso?' },
    { say: 'HECHOS: un adolescente fue identificado después de un incidente. PRUEBAS: se presentó un objeto y declaraciones de testigos, pero aún deben verificarse. NORMA: corresponde estudiar el régimen especial aplicable.', question: '¿En qué debe basarse una decisión fundada?' },
  ],
  n9: [
    { say: 'EXPEDIENTE 04: el tribunal debe resolver una denuncia contra un adolescente. Las partes presentaron relatos, documentos y pruebas que deben valorarse.', question: '¿Qué orden de razonamiento permite llegar a una decisión jurídica fundada?' },
    { say: 'EXPEDIENTE 05: antes de resolver, la jueza debe explicar qué hechos considera probados, qué evidencia los respalda y qué norma aplica.', question: '¿Qué estructura debería seguir la conclusión del tribunal?' },
  ],
};

LEVELS.forEach((lv) => lv.npcs.forEach((n) => {
  n.face = 'down';
  n.scenarios = [{ say: n.say, question: n.question }, ...SCENARIO_VARIANTS[n.id]];
  n.lastScenario = -1;
  NPC_BY_ID[n.id] = n;
}));

function selectScenarios() {
  LEVELS.forEach((lv) => lv.npcs.forEach((n) => {
    const choices = n.scenarios.map((_, i) => i).filter((i) => i !== n.lastScenario);
    const next = choices[Math.floor(Math.random() * choices.length)];
    n.say = n.scenarios[next].say;
    n.question = n.scenarios[next].question;
    n.lastScenario = next;
  }));
}

const DETECTIVES = {
  female: { skin: '#f0c090', hair: '#3b2a1a', hs: 'long', top: '#b58f58', bottom: '#34344a', acc: 'fedora', trench: true, badge: true },
  male: { skin: '#f0c090', hair: '#3b2a1a', hs: 'short', top: '#b58f58', bottom: '#34344a', acc: 'fedora', trench: true, badge: true },
};
let detective = DETECTIVES.female;

/* Paletas por escenario */
const PAL = {
  police:  { floorA: '#9fb2cf', floorB: '#8fa3c2', wall: '#38507a', wallTop: '#5d79ad', rug: '#2a4d92', rugEdge: '#e8b84a', banner: '#2a56b8' },
  court:   { floorA: '#f1e8d3', floorB: '#e6dbc2', vein: '#cdbf9f', wall: '#6a3f29', wallTop: '#8d5c3e', rug: '#a3232f', rugEdge: '#e8b84a', banner: '#7a1d28' },
  hearing: { floorA: '#bd8a57', floorB: '#b07f4e', plank: '#9a6c3d', wall: '#4a2d1e', wallTop: '#6e4630', rug: '#1f6150', rugEdge: '#e8b84a', banner: '#1f6150' },
  school:  { floorA: '#e2dcc4', floorB: '#d6cfb2', wall: '#46705f', wallTop: '#76a892', rug: '#3f6fb5', rugEdge: '#ffd24d', banner: '#d9822b' },
};

/* ═══════════════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════════════ */
const G = {
  state: 'title', lvl: 0, score: 0, lives: 3, streak: 0,
  results: [], done: {}, levelDone: false, near: null,
  cur: null, order: null, answered: false, fbShown: false,
  player: { x: 9.5, y: 9.6, dir: 'down', moving: false },
  parts: [], floats: [], shake: 0, flash: 0, exitMsgAt: 0,
};
let mode = 'dark';          // 'dark' | 'light'
let isTouch = false;
let sfxVolume = 0.7;
const held = { left: false, right: false, up: false, down: false };
let lastStep = 0;

function setState(s) { G.state = s; document.body.dataset.state = s; }

/* ═══════════════════════════════════════════════════════════
   SONIDO (Web Audio, efectos retro)
═══════════════════════════════════════════════════════════ */
const Sfx = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      try { this.ctx = new A(); } catch (e) { return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, d, type, v, delay, slide) {
    if (sfxVolume === 0 || !this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime((v || 0.05) * sfxVolume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + d + 0.02);
  },
  blip()   { this.tone(660, 0.07, 'square', 0.04); },
  tick()   { this.tone(880 + Math.random() * 120, 0.025, 'square', 0.012); },
  step()   { this.tone(110 + Math.random() * 30, 0.04, 'triangle', 0.03); },
  good()   { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'square', 0.05, i * 0.08)); },
  bad()    { this.tone(220, 0.35, 'sawtooth', 0.06, 0, 70); },
  win()    { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'square', 0.05, i * 0.1)); },
};

/* ═══════════════════════════════════════════════════════════
   TEMA CLARO / OSCURO
═══════════════════════════════════════════════════════════ */
const bakes = {};
function applyMode() {
  document.documentElement.setAttribute('data-theme', mode);
  const b = $('btn-theme');
  b.textContent = mode === 'dark' ? '☀️' : '🌙';
  b.setAttribute('aria-label', mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  Object.keys(bakes).forEach((k) => delete bakes[k]);
}
function initMode() {
  let saved = null;
  try { saved = localStorage.getItem('lq-theme'); } catch (e) { /* sin almacenamiento */ }
  mode = (saved === 'light' || saved === 'dark') ? saved : 'light';
  let savedMusicVolume = null, savedSfxVolume = null;
  try {
    savedMusicVolume = localStorage.getItem('lq-music-volume');
    savedSfxVolume = localStorage.getItem('lq-sfx-volume');
  } catch (e) { /* sin almacenamiento */ }
  const musicVolume = Number(savedMusicVolume);
  const effectVolume = Number(savedSfxVolume);
  music.volume = savedMusicVolume !== null && Number.isFinite(musicVolume) ? Math.max(0, Math.min(1, musicVolume)) : 0.15;
  sfxVolume = savedSfxVolume !== null && Number.isFinite(effectVolume) ? Math.max(0, Math.min(1, effectVolume)) : 1;
  $('music-volume').value = music.volume;
  $('sfx-volume').value = sfxVolume;
  updateVolumeControls();
  applyMode();
}
function playMusic() {
  music.play().catch((error) => {
    console.error('No se pudo reproducir la música de fondo.', error);
    toast('No se pudo iniciar la música. Revisá que el archivo esté disponible.');
  });
}
function toggleMode() {
  mode = mode === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('lq-theme', mode); } catch (e) { /* ignorar */ }
  applyMode();
  Sfx.init(); Sfx.blip();
}
function updateVolumeControls() {
  const musicVolume = Number($('music-volume').value);
  const effectVolume = Number($('sfx-volume').value);
  $('music-volume-value').value = Math.round(musicVolume * 100) + '%';
  $('sfx-volume-value').value = Math.round(effectVolume * 100) + '%';
  $('btn-sound').textContent = musicVolume === 0 && effectVolume === 0 ? '🔇' : '🔊';
}
function setMusicVolume() {
  music.volume = Number($('music-volume').value);
  try { localStorage.setItem('lq-music-volume', String(music.volume)); } catch (e) { /* ignorar */ }
  updateVolumeControls();
}
function setSfxVolume() {
  sfxVolume = Number($('sfx-volume').value);
  try { localStorage.setItem('lq-sfx-volume', String(sfxVolume)); } catch (e) { /* ignorar */ }
  updateVolumeControls();
}
function toggleSoundControls() {
  const button = $('btn-sound');
  const controls = $('sound-controls');
  const isOpen = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!isOpen));
  button.setAttribute('aria-label', isOpen ? 'Abrir controles de volumen' : 'Cerrar controles de volumen');
  controls.hidden = isOpen;
}

/* ═══════════════════════════════════════════════════════════
   SPRITES: PERSONAS (dibujadas con rectángulos, estilo pixel)
═══════════════════════════════════════════════════════════ */
function drawPerson(c, px, py, L, dir, moving, t, ex) {
  ex = ex || {};
  px = Math.round(px); py = Math.round(py);
  const ph = t * 0.013;
  const b = moving ? -Math.round(Math.abs(Math.sin(ph)) * 1.6) : Math.round(Math.sin(t * 0.004) * 0.6);
  const st = moving && Math.sin(ph) > 0;
  const skin = L.skin, top = L.top;
  const robust = L.build === 'robust';

  // sombra
  c.fillStyle = 'rgba(0,0,0,.28)';
  c.beginPath(); c.ellipse(px, py, 9, 3.2, 0, 0, Math.PI * 2); c.fill();

  // piernas o túnica
  if (L.acc === 'robe') {
    R(c, px - 6, py - 14 + b, 12, 14, top);
    R(c, px - 6, py - 3, 12, 3, shade(top, 0.7));
    R(c, px - 4, py - 1, 3, 1, '#111'); R(c, px + 1, py - 1, 3, 1, '#111');
  } else {
    const legWidth = robust ? 5 : 4;
    const legLeft = robust ? -6 : -5;
    const lo = moving ? (st ? -1 : 0) : 0, ro = moving ? (st ? 0 : -1) : 0;
    R(c, px + legLeft, py - 8 + b + lo, legWidth, 8, L.bottom);
    R(c, px + 1, py - 8 + b + ro, legWidth, 8, L.bottom);
    R(c, px + legLeft, py - 2 + lo, legWidth, 2, L.shoes || '#1d1a22');
    R(c, px + 1, py - 2 + ro, legWidth, 2, L.shoes || '#1d1a22');
  }

  // torso y brazos
  const torsoWidth = robust ? 20 : 12;
  const torsoLeft = -torsoWidth / 2;
  R(c, px + torsoLeft, py - 18 + b, torsoWidth, 11, top);
  R(c, px + torsoLeft, py - 18 + b, torsoWidth, 2, shade(top, 1.2));
  if (L.trench) {
    R(c, px - 6, py - 9 + b, 12, 4, top);
    R(c, px - 6, py - 11 + b, 12, 2, '#6b4a22');
    R(c, px - 1, py - 18 + b, 2, 6, shade(top, 0.7));
  }
  const armOffset = robust ? 11 : 9;
  R(c, px - armOffset, py - 17 + b, 3, 9, top); R(c, px + armOffset - 3, py - 17 + b, 3, 9, top);
  R(c, px - armOffset, py - 9 + b, 3, 2, skin); R(c, px + armOffset - 3, py - 9 + b, 3, 2, skin);

  // cabeza
  const headWidth = robust ? 14 : 10;
  const headLeft = -headWidth / 2;
  R(c, px + headLeft, py - 27 + b, headWidth, 10, skin);
  const hc = L.hair;
  if (!(L.hs === 'bald' && L.baldByChoice)) {
    if (dir === 'up') {
      R(c, px - 5, py - 28 + b, 10, 11, hc);
    } else {
      if (L.hs === 'bald') {
        R(c, px + headLeft, py - 25 + b, 1, 3, hc);
        R(c, px + headWidth / 2 - 1, py - 25 + b, 1, 3, hc);
        R(c, px - 3, py - 28 + b, 6, 1, hc);
      } else {
        R(c, px - 5, py - 28 + b, 10, 4, hc);
        R(c, px - 5, py - 25 + b, 1, 3, hc); R(c, px + 4, py - 25 + b, 1, 3, hc);
      }
      if (L.hs === 'long') { R(c, px - 6, py - 27 + b, 2, 12, hc); R(c, px + 4, py - 27 + b, 2, 12, hc); }
      if (L.hs === 'bun') { R(c, px - 2, py - 32 + b, 4, 4, hc); }
      if (dir === 'left')  R(c, px + 1, py - 25 + b, 4, 6, hc);
      if (dir === 'right') R(c, px - 5, py - 25 + b, 4, 6, hc);
    }
  }
  if (dir === 'down') {
    R(c, px - 3, py - 23 + b, 2, 2, '#14141c'); R(c, px + 1, py - 23 + b, 2, 2, '#14141c');
    R(c, px - 1, py - 19 + b, 2, 1, '#a5545a');
  } else if (dir === 'left') {
    R(c, px - 4, py - 23 + b, 2, 2, '#14141c'); R(c, px - 4, py - 19 + b, 2, 1, '#a5545a');
  } else if (dir === 'right') {
    R(c, px + 2, py - 23 + b, 2, 2, '#14141c'); R(c, px + 2, py - 19 + b, 2, 1, '#a5545a');
  }

  // accesorios
  switch (L.acc) {
    case 'fedora':
      R(c, px - 8, py - 29 + b, 16, 2, '#25252d'); R(c, px - 5, py - 34 + b, 10, 6, '#25252d'); R(c, px - 5, py - 30 + b, 10, 1, '#c0392b'); break;
    case 'cap': {
      const cc = L.cap || '#1d3a8a';
      R(c, px - 5, py - 31 + b, 10, 4, cc);
      R(c, px - 7, py - 28 + b, dir === 'up' ? 10 : 14, 2, shade(cc, 0.8));
      R(c, px - 1, py - 30 + b, 2, 2, '#e8b84a'); break;
    }
    case 'glasses':
      if (dir === 'down') {
        c.strokeStyle = '#1a1a22'; c.lineWidth = 1;
        c.strokeRect(px - 4.5, py - 23.5 + b, 4, 3); c.strokeRect(px + 0.5, py - 23.5 + b, 4, 3);
        R(c, px - 1, py - 22 + b, 2, 1, '#1a1a22');
      } break;
    case 'folder':
      R(c, px + 7, py - 14 + b, 7, 9, '#f2e8cb'); R(c, px + 7, py - 14 + b, 7, 2, '#c0392b'); break;
    case 'robe':
      R(c, px - 2, py - 18 + b, 4, 3, '#ffffff'); break;
    default: break;
  }
  if (L.badge) R(c, px + 2, py - 14 + b, 3, 3, '#e8b84a');
  if (ex.lens) {
    c.strokeStyle = '#ffd24d'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(px + 13, py - 13 + b, 3.6, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(px + 10, py - 10 + b); c.lineTo(px + 8, py - 8 + b); c.stroke();
  }
}

/* ═══════════════════════════════════════════════════════════
   MAPA: TILES FIJOS (se dibujan una vez y se guardan)
═══════════════════════════════════════════════════════════ */
function drawFloor(c, pal, theme, x, y, r, col) {
  if (theme === 'police') {
    R(c, x, y, TS, TS, (r + col) % 2 ? pal.floorA : pal.floorB);
    R(c, x, y, TS, 1, 'rgba(255,255,255,.18)'); R(c, x, y, 1, TS, 'rgba(255,255,255,.12)');
  } else if (theme === 'court') {
    R(c, x, y, TS, TS, (r + col) % 2 ? pal.floorA : pal.floorB);
    R(c, x, y + TS - 1, TS, 1, 'rgba(0,0,0,.12)'); R(c, x + TS - 1, y, 1, TS, 'rgba(0,0,0,.12)');
    const h = hash(col, r);
    if (h > 0.35) {
      c.strokeStyle = pal.vein; c.lineWidth = 1; c.beginPath();
      c.moveTo(x + 4 + h * 10, y + 2); c.lineTo(x + 16 + h * 6, y + 14); c.lineTo(x + 10 + h * 12, y + 28); c.stroke();
    }
  } else if (theme === 'school') {
    R(c, x, y, TS, TS, (r + col) % 2 ? pal.floorA : pal.floorB);
    R(c, x, y, TS, 1, 'rgba(255,255,255,.3)'); R(c, x, y, 1, TS, 'rgba(255,255,255,.2)');
    for (let k = 0; k < 3; k++) R(c, x + 3 + Math.floor(hash(col * 3 + k, r) * 24), y + 3 + Math.floor(hash(r * 5 + k, col) * 24), 2, 1, 'rgba(0,0,0,.1)');
  } else {
    for (let k = 0; k < 4; k++) {
      R(c, x, y + k * 8, TS, 8, (k + r) % 2 ? pal.floorA : pal.floorB);
      R(c, x, y + k * 8, TS, 1, pal.plank);
      R(c, x + 2 + Math.floor(hash(col + k * 7, r) * 28), y + k * 8, 1, 8, pal.plank);
    }
  }
}
function drawRug(c, pal, map, r, col, x, y) {
  R(c, x, y, TS, TS, pal.rug);
  const L = (rr, cc) => map[rr] && map[rr][cc] === 'R';
  if (!L(r - 1, col)) R(c, x, y, TS, 3, pal.rugEdge);
  if (!L(r + 1, col)) R(c, x, y + TS - 3, TS, 3, pal.rugEdge);
  if (!L(r, col - 1)) R(c, x, y, 3, TS, pal.rugEdge);
  if (!L(r, col + 1)) R(c, x + TS - 3, y, 3, TS, pal.rugEdge);
  c.fillStyle = 'rgba(255,255,255,.18)';
  c.beginPath(); c.moveTo(x + 16, y + 8); c.lineTo(x + 24, y + 16); c.lineTo(x + 16, y + 24); c.lineTo(x + 8, y + 16); c.closePath(); c.fill();
}
function drawWindowTile(c, x, y) {
  R(c, x + 4, y + 6, 24, 19, '#2a1c12');
  R(c, x + 6, y + 8, 20, 15, mode === 'dark' ? '#101a45' : '#8fd2ff');
  if (mode === 'dark') {
    R(c, x + 9, y + 11, 1, 1, '#fff'); R(c, x + 20, y + 15, 1, 1, '#fff'); R(c, x + 13, y + 19, 1, 1, '#fff');
    c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(x + 21, y + 13, 3, 0, Math.PI * 2); c.fill();
  } else {
    R(c, x + 9, y + 13, 8, 3, '#fff'); R(c, x + 11, y + 11, 5, 2, '#fff');
  }
  R(c, x + 15, y + 8, 2, 15, '#2a1c12'); R(c, x + 6, y + 15, 20, 2, '#2a1c12');
  R(c, x + 3, y + 25, 26, 3, '#d9c9a6');
}
function drawWallTile(c, pal, map, r, col, x, y, ch) {
  if (r === 0) {
    R(c, x, y, TS, TS, pal.wall);
    for (let k = 1; k < 4; k++) {
      R(c, x, y + k * 8, TS, 1, 'rgba(0,0,0,.22)');
      R(c, x + (k % 2) * 16 + 8, y + (k - 1) * 8 + 1, 1, 7, 'rgba(0,0,0,.22)');
    }
    R(c, x, y, TS, 5, pal.wallTop); R(c, x, y + 5, TS, 1, 'rgba(0,0,0,.35)');
    R(c, x, y + TS - 5, TS, 5, shade(pal.wall, 0.7));
    if (ch === 'W') drawWindowTile(c, x, y);
    if (ch === 'f') {
      R(c, x + 9, y + 3, 14, 22, pal.banner); R(c, x + 9, y + 3, 14, 1, '#e8b84a');
      for (let k = 0; k < 4; k++) R(c, x + 9 + k * 4, y + 25, 2, 3, '#e8b84a');
      R(c, x + 15, y + 7, 2, 12, '#e8b84a'); R(c, x + 11, y + 9, 10, 2, '#e8b84a');
      R(c, x + 11, y + 11, 3, 3, '#e8b84a'); R(c, x + 18, y + 11, 3, 3, '#e8b84a');
    }
    if (ch === 'g') {
      const lft = map[r][col - 1] === 'g', rgt = map[r][col + 1] === 'g';
      const bx = lft ? x : x + 3, bw = TS - (lft ? 0 : 3) - (rgt ? 0 : 3);
      R(c, bx, y + 4, bw, 23, '#6b4a2a');
      R(c, bx + (lft ? 0 : 2), y + 6, bw - (lft ? 0 : 2) - (rgt ? 0 : 2), 18, '#1f3b33');
      R(c, bx, y + 27, bw, 2, '#c9b48a');
      const h1 = hash(col, 7), h2 = hash(col, 9);
      R(c, x + 4 + Math.floor(h1 * 8), y + 10, 12, 1, 'rgba(255,255,255,.75)');
      R(c, x + 6 + Math.floor(h2 * 6), y + 15, 16, 1, 'rgba(255,255,255,.6)');
      R(c, x + 8, y + 20, 8, 1, 'rgba(255,255,255,.5)');
    }
    if (ch === 'o') {
      R(c, x + 6, y, 20, TS, shade(pal.wall, 1.25)); R(c, x + 6, y, 20, 4, shade(pal.wall, 1.5));
      R(c, x + 8, y + 4, 2, 24, 'rgba(255,255,255,.12)'); R(c, x + 22, y + 4, 2, 24, 'rgba(0,0,0,.18)');
    }
  } else {
    R(c, x, y, TS, TS, shade(pal.wall, 0.55));
    if (col === 0) R(c, x + TS - 4, y, 4, TS, pal.wallTop);
    if (col === COLS - 1) R(c, x, y, 4, TS, pal.wallTop);
    if (r === ROWS - 1) {
      R(c, x, y, TS, 5, pal.wallTop);
      if (map[r - 1][col] === 'X') {
        R(c, x, y, TS, TS, '#3a2216');
        R(c, x + 3, y + 2, 26, 30, '#8a5a32');
        R(c, x + 7, y + 6, 18, 10, '#a8743e'); R(c, x + 7, y + 19, 18, 10, '#a8743e');
        const knobRight = map[r - 1][col + 1] === 'X';
        R(c, knobRight ? x + 25 : x + 4, y + 18, 3, 3, '#e8b84a');
      }
    }
  }
}
function drawDesk(c, x, y, r, col) {
  R(c, x + 1, y + 8, 30, 16, '#b07a43'); R(c, x + 1, y + 8, 30, 2, '#d49a5c');
  R(c, x + 1, y + 24, 30, 7, '#7d5028'); R(c, x + 3, y + 24, 2, 7, '#5d3a1c'); R(c, x + 27, y + 24, 2, 7, '#5d3a1c');
  const k = (col + r) % 3;
  if (k === 0) { R(c, x + 6, y + 11, 9, 7, '#f4efe0'); R(c, x + 8, y + 13, 5, 1, '#999'); R(c, x + 18, y + 12, 7, 6, '#e7e0cc'); }
  else if (k === 1) { R(c, x + 9, y + 5, 12, 9, '#1d2230'); R(c, x + 10, y + 6, 10, 7, '#4aa3d8'); R(c, x + 13, y + 14, 4, 2, '#333'); }
  else { R(c, x + 7, y + 11, 5, 5, '#e8e2d0'); R(c, x + 8, y + 12, 3, 3, '#8b5a2b'); R(c, x + 18, y + 11, 9, 6, '#f4efe0'); }
}
function drawTable(c, x, y, r, col) {
  R(c, x + 1, y + 8, 30, 18, '#9a6a3a'); R(c, x + 1, y + 8, 30, 2, '#c08850');
  R(c, x + 1, y + 26, 30, 5, '#6b4423');
  if ((col + r) % 2) { R(c, x + 8, y + 14, 10, 3, '#4a2d14'); R(c, x + 14, y + 11, 4, 8, '#4a2d14'); }
  else { R(c, x + 6, y + 12, 9, 7, '#f4efe0'); R(c, x + 18, y + 13, 7, 6, '#e7e0cc'); }
}
function drawUrn(c, x, y) {
  R(c, x + 5, y + 10, 22, 18, '#2f6fb5'); R(c, x + 5, y + 10, 22, 3, '#5a98dc'); R(c, x + 5, y + 25, 22, 3, '#1f4f87');
  R(c, x + 11, y + 12, 10, 2, '#0b1e36');
  R(c, x + 13, y + 6, 6, 7, '#fffdf0'); R(c, x + 14, y + 8, 4, 1, '#999');
  R(c, x + 12, y + 17, 8, 6, '#fffdf0'); R(c, x + 14, y + 19, 4, 2, '#2f6fb5');
}
function drawBench(c, x, y) {
  R(c, x + 2, y + 14, 28, 10, '#7b4f2b'); R(c, x + 2, y + 6, 28, 8, '#8d5d33'); R(c, x + 2, y + 6, 28, 2, '#b4824e');
  R(c, x + 4, y + 24, 3, 5, '#4a2f18'); R(c, x + 25, y + 24, 3, 5, '#4a2f18');
}
function drawCell(c, x, y) {
  R(c, x, y, TS, TS, 'rgba(10,12,24,.55)');
  for (let k = 0; k < 5; k++) { R(c, x + 3 + k * 6, y, 3, TS, '#aab3c6'); R(c, x + 3 + k * 6, y, 1, TS, '#e6ecf7'); }
  R(c, x, y + 2, TS, 3, '#7d879c'); R(c, x, y + TS - 5, TS, 3, '#7d879c');
}
function drawJudgeBench(c, x, y, col) {
  R(c, x, y + 2, TS, TS - 2, '#3a2012'); R(c, x, y + 2, TS, 8, '#8a5530'); R(c, x, y + 2, TS, 2, '#b87a45');
  R(c, x + 3, y + 14, TS - 6, 14, '#52301b'); R(c, x + 4, y + 15, TS - 8, 12, '#5c3720');
  R(c, x + 14, y + 19, 4, 4, '#e8b84a');
  if (col % 2 === 0) R(c, x + 6, y - 1, 10, 4, '#f4efe0');
}
function bake(idx) {
  const lv = LEVELS[idx], pal = PAL[lv.theme], map = lv.map;
  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const c = cv.getContext('2d');
  c.scale(S, S); c.imageSmoothingEnabled = false;
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const ch = map[r][col], x = col * TS, y = r * TS;
      if (ch === '#' || ch === 'W' || ch === 'f' || ch === 'o' || ch === 'g') { drawWallTile(c, pal, map, r, col, x, y, ch); continue; }
      drawFloor(c, pal, lv.theme, x, y, r, col);
      if (ch === 'R') drawRug(c, pal, map, r, col, x, y);
      if (ch === 'X') {
        R(c, x + 1, y + 6, 30, 22, '#6b3a1e');
        for (let k = 0; k < 5; k++) R(c, x + 2 + k * 6, y + 6, 3, 22, 'rgba(217,167,43,.75)');
      }
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const ch = map[r][col], x = col * TS, y = r * TS;
      if (ch === 'D') drawDesk(c, x, y, r, col);
      else if (ch === 'T') drawTable(c, x, y, r, col);
      else if (ch === 'S') drawBench(c, x, y);
      else if (ch === 'K') drawCell(c, x, y);
      else if (ch === 'U') drawUrn(c, x, y);
      else if (ch === 'J') drawJudgeBench(c, x, y, col);
    }
  }
  return cv;
}
function getBake(i) { if (!bakes[i]) bakes[i] = bake(i); return bakes[i]; }

/* Objetos altos (se ordenan por profundidad junto a los personajes) */
function drawTall(c, ch, x, y, t) {
  const yb = y + TS;
  if (ch === 'B') {
    R(c, x + 1, yb - 46, 30, 46, '#6b4425'); R(c, x + 3, yb - 44, 26, 42, '#3e2713'); R(c, x + 1, yb - 46, 30, 2, '#8a5a32');
    const cols = ['#c0392b', '#2e86c1', '#d4ac0d', '#27ae60', '#8e44ad', '#e67e22'];
    for (let s = 0; s < 3; s++) {
      const sy = yb - 42 + s * 14;
      R(c, x + 3, sy + 12, 26, 2, '#6b4425');
      for (let bx = 0, k = 0; bx < 24; bx += 4, k++) {
        const hh = 7 + Math.floor(hash(k + s * 9, x) * 5);
        R(c, x + 4 + bx, sy + 12 - hh, 3, hh, cols[(k + s) % cols.length]);
      }
    }
  } else if (ch === 'O') {
    R(c, x + 6, yb - 5, 20, 5, '#d8d0bf'); R(c, x + 9, yb - 40, 14, 35, '#efe7d3');
    R(c, x + 9, yb - 40, 3, 35, '#ffffff'); R(c, x + 20, yb - 40, 3, 35, '#cfc6b0'); R(c, x + 6, yb - 46, 20, 6, '#d8d0bf');
  } else if (ch === 'P') {
    R(c, x + 10, yb - 10, 12, 10, '#b5532f'); R(c, x + 9, yb - 12, 14, 3, '#c8643c');
    [['#2f8f4a', 16, 20, 7], ['#3aa85a', 10, 16, 5], ['#3aa85a', 22, 17, 5], ['#2f8f4a', 16, 27, 5]].forEach(([col, dx, dy, rr]) => {
      c.fillStyle = col; c.beginPath(); c.arc(x + dx, yb - dy, rr, 0, Math.PI * 2); c.fill();
    });
  } else if (ch === 'F') {
    R(c, x + 15, yb - 46, 2, 46, '#c9c9c9'); R(c, x + 10, yb - 4, 12, 4, '#555');
    for (let i = 0; i < 14; i++) {
      const off = Math.sin(t * 0.004 + i * 0.5) * 1.5;
      for (let s = 0; s < 4; s++) R(c, x + 17 + i, yb - 44 + off + s * 3, 1, 3, s % 2 ? '#2f6fd6' : '#ffffff');
    }
    R(c, x + 17, yb - 44, 5, 5, '#f6c344');
  } else if (ch === 'L') {
    R(c, x + 15, yb - 40, 2, 40, '#444'); R(c, x + 11, yb - 3, 10, 3, '#333');
    c.fillStyle = mode === 'dark' ? '#ffe08a' : '#b8a56a';
    c.beginPath(); c.moveTo(x + 9, yb - 38); c.lineTo(x + 23, yb - 38); c.lineTo(x + 20, yb - 46); c.lineTo(x + 12, yb - 46); c.closePath(); c.fill();
  }
}

/* Datos derivados de cada mapa (objetos altos, luces, ventanas, salida) */
const MAPINFO = LEVELS.map((lv) => {
  const info = { talls: [], lamps: [], wins: [], exits: [] };
  lv.map.forEach((row, r) => [...row].forEach((ch, col) => {
    if (TALL.has(ch)) info.talls.push({ ch, x: col * TS, y: r * TS });
    if (ch === 'L') info.lamps.push({ x: col * TS + 16, y: (r + 1) * TS - 42 });
    if (ch === 'W') info.wins.push({ x: col * TS + 16, y: 18 });
    if (ch === 'X') info.exits.push({ x: col * TS, y: r * TS });
  }));
  return info;
});

/* ═══════════════════════════════════════════════════════════
   EFECTOS: partículas y textos flotantes
═══════════════════════════════════════════════════════════ */
function burst(x, y, kind) {
  const cols = kind === 'good' ? ['#ffd24d', '#4aa8ff', '#58e1ff', '#ff7ad9', '#ffffff'] : ['#ff9f43', '#ff7a1a', '#ffcf8a'];
  const n = kind === 'good' ? 46 : 24;
  for (let i = 0; i < n; i++) {
    G.parts.push({
      x, y, vx: rnd(-90, 90), vy: rnd(-150, -20), g: 260, life: 1, decay: rnd(0.8, 1.6),
      s: rnd(2, 4.5), c: cols[Math.floor(Math.random() * cols.length)], rot: rnd(0, 6), spin: rnd(-8, 8),
    });
  }
}
function floatText(x, y, text, color) { G.floats.push({ x, y, text, color, life: 1 }); }
function updateFx(dt) {
  G.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= p.decay * dt; p.rot += p.spin * dt; });
  G.parts = G.parts.filter((p) => p.life > 0);
  G.floats.forEach((f) => { f.y -= 22 * dt; f.life -= 0.9 * dt; });
  G.floats = G.floats.filter((f) => f.life > 0);
  G.shake = Math.max(0, G.shake - dt * 2.4);
  G.flash = Math.max(0, G.flash - dt * 2.2);
}
function drawFx(c) {
  G.parts.forEach((p) => {
    c.save(); c.globalAlpha = Math.max(0, p.life); c.translate(p.x, p.y); c.rotate(p.rot);
    c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); c.restore();
  });
  c.textAlign = 'center'; c.textBaseline = 'middle';
  G.floats.forEach((f) => {
    c.globalAlpha = Math.max(0, f.life);
    c.font = '10px "Press Start 2P", monospace';
    c.fillStyle = '#000'; c.fillText(f.text, f.x + 1, f.y + 1);
    c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
  });
  c.globalAlpha = 1;
}

/* ═══════════════════════════════════════════════════════════
   ILUMINACIÓN (noche con luces / día con rayos de sol)
═══════════════════════════════════════════════════════════ */
const lightCv = document.createElement('canvas');
lightCv.width = W * S; lightCv.height = H * S;
const lightCtx = lightCv.getContext('2d');

function hole(lc, x, y, r, a) {
  const g = lc.createRadialGradient(x, y, 3, x, y, r);
  g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
  g.addColorStop(0.55, 'rgba(0,0,0,' + (a * 0.6) + ')');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2);
}
function glow(c, x, y, r, rgb, a) {
  const g = c.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawLighting(c, t, info, lv) {
  if (mode === 'dark') {
    const lc = lightCtx;
    lc.setTransform(S, 0, 0, S, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, W, H);
    lc.fillStyle = 'rgba(5,8,26,0.8)'; lc.fillRect(0, 0, W, H);
    lc.globalCompositeOperation = 'destination-out';
    info.lamps.forEach((l, i) => hole(lc, l.x, l.y + 8, 130 + Math.sin(t * 0.008 + i) * 4, 1));
    info.wins.forEach((w) => hole(lc, w.x, w.y + 14, 62, 0.85));
    hole(lc, G.player.x * TS, G.player.y * TS - 12, 82, 1);
    lv.npcs.forEach((n) => { if (!G.done[n.id]) hole(lc, (n.tx + 0.5) * TS, (n.ty + 0.5) * TS, 42, 0.9); });
    lc.globalCompositeOperation = 'source-over';
    c.drawImage(lightCv, 0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    info.lamps.forEach((l, i) => glow(c, l.x, l.y + 6, 120, '255,190,90', 0.2 + Math.sin(t * 0.008 + i) * 0.015));
    info.wins.forEach((w) => glow(c, w.x, w.y + 24, 60, '150,180,255', 0.12));
    glow(c, G.player.x * TS, G.player.y * TS - 12, 78, '255,205,130', 0.14);
    c.globalCompositeOperation = 'source-over';
  } else {
    info.wins.forEach((w, i) => {
      c.fillStyle = 'rgba(255,246,200,' + (0.1 + Math.sin(t * 0.0015 + i) * 0.025) + ')';
      c.beginPath(); c.moveTo(w.x - 11, 26); c.lineTo(w.x + 11, 26); c.lineTo(w.x + 78, 170); c.lineTo(w.x + 28, 170); c.closePath(); c.fill();
    });
  }
  const v = c.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, mode === 'dark' ? 'rgba(0,0,0,.5)' : 'rgba(60,30,0,.2)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}

/* ═══════════════════════════════════════════════════════════
   DIBUJO DEL JUEGO
═══════════════════════════════════════════════════════════ */
const canvas = $('game');
canvas.width = W * S; canvas.height = H * S;
const ctx = canvas.getContext('2d');

function chip(c, text, x, y, bg, fg) {
  c.font = '7px "Press Start 2P", monospace';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(text).width + 10;
  R(c, x - w / 2 - 1, y - 8, w + 2, 16, '#000');
  R(c, x - w / 2, y - 7, w, 14, bg);
  c.fillStyle = fg; c.fillText(text, x, y + 1);
}
function drawNpc(c, n, t) {
  const x = (n.tx + 0.5) * TS, y = (n.ty + 0.9) * TS;
  const near = G.near === n;
  let dir = n.face;
  if (near) {
    const dx = G.player.x * TS - x, dy = G.player.y * TS - y;
    dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  drawPerson(c, x, y, n.look, dir, false, t + n.tx * 173, {});
  const st = G.done[n.id];
  const by = y - 46 + Math.sin(t * 0.006 + n.ty) * 2;
  c.beginPath(); c.arc(x, by, 7.5, 0, Math.PI * 2);
  c.fillStyle = st ? (st === 'ok' ? '#1f7ae0' : '#e8730c') : '#fff3b0'; c.fill();
  c.lineWidth = 2; c.strokeStyle = st ? '#0b2140' : '#c58a00'; c.stroke();
  if (!st) { R(c, x - 1, by - 5, 2, 6, '#222'); R(c, x - 1, by + 3, 2, 2, '#222'); }
  else if (st === 'ok') { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 3.5, by); c.lineTo(x - 1, by + 3); c.lineTo(x + 4, by - 3); c.stroke(); }
  else { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 3, by - 3); c.lineTo(x + 3, by + 3); c.moveTo(x + 3, by - 3); c.lineTo(x - 3, by + 3); c.stroke(); }
  if (near && !st && G.state === 'play') {
    chip(c, n.name, x, by - 17, '#10183a', '#ffcf4a');
    chip(c, isTouch ? 'HABLAR' : 'ENTER', x, y + 12, '#ffcf4a', '#1b1405');
  }
}
function drawGame(t) {
  const c = ctx, lv = LEVELS[G.lvl], info = MAPINFO[G.lvl];
  c.setTransform(S, 0, 0, S, 0, 0);
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.save();
  if (G.shake > 0 && !REDUCE) c.translate((Math.random() - 0.5) * G.shake * 8, (Math.random() - 0.5) * G.shake * 8);

  c.drawImage(getBake(G.lvl), 0, 0, W, H);

  const items = [];
  info.talls.forEach((o) => items.push({ y: o.y + TS, f: () => drawTall(c, o.ch, o.x, o.y, t) }));
  lv.npcs.forEach((n) => items.push({ y: (n.ty + 0.9) * TS, f: () => drawNpc(c, n, t) }));
  items.push({ y: G.player.y * TS, f: () => drawPerson(c, G.player.x * TS, G.player.y * TS, detective, G.player.dir, G.player.moving, t, { lens: G.state === 'dialog' }) });
  items.sort((a, b) => a.y - b.y).forEach((i) => i.f());

  if (G.levelDone) {
    const pulse = 0.22 + Math.sin(t * 0.006) * 0.12;
    info.exits.forEach((e) => R(c, e.x, e.y, TS, TS, 'rgba(255,220,80,' + pulse + ')'));
    const ex = info.exits[0].x + TS, ey = info.exits[0].y - 6 + Math.sin(t * 0.008) * 3;
    c.fillStyle = '#ffcf4a'; c.strokeStyle = '#000'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(ex - 9, ey - 12); c.lineTo(ex + 9, ey - 12); c.lineTo(ex, ey); c.closePath(); c.fill(); c.stroke();
    chip(c, 'SALIDA', ex, ey - 24, '#ffcf4a', '#1b1405');
  }

  drawLighting(c, t, info, lv);
  drawFx(c);
  c.restore();
  if (G.flash > 0) { c.fillStyle = 'rgba(255,130,30,' + (G.flash * 0.35) + ')'; c.fillRect(0, 0, W, H); }
}

/* ═══════════════════════════════════════════════════════════
   MOVIMIENTO Y COLISIONES
═══════════════════════════════════════════════════════════ */
function solidAt(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
  return SOLID.has(LEVELS[G.lvl].map[row][col]);
}
function blocked(x, y) {
  const l = x - 0.28, r = x + 0.28, tp = y - 0.3, bt = y;
  if (solidAt(Math.floor(l), Math.floor(tp)) || solidAt(Math.floor(r), Math.floor(tp)) ||
      solidAt(Math.floor(l), Math.floor(bt)) || solidAt(Math.floor(r), Math.floor(bt))) return true;
  return LEVELS[G.lvl].npcs.some((n) => Math.abs(x - (n.tx + 0.5)) < 0.55 && Math.abs((y - 0.15) - (n.ty + 0.55)) < 0.4);
}
function updatePlay(dt, now) {
  const p = G.player;
  let dx = 0, dy = 0;
  if (held.left) dx -= 1; if (held.right) dx += 1; if (held.up) dy -= 1; if (held.down) dy += 1;
  p.moving = !!(dx || dy);
  if (p.moving) {
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const sp = 2.9;
    if (!blocked(p.x + dx * sp * dt, p.y)) p.x += dx * sp * dt;
    if (!blocked(p.x, p.y + dy * sp * dt)) p.y += dy * sp * dt;
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (now - lastStep > 260) { Sfx.step(); lastStep = now; }
  }
  // personaje cercano
  G.near = null;
  let best = 1.35;
  LEVELS[G.lvl].npcs.forEach((n) => {
    if (G.done[n.id]) return;
    const d = Math.hypot(p.x - (n.tx + 0.5), (p.y - 0.35) - (n.ty + 0.55));
    if (d < best) { best = d; G.near = n; }
  });
  // salida
  const tile = LEVELS[G.lvl].map[Math.floor(p.y - 0.05)][Math.floor(p.x)];
  if (tile === 'X') {
    if (G.levelDone) goNext();
    else if (now - G.exitMsgAt > 2500) { G.exitMsgAt = now; toast('Todavía quedan casos por resolver'); }
  }
}

/* ═══════════════════════════════════════════════════════════
   INTERFAZ: HUD, AVISOS, TRANSICIONES
═══════════════════════════════════════════════════════════ */
function updateHUD() {
  const lv = LEVELS[G.lvl];
  $('hud-level').textContent = 'NIVEL ' + lv.id + ' · ' + lv.short;
  $('hud-pips').innerHTML = lv.npcs.map((n) => '<span class="pip ' + (G.done[n.id] || '') + '"></span>').join('');
  $('hud-lives').textContent = '♥'.repeat(G.lives) + '♡'.repeat(Math.max(0, 3 - G.lives));
  $('hud-score').textContent = G.score;
}
let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function fade(cb) {
  const f = $('fade');
  f.classList.add('on');
  setTimeout(() => { cb(); setTimeout(() => f.classList.remove('on'), 80); }, 450);
}
function showOverlay(id, on) { $(id).classList.toggle('on', on); }

/* ═══════════════════════════════════════════════════════════
   FLUJO DEL JUEGO
═══════════════════════════════════════════════════════════ */
function startGame() {
  Sfx.init(); Sfx.blip();
  playMusic();
  selectScenarios();
  G.lvl = 0; G.score = 0; G.lives = 3; G.streak = 0; G.results = [];
  showOverlay('screen-title', false); showOverlay('end', false);
  setState('transition');
  fade(() => loadLevel(0));
}
function loadLevel(i) {
  const lv = LEVELS[i];
  G.lvl = i; G.done = {}; G.levelDone = false; G.near = null; G.parts = []; G.floats = [];
  G.player = { x: lv.start.x, y: lv.start.y, dir: 'up', moving: false };
  Object.keys(held).forEach((k) => { held[k] = false; });
  updateHUD();
  $('intro-icon').textContent = lv.icon;
  $('intro-num').textContent = lv.id === 0 ? 'NIVEL 0 · PRÁCTICA' : 'NIVEL ' + lv.id + ' DE ' + (LEVELS.length - 1);
  $('intro-title').textContent = lv.title;
  $('intro-desc').textContent = lv.desc + (lv.practice ? ' En este nivel no se pierden vidas.' : '');
  $('intro-npcs').innerHTML = lv.npcs.map((n) =>
    '<li><span class="dot"></span>' + n.name + '<small>' + n.role + '</small></li>').join('');
  setState('intro');
  showOverlay('intro', true);
}
function enterLevel() {
  showOverlay('intro', false);
  setState('play');
  Sfx.blip();
  toast('Hablá con quienes tienen un ❗ sobre la cabeza');
}
function goNext() {
  if (G.state !== 'play') return;
  setState('transition');
  const last = G.lvl >= LEVELS.length - 1;
  fade(() => { if (last) finishGame(false); else loadLevel(G.lvl + 1); });
}
function finishGame(noLives) {
  const total = LEVELS.reduce((s, l) => s + l.npcs.length, 0);
  const correct = G.results.filter((r) => r.ok).length;
  const p = correct / total;
  let icon, title, msg;
  if (noLives)       { icon = '💔'; title = 'Sin vidas, detective';   msg = 'Te quedaste sin intentos. Repasá las normas de cada caso y volvé a abrir el expediente.'; }
  else if (p === 1)  { icon = '🏆'; title = '¡Caso resuelto!';        msg = 'Analizaste cada pista y construiste conclusiones fundamentadas.'; }
  else if (p >= 0.68){ icon = '🥈'; title = 'Caso casi resuelto';     msg = 'Tu análisis fue sólido. Revisá las respuestas incorrectas de abajo.'; }
  else if (p >= 0.4) { icon = '🔎'; title = 'Buen trabajo, detective'; msg = 'Encontraste varias pistas. Repasá las normas y volvé a intentarlo.'; }
  else               { icon = '📂'; title = 'El expediente sigue abierto'; msg = 'Un buen investigador aprende de sus errores. Repasá las normas y repetí el caso.'; }
  $('end-icon').textContent = icon;
  $('end-title').textContent = title;
  $('end-points').textContent = G.score;
  $('end-correct').textContent = correct + '/' + total;
  $('end-msg').textContent = msg;
  $('end-list').innerHTML = G.results.map((r) =>
    '<li><span class="st ' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✔' : '✖') + '</span>' + r.name +
    (r.link ? '<a href="' + r.link + '" target="_blank" rel="noopener">' + r.norma + '</a>' : '<span class="nm">' + r.norma + '</span>') + '</li>').join('');
  setState('end');
  showOverlay('end', true);
  if (!noLives && p >= 0.4) Sfx.win();
}

/* ═══════════════════════════════════════════════════════════
   DIÁLOGOS
═══════════════════════════════════════════════════════════ */
let typing = null;
function typeInto(el, text, speed, done) {
  if (speed === 0) { el.textContent = text; done && done(); return; }
  let i = 0; el.textContent = '';
  const iv = setInterval(() => {
    i++; el.textContent = text.slice(0, i);
    if (i % 3 === 0) Sfx.tick();
    if (i >= text.length) { clearInterval(iv); typing = null; done && done(); }
  }, speed);
  typing = { iv, el, text, done };
}
function skipTyping() {
  if (!typing) return;
  clearInterval(typing.iv);
  typing.el.textContent = typing.text;
  const d = typing.done; typing = null;
  d && d();
}
function drawPortrait(n) {
  const pc = $('dlg-portrait').getContext('2d');
  pc.clearRect(0, 0, 48, 56);
  drawPerson(pc, 24, 52, n.look, 'down', false, 0, {});
}
function openDialog(n) {
  setState('dialog');
  G.cur = n; G.answered = false; G.fbShown = false; G.order = null;
  $('dialog').classList.add('on');
  $('dlg-name').textContent = n.name;
  $('dlg-role').textContent = n.role;
  drawPortrait(n);
  $('dlg-say').style.display = '';
  $('dlg-q').classList.remove('show'); $('dlg-q').textContent = '';
  $('dlg-opts').classList.remove('show'); $('dlg-opts').innerHTML = '';
  $('dlg-fb').classList.remove('show');
  Sfx.blip();
  typeInto($('dlg-say'), '“' + n.say + '”', REDUCE ? 0 : 16, () => showQuestion(n));
}
function showQuestion(n) {
  $('dlg-q').textContent = n.question;
  $('dlg-q').classList.add('show');
  G.order = shuffle(n.opts.map((t, i) => ({ t, ok: i === n.ans })));
  const box = $('dlg-opts'); box.innerHTML = '';
  G.order.forEach((o, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt';
    b.innerHTML = '<span class="k">' + 'ABCD'[i] + '</span><span class="t"></span>';
    b.querySelector('.t').textContent = o.t;
    b.addEventListener('click', () => choose(i));
    box.appendChild(b);
  });
  box.classList.add('show');
}
function choose(i) {
  if (G.state !== 'dialog' || G.answered || !G.order || !G.order[i]) return;
  G.answered = true;
  const n = G.cur, ok = G.order[i].ok;
  document.querySelectorAll('#dlg-opts .opt').forEach((b, k) => {
    b.disabled = true;
    const key = b.querySelector('.k');
    if (G.order[k].ok) { b.classList.add('ok'); if (key) key.textContent = '✔'; }
    else if (k === i) { b.classList.add('bad'); if (key) key.textContent = '✖'; }
    else b.classList.add('dim');
  });
  const nx = (n.tx + 0.5) * TS, ny = (n.ty + 0.5) * TS;
  if (ok) {
    const pts = 100 + G.streak * 25;
    G.score += pts; G.streak++;
    burst(nx, ny - 10, 'good'); floatText(nx, ny - 40, '+' + pts, '#4aa8ff'); Sfx.good();
  } else {
    if (!LEVELS[G.lvl].practice) G.lives = Math.max(0, G.lives - 1);
    G.streak = 0;
    G.shake = 1; G.flash = 1; burst(nx, ny - 10, 'bad'); floatText(nx, ny - 40, '✖', '#ff9f43'); Sfx.bad();
  }
  G.results.push({ lvl: G.lvl, id: n.id, name: n.name, ok, norma: n.norma, link: n.link });
  G.done[n.id] = ok ? 'ok' : 'bad';
  updateHUD();
  setTimeout(() => showFeedback(n, ok), REDUCE ? 100 : 1000);
}
function showFeedback(n, ok) {
  if (G.state !== 'dialog') return;
  $('dlg-say').style.display = 'none';
  $('dlg-q').classList.remove('show');
  $('dlg-opts').classList.remove('show');
  const v = $('fb-verdict');
  v.className = 'fb-verdict ' + (ok ? 'ok' : 'bad');
  v.textContent = ok ? '✔ Análisis correcto' : '✖ Hay que revisar este caso';
  let exp = n.exp;
  if (!ok) exp = 'La respuesta correcta era: ' + n.opts[n.ans] + '. ' + exp;
  $('fb-exp').textContent = exp;
  const a = $('fb-link'); a.textContent = n.norma;
  if (n.link) a.setAttribute('href', n.link); else a.removeAttribute('href');
  $('fb-label').textContent = n.link ? 'Norma:' : 'Concepto:';
  $('dlg-fb').classList.add('show');
  G.fbShown = true;
}
function closeDialog() {
  skipTyping();
  $('dialog').classList.remove('on');
  setState('play');
  G.cur = null; G.fbShown = false;
  if (G.lives <= 0) { finishGame(true); return; }
  if (LEVELS[G.lvl].npcs.every((n) => G.done[n.id])) {
    G.levelDone = true; Sfx.win();
    toast('¡Expediente completo! Salí por la puerta ↓');
  }
}

/* ═══════════════════════════════════════════════════════════
   ENTRADA: teclado, pantalla táctil y botones
═══════════════════════════════════════════════════════════ */
function action() {
  Sfx.init();
  if (G.state === 'title') startGame();
  else if (G.state === 'intro') enterLevel();
  else if (G.state === 'play') { if (G.near) openDialog(G.near); }
  else if (G.state === 'dialog') {
    if (typing) skipTyping();
    else if (G.fbShown) closeDialog();
  } else if (G.state === 'end') startGame();
}
const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
document.addEventListener('keydown', (e) => {
  const k = e.key;
  const onButton = e.target && e.target.tagName === 'BUTTON';
  if (G.state === 'dialog' && G.order && !G.answered) {
    const idx = '1234'.indexOf(k) >= 0 && k.length === 1 ? '1234'.indexOf(k) : 'abcd'.indexOf(k.toLowerCase());
    if (idx >= 0 && k.length === 1) { e.preventDefault(); choose(idx); return; }
  }
  if (KEYMAP[k] && G.state === 'play') { held[KEYMAP[k]] = true; }
  if (k.startsWith('Arrow') || k === ' ') e.preventDefault();
  if ((k === 'Enter' || k === ' ' || k === 'e' || k === 'E') && !onButton) { e.preventDefault(); action(); }
});
document.addEventListener('keyup', (e) => { if (KEYMAP[e.key]) held[KEYMAP[e.key]] = false; });
window.addEventListener('blur', () => Object.keys(held).forEach((k) => { held[k] = false; }));
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('button');
  if (b) setTimeout(() => b.blur(), 0);
});
window.addEventListener('touchstart', () => { isTouch = true; document.body.classList.add('touch'); }, { once: true, passive: true });

document.querySelectorAll('#pad .pb[data-dir]').forEach((b) => {
  const d = b.dataset.dir;
  const on = (e) => { e.preventDefault(); if (G.state === 'play') held[d] = true; };
  const off = (e) => { e.preventDefault(); held[d] = false; };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off);
  b.addEventListener('pointerleave', off);
});
$('btn-act').addEventListener('pointerdown', (e) => { e.preventDefault(); action(); });
$('btn-start').addEventListener('click', startGame);
document.querySelectorAll('.detective-option').forEach((button) => {
  button.addEventListener('click', () => {
    const choice = button.dataset.detective;
    if (choice !== 'female' && choice !== 'male') return;
    detective = DETECTIVES[choice];
    document.querySelectorAll('.detective-option').forEach((option) => {
      const selected = option === button;
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
  });
});
$('btn-enter').addEventListener('click', enterLevel);
$('btn-continue').addEventListener('click', closeDialog);
$('btn-restart').addEventListener('click', startGame);
$('btn-theme').addEventListener('click', toggleMode);
$('btn-sound').addEventListener('click', toggleSoundControls);
$('music-volume').addEventListener('input', setMusicVolume);
$('sfx-volume').addEventListener('input', setSfxVolume);
document.addEventListener('pointerdown', (event) => {
  const controls = $('sound-controls');
  if (controls.hidden || controls.contains(event.target) || $('btn-sound').contains(event.target)) return;
  controls.hidden = true;
  $('btn-sound').setAttribute('aria-expanded', 'false');
  $('btn-sound').setAttribute('aria-label', 'Abrir controles de volumen');
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || $('sound-controls').hidden) return;
  $('sound-controls').hidden = true;
  $('btn-sound').setAttribute('aria-expanded', 'false');
  $('btn-sound').setAttribute('aria-label', 'Abrir controles de volumen');
  $('btn-sound').focus();
});

/* ═══════════════════════════════════════════════════════════
   PANTALLA DE INICIO: ciudad animada con personajes caminando
═══════════════════════════════════════════════════════════ */
const tctx = $('title-canvas').getContext('2d');
const TW = 320, TH = 180;
function mkLayer(seed, minH, maxH, minW, maxW, span) {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const b = []; let x = 0;
  while (x < span) {
    const w = Math.floor(minW + r() * (maxW - minW)), h = Math.floor(minH + r() * (maxH - minH));
    const wins = [];
    for (let wx = 3; wx < w - 3; wx += 6) for (let wy = 6; wy < h - 4; wy += 7) wins.push({ x: wx, y: wy, ph: r() * 6.28, on: r() });
    b.push({ x, w, h, wins });
    x += w + Math.floor(r() * 3);
  }
  return { b, span: x };
}
const SKY = [mkLayer(11, 34, 64, 14, 26, 520), mkLayer(23, 44, 84, 16, 30, 560), mkLayer(37, 60, 108, 20, 36, 600)];
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97) % TW, y: (i * 53) % 90, p: i * 1.7 }));
const WALKERS = [
  { look: detective, dir: 1, sp: 34, o: 0, y: 0 },
  { look: NPC_BY_ID.n4.look, dir: -1, sp: 28, o: 90, y: 6 },
  { look: NPC_BY_ID.n6.look, dir: 1, sp: 22, o: 200, y: 10 },
];
function drawTitleScene(t) {
  const c = tctx, dark = mode === 'dark';
  c.imageSmoothingEnabled = false;
  const g = c.createLinearGradient(0, 0, 0, 150);
  if (dark) { g.addColorStop(0, '#070b26'); g.addColorStop(0.6, '#2a2266'); g.addColorStop(1, '#6b3a7d'); }
  else { g.addColorStop(0, '#6cc3ff'); g.addColorStop(0.7, '#bfe6ff'); g.addColorStop(1, '#ffe9bd'); }
  c.fillStyle = g; c.fillRect(0, 0, TW, TH);
  if (dark) {
    STARS.forEach((s) => { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + s.p)); R(c, s.x, s.y, 1, 1, '#fff'); });
    c.globalAlpha = 1;
    glow(c, 262, 30, 50, '255,243,196', 0.35);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(262, 30, 13, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.arc(257, 27, 3, 0, 6.283); c.fill(); c.beginPath(); c.arc(267, 35, 2, 0, 6.283); c.fill();
  } else {
    glow(c, 262, 34, 60, '255,236,150', 0.5);
    c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(262, 34, 14, 0, 6.283); c.fill();
    for (let k = 0; k < 3; k++) {
      const cx2 = ((t * 0.006 * (k + 1) + k * 130) % (TW + 80)) - 40, cy = 24 + k * 22;
      R(c, cx2, cy, 30, 6, '#fff'); R(c, cx2 + 6, cy - 4, 18, 5, '#fff'); R(c, cx2 + 4, cy + 6, 22, 3, 'rgba(255,255,255,.7)');
    }
  }
  const cols = dark ? ['#1a2150', '#121842', '#0b1030'] : ['#b4c8ec', '#8fa6d8', '#667db4'];
  SKY.forEach((L, li) => {
    const off = (t / 1000 * [3, 7, 13][li]) % L.span;
    for (let rep = 0; rep < 2; rep++) {
      L.b.forEach((bd) => {
        const bx = Math.round(bd.x - off + rep * L.span);
        if (bx > TW || bx + bd.w < 0) return;
        const by = 150 - bd.h;
        R(c, bx, by, bd.w, bd.h, cols[li]);
        if (li > 0) bd.wins.forEach((w) => {
          const lit = dark && Math.sin(t * 0.0008 + w.ph) > -0.2 && w.on > 0.45;
          R(c, bx + w.x, by + w.y, 3, 4, lit ? '#ffd36b' : (dark ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.35)'));
        });
      });
    }
  });
  R(c, 0, 150, TW, TH - 150, dark ? '#171a2b' : '#6b7184');
  R(c, 0, 150, TW, 5, dark ? '#2b3354' : '#a7aec4');
  for (let x = -((t * 0.05) % 40); x < TW; x += 40) R(c, x, 170, 20, 2, dark ? '#f5d36b' : '#fff3b0');
  WALKERS.forEach((w, i) => {
    const span = TW + 80, p = (t * w.sp / 1000 + w.o) % span;
    const x = w.dir > 0 ? p - 40 : TW + 40 - p;
    drawPerson(c, x, 163 + w.y, i === 0 ? detective : w.look, w.dir > 0 ? 'right' : 'left', true, t + w.o * 100);
  });
  const v = c.createRadialGradient(TW / 2, TH / 2, 60, TW / 2, TH / 2, 200);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, dark ? 'rgba(0,0,0,.45)' : 'rgba(60,30,0,.15)');
  c.fillStyle = v; c.fillRect(0, 0, TW, TH);
}
function buildLogo() {
  const el = $('logo'); el.innerHTML = '';
  ['DETECTIVE', 'LEGAL'].forEach((word, wi) => {
    const row = document.createElement('span');
    row.className = 'logo-row r' + wi;
    [...word].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch; s.style.animationDelay = ((wi * 5 + i) * 0.09) + 's';
      row.appendChild(s);
    });
    el.appendChild(row);
  });
}

/* ═══════════════════════════════════════════════════════════
   BUCLE PRINCIPAL
═══════════════════════════════════════════════════════════ */
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (G.state === 'title' || G.state === 'end') {
    drawTitleScene(now);
  } else {
    if (G.state === 'play') updatePlay(dt, now);
    updateFx(dt);
    drawGame(now);
  }
  requestAnimationFrame(frame);
}

initMode();
buildLogo();
updateHUD();
requestAnimationFrame(frame);