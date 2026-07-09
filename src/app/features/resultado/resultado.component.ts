import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ExamenService, EXAMEN_CONFIG } from '../../core/services/examen.service';
import { CertificadoService } from '../../core/services/certificado.service';
import { HistorialService } from '../../core/services/historial.service';
import { PreguntaCardComponent } from '../../shared/pregunta-card/pregunta-card.component';
import { EmparejamientoCardComponent } from '../../shared/emparejamiento-card/emparejamiento-card.component';
import { ResultadoBadgeComponent } from '../../shared/resultado-badge/resultado-badge.component';
// Textos y datos de contacto de los CTA (editables en este JSON).
import contactoCfg from '../../core/data/contacto.config.json';

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

        <!-- Certificado digital (solo si aprobó) -->
        <div class="certificado mt-24" *ngIf="r.aprobado">
          <h3>🎓 Certificado digital</h3>
          <p class="cert-ayuda">
            Genera un certificado en PDF de esta práctica aprobada, con tu puntaje y el detalle.
          </p>
          <form
            class="cert-form"
            (submit)="emitirCertificado(nombreRef.value, correoRef.value); $event.preventDefault()"
          >
            <input #nombreRef type="text" placeholder="Nombre completo" aria-label="Nombre completo" />
            <input #correoRef type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" />
            <button class="btn btn-primario" type="submit">Descargar y enviar por WhatsApp</button>
          </form>
          <p class="cert-error" *ngIf="certError()">{{ certError() }}</p>
          <p class="cert-nota">
            Se descarga el PDF y se abre el WhatsApp de Conducir Motos con un mensaje listo; solo
            adjunta el archivo descargado para enviarlo. Documento de práctica, no oficial.
          </p>
        </div>
      </div>

      <!-- CTA contextual (Conducir Motos) -->
      <div class="card cta text-centro mt-16">
        <ng-container *ngIf="!r.aprobado; else ctaAprob">
          <h3>{{ cta.ctaReprobado.titulo }}</h3>
          <p class="cta-txt">{{ cta.ctaReprobado.texto }}</p>
          <button class="btn btn-primario btn-wa" (click)="whatsapp(cta.ctaReprobado.mensaje)">
            💬 {{ cta.ctaReprobado.boton }}
          </button>
        </ng-container>
        <ng-template #ctaAprob>
          <h3>{{ cta.ctaAprobado.titulo }}</h3>
          <p class="cta-txt">{{ cta.ctaAprobado.texto }}</p>
          <div class="cta-acciones">
            <button class="btn btn-primario btn-wa" (click)="whatsapp(cta.ctaAprobado.mensaje)">
              💬 {{ cta.ctaAprobado.boton }}
            </button>
            <button class="btn btn-secundario" (click)="compartir()">
              🔗 {{ cta.ctaAprobado.botonCompartir }}
            </button>
          </div>
        </ng-template>
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
      .certificado {
        width: 100%;
        border-top: 1px solid var(--color-borde);
        padding-top: 16px;
      }
      .certificado h3 { margin: 0 0 4px; }
      .cert-ayuda { margin: 0 0 12px; font-size: 0.9rem; color: var(--color-texto-suave); }
      .cert-form { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
      .cert-form input {
        flex: 1 1 220px;
        padding: 12px;
        border-radius: var(--radio);
        border: 2px solid var(--color-borde);
        background: var(--color-superficie-2);
        color: var(--color-texto);
        font-size: 1rem;
      }
      .cert-error { color: var(--color-error); font-size: 0.85rem; margin: 8px 0 0; }
      .cert-nota { margin: 10px 0 0; font-size: 0.75rem; color: var(--color-texto-suave); }
      .cta { border: 1px solid var(--color-acento); }
      .cta h3 { margin: 0 0 6px; }
      .cta-txt { margin: 0 0 14px; color: var(--color-texto-suave); }
      .cta-acciones { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      .cta-acciones .btn { flex: 1 1 auto; }
      .btn-wa { background: #25d366; color: #05391f; }
      .btn-wa:hover { background: #1eb455; }
    `,
  ],
})
export class ResultadoComponent implements OnInit {
  private examenSrv = inject(ExamenService);
  private certificadoSrv = inject(CertificadoService);
  private historialSrv = inject(HistorialService);
  private router = inject(Router);

  readonly minimo = EXAMEN_CONFIG.puntajeMinimo;
  readonly cta = contactoCfg;
  resultado = this.examenSrv.ultimoResultado;
  certError = signal('');

  reproboPorDobles = computed(() => {
    const r = this.resultado();
    return !!r && !r.aprobado && r.doblesTotales > 0 && r.doblesFalladas === r.doblesTotales;
  });

  ngOnInit(): void {
    if (!this.resultado()) {
      this.router.navigate(['/']);
    }
  }

  emitirCertificado(nombre: string, correo: string): void {
    const n = nombre.trim();
    const c = correo.trim();
    if (n.length < 3) {
      this.certError.set('Ingresa tu nombre completo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
      this.certError.set('Ingresa un correo electrónico válido.');
      return;
    }
    const r = this.resultado();
    if (!r || !r.aprobado) return;
    this.certError.set('');
    const emitido = new Date();
    const folio = this.certificadoSrv.generarFolio(emitido);
    this.certificadoSrv.generar({ datos: { nombre: n, correo: c }, resultado: r, folio, emitido });
    // guarda la emisión en el intento para poder reimprimir desde el historial
    const idIntento = this.examenSrv.ultimoIntentoId();
    if (idIntento) {
      this.historialSrv.guardarCertificado(idIntento, {
        folio,
        nombre: n,
        correo: c,
        emitido: emitido.toISOString(),
      });
    }
    // abre WhatsApp de Conducir Motos con el mensaje (el PDF se adjunta manualmente)
    this.certificadoSrv.abrirWhatsApp(folio, r.puntaje, r.puntajeMaximo);
  }

  /** Abre WhatsApp de Conducir Motos con el mensaje del CTA. */
  whatsapp(mensaje: string): void {
    const url = `https://wa.me/${this.cta.whatsappNumero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  /** Comparte el simulador (Web Share API si existe; si no, por WhatsApp). */
  compartir(): void {
    const url = window.location.origin + window.location.pathname + '#/';
    const texto = this.cta.ctaAprobado.textoCompartir;
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      nav.share({ title: 'Simulador Examen Clase C', text: texto, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank');
    }
  }

  inicio(): void { this.router.navigate(['/']); }
  repetir(): void { this.router.navigate(['/examen']); }
}
