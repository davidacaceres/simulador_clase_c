import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Insignia grande de resultado: APROBADO / REPROBADO. */
@Component({
  selector: 'app-resultado-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badge" [class.aprobado]="aprobado" [class.reprobado]="!aprobado">
      <span class="icono" aria-hidden="true">{{ aprobado ? '✅' : '❌' }}</span>
      <span class="texto">{{ aprobado ? 'Aprobado' : 'Reprobado' }}</span>
    </div>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 24px;
        border-radius: 999px;
        font-size: 1.3rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .aprobado { background: rgba(52, 199, 89, 0.15); color: var(--color-exito); border: 2px solid var(--color-exito); }
      .reprobado { background: rgba(255, 69, 58, 0.15); color: var(--color-error); border: 2px solid var(--color-error); }
      .icono { font-size: 1.4rem; }
    `,
  ],
})
export class ResultadoBadgeComponent {
  @Input({ required: true }) aprobado = false;
}
