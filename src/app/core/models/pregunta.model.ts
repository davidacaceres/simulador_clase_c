import { Categoria } from '../enums/categoria.enum';

/**
 * Tipo de respuesta:
 * - 'unica': una alternativa correcta.
 * - 'multiple': varias alternativas correctas.
 * - 'emparejamiento': asociar cada ítem (ej. una señal numerada) con su significado.
 */
export type TipoPregunta = 'unica' | 'multiple' | 'emparejamiento';

/** Ítem a emparejar (ej. la señal número "1") con su significado correcto. */
export interface EmparejamientoItem {
  /** Etiqueta visible del ítem (ej. "1", "2"). */
  etiqueta: string;
  /** Índice (en `alternativas`) del significado correcto para este ítem. */
  indiceCorrecto: number;
}

/**
 * Estructura de una pregunta del banco (coincide con preguntas.json).
 */
export interface Pregunta {
  /** Identificador único, con prefijo por categoría (ej: "SEN-001"). */
  id: string;
  /** Categoría del temario. */
  categoria: Categoria;
  /** Tipo de selección: única o múltiple. */
  tipo: TipoPregunta;
  /** Texto de la pregunta. */
  enunciado: string;
  /** Ruta de la imagen de la señal, si aplica; null si es solo texto. */
  imagen: string | null;
  /** Alternativas de respuesta (normalmente 3 a 4). */
  alternativas: string[];
  /** Índice (0-based) de la alternativa correcta (válido en tipo 'unica'; en 'multiple' es la primera correcta). */
  indiceCorrecta: number;
  /** Índices de TODAS las alternativas correctas. En 'unica' es un único elemento. (No se usa en 'emparejamiento'.) */
  indicesCorrectos: number[];
  /** Ítems a emparejar. Solo en tipo 'emparejamiento'. */
  items?: EmparejamientoItem[];
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
