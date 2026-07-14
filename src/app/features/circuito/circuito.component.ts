import { Component, ElementRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  ELEMENTOS_REQUERIDOS,
  ETAPAS,
  PISTA,
  VESTIMENTA_OBLIGATORIA,
} from '../../core/data/circuito.data';
import { Maniobra, RegionDiagrama } from '../../core/models/circuito.model';
import contactoCfg from '../../core/data/contacto.config.json';
// Trayectorias oficiales, extraídas del propio plano por scripts/extraer-ruta.py.
import rutasCfg from '../../../assets/data/circuito-rutas.json';

/**
 * EXPLORADOR DEL CIRCUITO — Examen Práctico Clase C.
 *
 * El plano oficial es la fuente de verdad y se muestra TAL CUAL: su línea ya está
 * bien dibujada, así que no la repintamos encima (hacerlo se veía como un rayado).
 * Seleccionar una maniobra hace zoom sobre esa zona del plano y pone una MOTO a
 * recorrer el tramo, con una estela corta detrás.
 *
 * La moto sigue la polilínea de `circuito-rutas.json`: la línea del propio plano,
 * seguida píxel a píxel (ver scripts/extraer-ruta.py) y suavizada acá para que el
 * temblor del trazador no se note en el movimiento.
 *
 * No es un juego ni un simulador de conducción: la destreza (equilibrio a baja
 * velocidad, embrague, mirada) no se aprende en pantalla. El objetivo es que el
 * postulante llegue sabiendo QUÉ le van a pedir.
 */
/**
 * Suaviza una polilínea: media móvil (quita el temblor del trazador) y luego una
 * pasada de Chaikin (redondea las esquinas que quedan). El resultado se usa solo
 * para mover la moto; el trazo que se ve sigue siendo el del plano.
 */
function suavizar(pts: number[][], ventana = 5): number[][] {
  if (pts.length < 3) return pts;

  const medias: number[][] = [];
  for (let i = 0; i < pts.length; i++) {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let k = -ventana; k <= ventana; k++) {
      const j = i + k;
      if (j < 0 || j >= pts.length) continue;
      sx += pts[j][0];
      sy += pts[j][1];
      n++;
    }
    medias.push([sx / n, sy / n]);
  }

  const chaikin: number[][] = [medias[0]];
  for (let i = 0; i < medias.length - 1; i++) {
    const p = medias[i];
    const q = medias[i + 1];
    chaikin.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]]);
    chaikin.push([0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]);
  }
  chaikin.push(medias[medias.length - 1]);
  return chaikin;
}

