import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Pregunta } from '../../core/models/pregunta.model';
import { Intento, ModoIntento } from '../../core/models/intento.model';
import { Categoria } from '../../core/enums/categoria.enum';
import { HistorialService } from '../../core/services/historial.service';
import { mezclar } from '../../core/utils/aleatorio';

import { PreguntaCardComponent } from '../pregunta-card/pregunta-card.component';
import { EmparejamientoCardComponent } from '../emparejamiento-card/emparejamiento-card.component';
import { BarraProgresoComponent } from '../barra-progreso/barra-progreso.component';

/**
 * Motor de práctica reutilizable (sin tiempo, con feedback inmediato).
 * Soporta preguntas de selección única y múltiple: en las múltiples el usuario
 * marca varias opciones y confirma antes de ver el feedback.
 */
@Component({
  selector: 'app-practica-runner',
  standalone: true,
  imports: [CommonModule, PreguntaCardComponent, EmparejamientoCardComponent, BarraProgresoComponent],
  template: `
    <ng-container *ngIf="preguntasMezcladas().length > 0; else vacio">
      <ng-container *ngIf="!mostrarResumen(); else resumen">
        <div class="cabecera">
          <app-barra-progreso [actual]="indice() + 1" [total]="preguntasMezcladas().length" />
          <span class="aciertos">✔️ {{ aciertos() }}</span>
        </div>

        <app-pregunta-card
          *ngIf="preguntaActual()!.tipo !== 'emparejamiento'"
          class="mt-16"
          [pregunta]="preguntaActual()!"
          [seleccionados]="seleccionados()[indice()]"
          [mostrarFeedback]="revelada()"
          [deshabilitado]="revelada()"
          (seleccionar)="responder($event)"
        />
        <app-emparejamiento-card
          *ngIf="preguntaActual()!.tipo === 'emparejamiento'"
          class="mt-16"
          [pregunta]="preguntaActual()!"
          [seleccionados]="seleccionados()[indice()]"
          [mostrarFeedback]="revelada()"
          [deshabilitado]="revelada()"
          (emparejar)="emparejar($event)"
        />

        <!-- Confirmar (múltiple y emparejamiento, antes de revelar) -->
        <button
          *ngIf="requiereConfirmar() && !revelada()"
          class="btn btn-primario btn-bloque mt-16"
          [disabled]="!puedeConfirmar()"
          (click)="confirmar()"
        >
          Confirmar respuesta
        </button>

        <div class="acciones mt-24">
          <button class="btn btn-secundario" (click)="anterior()" [disabled]="indice() === 0">← Anterior</button>
          <button
            *ngIf="indice() < preguntasMezcladas().length - 1"
            class="btn btn-primario"
            (click)="siguiente()"
            [disabled]="!revelada()"
          >
            Siguiente →
          </button>
          <button
            *ngIf="indice() === preguntasMezcladas().length - 1"
            class="btn btn-primario"
            (click)="finalizar()"
            [disabled]="!revelada()"
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

  @Input({ required: true }) preguntas: Pregunta[] = [];
  @Input() modo: ModoIntento = 'practica';
  @Input() categoria?: Categoria;
  @Input() mensajeVacio = 'No hay preguntas para practicar.';

  preguntasMezcladas = signal<Pregunta[]>([]);
  seleccionados = signal<number[][]>([]);
  reveladas = signal<boolean[]>([]);
  indice = signal(0);
  mostrarResumen = signal(false);

  preguntaActual = computed(() => this.preguntasMezcladas()[this.indice()] ?? null);
  revelada = computed(() => this.reveladas()[this.indice()] === true);
  /** Múltiple y emparejamiento requieren confirmar antes de revelar. */
  requiereConfirmar = computed(() => this.preguntaActual()?.tipo !== 'unica');
  puedeConfirmar = computed(() => {
    const p = this.preguntaActual();
    const sel = this.seleccionados()[this.indice()] ?? [];
    if (!p) return false;
    if (p.tipo === 'emparejamiento') return sel.length > 0 && sel.every((x) => x !== -1);
    return sel.length > 0;
  });

  aciertos = computed(() =>
    this.preguntasMezcladas().reduce(
      (acc, p, i) => acc + (this.esCorrecta(p, this.seleccionados()[i] ?? []) ? 1 : 0),
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
    if (this.revelada()) return; // bloqueada tras revelar
    const p = this.preguntaActual();
    if (!p) return;
    this.seleccionados.update((arr) => {
      const copia = arr.map((r) => [...r]);
      const actual = copia[this.indice()];
      if (p.tipo === 'multiple') {
        const pos = actual.indexOf(idx);
        if (pos >= 0) actual.splice(pos, 1);
        else actual.push(idx);
      } else {
        copia[this.indice()] = [idx];
      }
      return copia;
    });
    // en selección única, revelar de inmediato
    if (p.tipo === 'unica') this.revelar();
  }

  /** Emparejamiento: asigna la opción a un ítem (no revela hasta confirmar). */
  emparejar(e: { item: number; opcion: number }): void {
    if (this.revelada()) return;
    this.seleccionados.update((arr) => {
      const copia = arr.map((r) => [...r]);
      copia[this.indice()][e.item] = e.opcion;
      return copia;
    });
  }

  confirmar(): void {
    if (this.puedeConfirmar()) this.revelar();
  }

  private revelar(): void {
    this.reveladas.update((arr) => {
      const copia = [...arr];
      copia[this.indice()] = true;
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
    this.seleccionados.set(
      mezcladas.map((p) =>
        p.tipo === 'emparejamiento' ? new Array(p.items?.length ?? 0).fill(-1) : [],
      ),
    );
    this.reveladas.set(mezcladas.map(() => false));
    this.indice.set(0);
    this.mostrarResumen.set(false);
  }

  private esCorrecta(p: Pregunta, elegidos: number[]): boolean {
    if (p.tipo === 'emparejamiento') {
      const items = p.items ?? [];
      return items.length > 0 && items.every((it, i) => elegidos[i] === it.indiceCorrecto);
    }
    if (elegidos.length !== p.indicesCorrectos.length) return false;
    const s = new Set(elegidos);
    return p.indicesCorrectos.every((x) => s.has(x));
  }

  private guardarIntento(): void {
    const preguntas = this.preguntasMezcladas();
    if (preguntas.length === 0) return;
    const idsFalladas = preguntas
      .filter((p, i) => !this.esCorrecta(p, this.seleccionados()[i] ?? []))
      .map((p) => p.id);

    const intento: Intento = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      modo: this.modo,
      categoria: this.categoria,
      puntaje: this.aciertos(),
      puntajeMaximo: preguntas.length,
      aprobado: false,
      idsFalladas,
      // detalle por pregunta (para el diagnóstico por categoría)
      detalle: preguntas.map((p, i) => {
        const sel = this.seleccionados()[i] ?? [];
        return { id: p.id, seleccion: sel, correcta: this.esCorrecta(p, sel) };
      }),
    };
    this.historial.guardarIntento(intento);
  }

  inicio(): void { this.router.navigate(['/']); }
}
