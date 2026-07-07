import { Injectable } from '@angular/core';
import { Intento } from '../models/intento.model';

const CLAVE_HISTORIAL = 'sim_clasec_historial';
const CLAVE_FALLADAS = 'sim_clasec_falladas';

/**
 * Persistencia local (localStorage) del historial de intentos y de las
 * preguntas falladas en el último intento (para el modo Repaso de errores).
 * Está encapsulado para tolerar entornos sin localStorage (p. ej. SSR).
 */
@Injectable({ providedIn: 'root' })
export class HistorialService {
  private get disponible(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  /** Guarda un intento al inicio del historial (más reciente primero). */
  guardarIntento(intento: Intento): void {
    if (!this.disponible) return;
    const historial = this.obtenerIntentos();
    historial.unshift(intento);
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
    localStorage.setItem(CLAVE_FALLADAS, JSON.stringify(intento.idsFalladas));
  }

  /** Devuelve todos los intentos (más reciente primero). */
  obtenerIntentos(): Intento[] {
    if (!this.disponible) return [];
    try {
      const raw = localStorage.getItem(CLAVE_HISTORIAL);
      return raw ? (JSON.parse(raw) as Intento[]) : [];
    } catch {
      return [];
    }
  }

  /** Ids de las preguntas falladas en el último intento (para Repaso de errores). */
  obtenerUltimasFalladas(): string[] {
    if (!this.disponible) return [];
    try {
      const raw = localStorage.getItem(CLAVE_FALLADAS);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  /** Borra todo el historial. */
  limpiar(): void {
    if (!this.disponible) return;
    localStorage.removeItem(CLAVE_HISTORIAL);
    localStorage.removeItem(CLAVE_FALLADAS);
  }
}
