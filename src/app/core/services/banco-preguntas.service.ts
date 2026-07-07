import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, map } from 'rxjs';
import { Pregunta } from '../models/pregunta.model';
import { Categoria } from '../enums/categoria.enum';

/**
 * Carga el banco de preguntas desde el JSON estático (assets/data/preguntas.json)
 * y ofrece utilidades de filtrado. La carga se cachea con shareReplay para no
 * pedir el archivo más de una vez.
 */
@Injectable({ providedIn: 'root' })
export class BancoPreguntasService {
  private readonly ruta = 'assets/data/preguntas.json';
  private preguntas$?: Observable<Pregunta[]>;

  constructor(private http: HttpClient) {}

  /** Devuelve todas las preguntas del banco (cacheado). */
  obtenerTodas(): Observable<Pregunta[]> {
    if (!this.preguntas$) {
      this.preguntas$ = this.http.get<Pregunta[]>(this.ruta).pipe(shareReplay(1));
    }
    return this.preguntas$;
  }

  /** Devuelve solo las preguntas de una categoría. */
  obtenerPorCategoria(categoria: Categoria): Observable<Pregunta[]> {
    return this.obtenerTodas().pipe(map((ps) => ps.filter((p) => p.categoria === categoria)));
  }

  /** Devuelve las preguntas cuyos ids estén en la lista (para Repaso de errores). */
  obtenerPorIds(ids: string[]): Observable<Pregunta[]> {
    const set = new Set(ids);
    return this.obtenerTodas().pipe(map((ps) => ps.filter((p) => set.has(p.id))));
  }
}
