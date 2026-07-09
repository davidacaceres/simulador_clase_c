import { Injectable, signal } from '@angular/core';

/**
 * Gestiona las preguntas marcadas como difíciles/favoritas por el usuario,
 * persistidas en localStorage. Expone un signal para que la UI reaccione.
 */
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private readonly clave = 'sim_clasec_favoritas';
  private readonly _ids = signal<Set<string>>(this.cargar());
  /** Signal de solo lectura con los ids marcados. */
  readonly ids = this._ids.asReadonly();

  /** ¿La pregunta está marcada como favorita/difícil? (reactivo en plantillas) */
  esFavorita(id: string): boolean {
    return this._ids().has(id);
  }

  /** Alterna el estado de favorita de una pregunta. */
  alternar(id: string): void {
    const copia = new Set(this._ids());
    if (copia.has(id)) copia.delete(id);
    else copia.add(id);
    this._ids.set(copia);
    this.guardar(copia);
  }

  /** Lista de ids marcados. */
  obtenerIds(): string[] {
    return [...this._ids()];
  }

  /** Cantidad de marcadas. */
  cantidad(): number {
    return this._ids().size;
  }

  /** Borra todas las marcadas. */
  limpiar(): void {
    this._ids.set(new Set());
    this.guardar(new Set());
  }

  private cargar(): Set<string> {
    try {
      const raw = localStorage.getItem(this.clave);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }

  private guardar(s: Set<string>): void {
    try {
      localStorage.setItem(this.clave, JSON.stringify([...s]));
    } catch {
      /* sin localStorage: no persiste */
    }
  }
}
