import { Categoria } from '../enums/categoria.enum';

/**
 * Estructura de una pregunta del banco (coincide con preguntas.json).
 */
export interface Pregunta {
  /** Identificador único, con prefijo por categoría (ej: "SEN-001"). */
  id: string;
  /** Categoría del temario. */
  categoria: Categoria;
  /** Texto de la pregunta. */
  enunciado: string;
  /** Ruta de la imagen de la señal, si aplica; null si es solo texto. */
  imagen: string | null;
  /** Alternativas de respuesta (normalmente 3 a 4). */
  alternativas: string[];
  /** Índice (0-based) de la alternativa correcta dentro de `alternativas`. */
  indiceCorrecta: number;
  /** true si pertenece a un tema de doble puntaje (velocidad, alcohol, cinturón, casco, retención infantil). */
  esDoblePuntaje: boolean;
  /** Explicación que se muestra en la revisión / práctica. */
  explicacion: string;
  /** Referencia al artículo de ley o sección del libro CONASET. */
  referencia: string;
}
