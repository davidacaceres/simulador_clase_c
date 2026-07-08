import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { ExamenService, EXAMEN_CONFIG } from '../../core/services/examen.service';
import { HistorialService } from '../../core/services/historial.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { Intento } from '../../core/models/intento.model';

import { PreguntaCardComponent } from '../../shared/pregunta-card/pregunta-card.component';
import { EmparejamientoCardComponent } from '../../shared/emparejamiento-card/emparejamiento-card.component';
import { CronometroComponent } from '../../shared/cronometro/cronometro.component';
import { BarraProgresoComponent } from '../../shared/barra-progreso/barra-progreso.component';

@Component({
  selector: 'app-examen',
  standalone: true,
  imports: [
    CommonModule,
    PreguntaCardComponent,
    EmparejamientoCardComponent,
    CronometroComponent,
    BarraProgresoComponent,
  ],
  template: `
    <div class="contenedor">
      <p *ngIf="cargando()">Preparando tu examen…</p>

      <div class="card" *ngIf="error()">
        <p>{{ error() }}</p>
        <button class="btn btn-secundario mt-16" (click)="volverInicio()">Volver al inicio</button>
      </div>

      <!-- Pantalla de inicio del examen (el cronómetro NO corre aún) -->
      <div class="card intro" *ngIf="!cargando() && !error() && !iniciado()">
        <h2>Modo Examen</h2>
        <ul class="reglas">
          <li><strong>{{ preguntas().length }}</strong> preguntas de selección múltiple.</li>
          <li>Tiempo límite: <strong>{{ config.minutos }} minutos</strong> (se corta al llegar a 0).</li>
          <li>Preguntas de <strong>doble puntaje</strong>: valen 2 puntos.</li>
          <li>Apruebas con <strong>{{ config.puntajeMinimo }}</strong> puntos o más.</li>
          <li>Si fallas todas las de doble puntaje, repruebas automáticamente.</li>
        </ul>
        <button class="btn btn-primario btn-bloque mt-16" (click)="comenzar()">Comenzar examen</button>
        <button class="btn btn-secundario btn-bloque mt-8" (click)="volverInicio()">Cancelar</button>
      </div>

      <!-- Examen en curso -->
      <ng-container *ngIf="iniciado() && preguntaActual() as pregunta">
        <div class="barra-superior">
          <app-barra-progreso
            [actual]="indiceActual() + 1"
            [total]="preguntas().length"
            [respondidas]="respondidas()"
          />
          <app-cronometro [segundos]="segundosRestantes()" />
        </div>

        <p class="sr-only" aria-live="polite">Pregunta {{ indiceActual() + 1 }} de {{ preguntas().length }}</p>

        <app-pregunta-card
          *ngIf="pregunta.tipo !== 'emparejamiento'"
          class="mt-16"
          [pregunta]="pregunta"
          [seleccionados]="respuestas()[indiceActual()]"
          [mostrarFeedback]="false"
          (seleccionar)="responder($event)"
        />
        <app-emparejamiento-card
          *ngIf="pregunta.tipo === 'emparejamiento'"
          class="mt-16"
          [pregunta]="pregunta"
          [seleccionados]="respuestas()[indiceActual()]"
          [mostrarFeedback]="false"
          (emparejar)="emparejar($event)"
        />

        <div class="navegador mt-16" role="navigation" aria-label="Ir a pregunta">
          <button
            *ngFor="let p of preguntas(); let i = index"
            type="button"
            class="chip"
            [class.actual]="i === indiceActual()"
            [class.respondida]="respondidaEn(i)"
            (click)="irA(i)"
            [attr.aria-label]="'Pregunta ' + (i + 1) + (respondidaEn(i) ? ', respondida' : '')"
            [attr.aria-current]="i === indiceActual() ? 'true' : null"
          >
            {{ i + 1 }}
          </button>
        </div>

        <div class="acciones mt-24">
          <button class="btn btn-secundario" (click)="anterior()" [disabled]="indiceActual() === 0">
            ← Anterior
          </button>
          <button
            *ngIf="indiceActual() < preguntas().length - 1"
            class="btn btn-primario"
            (click)="siguiente()"
          >
            Siguiente →
          </button>
          <button
            *ngIf="indiceActual() === preguntas().length - 1"
            class="btn btn-primario"
            (click)="pedirConfirmacion()"
          >
            Finalizar
          </button>
        </div>

        <button class="btn btn-secundario btn-bloque mt-16" (click)="pedirConfirmacion()">
          Terminar examen ahora
        </button>
      </ng-container>
    </div>

    <!-- Confirmación de finalizar -->
    <div
      class="overlay"
      *ngIf="mostrarConfirmar()"
      (click)="mostrarConfirmar.set(false)"
    >
      <div
        class="card dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloConfirmar"
        (click)="$event.stopPropagation()"
      >
        <h2 id="tituloConfirmar">¿Finalizar el examen?</h2>
        <p>
          Respondiste <strong>{{ respondidas() }}</strong> de
          <strong>{{ preguntas().length }}</strong> preguntas.
          <span *ngIf="respondidas() < preguntas().length">
            Las no respondidas se contarán como incorrectas.
          </span>
        </p>
        <div class="acciones mt-16">
          <button class="btn btn-secundario" (click)="mostrarConfirmar.set(false)">Seguir</button>
          <button class="btn btn-primario" (click)="finalizar()">Finalizar</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .sr-only {
        position: absolute;
        width: 1px; height: 1px;
        padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0, 0, 0, 0);
        white-space: nowrap; border: 0;
      }
      .intro h2 { margin-top: 0; }
      .reglas { margin: 0; padding-left: 20px; line-height: 1.9; }
      .barra-superior {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .navegador { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--color-borde);
        background: var(--color-superficie);
        color: var(--color-texto-suave);
        font-weight: 700;
        cursor: pointer;
      }
      .chip.respondida { color: var(--color-texto); border-color: var(--color-primario); }
      .chip.actual { background: var(--color-primario); color: var(--color-sobre-primario); border-color: var(--color-primario); }
      .acciones { display: flex; gap: 12px; justify-content: space-between; flex-wrap: wrap; }
      .acciones .btn { flex: 1 1 auto; }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10;
      }
      .dialogo { max-width: 420px; width: 100%; }
      .dialogo h2 { margin-top: 0; }
    `,
  ],
})
export class ExamenComponent implements OnInit, OnDestroy {
  private banco = inject(BancoPreguntasService);
  private examenSrv = inject(ExamenService);
  private historial = inject(HistorialService);
  private router = inject(Router);

