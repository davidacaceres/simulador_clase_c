import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BancoPreguntasService, FUENTES } from '../../core/services/banco-preguntas.service';
import { Pregunta } from '../../core/models/pregunta.model';
import { PracticaRunnerComponent } from '../../shared/practica-runner/practica-runner.component';

/**
 * Modo de práctica que usa SOLO las preguntas del cuestionario de conducirmotos.cl.
 * Sin tiempo, con feedback inmediato.
 */
@Component({
  selector: 'app-conducir-motos',
  standalone: true,
  imports: [CommonModule, PracticaRunnerComponent],
  template: `
    <div class="contenedor">
      <h2>Práctica Conducir Motos</h2>
      <p class="ayuda">
        Solo preguntas del cuestionario de conducirmotos.cl (las que típicamente aparecen en el examen).
        Sin tiempo y con feedback tras cada respuesta.
      </p>
      <p *ngIf="cargando()">Cargando preguntas…</p>
      <app-practica-runner
        *ngIf="!cargando()"
        [preguntas]="preguntas()"
        modo="practica"
        mensajeVacio="No hay preguntas de esta fuente en el banco."
      />
    </div>
  `,
  styles: [`.ayuda { color: var(--color-texto-suave); font-size: 0.9rem; margin-top: 0; }`],
})
export class ConducirMotosComponent implements OnInit {
  private banco = inject(BancoPreguntasService);
  cargando = signal(true);
  preguntas = signal<Pregunta[]>([]);

  ngOnInit(): void {
    this.banco.obtenerPorFuente(FUENTES.conducirMotos).subscribe((ps) => {
      this.preguntas.set(ps);
      this.cargando.set(false);
    });
  }
}
