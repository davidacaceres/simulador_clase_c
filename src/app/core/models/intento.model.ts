import { Categoria } from '../enums/categoria.enum';

/** Modo en que se realizó un intento. */
export type ModoIntento = 'examen' | 'practica' | 'tema' | 'repaso';

/**
 * Registro histórico de un intento, persistido en localStorage.
 */
export interface Intento {
  /** Identificador único del intento (timestamp o uuid). */
  id: string;
  /** Fecha ISO en que se realizó. */
  fecha: string;
  /** Modo del intento. */
  modo: ModoIntento;
  /** Categoría, solo cuando el modo es 'tema'. */
  categoria?: Categoria;
  /** Puntaje obtenido. */
  puntaje: number;
  /** Puntaje máximo posible. */
  puntajeMaximo: number;
  /** true si aprobó (solo relevante en Modo Examen). */
  aprobado: boolean;
  /** Ids de preguntas falladas, para el modo Repaso de errores. */
  idsFalladas: string[];
  /** Detalle por pregunta (para reimprimir el certificado desde el historial). */
  detalle?: DetalleRespuesta[];
  /** Datos del certificado emitido (para reimpresión desde el historial). */
  certificado?: EmisionCertificado;
}

/** Datos de la emisión original del certificado (para reimpresión). */
export interface EmisionCertificado {
  folio: string;
  nombre: string;
  correo: string;
  /** Fecha ISO de emisión original. */
  emitido: string;
}

/** Detalle mínimo de una respuesta, guardado para reconstruir el certificado. */
export interface DetalleRespuesta {
  /** Código de la pregunta. */
  id: string;
  /** Índices elegidos por el postulante. */
  seleccion: number[];
  /** true si la respuesta fue correcta. */
  correcta: boolean;
}
