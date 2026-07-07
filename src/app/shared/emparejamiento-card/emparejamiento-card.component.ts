import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pregunta } from '../../core/models/pregunta.model';

/**
 * Tarjeta para preguntas de tipo 'emparejamiento': muestra la imagen con los
 * ítems numerados y un desplegable por ítem para asociar cada uno con su
 * significado (una de las `alternativas`). El puntaje es todo o nada.
 * `seleccionados[i]` = índice de la alternativa elegida para el ítem i (-1 si nada).
 */
@Component({
  selector: 'app-emparejamiento-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card pregunta">
      <span class="tipo-badge">🔗 Emparejamiento · asocia cada número con su significado</span>

      <p class="enunciado">{{ pregunta.enunciado }}</p>

      <img
        *ngIf="pregunta.imagen"
        [src]="pregunta.imagen"
        [alt]="'Imagen de la pregunta ' + pregunta.id"
        class="imagen"
      />

      <div class="pares">
        <div class="par" *ngFor="let it of pregunta.items; let i = index">
          <span class="num">{{ it.etiqueta }}</span>
          <select
            class="sel"
            [class.correcta]="mostrarFeedback && seleccionados[i] === it.indiceCorrecto"
            [class.incorrecta]="mostrarFeedback && seleccionados[i] !== -1 && seleccionados[i] !== it.indiceCorrecto"
            [disabled]="deshabilitado"
            (change)="onCambio(i, $event)"
            [attr.aria-label]="'Significado para el número ' + it.etiqueta"
          >
            <option [value]="-1" [selected]="seleccionados[i] === -1" disabled>Elige el significado…</option>
            <option
              *ngFor="let alt of pregunta.alternativas; let j = index"
              [value]="j"
              [selected]="seleccionados[i] === j"
            >
              {{ alt }}
            </option>
          </select>
          <span
            class="correcto"
            *ngIf="mostrarFeedback && seleccionados[i] !== it.indiceCorrecto"
          >
            ✓ {{ pregunta.alternativas[it.indiceCorrecto] }}
          </span>
        </div>
      </div>

      <div class="feedback" *ngIf="mostrarFeedback">
        <p class="explicacion"><strong>Explicación:</strong> {{ pregunta.explicacion }}</p>
        <p class="referencia">{{ pregunta.referencia }}</p>
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
        color: var(--color-acento);
        background: var(--color-superficie-2);
        border: 1px solid var(--color-acento);
        border-radius: 999px;
        padding: 4px 10px;
        margin-bottom: 12px;
      }
      .enunciado { font-size: 1.1rem; font-weight: 600; margin: 0 0 14px; }
      .imagen {
        display: block;
        max-width: min(100%, 460px);
        height: auto;
        border-radius: var(--radio);
        margin: 0 auto 16px;
      }
      .pares { display: flex; flex-direction: column; gap: 10px; }
      .par { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .num {
        flex: 0 0 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: var(--color-primario);
        color: var(--color-sobre-primario);
        font-weight: 800;
      }
      .sel {
        flex: 1 1 220px;
        padding: 12px;
        border-radius: var(--radio);
        border: 2px solid var(--color-borde);
        background: var(--color-superficie-2);
        color: var(--color-texto);
        font-size: 1rem;
      }
      .sel.correcta { border-color: var(--color-exito); background: rgba(52, 199, 89, 0.15); }
      .sel.incorrecta { border-color: var(--color-error); background: rgba(255, 69, 58, 0.15); }
      .correcto { font-size: 0.85rem; color: var(--color-exito); font-weight: 700; }
      .feedback { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--color-borde); }
      .explicacion { margin: 0 0 6px; font-size: 0.95rem; }
      .referencia { margin: 0; font-size: 0.82rem; color: var(--color-texto-suave); font-style: italic; }
      .fuente { margin: 4px 0 0; font-size: 0.78rem; color: var(--color-texto-suave); }
      .pregunta { position: relative; padding-bottom: 26px; }
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
export class EmparejamientoCardComponent {
  @Input({ required: true }) pregunta!: Pregunta;
  /** seleccionados[i] = índice de alternativa elegida para el ítem i (-1 = sin elegir). */
  @Input() seleccionados: number[] = [];
  @Input() mostrarFeedback = false;
  @Input() deshabilitado = false;
  @Output() emparejar = new EventEmitter<{ item: number; opcion: number }>();

  onCambio(item: number, ev: Event): void {
    const opcion = Number((ev.target as HTMLSelectElement).value);
    this.emparejar.emit({ item, opcion });
  }
}
