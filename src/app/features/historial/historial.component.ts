import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistorialService } from '../../core/services/historial.service';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { Intento, ModoIntento } from '../../core/models/intento.model';
import { Pregunta } from '../../core/models/pregunta.model';
import { Resultado } from '../../core/models/resultado.model';
import { CATEGORIAS } from '../../core/enums/categoria.enum';

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
  imports: [CommonModule, RouterLink],
  template: `
    <div class="contenedor">
      <h2>Historial y estadísticas</h2>

      <ng-container *ngIf="intentos().length > 0; else vacio">
        <!-- Preparación + racha -->
        <div class="resumen mt-16">
          <div class="card listo-card">
            <div class="anillo" [style.--pct]="listo()" [class.completo]="listo() >= 100">
              <span class="anillo-num">{{ listo() }}%</span>
            </div>
            <div class="listo-info">
              <strong>{{ listoLabel() }}</strong>
              <p *ngIf="listo() < 100">
                Meta: ≥ {{ META_CAT }}% en todas las categorías.
                Te faltan <strong>{{ categoriasBajoMeta() }}</strong>.
              </p>
              <p *ngIf="listo() >= 100">Dominas todo el temario. ¡A dar el examen!</p>
            </div>
          </div>

          <div class="card racha-card">
            <div class="racha-num">🔥 {{ racha() }}</div>
            <div class="racha-info">
              <strong>{{ racha() === 1 ? '1 día' : racha() + ' días' }} de racha</strong>
              <p>Hoy: {{ preguntasHoy() }}/{{ META_DIARIA }} preguntas</p>
              <div class="meta-bar">
                <div class="meta-fill" [class.completa]="metaPct() >= 100" [style.width.%]="metaPct()"></div>
              </div>
            </div>
          </div>
        </div>

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

        <!-- Diagnóstico por categoría -->
        <div class="diag mt-24" *ngIf="diagnostico().length > 0">
          <h3>Diagnóstico por categoría</h3>
          <p class="diag-rec" *ngIf="recomendadas().length > 0">
            Te conviene repasar:
            <a
              class="rec-chip"
              *ngFor="let c of recomendadas()"
              [routerLink]="['/por-tema']"
              [queryParams]="{ cat: c.clave }"
            >{{ c.nombre }}</a>
          </p>
          <div class="diag-list">
            <div class="diag-row" *ngFor="let c of diagnostico()">
              <span class="diag-nom">{{ c.nombre }}</span>
              <div class="diag-bar">
                <div
                  class="diag-fill"
                  [class.baja]="c.porcentaje < 60"
                  [class.media]="c.porcentaje >= 60 && c.porcentaje < 80"
                  [class.alta]="c.porcentaje >= 80"
                  [style.width.%]="c.porcentaje"
                ></div>
              </div>
              <span class="diag-pct">{{ c.porcentaje }}% <small>({{ c.aciertos }}/{{ c.total }})</small></span>
            </div>
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

            <!-- Certificado: solo se puede REIMPRIMIR si fue emitido al finalizar el examen -->
            <div class="cert" *ngIf="it.modo === 'examen' && it.aprobado && it.certificado as c">
              <span class="folio">N° {{ c.folio }} · {{ c.nombre }}</span>
              <button class="btn btn-secundario btn-sm" (click)="reimprimir(it)">
                Reimprimir y enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>

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
      .resumen { display: grid; grid-template-columns: 1fr; gap: 12px; }
      @media (min-width: 560px) { .resumen { grid-template-columns: 1fr 1fr; } }
      .listo-card, .racha-card { display: flex; align-items: center; gap: 16px; padding: 16px; }
      .anillo {
        position: relative; flex: 0 0 auto; width: 76px; height: 76px; border-radius: 50%;
        background: conic-gradient(var(--color-primario) calc(var(--pct) * 1%), var(--color-superficie-2) 0);
      }
      .anillo.completo { background: conic-gradient(var(--color-exito) 100%, var(--color-exito) 0); }
      .anillo-num {
        position: absolute; inset: 8px; background: var(--color-superficie); border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem;
        font-variant-numeric: tabular-nums;
      }
      .listo-info strong, .racha-info strong { display: block; font-size: 1.05rem; }
      .listo-info p, .racha-info p { margin: 4px 0 0; font-size: 0.82rem; color: var(--color-texto-suave); }
      .racha-num { flex: 0 0 auto; font-size: 1.9rem; font-weight: 800; color: var(--color-primario); white-space: nowrap; }
      .racha-info { flex: 1; }
      .meta-bar { margin-top: 8px; height: 8px; border-radius: 999px; background: var(--color-superficie-2); overflow: hidden; }
      .meta-fill { height: 100%; border-radius: 999px; background: var(--color-acento); transition: width 0.3s ease; }
      .meta-fill.completa { background: var(--color-exito); }
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
      .diag h3 { margin: 0 0 8px; }
      .diag-rec { font-size: 0.9rem; color: var(--color-texto-suave); margin: 0 0 12px; }
      .rec-chip {
        display: inline-block; margin: 0 4px 4px 0; padding: 4px 10px; border-radius: 999px;
        background: var(--color-superficie-2); border: 1px solid var(--color-acento);
        color: var(--color-acento); text-decoration: none; font-weight: 600; font-size: 0.82rem;
      }
      .rec-chip:hover { background: var(--color-acento); color: var(--color-sobre-primario); }
      .diag-list { display: flex; flex-direction: column; gap: 8px; }
      .diag-row { display: flex; align-items: center; gap: 10px; }
      .diag-nom { flex: 0 0 42%; font-size: 0.85rem; }
      .diag-bar { flex: 1; height: 8px; border-radius: 999px; background: var(--color-superficie-2); overflow: hidden; }
      .diag-fill { height: 100%; border-radius: 999px; }
      .diag-fill.baja { background: var(--color-error); }
      .diag-fill.media { background: var(--color-acento); }
      .diag-fill.alta { background: var(--color-exito); }
      .diag-pct { flex: 0 0 auto; font-size: 0.82rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .diag-pct small { color: var(--color-texto-suave); }
    `,
  ],
})
export class HistorialComponent implements OnInit {
  private historial = inject(HistorialService);
  private banco = inject(BancoPreguntasService);
  private certificadoSrv = inject(CertificadoService);

