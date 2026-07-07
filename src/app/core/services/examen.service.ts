import { Injectable, signal } from '@angular/core';
import { Pregunta } from '../models/pregunta.model';
import { Resultado, RespuestaUsuario } from '../models/resultado.model';
import { mezclar, elegirPonderado } from '../utils/aleatorio';

/** Parámetros oficiales del Modo Examen. */
export const EXAMEN_CONFIG = {
  totalPreguntas: 35,
  totalDobles: 3,
  puntajeMinimo: 33,
  minutos: 45,
} as const;

/**
 * Distribución de las 32 preguntas de PUNTAJE SIMPLE por categoría (suma 32).
 * Las otras 3 son de doble puntaje (temas velocidad, alcohol, cinturón, casco,
 * retención infantil), elegidas aparte. Evita que la señalética domine el examen
 * aunque el banco tenga muchas señales; el banco completo sigue disponible en los
 * modos de práctica.
 */
export const DISTRIBUCION_EXAMEN: Record<string, number> = {
  senaletica: 11,
  normativa: 6,
  conduccion: 5,
  distancias: 4,
  fatiga: 3,
  motocicleta: 3,
};

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
   * Arma un examen realista:
   * 1) Toma `totalDobles` (3) preguntas de doble puntaje al azar.
   * 2) Completa cada categoría hasta su cupo (DISTRIBUCION_EXAMEN) con preguntas
   *    de puntaje simple, para un mix equilibrado.
   * 3) Si alguna categoría no alcanza, rellena con cualquier pregunta disponible
   *    hasta llegar a `totalPreguntas`.
   * Todo al azar y mezclado. Con bancos pequeños toma las que haya.
   */
  armarExamen(banco: Pregunta[]): Pregunta[] {
    const usados = new Set<string>();
    const seleccion: Pregunta[] = [];
    // peso de aparición de cada pregunta (por defecto 1 si no viene en el JSON)
    const peso = (p: Pregunta) => (typeof p.pesoExamen === 'number' ? p.pesoExamen : 1);

    // 1) preguntas de doble puntaje (selección ponderada por pesoExamen)
    const dobles = elegirPonderado(
      banco.filter((p) => p.esDoblePuntaje),
      EXAMEN_CONFIG.totalDobles,
      peso,
    );
    for (const d of dobles) {
      seleccion.push(d);
      usados.add(d.id);
    }

    // 2) llenar cada categoría con preguntas de PUNTAJE SIMPLE según la distribución,
    //    eligiendo de forma ponderada por pesoExamen
    for (const cat of Object.keys(DISTRIBUCION_EXAMEN)) {
      const n = DISTRIBUCION_EXAMEN[cat];
      const disponibles = elegirPonderado(
        banco.filter((p) => p.categoria === cat && !p.esDoblePuntaje && !usados.has(p.id)),
        n,
        peso,
      );
      for (const q of disponibles) {
        seleccion.push(q);
        usados.add(q.id);
      }
    }

    // 3) completar si faltan (categorías cortas), solo con puntaje simple para
    //    mantener exactamente 3 preguntas de doble puntaje
    if (seleccion.length < EXAMEN_CONFIG.totalPreguntas) {
      const faltan = EXAMEN_CONFIG.totalPreguntas - seleccion.length;
      const extra = elegirPonderado(
        banco.filter((p) => !p.esDoblePuntaje && !usados.has(p.id)),
        faltan,
        peso,
      );
      for (const q of extra) {
        seleccion.push(q);
        usados.add(q.id);
      }
    }

    return mezclar(seleccion).slice(0, EXAMEN_CONFIG.totalPreguntas);
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
