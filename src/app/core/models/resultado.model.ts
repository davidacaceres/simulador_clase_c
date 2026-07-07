import { Pregunta } from './pregunta.model';

/** Respuesta del postulante a una pregunta concreta. */
export interface RespuestaUsuario {
  pregunta: Pregunta;
  /** Índice elegido por el usuario, o null si no respondió. */
  indiceElegido: number | null;
  /** true si el índice elegido coincide con el correcto. */
  correcta: boolean;
}

/** Resultado final de un examen o práctica. */
export interface Resultado {
  /** Puntaje obtenido (dobles cuentan 2, normales 1). */
  puntaje: number;
  /** Puntaje máximo posible del examen (38 en Modo Examen). */
  puntajeMaximo: number;
  /** Cantidad de preguntas de doble puntaje respondidas mal. */
  doblesFalladas: number;
  /** Total de preguntas de doble puntaje en el examen. */
  doblesTotales: number;
  /** true si aprobó según las reglas (>= mínimo y no falló las 3 dobles). */
  aprobado: boolean;
  /** Detalle pregunta por pregunta para la revisión. */
  revision: RespuestaUsuario[];
}
