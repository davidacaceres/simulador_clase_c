import { Component, Input, computed, signal } from '@angular/core';

/**
 * Muestra el tiempo restante en formato mm:ss. Cambia a estado de alerta
 * cuando quedan 5 minutos o menos. No maneja la cuenta regresiva por sí mismo;
 * recibe los segundos restantes desde el componente padre.
 */
@Component({
  selector: 'app-cronometro',
  standalone: true,
  template: `
    <div class="cronometro" [class.alerta]="alerta()" role="timer" aria-live="off">
      <span class="icono" aria-hidden="true">⏱️</span>
      <span class="tiempo">{{ texto() }}</span>
    </div>
  `,
  styles: [
    `
      .cronometro {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--color-superficie-2);
        border: 1px solid var(--color-borde);
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        font-size: 1.05rem;
      }
      .cronometro.alerta {
        background: rgba(255, 69, 58, 0.15);
        border-color: var(--color-error);
        color: var(--color-error);
        animation: latido 1s ease-in-out infinite;
      }
      @keyframes latido {
        50% { opacity: 0.6; }
      }
    `,
  ],
})
export class CronometroComponent {
  private _segundos = signal(0);

  /** Segundos restantes. */
  @Input({ required: true }) set segundos(valor: number) {
    this._segundos.set(Math.max(0, valor));
  }

  texto = computed(() => {
    const s = this._segundos();
    const min = Math.floor(s / 60);
    const seg = s % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  });

  alerta = computed(() => this._segundos() <= 300);
}
