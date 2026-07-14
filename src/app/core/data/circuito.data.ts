/**
 * DATOS DEL EXAMEN PRÁCTICO CLASE C — circuito estandarizado MTT/CONASET.
 *
 * FUENTES
 *  - Diagramas oficiales del circuito (assets/img/circuito/). Son la FUENTE DE
 *    VERDAD del trazado: no redibujamos nada, hacemos zoom sobre ellos y
 *    resaltamos la trayectoria que ya viene dibujada en el documento.
 *  - Instructivos municipales del "Nuevo Examen Práctico Clase C" (Peralillo,
 *    Quillota), que replican la normativa MTT vigente desde diciembre de 2020:
 *    de ahí salen las etapas, las maniobras y la gravedad de cada error.
 *
 * Los recortes (`region`) están en píxeles del plano original. Si un encuadre
 * queda mal, se ajustan esos cuatro números y nada más depende de ellos.
 */

import { EtapaExamen, RegionDiagrama } from '../models/circuito.model';

/** Dimensiones oficiales de la pista, en metros. */
export const PISTA: { largo: number; ancho: number } = { largo: 70, ancho: 7 };

/** Elementos que el municipio debe instalar (cifras oficiales del instructivo). */
export const ELEMENTOS_REQUERIDOS: { cantidad: number; nombre: string }[] = [
  { cantidad: 24, nombre: 'conos' },
  { cantidad: 14, nombre: 'conos lenteja' },
  { cantidad: 1, nombre: 'odómetro' },
  { cantidad: 1, nombre: 'cronómetro' },
];

/** Vestimenta obligatoria. Sin esto el examen se REPROGRAMA (no se reprueba). */
export const VESTIMENTA_OBLIGATORIA: string[] = [
  'Casco reglamentario y protección ocular.',
  'Guantes que cubran completamente la mano.',
  'Calzado cerrado, con plantilla antideslizante.',
  'Ropa que cubra totalmente brazos y piernas.',
];

// ---------------------------------------------------------------------------
// Diagramas oficiales
// ---------------------------------------------------------------------------

const RUTA = 'assets/img/circuito/';

const E1_W = 4572;
const E1_H = 1422;
const E23_W = 3564;
const E23_H = 4682;

/** Recorte del plano de la Etapa 1 (motor apagado). */
function e1(x: number, y: number, w: number, h: number): RegionDiagrama {
  return {
    imagen: RUTA + 'claseCetapa1.png',
    imagenAncho: E1_W,
    imagenAlto: E1_H,
    x, y, w, h,
  };
}

/** Recorte del plano de las Etapas 2 y 3 (panel izquierdo = precisión, derecho = velocidad). */
function e23(x: number, y: number, w: number, h: number): RegionDiagrama {
  return {
    imagen: RUTA + 'claseCetapa2.png',
    imagenAncho: E23_W,
    imagenAlto: E23_H,
    x, y, w, h,
  };
}

// ---------------------------------------------------------------------------
// Etapas y maniobras
// ---------------------------------------------------------------------------

