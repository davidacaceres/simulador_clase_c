import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BancoPreguntasService } from '../../core/services/banco-preguntas.service';

/** Descripción de un modo para la pantalla de inicio. */
interface ModoTarjeta {
  /** Clave usada para la imagen de fondo (/assets/img/modos/{clave}.{svg|jpg}). */
  clave: string;
  titulo: string;
  descripcion: string;
  ruta: string | null;
  etapa: string;
  /** true si tiene foto real (.jpg); si no, usa la ilustración .svg. */
  foto?: boolean;
  /** Posición del fondo (background-position). Por defecto 'right center'. */
  pos?: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="contenedor hero-inner">
        <div class="hero-text">
          <p class="kicker">Desde 2008 · Patentando pilotos</p>
          <h1 class="hero-title">Aprueba tu<br /><span class="destacado">Licencia Clase C</span></h1>
          <p class="hero-sub">
            Practica el examen teórico de motocicletas con preguntas representativas,
            cronómetro y las reglas oficiales del examen municipal.
          </p>
          <div class="hero-cta">
            <button class="btn btn-primario" (click)="ir('/examen')">Comenzar examen</button>
            <button class="btn btn-secundario" (click)="ir('/practica')">Modo práctica</button>
          </div>
        </div>

        <!-- Tacómetro decorativo -->
        <div class="hero-gauge" aria-hidden="true">
          <svg viewBox="0 0 200 128" width="220" height="140">
            <defs>
              <linearGradient id="arcoGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#f5a623" />
                <stop offset="1" stop-color="#e5322d" />
              </linearGradient>
            </defs>
            <!-- track -->
            <path d="M18 105 A 82 82 0 0 1 182 105" fill="none" stroke="#2c3238" stroke-width="10" stroke-linecap="round" />
            <!-- valor -->
            <path d="M18 105 A 82 82 0 0 1 150 40" fill="none" stroke="url(#arcoGrad)" stroke-width="10" stroke-linecap="round" />
            <!-- ticks -->
            <g stroke="#b4bac1" stroke-width="2">
              <line x1="18" y1="105" x2="28" y2="105" />
              <line x1="29" y1="64" x2="38" y2="69" />
              <line x1="59" y1="35" x2="64" y2="43" />
              <line x1="100" y1="23" x2="100" y2="33" />
              <line x1="141" y1="35" x2="136" y2="43" />
              <line x1="171" y1="64" x2="162" y2="69" />
              <line x1="182" y1="105" x2="172" y2="105" />
            </g>
            <!-- aguja -->
            <line x1="100" y1="105" x2="140" y2="48" stroke="#e5322d" stroke-width="3" stroke-linecap="round" />
            <circle cx="100" cy="105" r="7" fill="#f5a623" />
            <text x="100" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="#b4bac1">RPM</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- MODOS -->
    <div class="contenedor">
      <p class="banco-info" *ngIf="preguntas$ | async as preguntas; else cargando">
        Banco cargado: <strong>{{ preguntas.length }}</strong> preguntas.
      </p>
      <ng-template #cargando>
        <p class="banco-info">Cargando banco de preguntas…</p>
      </ng-template>