  readonly config = EXAMEN_CONFIG;

  cargando = signal(true);
  error = signal<string | null>(null);
  iniciado = signal(false);
  preguntas = signal<Pregunta[]>([]);
  /** Una lista de índices marcados por pregunta (vacía = sin responder). */
  respuestas = signal<number[][]>([]);
  indiceActual = signal(0);
  segundosRestantes = signal(EXAMEN_CONFIG.minutos * 60);
  mostrarConfirmar = signal(false);

  private intervalo: ReturnType<typeof setInterval> | null = null;
  private finalizado = false;

  preguntaActual = computed(() => this.preguntas()[this.indiceActual()] ?? null);
  respondidas = computed(
    () =>
      this.respuestas().filter((r, i) => {
        const p = this.preguntas()[i];
        return p?.tipo === 'emparejamiento'
          ? r.length > 0 && r.every((x) => x !== -1)
          : r.length > 0;
      }).length,
  );

  ngOnInit(): void {
    this.banco.obtenerTodas().subscribe({
      next: (banco) => {
        if (!banco || banco.length === 0) {
          this.error.set('No se pudo cargar el banco de preguntas.');
          this.cargando.set(false);
          return;
        }
        const preguntas = this.examenSrv.armarExamen(banco);
        this.preguntas.set(preguntas);
        this.respuestas.set(
          preguntas.map((p) =>
            p.tipo === 'emparejamiento' ? new Array(p.items?.length ?? 0).fill(-1) : [],
          ),
        );
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Ocurrió un error al cargar las preguntas.');
        this.cargando.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.detenerCronometro();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mostrarConfirmar()) this.mostrarConfirmar.set(false);
  }

  comenzar(): void {
    this.iniciado.set(true);
    this.iniciarCronometro();
  }

  private iniciarCronometro(): void {
    this.intervalo = setInterval(() => {
      const restante = this.segundosRestantes() - 1;
      this.segundosRestantes.set(restante);
      if (restante <= 0) {
        this.detenerCronometro();
        this.finalizar(); // corte automático por tiempo
      }
    }, 1000);
  }

  private detenerCronometro(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }

  responder(indice: number): void {
    const pregunta = this.preguntaActual();
    if (!pregunta) return;
    this.respuestas.update((arr) => {
      const copia = arr.map((r) => [...r]);
      const actual = copia[this.indiceActual()];
      if (pregunta.tipo === 'multiple') {
        // alternar el índice
        const pos = actual.indexOf(indice);
        if (pos >= 0) actual.splice(pos, 1);
        else actual.push(indice);
      } else {
        // única: reemplazar
        copia[this.indiceActual()] = [indice];
      }
      return copia;
    });
  }

  /** Emparejamiento: asigna la opción elegida a un ítem. */
  emparejar(e: { item: number; opcion: number }): void {
    this.respuestas.update((arr) => {
      const copia = arr.map((r) => [...r]);
      copia[this.indiceActual()][e.item] = e.opcion;
      return copia;
    });
  }

  /** true si la pregunta i ya fue respondida (según su tipo). */
  respondidaEn(i: number): boolean {
    const r = this.respuestas()[i] ?? [];
    const p = this.preguntas()[i];
    return p?.tipo === 'emparejamiento' ? r.length > 0 && r.every((x) => x !== -1) : r.length > 0;
  }

  irA(i: number): void { this.indiceActual.set(i); }
  anterior(): void { if (this.indiceActual() > 0) this.indiceActual.update((i) => i - 1); }
  siguiente(): void {
    if (this.indiceActual() < this.preguntas().length - 1) this.indiceActual.update((i) => i + 1);
  }

  pedirConfirmacion(): void { this.mostrarConfirmar.set(true); }

  finalizar(): void {
    if (this.finalizado) return;
    this.finalizado = true;
    this.detenerCronometro();
    this.mostrarConfirmar.set(false);

    const preguntas = this.preguntas();
    const resultado = this.examenSrv.calcularResultado(preguntas, this.respuestas());

    const intento: Intento = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      modo: 'examen',
      puntaje: resultado.puntaje,
      puntajeMaximo: resultado.puntajeMaximo,
      aprobado: resultado.aprobado,
      idsFalladas: resultado.revision.filter((r) => !r.correcta).map((r) => r.pregunta.id),
      // detalle para poder reimprimir el certificado desde el historial
      detalle: resultado.revision.map((r) => ({
        id: r.pregunta.id,
        seleccion: r.indicesElegidos,
        correcta: r.correcta,
      })),
    };
    this.historial.guardarIntento(intento);
    this.examenSrv.ultimoIntentoId.set(intento.id);

    this.router.navigate(['/resultado']);
  }

  volverInicio(): void { this.router.navigate(['/']); }
}
