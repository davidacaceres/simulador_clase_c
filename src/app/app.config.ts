import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withHashLocation permite desplegar el build estático en cualquier hosting
    // (incluso abriendo el index.html) sin configurar reescritura de rutas.
    provideRouter(routes, withHashLocation()),
  ],
};
