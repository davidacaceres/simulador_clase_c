import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Barra de progreso simple: "actual de total" con relleno proporcional. */
@Component({
  selector: 'app-barra-progreso',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <div class="etiqueta">
        <span>Pregunta {{ actual }} de {{ total }}</span>
        <span *ngIf="respondidas !== null">{{ respondidas }} respondidas</span>
      </div>
      <div
        class="pista"
        role="progressbar"
        [attr.aria-valuenow]="actual"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="total"
      >
        <div class="relleno" [style.width.%]="porcentaje()"></div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; }
      .wrap { width: 100%; }
      .etiqueta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 0.8rem;
        color: var(--color-texto-suave);
        margin-bottom: 6px;
        white-space: nowrap;
      }
      .pista {
        height: 8px;
        border-radius: 999px;
        background: var(--color-superficie-2);
        overflow: hidden;
      }
      .relleno {
        height: 100%;
        background: var(--color-primario);
        transition: width 0.2s ease;
      }
    `,
  ],
})
export class BarraProgresoComponent {
  private _actual = signal(0);
  private _total = signal(1);

  @Input({ required: true }) set actual(v: number) { this._actual.set(v); }
  get actual() { return this._actual(); }

  @Input({ required: true }) set total(v: number) { this._total.set(Math.max(1, v)); }
  get total() { return this._total(); }

  /** Cantidad de preguntas respondidas (opcional). */
  @Input() respondidas: number | null = null;

  porcentaje = computed(() => Math.round((this._actual() / this._total()) * 100));
}
