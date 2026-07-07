import { Injectable, signal } from '@angular/core';
import { Pregunta } from '../models/pregunta.model';
import { Resultado, RespuestaUsuario } from '../models/resultado.model';
import { mezclar } from '../utils/aleatorio';

/** Parámetros oficiales del Modo Examen. */
export const EXAMEN_CONFIG = {
  totalPreguntas: 35,
  totalDobles: 3,
  puntajeMinimo: 33,
  minutos: 45,
} as const;

/**
 * Lógica de negocio del examen: arma el set de preguntas, calcula el resultado
 * aplicando las reglas oficiales, y guarda en memoria el último resultado para
 * que la pantalla de resultado lo pueda leer.
 */
@Injectable({ providedIn: 'root' })
export class ExamenService {
  /** Último resultado calculado (en memoria, no se persiste). */
  readonly ultimoResultado = signal<Resultado | null>(null);

  /**
   * Arma un examen tomando `totalDobles` preguntas de doble puntaje y el resto
   * de puntaje simple, hasta `totalPreguntas`, todo al azar y mezclado.
   * Si el banco no alcanza (banco de ejemplo), toma tantas como haya disponibles.
   */
  armarExamen(banco: Pregunta[]): Pregunta[] {
    const dobles = mezclar(banco.filter((p) => p.esDoblePuntaje)).slice(0, EXAMEN_CONFIG.totalDobles);
    const faltantes = EXAMEN_CONFIG.totalPreguntas - dobles.length;
    const normales = mezclar(banco.filter((p) => !p.esDoblePuntaje)).slice(0, faltantes);
    return mezclar([...dobles, ...normales]);
  }

  /**
   * Calcula el resultado del examen.
   * - Cada pregunta correcta suma 1 punto (o 2 si es de doble puntaje).
   * - Aprueba si el puntaje alcanza el mínimo Y no falló TODAS las preguntas
   *   de doble puntaje (regla especial: fallar las 3 dobles reprueba de inmediato).
   */
  calcularResultado(preguntas: Pregunta[], respuestas: (number | null)[]): Resultado {
    let puntaje = 0;
    let puntajeMaximo = 0;
    let doblesTotales = 0;
    let doblesFalladas = 0;
    const revision: RespuestaUsuario[] = [];

    preguntas.forEach((pregunta, i) => {
      const valor = pregunta.esDoblePuntaje ? 2 : 1;
      puntajeMaximo += valor;
      if (pregunta.esDoblePuntaje) doblesTotales++;

      const indiceElegido = respuestas[i] ?? null;
      const correcta = indiceElegido === pregunta.indiceCorrecta;

      if (correcta) {
        puntaje += valor;
      } else if (pregunta.esDoblePuntaje) {
        doblesFalladas++;
      }

      revision.push({ pregunta, indiceElegido, correcta });
    });

    // Regla especial: si falló todas las preguntas de doble puntaje del examen, reprueba.
    const falloTodasLasDobles = doblesTotales > 0 && doblesFalladas === doblesTotales;
    const aprobado = puntaje >= EXAMEN_CONFIG.puntajeMinimo && !falloTodasLasDobles;

    const resultado: Resultado = {
      puntaje,
      puntajeMaximo,
      doblesFalladas,
      doblesTotales,
      aprobado,
      revision,
    };
    this.ultimoResultado.set(resultado);
    return resultado;
  }
}
