/**
 * Modelo de datos del EXAMEN PRÁCTICO Clase C (circuito estandarizado MTT/CONASET).
 *
 * DECISIÓN DE DISEÑO
 * ------------------
 * No dibujamos el circuito: usamos los DIAGRAMAS OFICIALES como imagen base y
 * hacemos zoom sobre ellos. Cualquier plano redibujado sería una interpretación
 * nuestra; el diagrama oficial es la fuente de verdad.
 *
 * Para que se entienda QUÉ hay que hacer, la trayectoria se resalta: se extrajo
 * del propio plano (por color, con `scripts/extraer-ruta.py`) y se guarda como una
 * capa transparente aparte. En pantalla se apilan dos capas recortadas igual:
 *   1. el plano oficial, atenuado;
 *   2. la trayectoria, en naranja.
 * El trazo naranja no es un dibujo nuestro: es la línea del documento oficial.
 */

/** Gravedad de un error, según la planilla de evaluación del examinador. */
export type TipoError = 'leve' | 'grave' | 'reprobatorio';

/** Un error frecuente de una maniobra, con la gravedad que le asigna la planilla. */
export interface ErrorManiobra {
  texto: string;
  tipo: TipoError;
}

/**
 * Recorte de un diagrama oficial, en píxeles de la imagen original.
 * Seleccionar una maniobra hace zoom sobre esa zona del plano real.
 */
export interface RegionDiagrama {
  /** Plano oficial. */
  imagen: string;
  /** Ancho y alto naturales del plano, para calcular el recorte. */
  imagenAncho: number;
  imagenAlto: number;
  /** Recorte: esquina superior izquierda y tamaño, en píxeles del plano. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Una maniobra evaluada dentro de una etapa del examen. */
export interface Maniobra {
  id: string;
  nombre: string;
  /** Resumen de una línea. */
  descripcion: string;
  /** Qué hacer, paso a paso, siguiendo la línea naranja del plano. */
  pasos: string[];
  /** Qué destreza mide realmente el examinador (el "por qué" de la maniobra). */
  evalua: string;
  /** Cotas oficiales que aparecen en el diagrama (separación de conos, anchos, etc.). */
  medidas: string[];
  /** Errores frecuentes, con su gravedad según la planilla oficial. */
  erroresComunes: ErrorManiobra[];
  /**
   * Zoom al PLANO del circuito. Solo lo tienen las maniobras que se recorren sobre
   * la pista (etapas 2 y 3). `null` en las demás.
   */
  region: RegionDiagrama | null;
  /**
   * Ilustración suelta, sin plano ni recorrido: se muestra tal cual.
   * La usa "caminar junto a la moto", que tiene su propio esquema en el instructivo
   * pero no es un mapa del circuito ni tiene animación.
   */
  ilustracion: string | null;
  /**
   * Tramo de la trayectoria oficial que recorre esta maniobra, para animar la moto.
   * `ruta` es la clave dentro de circuito-rutas.json; `desde`/`hasta` son fracciones
   * (0 a 1) de la polilínea completa de la etapa.
   * `null` en las maniobras que se hacen detenido.
   */
  animacion: { ruta: 'e2' | 'e3'; desde: number; hasta: number } | null;
}

/** Una de las tres etapas del examen práctico. */
export interface EtapaExamen {
  id: string;
  numero: number;
  nombre: string;
  motor: 'apagado' | 'encendido';
  /** Solo la etapa de velocidad está cronometrada. */
  segundos: number | null;
  resumen: string;
  /** Vista completa del panel oficial de la etapa. */
  diagrama: RegionDiagrama;
  maniobras: Maniobra[];
}
