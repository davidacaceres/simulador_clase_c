import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { HistorialService } from '../../core/services/historial.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { PracticaRunnerComponent } from '../../shared/practica-runner/practica-runner.component';

/** Modo Repaso de errores: rehace solo las preguntas falladas en el último intento. */
@Component({
  selector: 'app-repaso',
  standalone: true,
  imports: [CommonModule, PracticaRunnerComponent],
  template: `
    <div class="contenedor">
      <h2>Repaso de errores</h2>
      <p class="ayuda">Practica solo las preguntas que fallaste en tu último intento.</p>
      <p *ngIf="cargando()">Cargando…</p>
      <app-practica-runner
        *ngIf="!cargando()"
        [preguntas]="preguntas()"
        modo="repaso"
        mensajeVacio="No hay preguntas falladas para repasar. ¡Haz un examen o una práctica primero!"
      />
    </div>
  `,
  styles: [`.ayuda { color: var(--color-texto-suave); font-size: 0.9rem; margin-top: 0; }`],
})
export class RepasoComponent implements OnInit {
  private banco = inject(BancoPreguntasService);
  private historial = inject(HistorialService);

  cargando = signal(true);
  preguntas = signal<Pregunta[]>([]);

  ngOnInit(): void {
    const ids = this.historial.obtenerUltimasFalladas();
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
}
