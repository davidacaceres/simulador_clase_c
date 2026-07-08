import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { CATEGORIAS } from '../../core/enums/categoria.enum';
import { PreguntaCardComponent } from '../../shared/pregunta-card/pregunta-card.component';
import { EmparejamientoCardComponent } from '../../shared/emparejamiento-card/emparejamiento-card.component';

/**
 * Verificador de preguntas: filtra por fuente y categoría, lista los ids como
 * botones a la derecha y muestra a la izquierda la pregunta seleccionada con su
 * respuesta correcta, explicación, referencia y fuente reveladas.
 */
@Component({
  selector: 'app-ver-pregunta',
  standalone: true,
  imports: [CommonModule, RouterLink, PreguntaCardComponent, EmparejamientoCardComponent],
  template: `
    <div class="wrap">
      <div class="cab">
        <h2>Verificador de preguntas</h2>
        <a class="btn btn-secundario" routerLink="/">Inicio</a>
      </div>

      <div class="layout">
        <!-- Panel (izquierda): filtros + ids -->
        <aside class="panel">
          <label class="campo">
            <span>Fuente</span>
            <select (change)="fuenteSel.set($any($event.target).value)">
              <option value="">Todas las fuentes</option>
              <option *ngFor="let f of fuentes()" [value]="f" [selected]="fuenteSel() === f">{{ f }}</option>
            </select>
          </label>

          <label class="campo">
            <span>Categoría</span>
            <select (change)="categoriaSel.set($any($event.target).value)">
              <option value="">Todas las categorías</option>
              <option *ngFor="let c of categorias" [value]="c.clave" [selected]="categoriaSel() === c.clave">
                {{ c.nombre }}
              </option>
            </select>
          </label>

          <p class="conteo">{{ filtradas().length }} preguntas</p>

          <div class="ids">
            <button
              *ngFor="let q of filtradas()"
              class="id-btn"
              [attr.id]="'idbtn-' + q.id"
              [class.activa]="seleccionada()?.id === q.id"
              [class.conimg]="q.imagen"
              (click)="elegir(q)"
              [title]="q.enunciado"
            >
              {{ q.id }}
            </button>
          </div>
        </aside>

        <!-- Detalle (derecha) -->
        <div class="detalle">
          <ng-container *ngIf="seleccionada() as p; else vacio">
            <app-pregunta-card
              *ngIf="p.tipo !== 'emparejamiento'"
              [pregunta]="p"
              [seleccionados]="[]"
              [mostrarFeedback]="true"
              [deshabilitado]="true"
            />
            <app-emparejamiento-card
              *ngIf="p.tipo === 'emparejamiento'"
              [pregunta]="p"
              [seleccionados]="vacioEmparejamiento(p)"
              [mostrarFeedback]="true"
              [deshabilitado]="true"
            />

            <div class="nav-preg mt-16">
              <button class="btn btn-secundario" (click)="anterior()" [disabled]="indiceActual() <= 0">
                ← Anterior
              </button>
              <span class="pos">{{ indiceActual() + 1 }} / {{ filtradas().length }}</span>
              <button
                class="btn btn-secundario"
                (click)="siguiente()"
                [disabled]="indiceActual() < 0 || indiceActual() >= filtradas().length - 1"
              >
                Siguiente →
              </button>
            </div>
          </ng-container>
          <ng-template #vacio>
            <div class="card"><p>Elige una pregunta del panel de la izquierda.</p></div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Ancho completo del browser (layout fluido, se adapta solo) */
      .wrap { width: 100%; padding: 16px 24px; box-sizing: border-box; }
      .cab { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .layout { display: flex; gap: 24px; align-items: flex-start; margin-top: 12px; flex-wrap: wrap; }
      /* Panel de filtros + ids a la izquierda (ancho fijo) */
      .panel {
        flex: 0 0 340px;
        position: sticky;
        top: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      /* Detalle de la pregunta a la derecha (ocupa el resto del ancho) */
      .detalle { flex: 1 1 480px; min-width: 0; }
      @media (max-width: 760px) {
        .wrap { padding: 12px; }
        .panel { flex: 1 1 100%; position: static; }
      }
      .campo { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--color-texto-suave); }
      .campo select {
        padding: 10px;
        border-radius: var(--radio);
        border: 2px solid var(--color-borde);
        background: var(--color-superficie-2);
        color: var(--color-texto);
        font-size: 0.9rem;
      }
      .conteo { margin: 4px 0; font-size: 0.8rem; color: var(--color-texto-suave); }
      .ids {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 72vh;
        overflow-y: auto;
        padding: 4px;
        border: 1px solid var(--color-borde);
        border-radius: var(--radio);
        background: var(--color-superficie);
      }
      .id-btn {
        font-family: monospace;
        font-size: 0.72rem;
        padding: 5px 7px;
        border-radius: 6px;
        border: 1px solid var(--color-borde);
        background: var(--color-superficie-2);
        color: var(--color-texto-suave);
        cursor: pointer;
      }
      .id-btn:hover { border-color: var(--color-primario); color: var(--color-texto); }
      .id-btn.conimg { border-left: 3px solid var(--color-acento); }
      .id-btn.activa { background: var(--color-primario); color: var(--color-sobre-primario); border-color: var(--color-primario); }
      .nav-preg { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .nav-preg .pos { font-size: 0.85rem; color: var(--color-texto-suave); font-variant-numeric: tabular-nums; }
    `,
  ],
})
export class VerPreguntaComponent implements OnInit {
  private banco = inject(BancoPreguntasService);
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);

  readonly categorias = CATEGORIAS;
  todas = signal<Pregunta[]>([]);
  fuenteSel = signal('');
  categoriaSel = signal('');
  seleccionada = signal<Pregunta | null>(null);

  fuentes = computed(() => [...new Set(this.todas().map((p) => p.fuente))].sort());
  filtradas = computed(() =>
    this.todas().filter(
      (p) =>
        (this.fuenteSel() === '' || p.fuente === this.fuenteSel()) &&
        (this.categoriaSel() === '' || p.categoria === this.categoriaSel()),
    ),
  );
  /** Posición de la pregunta seleccionada dentro de la lista filtrada (-1 si no está). */
  indiceActual = computed(() => {
    const sel = this.seleccionada();
    return sel ? this.filtradas().findIndex((q) => q.id === sel.id) : -1;
  });

  ngOnInit(): void {
    this.banco.obtenerTodas().subscribe((ps) => {
      this.todas.set(ps);
      const id = this.ruta.snapshot.paramMap.get('id');
      if (id) {
        const q = ps.find((p) => p.id.toUpperCase() === id.toUpperCase());
        if (q) this.seleccionada.set(q);
      }
    });
  }

  elegir(q: Pregunta): void {
    this.seleccionada.set(q);
    // refleja el id en la URL sin recargar
    this.router.navigate(['/pregunta', q.id]);
    // desplaza el botón activo a la vista dentro de la lista
    setTimeout(() => {
      document.getElementById('idbtn-' + q.id)?.scrollIntoView({ block: 'nearest' });
    });
  }

  anterior(): void {
    const i = this.indiceActual();
    if (i > 0) this.elegir(this.filtradas()[i - 1]);
  }

  siguiente(): void {
    const i = this.indiceActual();
    const lista = this.filtradas();
    if (i >= 0 && i < lista.length - 1) this.elegir(lista[i + 1]);
  }

  vacioEmparejamiento(p: Pregunta): number[] {
    return new Array(p.items?.length ?? 0).fill(-1);
  }
}
