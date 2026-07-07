import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialService } from '../../core/services/historial.service';
import { Intento, ModoIntento } from '../../core/models/intento.model';

const NOMBRE_MODO: Record<ModoIntento, string> = {
  examen: 'Examen',
  practica: 'Práctica',
  tema: 'Por tema',
  repaso: 'Repaso',
};

/** Historial de intentos y estadísticas, leídos de localStorage. */
@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contenedor">
      <h2>Historial y estadísticas</h2>

      <ng-container *ngIf="intentos().length > 0; else vacio">
        <!-- Estadísticas -->
        <div class="stats mt-16">
          <div class="card stat">
            <span class="valor">{{ intentos().length }}</span>
            <span class="etq">Intentos</span>
          </div>
          <div class="card stat">
            <span class="valor">{{ examenes().length }}</span>
            <span class="etq">Exámenes</span>
          </div>
          <div class="card stat">
            <span class="valor">{{ tasaAprobacion() }}%</span>
            <span class="etq">Aprobación</span>
          </div>
          <div class="card stat">
            <span class="valor">{{ mejorExamen() }}</span>
            <span class="etq">Mejor puntaje</span>
          </div>
        </div>

        <!-- Lista de intentos -->
        <div class="lista mt-24">
          <div class="card intento" *ngFor="let it of intentos()">
            <div class="fila">
              <span class="modo">{{ nombreModo(it.modo) }}</span>
              <span
                class="resultado"
                *ngIf="it.modo === 'examen'"
                [class.ok]="it.aprobado"
                [class.mal]="!it.aprobado"
              >
                {{ it.aprobado ? 'Aprobado' : 'Reprobado' }}
              </span>
            </div>
            <div class="fila secundaria">
              <span>{{ it.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
              <span>{{ it.puntaje }} / {{ it.puntajeMaximo }}</span>
            </div>
          </div>
        </div>

        <button class="btn btn-secundario btn-bloque mt-24" (click)="limpiar()">Borrar historial</button>
      </ng-container>

      <ng-template #vacio>
        <div class="card mt-16">
          <p>Todavía no tienes intentos registrados. Haz un examen o una práctica para empezar.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (min-width: 560px) { .stats { grid-template-columns: repeat(4, 1fr); } }
      .stat { text-align: center; padding: 16px; }
      .stat .valor { display: block; font-size: 1.8rem; font-weight: 800; color: var(--color-primario); }
      .stat .etq { font-size: 0.78rem; color: var(--color-texto-suave); text-transform: uppercase; letter-spacing: 0.04em; }
      .lista { display: flex; flex-direction: column; gap: 10px; }
      .intento { padding: 14px 16px; }
      .fila { display: flex; justify-content: space-between; align-items: center; }
      .fila.secundaria { margin-top: 6px; font-size: 0.85rem; color: var(--color-texto-suave); }
      .modo { font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; font-size: 0.9rem; }
      .resultado { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
      .resultado.ok { color: var(--color-exito); }
      .resultado.mal { color: var(--color-error); }
    `,
  ],
})
export class HistorialComponent {
  private historial = inject(HistorialService);

  intentos = signal<Intento[]>(this.historial.obtenerIntentos());
  examenes = computed(() => this.intentos().filter((i) => i.modo === 'examen'));

  tasaAprobacion = computed(() => {
    const ex = this.examenes();
    if (ex.length === 0) return 0;
    const aprobados = ex.filter((i) => i.aprobado).length;
    return Math.round((aprobados / ex.length) * 100);
  });

  mejorExamen = computed(() => {
    const ex = this.examenes();
    if (ex.length === 0) return '—';
    const mejor = Math.max(...ex.map((i) => i.puntaje));
    const max = ex[0]?.puntajeMaximo ?? 38;
    return `${mejor}/${max}`;
  });

  nombreModo(m: ModoIntento): string { return NOMBRE_MODO[m]; }

  limpiar(): void {
    this.historial.limpiar();
    this.intentos.set([]);
  }
}
