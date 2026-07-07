import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <a class="salto" href="#contenido">Saltar al contenido</a>

    <header class="app-header">
      <div class="contenedor cab">
        <a class="marca" routerLink="/" aria-label="Ir al inicio">
          <img
            class="logo"
            [src]="logoSrc()"
            (error)="onLogoError()"
            alt="Conducir Motos"
            width="88"
            height="55"
          />
          <span class="titulos">
            <span class="app-title">Simulador Examen Clase C</span>
            <span class="app-sub">Licencia de conducir · Motocicletas · Chile</span>
          </span>
        </a>
      </div>
    </header>

    <main id="contenido">
      <router-outlet />
    </main>

    <footer class="app-footer">
      <div class="contenedor pie">
        <span class="pie-txt">Conducir Motos · Desde 2008 patentando pilotos</span>
        <nav class="redes" aria-label="Redes sociales">
          <a href="https://www.facebook.com/conducirmotos" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/>
            </svg>
          </a>
          <a href="https://wa.me/56991206186" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 1.9a8.1 8.1 0 0 1 6.9 12.3l-.3.5.6 2.2-2.3-.6-.5.3A8.1 8.1 0 1 1 12 3.9zm-3 4c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.4-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.2-.2.3-.6.8-.7.9-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.3 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.5.1-.1 0-.3 0-.4 0-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5H9z"/>
            </svg>
          </a>
          <a href="https://www.instagram.com/conducirmotos" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.5.2 1 .5 1.4.9.4.4.7.9.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.5-.5 1-.9 1.4-.4.4-.9.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.5-.2-1-.5-1.4-.9-.4-.4-.7-.9-.9-1.4-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.5.5-1 .9-1.4.4-.4.9-.7 1.4-.9.4-.1 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C2.6 9.5 2.6 9.9 2.6 12s0 2.5.1 3.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-3.7s0-2.5-.1-3.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm5.1-3.1a1.1 1.1 0 1 1 0 2.3 1.1 1.1 0 0 1 0-2.3z"/>
            </svg>
          </a>
        </nav>
      </div>
    </footer>
  `,
  styles: [
    `
      :host { display: flex; flex-direction: column; min-height: 100vh; }
      main { flex: 1 0 auto; }

      .salto {
        position: absolute; left: -9999px; top: 0;
        background: var(--color-primario); color: var(--color-sobre-primario);
        padding: 8px 14px; border-radius: 0 0 8px 0; z-index: 100; font-weight: 700;
      }
      .salto:focus { left: 0; }

      .app-header {
        background: var(--color-superficie);
        border-bottom: 3px solid var(--color-primario);
        box-shadow: var(--sombra);
      }
      .cab { display: flex; align-items: center; padding-top: 12px; padding-bottom: 12px; }
      .marca { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
      .logo {
        width: 88px; height: 55px;
        object-fit: contain;
        border-radius: 6px;
        flex: 0 0 auto;
      }
      .titulos { display: flex; flex-direction: column; }
      .app-title {
        font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em;
      }
      @media (min-width: 560px) { .app-title { font-size: 1.2rem; } }
      .app-sub {
        margin-top: 4px; font-size: 0.72rem; letter-spacing: 0.06em;
        text-transform: uppercase; color: var(--color-texto-suave);
      }

      .app-footer {
        flex-shrink: 0;
        background: var(--color-superficie);
        border-top: 1px solid var(--color-borde);
        margin-top: 32px;
      }
      .pie {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; flex-wrap: wrap;
        padding-top: 16px; padding-bottom: 16px;
      }
      .pie-txt { font-size: 0.78rem; color: var(--color-texto-suave); }
      .redes { display: flex; align-items: center; gap: 10px; }
      .redes a {
        display: inline-flex; align-items: center; justify-content: center;
        width: 40px; height: 40px; border-radius: 50%;
        color: var(--color-texto);
        background: var(--color-superficie-2);
        border: 1px solid var(--color-borde);
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .redes a:hover { color: var(--color-sobre-primario); background: var(--color-primario); border-color: var(--color-primario); }
    `,
  ],
})
export class AppComponent {
  /** Logo de la marca (assets/img/logo.jpg); si no carga, cae al SVG de respaldo. */
  logoSrc = signal('assets/img/logo.jpg');

  onLogoError(): void {
    if (this.logoSrc() !== 'assets/img/logo.svg') {
      this.logoSrc.set('assets/img/logo.svg');
    }
  }
}
