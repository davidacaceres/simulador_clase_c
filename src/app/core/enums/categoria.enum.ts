/**
 * Categorías del temario del examen teórico Clase C.
 * El valor string coincide con el campo `categoria` del banco de preguntas (JSON).
 */
export enum Categoria {
  Senaletica = 'senaletica',
  Normativa = 'normativa',
  Conduccion = 'conduccion',
  Distancias = 'distancias',
  Alcohol = 'alcohol',
  Fatiga = 'fatiga',
  Motocicleta = 'motocicleta',
}

/** Metadatos para mostrar cada categoría en la interfaz. */
export interface CategoriaInfo {
  clave: Categoria;
  nombre: string;
  descripcion: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { clave: Categoria.Senaletica, nombre: 'Señalética', descripcion: 'Señales reglamentarias, preventivas e informativas.' },
  { clave: Categoria.Normativa, nombre: 'Normativa y Ley de Tránsito', descripcion: 'Reglas generales, documentación y prioridades.' },
  { clave: Categoria.Conduccion, nombre: 'Conducción segura y maniobras', descripcion: 'Cambio de pista, adelantamiento y virajes.' },
  { clave: Categoria.Distancias, nombre: 'Distancias de detención y frenado', descripcion: 'Tiempo de reacción y frenado.' },
  { clave: Categoria.Alcohol, nombre: 'Alcohol y drogas', descripcion: 'Ley Tolerancia Cero y Ley Emilia.' },
  { clave: Categoria.Fatiga, nombre: 'Fatiga y sueño', descripcion: 'Prevención de la fatiga al conducir.' },
  { clave: Categoria.Motocicleta, nombre: 'Específicos de motocicleta', descripcion: 'Casco, vestimenta reflectante y visibilidad.' },
];
