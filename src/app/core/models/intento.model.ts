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
}
