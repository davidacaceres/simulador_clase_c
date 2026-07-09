import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pregunta } from '../../core/models/pregunta.model';
import { FavoritosService } from '../../core/services/favoritos.service';
import libroCfg from '../../core/data/libro.config.json';

/**
 * Muestra una pregunta con sus alternativas. Soporta selección ÚNICA (radio) y
 * MÚLTIPLE (casillas). El padre decide cómo actualizar la selección al emitir el
 * índice pulsado (reemplazar en única, alternar en múltiple).
 * - En Modo Examen: `mostrarFeedback` = false.
 * - En Práctica / revisión: `mostrarFeedback` = true (colorea correctas e incorrectas
 *   y muestra explicación, referencia y fuente).
 */
@Component({
  selector: 'app-pregunta-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card pregunta">
      <button
        type="button"
        class="fav"
        [class.activa]="fav.esFavorita(pregunta.id)"
        [attr.aria-pressed]="fav.esFavorita(pregunta.id)"
        (click)="fav.alternar(pregunta.id)"
        title="Marcar como difícil / favorita"
      >
        {{ fav.esFavorita(pregunta.id) ? '★' : '☆' }}
      </button>

      <span class="tipo-badge" [class.multi]="esMultiple">
        {{ esMultiple ? '☑ Selección múltiple · marca todas las que correspondan' : '◉ Selección única' }}
      </span>

      <p class="enunciado">{{ pregunta.enunciado }}</p>

      <img
        *ngIf="pregunta.imagen"
        [src]="pregunta.imagen"
        [alt]="'Imagen de la pregunta ' + pregunta.id"
        class="imagen"
      />

      <div
        class="alternativas"
        [attr.role]="esMultiple ? 'group' : 'radiogroup'"
        [attr.aria-label]="pregunta.enunciado"
      >
        <button
          *ngFor="let alt of pregunta.alternativas; let i = index"
          type="button"
          class="alternativa"
          [class.multi]="esMultiple"
          [class.seleccionada]="!mostrarFeedback && seleccionados.includes(i)"
          [class.correcta]="mostrarFeedback && pregunta.indicesCorrectos.includes(i)"
          [class.incorrecta]="mostrarFeedback && seleccionados.includes(i) && !pregunta.indicesCorrectos.includes(i)"
          [disabled]="deshabilitado"
          [attr.role]="esMultiple ? 'checkbox' : 'radio'"
          [attr.aria-checked]="seleccionados.includes(i)"
          (click)="seleccionar.emit(i)"
        >
          <span class="marca" aria-hidden="true">{{ seleccionados.includes(i) ? '✓' : letras[i] }}</span>
          <span class="texto">{{ alt }}</span>
        </button>
      </div>

      <div class="feedback" *ngIf="mostrarFeedback">
        <p class="explicacion"><strong>Explicación:</strong> {{ pregunta.explicacion }}</p>
        <div class="ref-libro" *ngIf="pregunta.referencia">
          <span class="ref-icono" aria-hidden="true">📖</span>
          <span class="ref-texto">{{ pregunta.referencia }}</span>
          <a
            class="ref-link"
            [href]="libro.enlace"
            target="_blank"
            rel="noopener"
            [title]="libro.titulo"
          >{{ libro.textoEnlace }} →</a>
        </div>
        <p class="fuente"><strong>Fuente:</strong> {{ pregunta.fuente }}</p>
      </div>

      <span class="id-interno" title="Identificador interno de la pregunta">{{ pregunta.id }}</span>
    </div>
  `,
  styles: [
    `
      .tipo-badge {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--color-texto-suave);
        background: var(--color-superficie-2);
        border: 1px solid var(--color-borde);
        border-radius: 999px;
        padding: 4px 10px;
        margin-bottom: 12px;
      }
      .tipo-badge.multi { color: var(--color-acento); border-color: var(--color-acento); }
      .enunciado { font-size: 1.1rem; font-weight: 600; margin: 0 0 14px; }
      .imagen {
        display: block;
        max-width: min(100%, 300px);
        height: auto;
        border-radius: var(--radio);
        margin: 0 auto 16px;
      }
      .alternativas { display: flex; flex-direction: column; gap: 10px; }
      .alternativa {
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        padding: 14px;
        border-radius: var(--radio);
        border: 2px solid var(--color-borde);
        background: var(--color-superficie-2);
        color: var(--color-texto);
        font-size: 1rem;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .alternativa:disabled { cursor: default; }
      .alternativa:not(:disabled):hover { border-color: var(--color-primario); }
      .alternativa.seleccionada {
        border-color: var(--color-primario);
        background: rgba(255, 173, 51, 0.12);
      }
      .alternativa.correcta {
        border-color: var(--color-exito);
        background: rgba(52, 199, 89, 0.15);
      }
      .alternativa.incorrecta {
        border-color: var(--color-error);
        background: rgba(255, 69, 58, 0.15);
      }
      .marca {
        flex: 0 0 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--color-fondo);
        font-weight: 700;
        font-size: 0.9rem;
      }
      /* casilla cuadrada para selección múltiple */
      .alternativa.multi .marca { border-radius: 6px; }
      .feedback { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-borde); }
      .explicacion { margin: 0 0 10px; font-size: 0.95rem; }
      .ref-libro {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        padding: 8px 12px; border-radius: var(--radio);
        background: var(--color-superficie-2); border: 1px solid var(--color-borde);
      }
      .ref-icono { flex: 0 0 auto; }
      .ref-texto { flex: 1; min-width: 140px; font-size: 0.82rem; color: var(--color-texto-suave); font-style: italic; }
      .ref-link {
        flex: 0 0 auto; font-size: 0.8rem; font-weight: 700; color: var(--color-acento);
        text-decoration: none; white-space: nowrap;
      }
      .ref-link:hover { text-decoration: underline; }
      .fuente { margin: 8px 0 0; font-size: 0.78rem; color: var(--color-texto-suave); }
      .pregunta {
        position: relative;
        padding-bottom: 26px;
        -webkit-user-select: none;
        user-select: none;
      }
      .fav {
        position: absolute;
        top: 10px;
        right: 10px;
        background: transparent;
        border: none;
        color: var(--color-texto-suave);
        font-size: 1.4rem;
        line-height: 1;
        cursor: pointer;
        padding: 2px 4px;
      }
      .fav.activa { color: var(--color-acento); }
      .fav:hover { color: var(--color-acento); }
      .id-interno {
        position: absolute;
        bottom: 6px;
        right: 10px;
        font-size: 0.68rem;
        font-family: monospace;
        color: var(--color-texto-suave);
        opacity: 0.6;
        user-select: all;
      }
    `,
  ],
})
export class PreguntaCardComponent {
  readonly fav = inject(FavoritosService);
  @Input({ required: true }) pregunta!: Pregunta;
  /** Índices actualmente marcados por el usuario. */
  @Input() seleccionados: number[] = [];
  @Input() mostrarFeedback = false;
  @Input() deshabilitado = false;
  @Output() seleccionar = new EventEmitter<number>();

  readonly letras = ['A', 'B', 'C', 'D', 'E', 'F'];
  readonly libro = libroCfg;

  get esMultiple(): boolean {
    return this.pregunta.tipo === 'multiple';
  }
}