  intentos = signal<Intento[]>(this.historial.obtenerIntentos());
  examenes = computed(() => this.intentos().filter((i) => i.modo === 'examen'));
  private bancoMap = signal<Map<string, Pregunta>>(new Map());

  /** Meta de acierto por categoría (mismo umbral de aprobación del examen). */
  readonly META_CAT = 87;
  /** Meta de preguntas a responder por día. */
  readonly META_DIARIA = 20;

  /**
   * Preparación global (0–100): promedio sobre las 7 categorías del acierto
   * limitado a la meta. Las categorías sin practicar cuentan como 0, así que
   * llegar a 100% exige cubrir TODO el temario con ≥ META_CAT % de acierto.
   */
  listo = computed(() => {
    const porCat = new Map(this.diagnostico().map((d) => [d.clave, d.porcentaje]));
    let suma = 0;
    for (const c of CATEGORIAS) suma += Math.min(porCat.get(c.clave) ?? 0, this.META_CAT) / this.META_CAT;
    return Math.round((suma / CATEGORIAS.length) * 100);
  });

  /** Categorías del temario que aún tienen acierto bajo la meta (o sin practicar). */
  categoriasBajoMeta = computed(() => {
    const porCat = new Map(this.diagnostico().map((d) => [d.clave, d.porcentaje]));
    return CATEGORIAS.filter((c) => (porCat.get(c.clave) ?? 0) < this.META_CAT).length;
  });

  listoLabel = computed(() => {
    const v = this.listo();
    if (v >= 100) return '¡Listo para el examen!';
    if (v >= 85) return 'Casi listo';
    if (v >= 60) return 'Buen avance';
    if (v >= 30) return 'Vas avanzando';
    return 'Recién comienzas';
  });

  /** Clave local YYYY-MM-DD de una fecha (para agrupar por día). */
  private claveDia(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Racha de días consecutivos con al menos un intento (con gracia si hoy aún no practica). */
  racha = computed(() => {
    const dias = new Set(this.intentos().map((i) => this.claveDia(new Date(i.fecha))));
    if (dias.size === 0) return 0;
    const cursor = new Date();
    if (!dias.has(this.claveDia(cursor))) cursor.setDate(cursor.getDate() - 1);
    let n = 0;
    while (dias.has(this.claveDia(cursor))) {
      n++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return n;
  });

  /** Preguntas respondidas hoy (suma de puntajeMaximo de los intentos de hoy). */
  preguntasHoy = computed(() => {
    const hoy = this.claveDia(new Date());
    return this.intentos()
      .filter((i) => this.claveDia(new Date(i.fecha)) === hoy)
      .reduce((s, i) => s + i.puntajeMaximo, 0);
  });

  /** Progreso de la meta diaria en % (tope 100). */
  metaPct = computed(() => Math.min(100, Math.round((this.preguntasHoy() / this.META_DIARIA) * 100)));

  /** Diagnóstico por categoría: aciertos/total y % sobre todo el detalle registrado. */
  diagnostico = computed(() => {
    const mapa = this.bancoMap();
    if (mapa.size === 0) return [];
    const acc: Record<string, { aciertos: number; total: number }> = {};
    for (const it of this.intentos()) {
      for (const d of it.detalle ?? []) {
        const p = mapa.get(d.id);
        if (!p) continue;
        const a = acc[p.categoria] ?? { aciertos: 0, total: 0 };
        a.total++;
        if (d.correcta) a.aciertos++;
        acc[p.categoria] = a;
      }
    }
    return CATEGORIAS.filter((c) => acc[c.clave]).map((c) => {
      const a = acc[c.clave];
      return {
        clave: c.clave,
        nombre: c.nombre,
        aciertos: a.aciertos,
        total: a.total,
        porcentaje: Math.round((a.aciertos / a.total) * 100),
      };
    }).sort((x, y) => x.porcentaje - y.porcentaje);
  });

  /** Categorías recomendadas para repasar (bajo 80% de acierto). */
  recomendadas = computed(() => this.diagnostico().filter((c) => c.porcentaje < 80).slice(0, 3));

  ngOnInit(): void {
    this.banco.obtenerTodas().subscribe((ps) => {
      this.bancoMap.set(new Map(ps.map((p) => [p.id, p])));
    });
  }

  /** Reconstruye un Resultado a partir del detalle guardado y el banco. */
  private construirResultado(it: Intento): Resultado {
    const revision = (it.detalle ?? [])
      .map((d) => {
        const pregunta = this.bancoMap().get(d.id);
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
    this.certificadoSrv.abrirWhatsApp(c.folio, it.puntaje, it.puntajeMaximo);
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