      <div class="grid mt-8">
        <button
          *ngFor="let modo of modos"
          class="card modo"
          [class.deshabilitado]="!modo.ruta"
          [style.backgroundImage]="fondo(modo)"
          [style.backgroundPosition]="modo.pos || 'right center'"
          [disabled]="!modo.ruta"
          type="button"
          (click)="abrir(modo)"
        >
          <span class="modo-titulo">{{ modo.titulo }}</span>
          <span class="modo-desc">{{ modo.descripcion }}</span>
          <span class="modo-etapa" *ngIf="!modo.ruta">Próximamente · {{ modo.etapa }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .hero {
        position: relative;
        /* La imagen de fondo es opcional: si guardas assets/img/hero.jpg se usa;
           si no existe, se ve solo el gradiente. */
        background:
          linear-gradient(120deg, rgba(15, 17, 19, 0.92) 0%, rgba(20, 33, 61, 0.82) 60%, rgba(15, 17, 19, 0.9) 100%),
          radial-gradient(circle at 75% 20%, rgba(245, 166, 35, 0.25), transparent 45%),
          url('/assets/img/hero.jpg') center / cover no-repeat;
        background-color: #101214;
        border-bottom: 3px solid var(--color-primario);
      }
      .hero-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding-top: 40px;
        padding-bottom: 40px;
      }
      .hero-text { max-width: 520px; }
      .kicker {
        margin: 0 0 8px;
        font-size: 0.78rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--color-acento);
        font-weight: 700;
      }
      .hero-title {
        margin: 0;
        font-size: 2rem;
        line-height: 1.1;
      }
      @media (min-width: 560px) { .hero-title { font-size: 2.6rem; } }
      .destacado { color: var(--color-primario); }
      .hero-sub {
        margin: 14px 0 0;
        color: #e6e8ea;
        font-size: 1rem;
        max-width: 46ch;
      }
      .hero-cta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }
      .hero-gauge { flex: 0 0 auto; display: none; }
      @media (min-width: 720px) { .hero-gauge { display: block; } }

      .banco-info { font-size: 0.9rem; color: var(--color-texto-suave); margin-top: 20px; }
      .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
      @media (min-width: 560px) { .grid { grid-template-columns: 1fr 1fr; } }
      .modo {
        display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end;
        gap: 4px; min-height: 150px; text-align: left; cursor: pointer; color: var(--color-texto);
        border: 2px solid transparent; overflow: hidden;
        background-color: var(--color-superficie);
        background-size: cover; background-position: right center; background-repeat: no-repeat;
        transition: border-color 0.15s ease, transform 0.05s ease;
      }
      .modo:not(.deshabilitado):hover { border-color: var(--color-primario); }
      .modo:active { transform: scale(0.99); }
      .modo.deshabilitado { opacity: 0.6; cursor: not-allowed; }
      .modo-titulo { font-weight: 700; font-size: 1.15rem; }
      .modo-desc { font-size: 0.85rem; color: var(--color-texto-suave); max-width: 64%; }
      .modo-etapa { margin-top: 4px; font-size: 0.72rem; color: var(--color-acento); font-weight: 600; }
    `,
  ],
})
export class InicioComponent {
  private banco = inject(BancoPreguntasService);
  private router = inject(Router);
  preguntas$ = this.banco.obtenerTodas();

  ir(ruta: string): void { this.router.navigate([ruta]); }
  abrir(modo: ModoTarjeta): void { if (modo.ruta) this.router.navigate([modo.ruta]); }

  /** Fondo de la tarjeta: foto (.jpg) o ilustración (.svg) + degradado para legibilidad del texto. */
  fondo(modo: ModoTarjeta): string {
    const ext = modo.foto ? 'jpg' : 'svg';
    // Capa 1: tinte oscuro parejo sobre TODA la foto (cohesión + contraste del texto).
    // Capa 2: degradado extra a la izquierda para reforzar la legibilidad del título.
    return (
      'linear-gradient(90deg, rgba(20,20,22,0.92) 0%, rgba(20,20,22,0.60) 55%, rgba(20,20,22,0.45) 100%), ' +
      'linear-gradient(rgba(20,20,22,0.35), rgba(20,20,22,0.45)), ' +
      `url('/assets/img/modos/${modo.clave}.${ext}')`
    );
  }

  modos: ModoTarjeta[] = [
    { clave: 'examen', titulo: 'Modo Examen', descripcion: '35 preguntas, 45 minutos y reglas reales del examen.', ruta: '/examen', etapa: 'Etapa 3', foto: true },
    { clave: 'practica', titulo: 'Modo Práctica', descripcion: 'Sin tiempo, con feedback inmediato tras cada respuesta.', ruta: '/practica', etapa: 'Etapa 4', foto: true },
    { clave: 'conducir-motos', titulo: 'Práctica Conducir Motos', descripcion: 'Solo preguntas del cuestionario de conducirmotos.cl.', ruta: '/conducir-motos', etapa: '', foto: true, pos: 'right top' },
    { clave: 'por-tema', titulo: 'Práctica por Tema', descripcion: 'Estudia una categoría específica del temario.', ruta: '/por-tema', etapa: 'Etapa 4', foto: true },
    { clave: 'repaso', titulo: 'Repaso de errores', descripcion: 'Repite solo las preguntas que fallaste.', ruta: '/repaso', etapa: 'Etapa 4', foto: true },
    { clave: 'favoritas', titulo: 'Repaso de favoritas', descripcion: 'Practica las preguntas que marcaste como difíciles.', ruta: '/favoritas', etapa: '', foto: true },
    { clave: 'historial', titulo: 'Historial y estadísticas', descripcion: 'Revisa tus intentos y tu progreso.', ruta: '/historial', etapa: 'Etapa 6', foto: true },
  ];
}
