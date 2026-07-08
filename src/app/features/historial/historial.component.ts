import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialService } from '../../core/services/historial.service';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { Intento, ModoIntento } from '../../core/models/intento.model';
import { Pregunta } from '../../core/models/pregunta.model';
import { Resultado } from '../../core/models/resultado.model';

const NOMBRE_MODO: Record<ModoIntento, string> = {
  examen: 'Examen',
  practica: 'Práctica',
  tema: 'Por tema',
  repaso: 'Repaso',
};

/** Historial de intentos y estadísticas, leídos de localStorage. */
@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contenedor">
      <h2>Historial y estadísticas</h2>

      <ng-container *ngIf="intentos().length > 0; else vacio">
        <!-- Estadísticas -->
        <div class="stats mt-16">
          <div class="card stat">
            <span class="valor">{{ intentos().length }}</span>
            <span class="etq">Intentos</span>
          </div>
          <div class="card stat">
            <span class="valor">{{ examenes().length }}</span>
            <span class="etq">Exámenes</span>
          </div>
          <div class="card stat">
            <span class="valor">{{ tasaAprobacion() }}%</span>
            <span class="etq">Aprobación</span>
          </div>
          <div class="card stat">
            <span class="valor">{{ mejorExamen() }}</span>
            <span class="etq">Mejor puntaje</span>
          </div>
        </div>

        <!-- Lista de intentos -->
        <div class="lista mt-24">
          <div class="card intento" *ngFor="let it of intentos()">
            <div class="fila">
              <span class="modo">{{ nombreModo(it.modo) }}</span>
              <span
                class="resultado"
                *ngIf="it.modo === 'examen'"
                [class.ok]="it.aprobado"
                [class.mal]="!it.aprobado"
              >
                {{ it.aprobado ? 'Aprobado' : 'Reprobado' }}
              </span>
            </div>
            <div class="fila secundaria">
              <span>{{ it.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
              <span>{{ it.puntaje }} / {{ it.puntajeMaximo }}</span>
            </div>

            <!-- Certificado: solo exámenes aprobados -->
            <div class="cert" *ngIf="it.modo === 'examen' && it.aprobado">
              <ng-container *ngIf="it.certificado as c; else formEmision">
                <span class="folio">N° {{ c.folio }} · {{ c.nombre }}</span>
                <button class="btn btn-secundario btn-sm" (click)="reimprimir(it)">
                  Reimprimir certificado (PDF)
                </button>
              </ng-container>
              <ng-template #formEmision>
                <form class="cert-form" (submit)="emitir(it, nom.value, cor.value); $event.preventDefault()">
                  <input #nom type="text" placeholder="Nombre completo" />
                  <input #cor type="email" placeholder="Correo" />
                  <button class="btn btn-primario btn-sm" type="submit">Emitir certificado</button>
                </form>
              </ng-template>
            </div>
          </div>
        </div>

        <p class="cert-error" *ngIf="certError()">{{ certError() }}</p>

        <button class="btn btn-secundario btn-bloque mt-24" (click)="limpiar()">Borrar historial</button>
      </ng-container>

      <ng-template #vacio>
        <div class="card mt-16">
          <p>Todavía no tienes intentos registrados. Haz un examen o una práctica para empezar.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (min-width: 560px) { .stats { grid-template-columns: repeat(4, 1fr); } }
      .stat { text-align: center; padding: 16px; }
      .stat .valor { display: block; font-size: 1.8rem; font-weight: 800; color: var(--color-primario); }
      .stat .etq { font-size: 0.78rem; color: var(--color-texto-suave); text-transform: uppercase; letter-spacing: 0.04em; }
      .lista { display: flex; flex-direction: column; gap: 10px; }
      .intento { padding: 14px 16px; }
      .fila { display: flex; justify-content: space-between; align-items: center; }
      .fila.secundaria { margin-top: 6px; font-size: 0.85rem; color: var(--color-texto-suave); }
      .modo { font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; font-size: 0.9rem; }
      .resultado { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
      .resultado.ok { color: var(--color-exito); }
      .resultado.mal { color: var(--color-error); }
      .cert {
        margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--color-borde);
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      }
      .folio { font-family: monospace; font-size: 0.78rem; color: var(--color-texto-suave); }
      .cert-form { display: flex; gap: 6px; flex-wrap: wrap; }
      .cert-form input {
        padding: 8px 10px; border-radius: 8px; border: 2px solid var(--color-borde);
        background: var(--color-superficie-2); color: var(--color-texto); font-size: 0.85rem;
      }
      .btn-sm { padding: 8px 12px; font-size: 0.8rem; }
      .cert-error { color: var(--color-error); font-size: 0.85rem; margin-top: 8px; }
    `,
  ],
})
export class HistorialComponent implements OnInit {
  private historial = inject(HistorialService);
  private banco = inject(BancoPreguntasService);
  private certificadoSrv = inject(CertificadoService);

  intentos = signal<Intento[]>(this.historial.obtenerIntentos());
  examenes = computed(() => this.intentos().filter((i) => i.modo === 'examen'));
  certError = signal('');
  private bancoMap = new Map<string, Pregunta>();

  ngOnInit(): void {
    this.banco.obtenerTodas().subscribe((ps) => {
      this.bancoMap = new Map(ps.map((p) => [p.id, p]));
    });
  }

  /** Reconstruye un Resultado a partir del detalle guardado y el banco. */
  private construirResultado(it: Intento): Resultado {
    const revision = (it.detalle ?? [])
      .map((d) => {
        const pregunta = this.bancoMap.get(d.id);
        return pregunta
          ? { pregunta, indicesElegidos: d.seleccion, correcta: d.correcta }
          : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    return {
      puntaje: it.puntaje,
      puntajeMaximo: it.puntajeMaximo,
      doblesFalladas: 0,
      doblesTotales: 0,
      aprobado: it.aprobado,
      revision,
    };
  }

  /** Reimprime el certificado ya emitido (marcado como reimpresión). */
  reimprimir(it: Intento): void {
    if (!it.certificado) return;
    const c = it.certificado;
    this.certificadoSrv.generar({
      datos: { nombre: c.nombre, correo: c.correo },
      resultado: this.construirResultado(it),
      folio: c.folio,
      emitido: new Date(c.emitido),
      reimpresion: new Date(),
    });
  }

  /** Emite por primera vez el certificado desde el historial y lo guarda. */
  emitir(it: Intento, nombre: string, correo: string): void {
    const n = nombre.trim();
    const co = correo.trim();
    if (n.length < 3) { this.certError.set('Ingresa el nombre completo.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(co)) { this.certError.set('Correo inválido.'); return; }
    this.certError.set('');
    const emitido = new Date();
    const folio = this.certificadoSrv.generarFolio(emitido);
    this.certificadoSrv.generar({
      datos: { nombre: n, correo: co },
      resultado: this.construirResultado(it),
      folio,
      emitido,
    });
    this.historial.guardarCertificado(it.id, { folio, nombre: n, correo: co, emitido: emitido.toISOString() });
    this.intentos.set(this.historial.obtenerIntentos());
  }

  tasaAprobacion = computed(() => {
    const ex = this.examenes();
    if (ex.length === 0) return 0;
    const aprobados = ex.filter((i) => i.aprobado).length;
    return Math.round((aprobados / ex.length) * 100);
  });

  mejorExamen = computed(() => {
    const ex = this.examenes();
    if (ex.length === 0) return '—';
    const mejor = Math.max(...ex.map((i) => i.puntaje));
    const max = ex[0]?.puntajeMaximo ?? 38;
    return `${mejor}/${max}`;
  });

  nombreModo(m: ModoIntento): string { return NOMBRE_MODO[m]; }

  limpiar(): void {
    this.historial.limpiar();
    this.intentos.set([]);
  }
}
