/**
 * Devuelve una copia del arreglo con los elementos mezclados al azar
 * (algoritmo de Fisher-Yates). No modifica el arreglo original.
 */
export function mezclar<T>(arreglo: readonly T[]): T[] {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Selecciona hasta `n` elementos SIN reemplazo con probabilidad proporcional a
 * su peso (algoritmo de muestreo ponderado de Efraimidis–Spirakis).
 * Los elementos con peso <= 0 se excluyen. El resultado queda en orden aleatorio.
 */
export function elegirPonderado<T>(
  items: readonly T[],
  n: number,
  peso: (item: T) => number,
): T[] {
  return items
    .filter((it) => peso(it) > 0)
    .map((it) => ({ it, clave: Math.pow(Math.random(), 1 / peso(it)) }))
    .sort((a, b) => b.clave - a.clave)
    .slice(0, n)
    .map((x) => x.it);
}
