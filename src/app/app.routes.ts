import { Routes } from '@angular/router';

/**
 * Rutas de la aplicación. Los modos se cargan con lazy loading.
 * Por ahora (Etapa 2) solo está implementada la pantalla de Inicio;
 * el resto se agregará en las etapas siguientes.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/inicio/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'examen',
    loadComponent: () =>
      import('./features/examen/examen.component').then((m) => m.ExamenComponent),
  },
  {
    path: 'resultado',
    loadComponent: () =>
      import('./features/resultado/resultado.component').then((m) => m.ResultadoComponent),
  },
  {
    path: 'practica',
    loadComponent: () =>
      import('./features/practica/practica.component').then((m) => m.PracticaComponent),
  },
  {
    path: 'conducir-motos',
    loadComponent: () =>
      import('./features/conducir-motos/conducir-motos.component').then((m) => m.ConducirMotosComponent),
  },
  {
    path: 'por-tema',
    loadComponent: () =>
      import('./features/por-tema/por-tema.component').then((m) => m.PorTemaComponent),
  },
  {
    path: 'repaso',
    loadComponent: () =>
      import('./features/repaso/repaso.component').then((m) => m.RepasoComponent),
  },
  {
    path: 'favoritas',
    loadComponent: () =>
      import('./features/favoritas/favoritas.component').then((m) => m.FavoritasComponent),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./features/historial/historial.component').then((m) => m.HistorialComponent),
  },
  {
    path: 'pregunta/:id',
    loadComponent: () =>
      import('./features/ver-pregunta/ver-pregunta.component').then((m) => m.VerPreguntaComponent),
  },
  {
    path: 'pregunta',
    loadComponent: () =>
      import('./features/ver-pregunta/ver-pregunta.component').then((m) => m.VerPreguntaComponent),
  },
  { path: '**', redirectTo: '' },
];
