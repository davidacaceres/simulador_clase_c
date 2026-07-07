import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ExamenService, EXAMEN_CONFIG } from '../../core/services/examen.service';
import { PreguntaCardComponent } from '../../shared/pregunta-card/pregunta-card.component';
import { EmparejamientoCardComponent } from '../../shared/emparejamiento-card/emparejamiento-card.component';
import { ResultadoBadgeComponent } from '../../shared/resultado-badge/resultado-badge.component';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule, PreguntaCardComponent, EmparejamientoCardComponent, ResultadoBadgeComponent],
  template: `
    <div class="contenedor" *ngIf="resultado() as r; else sinResultado">
      <div class="card resumen text-centro">
        <app-resultado-badge [aprobado]="r.aprobado" />

        <p class="puntaje mt-16">
          <span class="numero">{{ r.puntaje }}</span>
          <span class="de">/ {{ r.puntajeMaximo }} puntos</span>
        </p>
        <p class="minimo">Mínimo para aprobar: {{ minimo }} puntos</p>

        <p class="regla-especial" *ngIf="reproboPorDobles()">
          ⚠️ Reprobado por regla especial: se fallaron las {{ r.doblesTotales }} preguntas de doble puntaje.
        </p>

        <div class="acciones mt-16">
          <button class="btn btn-secundario" (click)="inicio()">Inicio</button>
          <button class="btn btn-primario" (click)="repetir()">Repetir examen</button>
        </div>
      </div>

      <h2 class="mt-24">Revisión</h2>
      <p class="ayuda">Revisa cada pregunta con la respuesta correcta y su explicación.</p>

      <div class="revision">
        <div class="item" *ngFor="let rev of r.revision; let i = index">
          <div class="item-cabecera">
            <span class="num">{{ i + 1 }}</span>
            <span class="estado" [class.ok]="rev.correcta" [class.mal]="!rev.correcta">
              {{ rev.correcta ? 'Correcta' : (rev.indicesElegidos.length === 0 ? 'Sin responder' : 'Incorrecta') }}
            </span>
            <span class="doble" *ngIf="rev.pregunta.esDoblePuntaje">Doble puntaje</span>
          </div>
          <app-pregunta-card
            *ngIf="rev.pregunta.tipo !== 'emparejamiento'"
            [pregunta]="rev.pregunta"
            [seleccionados]="rev.indicesElegidos"
            [mostrarFeedback]="true"
            [deshabilitado]="true"
          />
          <app-emparejamiento-card
            *ngIf="rev.pregunta.tipo === 'emparejamiento'"
            [pregunta]="rev.pregunta"
            [seleccionados]="rev.indicesElegidos"
            [mostrarFeedback]="true"
            [deshabilitado]="true"
          />
        </div>
      </div>

      <div class="acciones mt-24">
        <button class="btn btn-secundario" (click)="inicio()">Volver al inicio</button>
        <button class="btn btn-primario" (click)="repetir()">Repetir examen</button>
      </div>
    </div>

    <ng-template #sinResultado>
      <div class="contenedor">
        <div class="card">
          <p>No hay un resultado para mostrar.</p>
          <button class="btn btn-primario mt-16" (click)="inicio()">Ir al inicio</button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .resumen { display: flex; flex-direction: column; align-items: center; }
      .puntaje { margin: 0; }
      .numero { font-size: 2.6rem; font-weight: 800; color: var(--color-primario); }
      .de { font-size: 1rem; color: var(--color-texto-suave); margin-left: 6px; }
      .minimo { margin: 4px 0 0; font-size: 0.85rem; color: var(--color-texto-suave); }
      .regla-especial {
        margin-top: 12px;
        color: var(--color-error);
        font-weight: 600;
        font-size: 0.9rem;
      }
      .acciones { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      .acciones .btn { flex: 1 1 auto; }
      .ayuda { color: var(--color-texto-suave); font-size: 0.9rem; margin-top: 0; }
      .revision { display: flex; flex-direction: column; gap: 20px; }
      .item-cabecera { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
      .num {
        width: 28px; height: 28px; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--color-superficie-2); font-weight: 700; font-size: 0.85rem;
      }
      .estado { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
      .estado.ok { color: var(--color-exito); }
      .estado.mal { color: var(--color-error); }
      .doble {
        margin-left: auto;
        font-size: 0.72rem;
        color: var(--color-acento);
        font-weight: 700;
        text-transform: uppercase;
      }
    `,
  ],
})
export class ResultadoComponent implements OnInit {
  private examenSrv = inject(ExamenService);
  private router = inject(Router);

  readonly minimo = EXAMEN_CONFIG.puntajeMinimo;
  resultado = this.examenSrv.ultimoResultado;

  reproboPorDobles = computed(() => {
    const r = this.resultado();
    return !!r && !r.aprobado && r.doblesTotales > 0 && r.doblesFalladas === r.doblesTotales;
  });

  ngOnInit(): void {
    if (!this.resultado()) {
      this.router.navigate(['/']);
    }
  }

  inicio(): void { this.router.navigate(['/']); }
  repetir(): void { this.router.navigate(['/examen']); }
}
