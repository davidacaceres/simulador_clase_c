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
