import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { Categoria, CATEGORIAS, CategoriaInfo } from '../../core/enums/categoria.enum';
import { PracticaRunnerComponent } from '../../shared/practica-runner/practica-runner.component';

/** Modo Por Tema: primero se elige una categoría, luego se practica solo con ella. */
@Component({
  selector: 'app-por-tema',
  standalone: true,
  imports: [CommonModule, PracticaRunnerComponent],
  template: `
    <div class="contenedor">
      <h2>Práctica por tema</h2>

      <ng-container *ngIf="!categoriaElegida(); else practicando">
        <p class="ayuda">Elige una categoría para estudiar.</p>
        <div class="grid mt-16">
          <button
            *ngFor="let cat of categorias"
            class="card tema"
            type="button"
            (click)="elegir(cat)"
          >
            <span class="nombre">{{ cat.nombre }}</span>
            <span class="desc">{{ cat.descripcion }}</span>
            <span class="conteo">{{ conteos()[cat.clave] || 0 }} preguntas</span>
          </button>
        </div>
      </ng-container>

      <ng-template #practicando>
        <button class="btn btn-secundario mb-16" (click)="volver()">← Cambiar tema</button>
        <app-practica-runner
          [preguntas]="preguntas()"
          modo="tema"
          [categoria]="categoriaElegida()!"
          mensajeVacio="Esta categoría aún no tiene preguntas."
        />
      </ng-template>
    </div>
  `,
  styles: [
    `
      .ayuda { color: var(--color-texto-suave); font-size: 0.9rem; margin-top: 0; }
      .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
      @media (min-width: 560px) { .grid { grid-template-columns: 1fr 1fr; } }
      .tema {
        display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
        text-align: left; cursor: pointer; color: var(--color-texto);
        border: 2px solid transparent; transition: border-color 0.15s ease;
      }
      .tema:hover { border-color: var(--color-primario); }
      .nombre { font-weight: 700; font-size: 1.05rem; }
      .desc { font-size: 0.85rem; color: var(--color-texto-suave); }
      .conteo { font-size: 0.75rem; color: var(--color-acento); font-weight: 600; margin-top: 4px; }
      .mb-16 { margin-bottom: 16px; }
    `,
  ],
})
export class PorTemaComponent implements OnInit {
  private banco = inject(BancoPreguntasService);

  readonly categorias = CATEGORIAS;
  conteos = signal<Record<string, number>>({});
  categoriaElegida = signal<Categoria | null>(null);
  preguntas = signal<Pregunta[]>([]);

  ngOnInit(): void {
    this.banco.obtenerTodas().subscribe((ps) => {
      const conteo: Record<string, number> = {};
      ps.forEach((p) => (conteo[p.categoria] = (conteo[p.categoria] || 0) + 1));
      this.conteos.set(conteo);
    });
  }

  elegir(cat: CategoriaInfo): void {
    this.categoriaElegida.set(cat.clave);
    this.banco.obtenerPorCategoria(cat.clave).subscribe((ps) => this.preguntas.set(ps));
  }

  volver(): void {
    this.categoriaElegida.set(null);
    this.preguntas.set([]);
  }
}
