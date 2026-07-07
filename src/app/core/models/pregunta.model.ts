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
  /**
   * Peso / probabilidad relativa de aparecer en el Modo Examen.
   * 1 = normal, mayor = más probable, 0 = nunca aparece en el examen.
   * (No afecta a los modos de práctica, que usan todo el banco.)
   */
  pesoExamen: number;
  /** Explicación que se muestra en la revisión / práctica. */
  explicacion: string;
  /** Referencia al artículo de ley o sección específica del material. */
  referencia: string;
  /** Fuente / documento de origen de la pregunta (ej: "Libro del Nuevo Conductor Clase C"). */
  fuente: string;
}
