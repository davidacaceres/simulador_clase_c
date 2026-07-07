import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { PracticaRunnerComponent } from '../../shared/practica-runner/practica-runner.component';

/** Modo Práctica: todas las preguntas del banco, sin tiempo, con feedback inmediato. */
@Component({
  selector: 'app-practica',
  standalone: true,
  imports: [CommonModule, PracticaRunnerComponent],
  template: `
    <div class="contenedor">
      <h2>Práctica libre</h2>
      <p class="ayuda">Sin tiempo. Verás la respuesta correcta y la explicación tras cada pregunta.</p>
      <p *ngIf="cargando()">Cargando preguntas…</p>
      <app-practica-runner
        *ngIf="!cargando()"
        [preguntas]="preguntas()"
        modo="practica"
      />
    </div>
  `,
  styles: [`.ayuda { color: var(--color-texto-suave); font-size: 0.9rem; margin-top: 0; }`],
})
export class PracticaComponent implements OnInit {
  private banco = inject(BancoPreguntasService);
  cargando = signal(true);
  preguntas = signal<Pregunta[]>([]);

  ngOnInit(): void {
    this.banco.obtenerTodas().subscribe((ps) => {
      this.preguntas.set(ps);
      this.cargando.set(false);
    });
  }
}
