# Simulador Examen Teórico — Licencia Clase C (Motocicletas)

Aplicación web (SPA) en **Angular** que simula el examen teórico municipal para la
licencia de conducir Clase C en Chile. Sin backend: el banco de preguntas es un archivo
JSON estático y el historial se guarda en `localStorage`.

> Contenido representativo basado en el *Libro del Nuevo Conductor* (CONASET) y la Ley de
> Tránsito. **No** son las preguntas oficiales del examen (el banco Nexteo no es público).

---

## Requisitos

- **Node.js** 20 LTS o superior — descárgalo desde https://nodejs.org (instala también `npm`).
- **Angular CLI** (se instala una sola vez):

```bash
npm install -g @angular/cli
```

Para verificar que quedó todo instalado:

```bash
node --version
ng version
```

---

## Instalar y ejecutar

Desde la carpeta `simulador-clase-c/`:

```bash
# 1. Instalar dependencias (crea node_modules/)
npm install

# 2. Levantar el servidor de desarrollo
npm start
# o bien:  ng serve
```

Luego abre en el navegador: **http://localhost:4200**

El navegador se recarga solo al guardar cambios en el código.

---

## Generar el build estático (para desplegar)

```bash
npm run build
```

El resultado queda en `dist/simulador-clase-c/`. Esa carpeta es 100% estática y se puede
subir a cualquier hosting (Netlify, GitHub Pages, Vercel, un servidor propio, etc.).
Se usa ruteo por *hash* (`/#/...`), así que funciona sin configurar reescritura de URLs.

---

## Desplegar en Vercel

El proyecto incluye `vercel.json` ya configurado para el builder de Angular
(salida en `dist/simulador-clase-c/browser`). No necesita reescrituras de rutas
porque usa ruteo por *hash*.

**Opción A — Vercel CLI (no requiere Git):**

```bash
npm install -g vercel      # una sola vez
cd simulador-clase-c       # ubicarse en la carpeta del proyecto Angular
vercel                     # primer deploy (preview); sigue el asistente
vercel --prod              # publicar a producción
```

En el asistente acepta los valores por defecto: `vercel.json` ya define el build
y la carpeta de salida.

**Opción B — Git + panel de Vercel:**

1. Sube el proyecto a GitHub/GitLab.
2. En vercel.com → **Add New… → Project** → importa el repositorio.
3. **Importante:** si subiste toda la carpeta `Simulador Test Clase C`, en
   *Root Directory* selecciona `simulador-clase-c` (donde está este proyecto).
4. Vercel lee `vercel.json` automáticamente → **Deploy**.

Cada push a la rama principal genera un nuevo deploy.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/                     # Lógica de negocio (no UI)
│   │   ├── enums/categoria.enum.ts
│   │   ├── models/               # Pregunta, Intento, Resultado
│   │   └── services/             # banco-preguntas.service.ts (+ examen, historial en próximas etapas)
│   ├── features/                 # Una carpeta por modo (lazy load)
│   │   └── inicio/               # Pantalla de inicio (implementada)
│   └── app.routes.ts             # Rutas
├── assets/data/preguntas.json    # BANCO DE PREGUNTAS (editable)
└── styles.scss                   # Estilos globales, mobile-first
```

---

## Estado por etapas

- [x] **Etapa 1** — Plan, arquitectura y esquema de datos (ver `../PLAN.md`).
- [x] **Etapa 2** — Esqueleto Angular, modelos, servicio de banco y preguntas de ejemplo.
- [x] **Etapa 3** — Modo Examen (cronómetro 45 min, reglas, puntaje y revisión) + guardado del intento.
- [x] **Etapa 4** — Modo Práctica, Práctica por Tema y Repaso de errores.
- [x] **Etapa 5** — Banco completo: **366 preguntas** del *Libro del Nuevo Conductor* CONASET,
  sus módulos y el catálogo de señales (171 señales con imagen).
- [x] **Etapa 6** — Historial y estadísticas en `localStorage`.

> El banco tiene 366 preguntas: señalética 196 (171 con imagen del catálogo de señales),
> normativa 35, conducción 30, distancias 22, alcohol 28, fatiga 20, motocicleta 35. Cada
> pregunta incluye explicación, referencia y **fuente** (extensible a nuevas fuentes).
> El Modo Examen arma 35 preguntas con distribución realista por categoría (ver
> `DISTRIBUCION_EXAMEN`) y exactamente 3 de doble puntaje. El banco completo está disponible
> en los modos de práctica.
>
> Cada pregunta tiene un campo **`pesoExamen`** (probabilidad relativa de aparecer en el
> examen): 1 = normal, mayor = más probable, 0 = nunca aparece. La selección aleatoria del
> examen es un muestreo ponderado por ese peso, así puedes priorizar o excluir preguntas
> sin borrarlas del banco.
>
> Hay tres **tipos** de pregunta (`tipo`): `unica` (una respuesta correcta), `multiple`
> (varias correctas — `indicesCorrectos`) y `emparejamiento` (asociar cada ítem numerado con
> su significado — `items`). La interfaz indica el tipo en cada pregunta; múltiple y
> emparejamiento se puntúan **todo o nada** (la selección debe coincidir exactamente).
>
> El banco tiene **594 preguntas** de tres **fuentes** (campo `fuente`): Libro del Nuevo
> Conductor (211), Catálogo de Señales (171) y el **Cuestionario Clase C de conducirmotos.cl**
> (212, con su clave de respuestas oficial). Las del cuestionario llevan `pesoExamen: 4`
> porque son las que típicamente aparecen en el examen, así predominan en el sorteo (≈23 de
> 35 preguntas por examen). En total: 528 de selección única y 66 de selección múltiple.

---

## Reglas del Modo Examen (referencia)

- 35 preguntas al azar del banco; 3 de doble puntaje.
- Puntaje máximo 38; mínimo para aprobar 33.
- Si se fallan las 3 preguntas de doble puntaje → reprueba, aunque sume 33.
- Tiempo límite: 45 minutos (el examen se corta al llegar a 0).
