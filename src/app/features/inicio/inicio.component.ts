import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';

/** Descripción de un modo para la pantalla de inicio. */
interface ModoTarjeta {
  icono: string;
  titulo: string;
  descripcion: string;
  ruta: string | null; // null = aún no implementado
  etapa: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contenedor">
      <p class="intro mt-16">
        Practica para el examen teórico municipal de la licencia Clase C. Elige un modo para comenzar.
      </p>

      <p class="banco-info" *ngIf="preguntas$ | async as preguntas; else cargando">
        Banco cargado: <strong>{{ preguntas.length }}</strong> preguntas de ejemplo.
      </p>
      <ng-template #cargando>
        <p class="banco-info">Cargando banco de preguntas…</p>
      </ng-template>

      <div class="grid mt-16">
        <button
          *ngFor="let modo of modos"
          class="card modo"
          [class.deshabilitado]="!modo.ruta"
          [disabled]="!modo.ruta"
          type="button"
          (click)="abrir(modo)"
        >
          <span class="modo-icono" aria-hidden="true">{{ modo.icono }}</span>
          <span class="modo-titulo">{{ modo.titulo }}</span>
          <span class="modo-desc">{{ modo.descripcion }}</span>
          <span class="modo-etapa" *ngIf="!modo.ruta">Próximamente · {{ modo.etapa }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .intro { color: var(--color-texto-suave); }
      .banco-info { font-size: 0.9rem; color: var(--color-texto-suave); }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      @media (min-width: 560px) {
        .grid { grid-template-columns: 1fr 1fr; }
      }
      .modo {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        text-align: left;
        cursor: pointer;
        color: var(--color-texto);
        border: 2px solid transparent;
        transition: border-color 0.15s ease, transform 0.05s ease;
      }
      .modo:not(.deshabilitado):hover { border-color: var(--color-primario); }
      .modo:active { transform: scale(0.99); }
      .modo.deshabilitado { opacity: 0.6; cursor: not-allowed; }
      .modo-icono { font-size: 1.8rem; }
      .modo-titulo { font-weight: 700; font-size: 1.05rem; }
      .modo-desc { font-size: 0.85rem; color: var(--color-texto-suave); }
      .modo-etapa {
        margin-top: 4px;
        font-size: 0.72rem;
        color: var(--color-acento);
        font-weight: 600;
      }
    `,
  ],
})
export class InicioComponent {
  private banco = inject(BancoPreguntasService);
  private router = inject(Router);
  preguntas$ = this.banco.obtenerTodas();

  abrir(modo: ModoTarjeta): void {
    if (modo.ruta) this.router.navigate([modo.ruta]);
  }

  modos: ModoTarjeta[] = [
    {
      icono: '📝',
      titulo: 'Modo Examen',
      descripcion: '35 preguntas, 45 minutos y reglas reales del examen.',
      ruta: '/examen',
      etapa: 'Etapa 3',
    },
    {
      icono: '🎯',
      titulo: 'Modo Práctica',
      descripcion: 'Sin tiempo, con feedback inmediato tras cada respuesta.',
      ruta: '/practica',
      etapa: 'Etapa 4',
    },
    {
      icono: '📚',
      titulo: 'Práctica por Tema',
      descripcion: 'Estudia una categoría específica del temario.',
      ruta: '/por-tema',
      etapa: 'Etapa 4',
    },
    {
      icono: '🔁',
      titulo: 'Repaso de errores',
      descripcion: 'Repite solo las preguntas que fallaste.',
      ruta: '/repaso',
      etapa: 'Etapa 4',
    },
    {
      icono: '📊',
      titulo: 'Historial y estadísticas',
      descripcion: 'Revisa tus intentos y tu progreso.',
      ruta: '/historial',
      etapa: 'Etapa 6',
    },
  ];
}