@Component({
  selector: 'app-circuito',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contenedor">
      <!-- CABECERA -->
      <header class="cab">
        <p class="kicker">Examen práctico · Licencia Clase C</p>
        <h1>El circuito, <span class="destacado">maniobra por maniobra</span></h1>
        <p class="sub">
          Desde 2020 el examen práctico está estandarizado en todo Chile: una pista de
          {{ pista.largo }} × {{ pista.ancho }} metros, tres etapas y las mismas maniobras para
          todos. Este es el <strong>plano oficial</strong>. Elige una maniobra y se resalta el
          recorrido que tienes que hacer.
        </p>
      </header>

      <!-- FICHA DE LA PISTA -->
      <section class="ficha card">
        <div class="ficha-item">
          <span class="ficha-valor">{{ pista.largo }} × {{ pista.ancho }} m</span>
          <span class="ficha-label">Pista pavimentada</span>
        </div>
        <div class="ficha-item" *ngFor="let el of elementosRequeridos">
          <span class="ficha-valor">{{ el.cantidad }}</span>
          <span class="ficha-label">{{ el.nombre }}</span>
        </div>
        <div class="ficha-item">
          <span class="ficha-valor">35 s</span>
          <span class="ficha-label">Etapa de velocidad</span>
        </div>
      </section>

      <!-- SELECTOR DE ETAPA -->
      <nav class="tabs" role="tablist" aria-label="Etapas del examen">
        <button
          *ngFor="let e of etapas"
          role="tab"
          type="button"
          class="tab"
          [class.activa]="e.id === etapaId()"
          [attr.aria-selected]="e.id === etapaId()"
          (click)="seleccionarEtapa(e.id)"
        >
          <span class="tab-num">Etapa {{ e.numero }}</span>
          <span class="tab-nombre">{{ e.nombre }}</span>
        </button>
      </nav>

      <p class="etapa-resumen">{{ etapa().resumen }}</p>

      <!-- Aviso del límite de tiempo (solo etapa de velocidad) -->
      <p class="limite card" *ngIf="etapa().segundos as limite">
        <strong>{{ limite }} segundos</strong> para las 4 maniobras de velocidad. Pasarte hasta
        5 s es un error leve; entre 5 y 10 s, grave; más de 10 s, reprobatorio.
      </p>

      <!-- MANIOBRAS + DIAGRAMA -->
      <section class="split">
        <!-- Lista de maniobras -->
        <ul class="maniobras" role="tablist" aria-label="Maniobras de la etapa">
          <li *ngFor="let m of etapa().maniobras; let i = index" role="presentation">
            <button
              role="tab"
              type="button"
              class="maniobra"
              [class.activa]="m.id === maniobraId()"
              [attr.aria-selected]="m.id === maniobraId()"
              (click)="seleccionarManiobra(m.id)"
            >
              <span class="maniobra-num">{{ i + 1 }}</span>
              <span class="maniobra-nombre">{{ m.nombre }}</span>
            </button>
          </li>
        </ul>

        <div class="detalle">
          <!-- PLANO OFICIAL con la moto recorriendo el tramo.
               Solo las maniobras que se hacen sobre la pista tienen plano. -->
          <div class="card diagrama" *ngIf="maniobra().region">
            <div class="diagrama-cab">
              <span class="leyenda">
                <span class="leyenda-punto" aria-hidden="true"></span>
                La moto hace tu recorrido en el plano oficial
              </span>
              <button
                class="btn btn-secundario btn-mini"
                type="button"
                (click)="alternarPlano()"
                [disabled]="!maniobra().region"
                [title]="
                  planoCompleto()
                    ? 'Volver al tramo de esta maniobra'
                    : 'Ver la etapa completa, de la partida a la llegada'
                "
              >
                {{ planoCompleto() ? 'Ver solo la maniobra' : 'Ver plano completo' }}
              </button>
            </div>

            <div class="diagrama-marco" *ngIf="regionActiva() as r">
              <!-- El visor recorta; dentro, el plano se puede arrastrar y ampliar. -->
              <div
                class="visor"
                [class.navegable]="planoCompleto()"
                [class.arrastrando]="arrastrando()"
                (wheel)="rueda($event)"
                (pointerdown)="tomar($event)"
                (pointermove)="mover($event)"
                (pointerup)="soltar($event)"
                (pointercancel)="soltar($event)"
                (dblclick)="acercar(1.6)"
              >
                <div class="recorte" [ngStyle]="marco(r)" [style.transform]="lente()" role="img"
                  [attr.aria-label]="'Plano oficial, maniobra: ' + maniobra().nombre"
                >
                <!-- El plano oficial, tal cual: su línea ya está bien dibujada. -->
                <div class="capa plano" [ngStyle]="capa(r, r.imagen)"></div>

                <!-- Encima, solo la moto y una estela corta. Nada de repintar la línea:
                     el viewBox va en píxeles del plano, así que la moto cae justo sobre él. -->
                <svg
                  *ngIf="tramo().length > 1"
                  class="capa svg"
                  [attr.viewBox]="r.x + ' ' + r.y + ' ' + r.w + ' ' + r.h"
                  aria-hidden="true"
                >
                  <polyline class="estela" [attr.points]="estela()" />
                  <g [attr.transform]="transformMoto()">
                    <circle class="moto-halo" r="60" />
                    <circle class="moto" r="30" />
                    <path class="moto-nariz" d="M 30 0 L 6 -13 L 6 13 Z" />
                  </g>
                </svg>
                </div>
              </div>

              <!-- Controles de zoom: solo tienen sentido con el plano completo. -->
              <div class="zoom" *ngIf="planoCompleto()">
                <button type="button" (click)="acercar(1.3)" aria-label="Acercar">+</button>
                <button type="button" (click)="acercar(1 / 1.3)" aria-label="Alejar">−</button>
                <button type="button" class="reset" (click)="encuadrar()" aria-label="Encuadrar">
                  Ajustar
                </button>
              </div>
            </div>

            <p class="ayuda" *ngIf="planoCompleto()">
              Arrastra para moverte. Rueda del mouse o los botones para acercar.
            </p>


            <p class="diagrama-pie" *ngIf="etapa().numero !== 1">
              El plano se lee <strong>de abajo hacia arriba</strong>: el INICIO está abajo.
            </p>
          </div>

          <!-- Ilustración suelta: no es el plano del circuito ni tiene recorrido,
               así que se muestra tal cual, sin visor ni controles. -->
          <div class="card diagrama" *ngIf="maniobra().ilustracion as img">
            <span class="leyenda">Esquema oficial de la maniobra</span>
            <div class="hoja">
              <img [src]="img" [alt]="'Esquema oficial: ' + maniobra().nombre" />
            </div>
          </div>

          <!-- Qué hay que hacer -->
          <article class="card ficha-maniobra">
            <h2>{{ maniobra().nombre }}</h2>
            <p class="m-desc">{{ maniobra().descripcion }}</p>

            <ul class="medidas" *ngIf="maniobra().medidas.length">
              <li *ngFor="let med of maniobra().medidas">{{ med }}</li>
            </ul>

            <h3>Qué tienes que hacer</h3>
            <ol class="pasos">
              <li *ngFor="let p of maniobra().pasos">{{ p }}</li>
            </ol>

            <h3>Qué evalúa el examinador</h3>
            <p class="m-evalua">{{ maniobra().evalua }}</p>

            <h3>Qué te descuenta acá</h3>
            <ul class="m-errores">
              <li *ngFor="let e of maniobra().erroresComunes">
                <span class="chip" [class]="'chip-' + e.tipo">{{ e.tipo }}</span>
                <span>{{ e.texto }}</span>
              </li>
            </ul>
            <p class="regla">
              Repruebas con 1 error reprobatorio, 2 graves, 1 grave + 3 leves, o 6 leves.
            </p>
          </article>
        </div>
      </section>

      <!-- VESTIMENTA -->
      <section class="card vestimenta">
        <h2>Con qué debes presentarte</h2>
        <ul>
          <li *ngFor="let v of vestimenta">{{ v }}</li>
        </ul>
        <p class="nota">
          Si llegas sin la vestimenta adecuada, el examen no se reprueba: se
          <strong>reprograma</strong>. Igual pierdes el cupo y la fecha.
        </p>
      </section>

      <!-- CTA -->
      <section class="cta card">
        <h2>{{ cta.ctaCircuito.titulo }}</h2>
        <p>{{ cta.ctaCircuito.texto }}</p>
        <div class="cta-btns">
          <button class="btn btn-primario" type="button" (click)="whatsapp()">
            {{ cta.ctaCircuito.boton }}
          </button>
          <button class="btn btn-secundario" type="button" (click)="volver()">Volver al inicio</button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-bottom: 48px;
        /* Alto disponible para el plano. Debe coincidir con ALTO_MAX del componente. */
        --alto-plano: 72vh;
      }

      /* --- Cabecera --- */
      .cab { padding: 28px 0 8px; }
      .kicker {
        margin: 0 0 8px;
        font-size: 0.78rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--color-acento);
        font-weight: 700;
      }
      h1 { margin: 0; font-size: 1.8rem; line-height: 1.15; }
      @media (min-width: 560px) { h1 { font-size: 2.3rem; } }
      .destacado { color: var(--color-primario); }
      .sub { color: var(--color-texto-suave); max-width: 64ch; margin: 12px 0 0; }

      /* --- Ficha de la pista --- */
      .ficha {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
        margin-top: 22px; padding: 16px;
      }
      @media (min-width: 720px) { .ficha { grid-template-columns: repeat(6, 1fr); } }
      .ficha-item { display: flex; flex-direction: column; gap: 2px; }
      .ficha-valor { font-weight: 800; font-size: 1.1rem; color: var(--color-primario); }
      .ficha-label {
        font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--color-texto-suave);
      }

      /* --- Tabs de etapa --- */
      .tabs { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 28px; }
      @media (min-width: 560px) { .tabs { grid-template-columns: repeat(3, 1fr); } }
      .tab {
        display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
        padding: 12px 14px; text-align: left; cursor: pointer;
        background: var(--color-superficie);
        border: 2px solid var(--color-borde);
        border-radius: 10px; color: var(--color-texto);
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .tab:hover { border-color: var(--color-primario); }
      .tab.activa { border-color: var(--color-primario); background: var(--color-superficie-2); }
      .tab-num {
        font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
        color: var(--color-acento); font-weight: 700;
      }
      .tab-nombre { font-weight: 700; font-size: 0.98rem; }
      .etapa-resumen { color: var(--color-texto-suave); margin: 16px 0 0; max-width: 72ch; }

      /* --- Aviso del límite de tiempo --- */
      .limite {
        margin: 18px 0 0; padding: 14px 16px;
        border-left: 4px solid var(--color-primario);
        color: var(--color-texto-suave); font-size: 0.9rem;
      }
      .limite strong { color: var(--color-primario); }

      /* --- Layout maniobras --- */
      .split { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 24px; }
      @media (min-width: 960px) { .split { grid-template-columns: 250px 1fr; align-items: start; } }

      .maniobras { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .maniobra {
        width: 100%; display: flex; align-items: center; gap: 10px;
        padding: 11px 12px; cursor: pointer; text-align: left;
        background: var(--color-superficie);
        border: 2px solid transparent; border-radius: 10px;
        color: var(--color-texto-suave);
        transition: border-color 0.15s ease, color 0.15s ease;
      }
      .maniobra:hover { border-color: var(--color-borde); color: var(--color-texto); }
      .maniobra.activa {
        border-color: var(--color-primario); color: var(--color-texto);
        background: var(--color-superficie-2);
      }
      .maniobra-num {
        flex: 0 0 22px; height: 22px; display: grid; place-items: center;
        border-radius: 50%; background: var(--color-borde);
        font-size: 0.72rem; font-weight: 800; color: var(--color-texto);
      }
      .maniobra.activa .maniobra-num { background: var(--color-primario); color: var(--color-sobre-primario); }
      .maniobra-nombre { font-weight: 600; font-size: 0.92rem; }

      /* --- Plano oficial --- */
      .detalle { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
      .diagrama { padding: 14px; }
      .diagrama-cab {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; margin-bottom: 10px;
      }
      .leyenda {
        display: flex; align-items: center; gap: 8px;
        font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.08em;
        font-weight: 700; color: var(--color-texto-suave);
      }
      .leyenda-punto {
        width: 12px; height: 12px; border-radius: 50%;
        background: var(--color-primario);
        box-shadow: 0 0 0 4px rgba(255, 173, 51, 0.22);
      }
      .btn-mini { padding: 6px 12px; font-size: 0.78rem; }

      /* El plano viene con fondo blanco: lo montamos sobre una "hoja" clara.
         Sin scroll: el recorte se dimensiona para caber entero (ver marco()). */
      .diagrama-marco {
        position: relative;
        background: #eef0f3; border-radius: 10px; padding: 10px;
      }
      /*
       * El VISOR ocupa TODO el ancho disponible y el alto máximo permitido; recorta
       * lo que se sale. El plano va centrado dentro y, al ampliarlo, crece hasta
       * llenar ese ancho. Si el visor tuviera la forma del plano (una tira de 1:2,7),
       * el zoom seguiría mirando por la misma rendija.
       *
       * El plano se centra con flex. OJO: nada de position:absolute con inset:0 en el
       * hijo — con top y bottom fijados a la vez el navegador estira la altura e
       * ignora el aspect-ratio; el plano sale deformado y la moto, fuera de cuadro.
       */
      .visor {
        overflow: hidden; border-radius: 6px;
        width: 100%; height: var(--alto-plano);
        background: #fff;
        display: flex; align-items: center; justify-content: center;
        touch-action: none; /* el arrastre lo manejamos nosotros */
      }
      .visor.navegable { cursor: grab; }
      .visor.navegable.arrastrando { cursor: grabbing; }
      /* marco() le da el ancho; el alto sale solo del aspect-ratio. */
      .recorte {
        position: relative; flex: 0 0 auto;
        transform-origin: center center;
      }

      /* Controles de zoom */
      .zoom {
        position: absolute; right: 18px; bottom: 18px;
        display: flex; gap: 6px;
      }
      .zoom button {
        min-width: 34px; height: 34px; padding: 0 10px;
        border-radius: 8px; cursor: pointer;
        font-size: 1rem; font-weight: 800; line-height: 1;
        color: var(--color-texto);
        background: rgba(29, 30, 32, 0.88);
        border: 1px solid var(--color-borde);
      }
      .zoom button:hover { border-color: var(--color-primario); }
      .zoom .reset { font-size: 0.76rem; font-weight: 700; }
      .ayuda {
        margin: 8px 0 0; font-size: 0.78rem; color: var(--color-texto-suave);
      }

      /* Ilustración suelta, sobre la misma "hoja" clara que el plano. */
      .hoja {
        margin-top: 10px;
        background: #fff; border-radius: 6px; padding: 10px;
      }
      .hoja img { display: block; width: 100%; height: auto; }
      .capa {
        position: absolute; inset: 0;
        background-repeat: no-repeat;
      }
      /* El plano se atenúa para que la trayectoria destaque por encima. */
      .svg { width: 100%; height: 100%; }
      /* Estela: rastro corto detrás de la moto. No repinta el trazo del plano. */
      .estela {
        fill: none;
        stroke: var(--color-primario);
        stroke-width: 14;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.55;
      }
      .moto-halo { fill: var(--color-primario); opacity: 0.22; }
      .moto { fill: var(--color-primario); stroke: #2b3464; stroke-width: 5; }
      .moto-nariz { fill: #2b3464; }

      .diagrama-pie { margin: 10px 0 0; font-size: 0.78rem; color: var(--color-texto-suave); }

      /* --- Ficha de maniobra --- */
      .ficha-maniobra { padding: 18px; }
      .ficha-maniobra h2 { margin: 0 0 8px; font-size: 1.25rem; color: var(--color-primario); }
      .ficha-maniobra h3 {
        margin: 20px 0 8px; font-size: 0.74rem; text-transform: uppercase;
        letter-spacing: 0.1em; color: var(--color-acento);
      }
      .m-desc { margin: 0; }
      .m-evalua { margin: 0; color: var(--color-texto-suave); }

      .medidas { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 0; padding: 0; }
      .medidas li {
        font-size: 0.76rem; font-weight: 600; padding: 4px 10px; border-radius: 999px;
        background: var(--color-superficie-2); border: 1px solid var(--color-borde);
        color: var(--color-texto);
      }

      .pasos { margin: 0; padding-left: 20px; }
      .pasos li { margin-bottom: 7px; }
      .pasos li::marker { color: var(--color-primario); font-weight: 800; }

      .m-errores { list-style: none; margin: 0; padding: 0; }
      .m-errores li {
        display: flex; align-items: flex-start; gap: 9px;
        padding: 8px 0; border-top: 1px solid var(--color-borde);
        color: var(--color-texto-suave); font-size: 0.88rem;
      }
      .m-errores li:first-child { border-top: none; }
      .chip {
        flex: 0 0 auto; margin-top: 1px;
        font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
        padding: 3px 7px; border-radius: 4px;
      }
      .chip-leve { background: rgba(255, 198, 50, 0.16); color: var(--color-acento); }
      .chip-grave { background: rgba(255, 159, 10, 0.16); color: #ff9f0a; }
      .chip-reprobatorio { background: rgba(255, 69, 58, 0.16); color: var(--color-error); }
      .regla {
        margin: 14px 0 0; font-size: 0.8rem; color: var(--color-texto-suave);
        border-left: 3px solid var(--color-borde); padding-left: 10px;
      }

      /* --- Vestimenta --- */
      .vestimenta { margin-top: 32px; padding: 18px; }
      .vestimenta h2 { margin: 0 0 10px; font-size: 1.2rem; }
      .vestimenta ul { margin: 0; padding-left: 18px; color: var(--color-texto-suave); }
      .vestimenta li { margin-bottom: 4px; }
      .nota { margin: 12px 0 0; font-size: 0.85rem; color: var(--color-texto-suave); }

      /* --- CTA --- */
      .cta {
        margin-top: 32px; padding: 22px;
        border: 2px solid var(--color-primario);
        background: linear-gradient(135deg, var(--color-superficie-2), var(--color-superficie));
      }
      .cta h2 { margin: 0 0 8px; font-size: 1.3rem; }
      .cta p { margin: 0; color: var(--color-texto-suave); max-width: 62ch; }
      .cta-btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
    `,
  ],
})
export class CircuitoComponent implements OnDestroy {
  private router = inject(Router);
  private hostRef: ElementRef<HTMLElement> = inject(ElementRef);

  // --- Datos estáticos ---
  readonly pista = PISTA;
  readonly etapas = ETAPAS;
  readonly elementosRequeridos = ELEMENTOS_REQUERIDOS;
  readonly vestimenta = VESTIMENTA_OBLIGATORIA;
  readonly cta = contactoCfg;

  // --- Estado: etapa y maniobra seleccionadas ---
  readonly etapaId = signal(ETAPAS[0].id);
  readonly maniobraId = signal(ETAPAS[0].maniobras[0].id);
  /** true = se muestra el panel completo de la etapa en vez del recorte de la maniobra. */
  readonly planoCompleto = signal(false);

  readonly etapa = computed(() => this.etapas.find((e) => e.id === this.etapaId())!);
  readonly maniobra = computed<Maniobra>(
    () => this.etapa().maniobras.find((m) => m.id === this.maniobraId()) ?? this.etapa().maniobras[0],
  );

  /**
   * Polilíneas oficiales, en píxeles del plano, ya suavizadas.
   *
   * El trazador avanza a saltitos y deja la línea con un temblor mínimo. Sobre el
   * plano no se nota (no la dibujamos), pero SÍ se notaría en el movimiento de la
   * moto, así que se suaviza una vez, al cargar.
   */
  private readonly rutas: Record<string, number[][]> = Object.fromEntries(
    Object.entries(rutasCfg as Record<string, number[][]>).map(([k, pts]) => [k, suavizar(pts)]),
  );

  // --- Animación de la moto sobre la trayectoria oficial ---
  /** Avance dentro del tramo, de 0 a 1. */
  readonly avance = signal(0);
  /** 25 fps: suficiente y mucho más barato que 60. */
  private readonly FRAME = 40;
  /** Alto máximo del plano en pantalla: lo que queda de viewport sin provocar scroll. */
  private readonly ALTO_MAX = '72vh';

  // --- Visor: arrastrar y ampliar (solo con el plano completo) ---
  readonly zoom = signal(1);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly arrastrando = signal(false);
  private ultimo: { x: number; y: number } | null = null;

  private readonly ZOOM_MIN = 1;
  private readonly ZOOM_MAX = 6;

  /** El transform del plano dentro del visor. */
  readonly lente = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`,
  );

  /** Velocidad de la moto, en píxeles del plano por milisegundo. */
  private readonly VELOCIDAD = 1.8;
  /** Duración mínima, para que un tramo corto no pase volando. */
  private readonly CICLO_MIN = 3500;
  private reloj: ReturnType<typeof setInterval> | null = null;

  /** Región del plano que se muestra: la de la maniobra, o el panel completo de la etapa. */
  readonly regionActiva = computed<RegionDiagrama | null>(() => {
    const region = this.maniobra().region;
    if (!region) return null;
    return this.planoCompleto() ? this.etapa().diagrama : region;
  });

  /** Clave de la polilínea de la etapa activa (la etapa 1 no tiene recorrido animado). */
  private readonly claveRuta = computed<'e2' | 'e3' | null>(() => {
    const n = this.etapa().numero;
    if (n === 2) return 'e2';
    if (n === 3) return 'e3';
    return null;
  });

  /**
   * Lo que recorre la moto:
   *  - con el plano completo, TODO el recorrido de la etapa, de la partida a la llegada;
   *  - con una maniobra seleccionada, solo su tramo.
   */
  readonly tramo = computed<number[][]>(() => {
    if (this.planoCompleto()) {
      const clave = this.claveRuta();
      return clave ? (this.rutas[clave] ?? []) : [];
    }
    const anim = this.maniobra().animacion;
    if (!anim) return [];
    const completa = this.rutas[anim.ruta] ?? [];
    const desde = Math.floor(anim.desde * completa.length);
    const hasta = Math.ceil(anim.hasta * completa.length);
    return completa.slice(desde, hasta);
  });

  /** Estela: el trocito de recorrido que la moto acaba de pasar. */
  readonly estela = computed(() => {
    const pts = this.tramo();
    if (pts.length < 2) return '';
    const hasta = Math.max(1, Math.round(this.avance() * (pts.length - 1)));
    const desde = Math.max(0, hasta - Math.round(pts.length * 0.12));
    return pts
      .slice(desde, hasta + 1)
      .map((p) => `${p[0].toFixed(0)},${p[1].toFixed(0)}`)
      .join(' ');
  });

  /** Largo acumulado del tramo, para que la moto avance a velocidad pareja. */
  private readonly largos = computed(() => {
    const pts = this.tramo();
    const acum: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return acum;
  });

  /** Posición y ángulo de la moto: `transform` del grupo SVG. */
  readonly transformMoto = computed(() => {
    const pts = this.tramo();
    if (pts.length < 2) return '';
    const acum = this.largos();
    const total = acum[acum.length - 1];
    if (total === 0) return '';

    const objetivo = this.avance() * total;
    let i = 1;
    while (i < acum.length - 1 && acum[i] < objetivo) i++;

    const seg = acum[i] - acum[i - 1];
    const f = seg === 0 ? 0 : (objetivo - acum[i - 1]) / seg;
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f;
    const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
    // El ángulo se toma mirando unos puntos más adelante: si se calcula entre dos
    // puntos consecutivos, la moto tirita.
    const j = Math.min(pts.length - 1, i + 6);
    const k = Math.max(0, i - 6);
    const ang = (Math.atan2(pts[j][1] - pts[k][1], pts[j][0] - pts[k][0]) * 180) / Math.PI;

    return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`;
  });

  constructor() {
    this.reloj = setInterval(() => this.tic(), this.FRAME);
  }

  ngOnDestroy(): void {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = null;
  }

  /**
   * Duración de una vuelta completa. Se calcula del largo real del recorrido, así
   * la moto va siempre a la misma velocidad: el zigzag y los 70 m de recta se ven
   * coherentes entre sí.
   */
  private readonly ciclo = computed(() => {
    const acum = this.largos();
    const total = acum[acum.length - 1] ?? 0;
    return Math.max(this.CICLO_MIN, total / this.VELOCIDAD);
  });

  /** Avanza la moto un frame. La animación corre en bucle mientras haya recorrido. */
  private tic(): void {
    if (this.tramo().length < 2) return;
    this.avance.update((a) => (a + this.FRAME / this.ciclo()) % 1);
  }

  // --- Selección ---

  seleccionarEtapa(id: string): void {
    this.etapaId.set(id);
    this.maniobraId.set(this.etapa().maniobras[0].id);
    this.planoCompleto.set(false);
    this.avance.set(0);
  }

  seleccionarManiobra(id: string): void {
    this.maniobraId.set(id);
    this.planoCompleto.set(false);
    this.avance.set(0);
    this.encuadrar();
  }

  alternarPlano(): void {
    this.planoCompleto.update((v) => !v);
    this.avance.set(0);
    this.encuadrar();
  }

  // --- Navegación del plano ---

  /** Vuelve al encuadre inicial: todo el plano visible, sin desplazamiento. */
  encuadrar(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  /**
   * Amplía o reduce respecto del CENTRO del visor.
   * El desplazamiento se escala igual, para que no se salte lo que estabas mirando.
   */
  acercar(factor: number): void {
    if (!this.planoCompleto()) return;
    const antes = this.zoom();
    const despues = this.limitarZoom(antes * factor);
    if (despues === antes) return;
    const k = despues / antes;
    this.zoom.set(despues);
    this.panX.update((p) => p * k);
    this.panY.update((p) => p * k);
    this.ajustarPan();
  }

  /** Rueda del mouse: amplía manteniendo fijo el punto bajo el cursor. */
  rueda(ev: WheelEvent): void {
    if (!this.planoCompleto()) return;
    ev.preventDefault();

    const antes = this.zoom();
    const despues = this.limitarZoom(antes * (ev.deltaY < 0 ? 1.15 : 1 / 1.15));
    if (despues === antes) return;

    // Cursor respecto del centro del visor (el transform-origin).
    const caja = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = ev.clientX - caja.left - caja.width / 2;
    const cy = ev.clientY - caja.top - caja.height / 2;

    // Para que el punto bajo el cursor no se mueva:
    //   pan' = c - (c - pan) * (zoom' / zoom)
    const k = despues / antes;
    this.panX.update((p) => cx - (cx - p) * k);
    this.panY.update((p) => cy - (cy - p) * k);
    this.zoom.set(despues);
    this.ajustarPan();
  }

  tomar(ev: PointerEvent): void {
    if (!this.planoCompleto()) return;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    this.arrastrando.set(true);
    this.ultimo = { x: ev.clientX, y: ev.clientY };
  }

  mover(ev: PointerEvent): void {
    if (!this.arrastrando() || !this.ultimo) return;
    this.panX.update((p) => p + (ev.clientX - this.ultimo!.x));
    this.panY.update((p) => p + (ev.clientY - this.ultimo!.y));
    this.ultimo = { x: ev.clientX, y: ev.clientY };
    this.ajustarPan();
  }

  soltar(ev: PointerEvent): void {
    if (!this.arrastrando()) return;
    (ev.currentTarget as HTMLElement).releasePointerCapture?.(ev.pointerId);
    this.arrastrando.set(false);
    this.ultimo = null;
  }

  private limitarZoom(z: number): number {
    return Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, z));
  }

  /**
   * Impide que el plano se arrastre fuera de la vista: el desplazamiento no puede
   * superar el margen que el zoom deja sobrando a cada lado.
   */
  private ajustarPan(): void {
    const raiz = this.hostRef.nativeElement;
    const visor: HTMLElement | null = raiz.querySelector('.visor');
    const plano: HTMLElement | null = raiz.querySelector('.recorte');
    if (!visor || !plano) return;

    // Solo se puede arrastrar lo que el plano ampliado se sale del visor.
    // Si entra completo (zoom 1), no hay nada que desplazar.
    const z = this.zoom();
    const sobraX = Math.max(0, (plano.offsetWidth * z - visor.clientWidth) / 2);
    const sobraY = Math.max(0, (plano.offsetHeight * z - visor.clientHeight) / 2);

    this.panX.update((p) => Math.min(sobraX, Math.max(-sobraX, p)));
    this.panY.update((p) => Math.min(sobraY, Math.max(-sobraY, p)));
  }

  // --- Recorte del plano oficial ---

  /**
   * Tamaño del recorte en pantalla.
   *
   * El plano completo es muy alto (una tira de 70 m). Si se fija el ancho al 100%,
   * la altura se dispara y aparece scroll. Así que se limita por ALTURA —lo que
   * queda de viewport— y el ancho se deduce de la proporción del recorte:
   *
   *     ancho = min(100% del contenedor, alto disponible x proporción)
   *
   * Con `aspect-ratio` la altura sale sola, así que nunca se deforma ni se pasa.
   */
  marco(r: RegionDiagrama): Record<string, string> {
    const proporcion = r.w / r.h;
    return {
      'aspect-ratio': `${r.w} / ${r.h}`,
      width: `min(100%, calc(${this.ALTO_MAX} * ${proporcion.toFixed(4)}))`,
    };
  }

  /**
   * Recorta una zona de la imagen con la técnica de sprite:
   *  - `background-size` escala la imagen completa respecto del recorte,
   *  - `background-position` en % desplaza hasta la zona pedida.
   * Como los porcentajes dependen solo de la PROPORCIÓN, la capa de trayectoria
   * (guardada a media resolución) se alinea exactamente con el plano.
   */
  capa(r: RegionDiagrama, imagen: string): Record<string, string> {
    const restoX = r.imagenAncho - r.w;
    const restoY = r.imagenAlto - r.h;
    return {
      'background-image': `url('${imagen}')`,
      'background-size': `${(r.imagenAncho / r.w) * 100}% ${(r.imagenAlto / r.h) * 100}%`,
      'background-position': `${restoX <= 0 ? 0 : (r.x / restoX) * 100}% ${
        restoY <= 0 ? 0 : (r.y / restoY) * 100
      }%`,
    };
  }

  // --- Navegación y CTA ---

  whatsapp(): void {
    const url = `https://wa.me/${this.cta.whatsappNumero}?text=${encodeURIComponent(
      this.cta.ctaCircuito.mensaje,
    )}`;
    window.open(url, '_blank');
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
