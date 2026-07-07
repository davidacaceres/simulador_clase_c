import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { PreguntaCardComponent } from '../../shared/pregunta-card/pregunta-card.component';
import { EmparejamientoCardComponent } from '../../shared/emparejamiento-card/emparejamiento-card.component';

/**
 * Muestra UNA pregunta por su id (desde la URL: /#/pregunta/CU-051), con la
 * respuesta correcta y la explicación reveladas. Sirve para revisar y corregir.
 */
@Component({
  selector: 'app-ver-pregunta',
  standalone: true,
  imports: [CommonModule, RouterLink, PreguntaCardComponent, EmparejamientoCardComponent],
  template: `
    <div class="contenedor">
      <h2>Ver pregunta por id</h2>

      <form class="buscador" (submit)="buscar(idInput.value); $event.preventDefault()">
        <input #idInput type="text" [value]="id()" placeholder="Ej: CU-051" aria-label="Id de la pregunta" />
        <button class="btn btn-primario" type="submit">Ir</button>
        <a class="btn btn-secundario" routerLink="/">Inicio</a>
      </form>

      <ng-container *ngIf="!cargando()">
        <ng-container *ngIf="pregunta() as p; else noExiste">
          <app-pregunta-card
            *ngIf="p.tipo !== 'emparejamiento'"
            class="mt-16"
            [pregunta]="p"
            [seleccionados]="[]"
            [mostrarFeedback]="true"
            [deshabilitado]="true"
          />
          <app-emparejamiento-card
            *ngIf="p.tipo === 'emparejamiento'"
            class="mt-16"
            [pregunta]="p"
            [seleccionados]="vacioEmparejamiento(p)"
            [mostrarFeedback]="true"
            [deshabilitado]="true"
          />
        </ng-container>
        <ng-template #noExiste>
          <div class="card mt-16" *ngIf="id()">
            <p>No existe una pregunta con id <strong>{{ id() }}</strong>.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .buscador { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
      .buscador input {
        flex: 1 1 160px;
        padding: 12px;
        border-radius: var(--radio);
        border: 2px solid var(--color-borde);
        background: var(--color-superficie-2);
        color: var(--color-texto);
        font-size: 1rem;
        font-family: monospace;
        text-transform: uppercase;
      }
    `,
  ],
})
export class VerPreguntaComponent implements OnInit {
  private banco = inject(BancoPreguntasService);
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);

  id = signal('');
  pregunta = signal<Pregunta | null>(null);
  cargando = signal(true);

  ngOnInit(): void {
    this.ruta.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      this.id.set(id);
      if (!id) {
        this.pregunta.set(null);
        this.cargando.set(false);
        return;
      }
      this.cargando.set(true);
      this.banco.obtenerPorId(id).subscribe((p) => {
        this.pregunta.set(p ?? null);
        this.cargando.set(false);
      });
    });
  }

  buscar(valor: string): void {
    const id = valor.trim();
    if (id) this.router.navigate(['/pregunta', id.toUpperCase()]);
  }

  /** Arreglo de -1 (sin elegir) del largo de los ítems, para mostrar el emparejamiento sin respuestas. */
  vacioEmparejamiento(p: Pregunta): number[] {
    return new Array(p.items?.length ?? 0).fill(-1);
  }
}
