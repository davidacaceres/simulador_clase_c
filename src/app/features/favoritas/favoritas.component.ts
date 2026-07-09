import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { FavoritosService } from '../../core/services/favoritos.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { PracticaRunnerComponent } from '../../shared/practica-runner/practica-runner.component';

/** Repaso solo con las preguntas marcadas como difíciles/favoritas (★). */
@Component({
  selector: 'app-favoritas',
  standalone: true,
  imports: [CommonModule, PracticaRunnerComponent],
  template: `
    <div class="contenedor">
      <div class="cab">
        <h2>Repaso de favoritas ★</h2>
        <button
          *ngIf="preguntas().length > 0"
          class="btn btn-secundario btn-sm"
          (click)="limpiar()"
        >
          Quitar todas
        </button>
      </div>
      <p class="ayuda">Practica solo las preguntas que marcaste con la estrella (★). Sin tiempo, con feedback.</p>
      <p *ngIf="cargando()">Cargando…</p>
      <app-practica-runner
        *ngIf="!cargando()"
        [preguntas]="preguntas()"
        modo="repaso"
        mensajeVacio="Aún no has marcado preguntas. Toca la estrella (☆) en una pregunta para agregarla aquí."
      />
    </div>
  `,
  styles: [
    `
      .cab { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ayuda { color: var(--color-texto-suave); font-size: 0.9rem; margin-top: 0; }
      .btn-sm { padding: 8px 12px; font-size: 0.8rem; }
    `,
  ],
})
export class FavoritasComponent implements OnInit {
  private banco = inject(BancoPreguntasService);
  private favoritos = inject(FavoritosService);

  cargando = signal(true);
  preguntas = signal<Pregunta[]>([]);

  ngOnInit(): void {
    const ids = this.favoritos.obtenerIds();
    if (ids.length === 0) {
      this.preguntas.set([]);
      this.cargando.set(false);
      return;
    }
    this.banco.obtenerPorIds(ids).subscribe((ps) => {
      this.preguntas.set(ps);
      this.cargando.set(false);
    });
  }

  limpiar(): void {
    this.favoritos.limpiar();
    this.preguntas.set([]);
  }
}