export const ETAPAS: EtapaExamen[] = [
  {
    id: 'etapa-1',
    numero: 1,
    nombre: 'Motor apagado',
    motor: 'apagado',
    segundos: null,
    resumen:
      'Sin tiempo. Se revisa que conozcas el vehículo y sus documentos, y que puedas mover y estacionar la moto a pie sin dejarla caer.',
    diagrama: e1(0, 0, E1_W, E1_H),
    maniobras: [
      {
        id: 'e1-documentos',
        nombre: 'Identificar los documentos',
        descripcion: 'Reconocer los documentos obligatorios del vehículo.',
        pasos: [
          'Muestra la placa patente.',
          'Identifica el permiso de circulación.',
          'Identifica el certificado de seguro obligatorio.',
          'Identifica el certificado de revisión técnica y de gases.',
        ],
        evalua: 'Que sepas qué papeles debe portar la moto y dónde están.',
        medidas: [],
        erroresComunes: [
          { texto: 'Confundir el permiso de circulación con la revisión técnica.', tipo: 'leve' },
          { texto: 'No saber dónde se ubica la placa patente.', tipo: 'leve' },
        ],
        region: null,
        ilustracion: null,
        animacion: null,
      },
      {
        id: 'e1-casco',
        nombre: 'Uso correcto del casco',
        descripcion: 'Demostrar que sabes ponerte el casco correctamente.',
        pasos: [
          'Ponte el casco con la visera protectora cubriendo la vista.',
          'Amarra la hebilla y ajústala.',
        ],
        evalua: 'Que el casco quede efectivamente asegurado, no solo puesto.',
        medidas: [],
        erroresComunes: [
          { texto: 'No usar el casco o usarlo de manera incorrecta.', tipo: 'reprobatorio' },
        ],
        region: null,
        ilustracion: null,
        animacion: null,
      },
      {
        id: 'e1-comandos',
        nombre: 'Activar los comandos',
        descripcion: 'Accionar los mandos de la moto a pedido del examinador.',
        pasos: [
          'Enciende las luces.',
          'Toca la bocina.',
          'Activa los señalizadores de viraje.',
          'Acciona ambos frenos.',
        ],
        evalua: 'Que domines los mandos de la moto sin tener que buscarlos.',
        medidas: [],
        erroresComunes: [
          { texto: 'No identificar los mandos: luces, señalizadores y bocina.', tipo: 'grave' },
          { texto: 'No ajustar los espejos retrovisores antes de partir.', tipo: 'leve' },
        ],
        region: null,
        ilustracion: null,
        animacion: null,
      },
      {
        id: 'e1-caminar',
        nombre: 'Caminar junto a la moto',
        descripcion:
          'Mover la moto a pie: recto, rodeando un cono, hasta el fondo y de vuelta.',
        pasos: [
          'Camina junto a la moto en línea recta durante 3 metros.',
          'Rodea el cono que aparece en el camino sin dejar caer la moto.',
          'Sigue recto 4 metros hasta el cono del fondo.',
          'Gira en torno a ese cono y vuelve caminando por el carril de regreso.',
        ],
        evalua:
          'Control del peso de la moto a pie: equilibrio, manejo del manubrio y giro apretado alrededor del cono.',
        medidas: ['3 m hasta el primer cono', '4 m hasta el cono del fondo'],
        erroresComunes: [
          { texto: 'Caída del postulante y/o del vehículo en esta etapa.', tipo: 'grave' },
          { texto: 'No seguir la trayectoria establecida.', tipo: 'leve' },
        ],
        region: null,
        ilustracion: RUTA + 'claseCetapa1.png',
        animacion: null,
      },
      {
        id: 'e1-estacionar',
        nombre: 'Estacionar sobre el soporte',
        descripcion: 'Dejar la moto apoyada sobre su soporte (pata).',
        pasos: [
          'Detén la moto en la posición indicada.',
          'Súbela al soporte sin dejarla caer.',
        ],
        evalua: 'Que puedas dejar la moto estable sin ayuda.',
        medidas: [],
        erroresComunes: [
          { texto: 'No lograr colocarla sobre el soporte, o dejarla caer al intentarlo.', tipo: 'leve' },
          { texto: 'No recoger el soporte al iniciar la marcha después.', tipo: 'grave' },
        ],
        region: null,
        ilustracion: null,
        animacion: null,
      },
    ],
  },

  {
    id: 'etapa-2',
    numero: 2,
    nombre: 'Motor encendido · Precisión',
    motor: 'encendido',
    segundos: null,
    resumen:
      'Sin tiempo. Aquí NO se mide la rapidez, sino la destreza: no perder el control de la moto a baja velocidad. El recorrido parte abajo (INICIO) y sube.',
    diagrama: e23(125, 75, 1675, 4450),
    maniobras: [
      {
        id: 'e2-zigzag',
        nombre: 'Zigzag entre conos',
        descripcion: 'Recorrer en zigzag una línea de cinco conos.',
        pasos: [
          'Parte entre los dos conos de la puerta de inicio.',
          'Avanza 3 metros hasta el primer cono de la línea.',
          'Pasa por un costado del primer cono y por el costado contrario del siguiente.',
          'Sigue alternando lado en los cinco conos, sin enderezar entre medio.',
        ],
        evalua:
          'Equilibrio a baja velocidad y dosificación del embrague. Es la maniobra que más gente falla.',
        medidas: [
          'Puerta de partida: 1,5 m entre conos',
          '3 m desde la partida al primer cono',
          '5 conos separados 4 m entre sí',
        ],
        erroresComunes: [
          { texto: 'Apoyar uno o ambos pies en el suelo durante la conducción.', tipo: 'leve' },
          { texto: 'Topar, botar o mover un cono de su posición.', tipo: 'leve' },
          { texto: 'Apagar el motor por mal manejo del embrague.', tipo: 'leve' },
        ],
        region: e23(200, 2950, 1175, 1525),
        ilustracion: null,
        animacion: { ruta: 'e2', desde: 0.0, hasta: 0.27 },
      },
      {
        id: 'e2-ocho',
        nombre: 'Figura en ocho',
        descripcion: 'Dibujar un "8" alrededor de dos conos separados 10 metros.',
        pasos: [
          'Rodea el primer cono describiendo un círculo completo.',
          'Cruza en diagonal por el medio, entre los dos conos.',
          'Rodea el segundo cono en sentido contrario.',
          'Vuelve a cruzar por el medio para salir hacia la maniobra siguiente.',
        ],
        evalua:
          'Giro cerrado en ambos sentidos sin poner pie. El ocho es una curva continua que se CRUZA en el medio: no son dos círculos pegados. Exige mirar al punto de salida, no a la rueda.',
        medidas: ['Los dos conos del ocho están a 10 m entre sí'],
        erroresComunes: [
          { texto: 'Apoyar el pie en el suelo en el giro cerrado.', tipo: 'leve' },
          { texto: 'Abrirse y no seguir la trayectoria establecida.', tipo: 'leve' },
          { texto: 'Detención del motor por mal manejo de los controles.', tipo: 'leve' },
        ],
        region: e23(550, 1975, 825, 1150),
        ilustracion: null,
        animacion: { ruta: 'e2', desde: 0.26, hasta: 0.73 },
      },
      {
        id: 'e2-curvas',
        nombre: 'Curvas y contracurvas',
        descripcion: 'Encadenar curvas alternadas, una por cada cono.',
        pasos: [
          'Rodea el primer cono por un costado, inclinando la moto.',
          'Cambia de lado justo al llegar al cono siguiente: el cambio de sentido va SOBRE el cono.',
          'Repite alternando en cada cono, sin enderezar la moto entre curva y curva.',
        ],
        evalua:
          'Transferencia de peso de un lado a otro. Cada cambio de sentido ocurre sobre un cono: si te adelantas o te atrasas, pierdes la trayectoria.',
        medidas: ['Conos separados 4 m', '2 m entre el cono y las lentejas del costado'],
        erroresComunes: [
          { texto: 'Cortar la curva y no seguir la trayectoria establecida.', tipo: 'leve' },
          { texto: 'Topar o mover un cono de su posición.', tipo: 'leve' },
          { texto: 'Soltar momentáneamente una mano del manubrio.', tipo: 'grave' },
        ],
        region: e23(250, 1400, 1125, 800),
        ilustracion: null,
        animacion: { ruta: 'e2', desde: 0.72, hasta: 0.9 },
      },
      {
        id: 'e2-pasillo',
        nombre: 'Línea recta por pasillo estrecho',
        descripcion: 'Pasar recto entre dos placas metálicas separadas 40 cm.',
        pasos: [
          'Endereza la moto y alinéate con el pasillo antes de entrar.',
          'Cruza recto entre las dos placas metálicas, sin tocarlas.',
          'Mantén la mirada al frente, no a la rueda.',
        ],
        evalua:
          'Control fino de la dirección: mantener la rueda recta a baja velocidad, en un pasillo de apenas 40 centímetros.',
        medidas: ['Pasillo de 0,4 m entre placas', '6 m desde el pasillo a la zona de detención'],
        erroresComunes: [
          { texto: 'Salirse del pasillo (no seguir la trayectoria establecida).', tipo: 'leve' },
          { texto: 'Poner pie en el suelo para corregir.', tipo: 'leve' },
        ],
        region: e23(450, 750, 925, 900),
        ilustracion: null,
        animacion: { ruta: 'e2', desde: 0.88, hasta: 0.97 },
      },
      {
        id: 'e2-frenado',
        nombre: 'Frenado progresivo',
        descripcion: 'Frenar y detenerse en la zona demarcada por conos.',
        pasos: [
          'Suelta el acelerador al salir del pasillo.',
          'Frena de forma progresiva usando ambos frenos.',
          'Detente dentro de la zona marcada por los conos del extremo superior.',
        ],
        evalua: 'Uso combinado de ambos frenos y precisión del punto de detención.',
        medidas: ['Zona de detención: dos puertas de 1,5 m'],
        erroresComunes: [
          { texto: 'Detenerse un metro o más antes del lugar establecido.', tipo: 'leve' },
          { texto: 'No detenerse, o hacerlo a más de 50 cm del lugar establecido.', tipo: 'reprobatorio' },
        ],
        region: e23(450, 300, 1000, 900),
        ilustracion: null,
        animacion: { ruta: 'e2', desde: 0.94, hasta: 1.0 },
      },
    ],
  },

  {
    id: 'etapa-3',
    numero: 3,
    nombre: 'Motor encendido · Velocidad',
    motor: 'encendido',
    segundos: 35,
    resumen:
      'Cronometrada: 35 segundos. Parte arriba (donde terminaste la etapa anterior), baja esquivando obstáculos, gira en U abajo y vuelve en línea recta con cambios de marcha.',
    diagrama: e23(1800, 75, 1675, 4450),
    maniobras: [
      {
        id: 'e3-obstaculo',
        nombre: 'Evitar obstáculos',
        descripcion: 'Bajar por el circuito esquivando los conos lenteja.',
        pasos: [
          'Parte desde arriba y baja acelerando por el carril.',
          'Al llegar a cada par de lentejas, pasa por la abertura que dejan entre sí.',
          'Encadena los tres pasos sin frenar ni soltar el manubrio.',
        ],
        evalua: 'Esquive a velocidad, con la moto ya rodando en marcha.',
        medidas: ['Aberturas de 0,6 m entre lentejas', '2 m entre el cono y sus lentejas'],
        erroresComunes: [
          { texto: 'Topar o mover una lenteja de su posición.', tipo: 'leve' },
          { texto: 'Soltar momentáneamente una o ambas manos del manubrio.', tipo: 'grave' },
          { texto: 'Circular sin encender las luces.', tipo: 'grave' },
        ],
        region: e23(1900, 2200, 1250, 1800),
        ilustracion: null,
        animacion: { ruta: 'e3', desde: 0.0, hasta: 0.5 },
      },
      {
        id: 'e3-viraje-u',
        nombre: 'Viraje en U',
        descripcion: 'Girar 180° en el extremo del circuito, sin detenerse.',
        pasos: [
          'Llega al extremo inferior sin frenar del todo.',
          'Ábrete hacia un costado para ganar radio de giro.',
          'Gira 180° dentro de los 7 metros de ancho, sin poner pie y sin detenerte.',
          'Sal alineado con el carril de vuelta.',
        ],
        evalua:
          'Giro de 180° dentro de los 7 metros de ancho de la pista, sin frenar y sin poner pie. Es el filtro más duro de la etapa.',
        medidas: ['Ancho de pista disponible: 7 m', 'Conos del vértice separados 3 m'],
        erroresComunes: [
          { texto: 'Apoyar el pie en el suelo durante el giro.', tipo: 'leve' },
          { texto: 'Detenerse a mitad del giro.', tipo: 'leve' },
          { texto: 'Caída del postulante y/o del vehículo en la etapa de velocidad.', tipo: 'reprobatorio' },
        ],
        region: e23(1950, 3450, 1300, 950),
        ilustracion: null,
        animacion: { ruta: 'e3', desde: 0.44, hasta: 0.6 },
      },
      {
        id: 'e3-recta',
        nombre: 'Conducir en línea recta',
        descripcion: 'Volver en recta hasta arriba, subiendo de marcha.',
        pasos: [
          'Acelera al salir del viraje en U.',
          'Sube de marcha durante el tramo recto: el examinador evalúa el cambio de marchas.',
          'Mantén la trayectoria recta hasta la zona donde partió la etapa.',
        ],
        evalua: 'Que subas de marcha y aceleres de verdad, no que cruces la pista en primera.',
        medidas: ['Largo total del circuito: 70 m', 'Límite de la etapa: 35 s'],
        erroresComunes: [
          { texto: 'No efectuar cambios de marcha.', tipo: 'leve' },
          { texto: 'Pasarse hasta 5 s del tiempo establecido.', tipo: 'leve' },
          { texto: 'Pasarse entre 5 y 10 s del tiempo establecido.', tipo: 'grave' },
          { texto: 'Pasarse más de 10 s del tiempo establecido.', tipo: 'reprobatorio' },
        ],
        region: e23(2200, 150, 1300, 4350),
        ilustracion: null,
        animacion: { ruta: 'e3', desde: 0.58, hasta: 0.96 },
      },
      {
        id: 'e3-frenado',
        nombre: 'Frenado progresivo final',
        descripcion: 'Frenar desde velocidad y detenerse en el punto exacto.',
        pasos: [
          'Suelta el acelerador y baja de marcha al acercarte.',
          'Frena progresivamente con ambos frenos, sin bloquear la rueda.',
          'Detente dentro de la zona demarcada por conos, arriba.',
        ],
        evalua: 'Frenar desde velocidad real y clavar el punto de detención.',
        medidas: ['Zona de detención: dos puertas de 1,5 m'],
        erroresComunes: [
          { texto: 'No detenerse, o hacerlo a más de 50 cm del lugar establecido.', tipo: 'reprobatorio' },
          { texto: 'Bloquear la rueda por frenar solo con el freno delantero.', tipo: 'leve' },
        ],
        region: e23(2000, 250, 1450, 1150),
        ilustracion: null,
        animacion: { ruta: 'e3', desde: 0.92, hasta: 1.0 },
      },
    ],
  },
];
