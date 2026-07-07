import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Pregunta } from '../models/pregunta.model';
import { Categoria } from '../enums/categoria.enum';
// El banco se importa en tiempo de COMPILACIÓN y queda dentro del bundle JS.
// No se sirve como archivo (assets/data/preguntas.json ya no existe), por lo que
// no hay una URL directa para descargar las preguntas y respuestas.
import bancoJson from '../data/preguntas.json';

/**
 * Provee el banco de preguntas ya empaquetado en la aplicación.
 * Mantiene una API basada en Observable para no cambiar los componentes.
 */
@Injectable({ providedIn: 'root' })
export class BancoPreguntasService {
  private readonly preguntas = bancoJson as unknown as Pregunta[];

  /** Devuelve todas las preguntas del banco. */
  obtenerTodas(): Observable<Pregunta[]> {
    return of(this.preguntas);
  }

  /** Devuelve solo las preguntas de una categoría. */
  obtenerPorCategoria(categoria: Categoria): Observable<Pregunta[]> {
    return of(this.preguntas.filter((p) => p.categoria === categoria));
  }

  /** Devuelve las preguntas cuyos ids estén en la lista (para Repaso de errores). */
  obtenerPorIds(ids: string[]): Observable<Pregunta[]> {
    const set = new Set(ids);
    return of(this.preguntas.filter((p) => set.has(p.id)));
  }

  /** Devuelve solo las preguntas de una fuente concreta (ej. el cuestionario de conducirmotos.cl). */
  obtenerPorFuente(fuente: string): Observable<Pregunta[]> {
    return of(this.preguntas.filter((p) => p.fuente === fuente));
  }

  /** Busca una pregunta por su id (case-insensitive). undefined si no existe. */
  obtenerPorId(id: string): Observable<Pregunta | undefined> {
    const clave = id.trim().toUpperCase();
    return of(this.preguntas.find((p) => p.id.toUpperCase() === clave));
  }
}

/** Fuentes conocidas del banco (útiles para filtrar por modo). */
export const FUENTES = {
  conducirMotos: 'Cuestionario Clase C – conducirmotos.cl',
} as const;
