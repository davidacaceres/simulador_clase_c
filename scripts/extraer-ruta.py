#!/usr/bin/env python3
"""
Sigue la trayectoria dibujada en los planos oficiales del examen práctico Clase C
y la guarda en `src/assets/data/circuito-rutas.json` como POLILÍNEA ORDENADA (de la
partida a la llegada), para animar la moto recorriéndola.

Por qué así: el plano oficial ya trae dibujada la línea del recorrido. En vez de
redibujarla (lo que sería una interpretación nuestra), la aislamos por color y la
seguimos. Todo lo que ve el usuario sale del documento oficial.

Problemas que resuelve, y cómo:

  - La línea comparte color con el texto y las cotas (azul marino #2B3464).
    Se filtran los componentes conectados por forma: área, dimensiones y relleno.

  - Los conos TAPAN la línea, así que el trazo llega fragmentado. El trazador
    puentea esos cortes buscando más lejos en la dirección en que venía.

  - La figura en ocho SE CRUZA consigo misma. Un trazador que solo busca el píxel
    más cercano salta de rama en el cruce. Este mantiene el rumbo: cerca acepta
    curvas cerradas, pero al puentear un hueco exige ir casi recto, que es lo que
    desambigua el cruce.

Uso:
    pip install pillow numpy scipy
    python scripts/extraer-ruta.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "src" / "assets" / "img" / "circuito"
DATA = RAIZ / "src" / "assets" / "data"

# Azul marino con el que están dibujadas las trayectorias en los planos.
NAVY = np.array([43, 52, 100], dtype=np.int16)
TOLERANCIA = 120

def cargar(nombre, escala):
    """Carga el plano y devuelve la máscara de píxeles azul marino."""
    im = Image.open(IMG / f"{nombre}.png").convert("RGB")
    if escala > 1:
        im = im.resize((im.width // escala, im.height // escala), Image.LANCZOS)
    pix = np.asarray(im, dtype=np.int16)
    mask = np.abs(pix - NAVY).sum(axis=2) < TOLERANCIA
    del pix
    # Une las puntas de flecha con la línea a la que pertenecen.
    return ndimage.binary_closing(mask, structure=np.ones((5, 5)))


def componentes(mask, area_min, dim_min, largo_min, relleno_max):
    """Deja solo los componentes conectados que parecen trazo de trayectoria.

    - area_min    descarta letras y números.
    - dim_min     descarta cotas (líneas rectas muy finas).
    - largo_min   descarta lentejas y los iconos de moto.
    - relleno_max descarta bloques sólidos (el título, los círculos "1" y "2").
    """
    etiquetas, _ = ndimage.label(mask, structure=np.ones((3, 3)))
    out = np.zeros_like(mask)
    for i, corte in enumerate(ndimage.find_objects(etiquetas), start=1):
        alto = corte[0].stop - corte[0].start
        ancho = corte[1].stop - corte[1].start
        pieza = etiquetas[corte] == i
        area = int(pieza.sum())
        if (
            area > area_min
            and min(alto, ancho) > dim_min
            and max(alto, ancho) > largo_min
            and area / (alto * ancho) < relleno_max
        ):
            out[corte] |= pieza
    return out


def trazar(mask, semilla, rumbo0, paso=9, max_pasos=6000):
    """Sigue la línea del plano manteniendo el rumbo. Devuelve la polilínea ordenada.

    Cuatro tramos de búsqueda, en orden de preferencia:
      1. contiguo -> curvas normales;
      2. medio    -> puentea el corte que deja un cono, exigiendo ir bastante recto;
      3. largo    -> puentea cortes grandes, exigiendo ir casi recto;
      4. rescate  -> horquillas de casi 90° (el codo antes del pasillo). Solo se usa
                     si los tres anteriores fallan, y solo sobre pixeles no pisados,
                     para que el trazador no se devuelva por donde vino.

    La exigencia de ir recto al puentear es lo que impide que, en el cruce de la
    figura en ocho, el trazador salte a la otra rama.
    """
    ys, xs = np.nonzero(mask)
    pts = np.stack([xs, ys], axis=1).astype(float)
    arbol = cKDTree(pts)
    usado = np.zeros(len(pts), bool)

    pos = np.array(semilla, float)
    rumbo = np.array(rumbo0, float)
    rumbo /= np.linalg.norm(rumbo)
    ruta = [pos.copy()]

    # (radio, coseno minimo, penalizacion por repisar, solo pixeles nuevos)
    tramos = [
        (paso * 2.5, 0.20, 1.5, False),
        (paso * 7, 0.55, 2.0, False),
        (paso * 22, 0.85, 2.5, False),
        (paso * 3.0, -0.35, 0.0, True),
    ]

    for _ in range(max_pasos):
        elegido = None
        for radio, cos_min, pena, solo_nuevos in tramos:
            mejor, mejor_score = None, -1e9
            for i in arbol.query_ball_point(pos, radio):
                if solo_nuevos and usado[i]:
                    continue
                v = pts[i] - pos
                d = float(np.linalg.norm(v))
                if d < paso * 0.5:
                    continue
                v = v / d
                cos = float(np.dot(v, rumbo))
                if cos < cos_min:
                    continue
                score = cos * 2.0 - abs(d - paso) / paso * 0.2 - (pena if usado[i] else 0)
                if score > mejor_score:
                    mejor, mejor_score = i, score
            if mejor is not None:
                elegido = pts[mejor]
                break
        if elegido is None:
            break

        v = elegido - pos
        d = float(np.linalg.norm(v))
        v /= d
        rumbo = 0.45 * rumbo + 0.55 * v
        rumbo /= np.linalg.norm(rumbo)
        pos = pos + rumbo * min(d, paso * 1.5)
        for j in arbol.query_ball_point(pos, paso * 1.1):
            usado[j] = True
        ruta.append(pos.copy())

    return ruta


def semilla_trazo_largo(mask, x0, x1, arriba=True):
    """Semilla en el extremo del trazo LARGO de una banda vertical.

    Sirve para no arrancar sobre el icono de la moto, que tambien es azul marino
    y queda dentro de la mascara.
    """
    banda = np.zeros_like(mask)
    banda[:, x0:x1] = mask[:, x0:x1]
    etiquetas, _ = ndimage.label(banda, structure=np.ones((3, 3)))
    mejor, mejor_alto = None, -1
    for i, corte in enumerate(ndimage.find_objects(etiquetas), start=1):
        alto = corte[0].stop - corte[0].start
        if alto > mejor_alto:
            mejor, mejor_alto = i, alto
    ys, xs = np.nonzero(etiquetas == mejor)
    k = int(np.argmin(ys)) if arriba else int(np.argmax(ys))
    return (int(xs[k]), int(ys[k]))


def semilla_trazo_ancho(mask, y0, y1, ancho_min=600):
    """Semilla en el extremo izquierdo del trazo mas ANCHO de una banda horizontal.

    Equivalente a semilla_trazo_largo, pero para el plano horizontal de la etapa 1.
    """
    banda = np.zeros_like(mask)
    banda[y0:y1, :] = mask[y0:y1, :]
    etiquetas, _ = ndimage.label(banda, structure=np.ones((3, 3)))
    # El carril viene partido en varios trozos (la joroba sobre el cono lo corta).
    # Se toma el extremo izquierdo de TODOS los trozos anchos: asi la semilla cae
    # al principio del carril y no en mitad del recorrido. El umbral de ancho deja
    # fuera el icono de la moto, que esta pegado al borde.
    mejor_x, semilla = None, None
    for i, corte in enumerate(ndimage.find_objects(etiquetas), start=1):
        if corte[1].stop - corte[1].start < ancho_min:
            continue
        ys, xs = np.nonzero(etiquetas == i)
        k = int(np.argmin(xs))
        if mejor_x is None or xs[k] < mejor_x:
            mejor_x, semilla = int(xs[k]), (int(xs[k]), int(ys[k]))
    return semilla


def main():
    rutas = {}

    # ---- Etapa 1: plano horizontal (4572x1422). Se recorre de izquierda a derecha.
    print("claseCetapa1.png")
    base = cargar("claseCetapa1", escala=1)
    # Para TRAZAR se usa una mascara mas permisiva: el filtro del resalte descarta
    # los tramos cortos que quedan entre cono y cono, y eso deja huecos enormes.
    # relleno_max alto: los carriles de esta etapa son rectas horizontales largas,
    # y una recta llena casi todo su bounding box. Con el umbral bajo se descartaban.
    trazo = componentes(base, 1200, 6, 120, 1.05)
    # El carril de ida es el trazo mas ANCHO de la mitad superior. Buscarlo asi
    # evita arrancar sobre el icono de la moto, que esta pegado al borde izquierdo.
    semilla = semilla_trazo_ancho(trazo, 0, base.shape[0] // 2)
    ruta = trazar(trazo, semilla, (1, 0), paso=14)
    rutas["e1"] = [[round(float(p[0]), 1), round(float(p[1]), 1)] for p in ruta]
    print(f"  ruta e1: {len(ruta)} puntos desde {semilla}")

    # ---- Etapas 2 y 3: plano vertical con dos paneles. Se guarda en el repo a media
    # resolucion (pesa la mitad y basta de sobra), asi que se lee tal cual.
    print("claseCetapa2.png")
    base = cargar("claseCetapa2", escala=1)
    trazo = componentes(base, 600, 0, 22, 0.62)
    ys, xs = np.nonzero(trazo)

    # Panel izquierdo (precision): parte abajo, en la flecha de INICIO, y sube.
    # El limite y<4300 evita picar el icono de la moto, que esta mas abajo.
    sel = (xs < 1780) & (ys < 4300)
    i = int(np.argmax(ys[sel]))
    semilla = (int(xs[sel][i]), int(ys[sel][i]))
    ruta = trazar(trazo, semilla, (0, -1))
    rutas["e2"] = [[round(float(p[0]), 1), round(float(p[1]), 1)] for p in ruta]
    print(f"  ruta e2: {len(ruta)} puntos desde {semilla}")

    # Panel derecho (velocidad): parte arriba, en el carril izquierdo, y baja.
    semilla = semilla_trazo_largo(trazo, 1800, 2700, arriba=True)
    ruta = trazar(trazo, semilla, (0, 1))
    rutas["e3"] = [[round(float(p[0]), 1), round(float(p[1]), 1)] for p in ruta]
    print(f"  ruta e3: {len(ruta)} puntos desde {semilla}")

    DATA.mkdir(parents=True, exist_ok=True)
    destino = DATA / "circuito-rutas.json"
    destino.write_text(json.dumps(rutas), encoding="utf-8")
    print(f"{destino.relative_to(RAIZ)}: {sum(len(v) for v in rutas.values())} puntos")


if __name__ == "__main__":
    main()
