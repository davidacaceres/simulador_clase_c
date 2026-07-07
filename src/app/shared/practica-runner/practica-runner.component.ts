import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Pregunta } from '../../core/models/pregunta.model';
import { Intento, ModoIntento } from '../../core/models/intento.model';
import { Categoria } from '../../core/enums/categoria.enum';
import { HistorialService } from '../../core/services/historial.service';
import { mezclar } from '../../core/utils/aleatorio';

import { PreguntaCardComponent } from '../pregunta-card/pregunta-card.component';
import { BarraProgresoComponent } from '../barra-progreso/barra-progreso.component';

/**
 * Motor de práctica reutilizable (sin tiempo, con feedback inmediato).
 * Lo usan los modos Práctica, Por Tema y Repaso de errores: cada uno le pasa
 * la lista de preguntas y el `modo` con el que se guardará el intento.
 */
@Component({
  selector: 'app-practica-runner',
  standalone: true,
  imports: [CommonModule, PreguntaCardComponent, BarraProgresoComponent],
  template: `
    <ng-container *ngIf="preguntasMezcladas().length > 0; else vacio">
      <ng-container *ngIf="!mostrarResumen(); else resumen">
        <div class="cabecera">
          <app-barra-progreso [actual]="indice() + 1" [total]="preguntasMezcladas().length" />
          <span class="aciertos">✔️ {{ aciertos() }}</span>
        </div>

        <app-pregunta-card
          class="mt-16"
          [pregunta]="preguntaActual()!"
          [indiceSeleccionado]="seleccionados()[indice()]"
          [mostrarFeedback]="respondida()"
          [deshabilitado]="respondida()"
          (seleccionar)="responder($event)"
        />

        <div class="acciones mt-24">
          <button class="btn btn-secundario" (click)="anterior()" [disabled]="indice() === 0">← Anterior</button>
          <button
            *ngIf="indice() < preguntasMezcladas().length - 1"
            class="btn btn-primario"
            (click)="siguiente()"
            [disabled]="!respondida()"
          >
            Siguiente →
          </button>
          <button
            *ngIf="indice() === preguntasMezcladas().length - 1"
            class="btn btn-primario"
            (click)="finalizar()"
            [disabled]="!respondida()"
          >
            Ver resumen
          </button>
        </div>

        <button class="btn btn-secundario btn-bloque mt-16" (click)="finalizar()">Terminar práctica</button>
      </ng-container>

      <ng-template #resumen>
        <div class="card text-centro">
          <h2>Resumen</h2>
          <p class="puntaje">
            <span class="numero">{{ aciertos() }}</span>
            <span class="de">/ {{ preguntasMezcladas().length }} correctas</span>
          </p>
          <p class="porcentaje">{{ porcentaje() }}% de acierto</p>
          <div class="acciones mt-16">
            <button class="btn btn-secundario" (click)="inicio()">Inicio</button>
            <button class="btn btn-primario" (click)="reiniciar()">Repetir</button>
          </div>
        </div>
      </ng-template>
    </ng-container>

    <ng-template #vacio>
      <div class="card">
        <p>{{ mensajeVacio }}</p>
        <button class="btn btn-primario mt-16" (click)="inicio()">Volver al inicio</button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .cabecera { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .cabecera app-barra-progreso { flex: 1 1 200px; }
      .aciertos { font-weight: 700; color: var(--color-exito); white-space: nowrap; }
      .acciones { display: flex; gap: 12px; justify-content: space-between; flex-wrap: wrap; }
      .acciones .btn { flex: 1 1 auto; }
      .puntaje { margin: 8px 0 0; }
      .numero { font-size: 2.6rem; font-weight: 800; color: var(--color-primario); }
      .de { font-size: 1rem; color: var(--color-texto-suave); margin-left: 6px; }
      .porcentaje { margin: 4px 0 0; color: var(--color-texto-suave); }
    `,
  ],
})
export class PracticaRunnerComponent implements OnInit {
  private historial = inject(HistorialService);
  private router = inject(Router);

  /** Preguntas a practicar. */
  @Input({ required: true }) preguntas: Pregunta[] = [];
  /** Modo con el que se guarda el intento. */
  @Input() modo: ModoIntento = 'practica';
  /** Categoría (solo para modo 'tema'). */
  @Input() categoria?: Categoria;
  /** Mensaje cuando no hay preguntas. */
  @Input() mensajeVacio = 'No hay preguntas para practicar.';

  preguntasMezcladas = signal<Pregunta[]>([]);
  seleccionados = signal<(number | null)[]>([]);
  indice = signal(0);
  mostrarResumen = signal(false);

  preguntaActual = computed(() => this.preguntasMezcladas()[this.indice()] ?? null);
  respondida = computed(() => this.seleccionados()[this.indice()] !== null);
  aciertos = computed(() =>
    this.preguntasMezcladas().reduce(
      (acc, p, i) => acc + (this.seleccionados()[i] === p.indiceCorrecta ? 1 : 0),
      0,
    ),
  );
  porcentaje = computed(() => {
    const total = this.preguntasMezcladas().length;
    return total ? Math.round((this.aciertos() / total) * 100) : 0;
  });

  ngOnInit(): void {
    this.reiniciar();
  }

  responder(idx: number): void {
    if (this.respondida()) return; // una sola respuesta por pregunta
    this.seleccionados.update((arr) => {
      const copia = [...arr];
      copia[this.indice()] = idx;
      return copia;
    });
  }

  anterior(): void { if (this.indice() > 0) this.indice.update((i) => i - 1); }
  siguiente(): void {
    if (this.indice() < this.preguntasMezcladas().length - 1) this.indice.update((i) => i + 1);
  }

  finalizar(): void {
    this.guardarIntento();
    this.mostrarResumen.set(true);
  }

  reiniciar(): void {
    const mezcladas = mezclar(this.preguntas);
    this.preguntasMezcladas.set(mezcladas);
    this.seleccionados.set(new Array(mezcladas.length).fill(null));
    this.indice.set(0);
    this.mostrarResumen.set(false);
  }

  private guardarIntento(): void {
    const preguntas = this.preguntasMezcladas();
    if (preguntas.length === 0) return;
    const idsFalladas = preguntas
      .filter((p, i) => this.seleccionados()[i] !== p.indiceCorrecta)
      .map((p) => p.id);

    const intento: Intento = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      modo: this.modo,
      categoria: this.categoria,
      puntaje: this.aciertos(),
      puntajeMaximo: preguntas.length,
      aprobado: false, // no aplica en práctica
      idsFalladas,
    };
    this.historial.guardarIntento(intento);
  }

  inicio(): void { this.router.navigate(['/']); }
}
