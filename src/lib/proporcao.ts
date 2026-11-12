// Padrão das fotos da proposta: 4:3 horizontal (costado e detalhes) ou 3:4 vertical (só detalhes).
export const HORIZONTAL = 4 / 3;
export const VERTICAL = 3 / 4;

export type FotoMedida = { largura: number | null; altura: number | null };

export const ehVertical = (f: FotoMedida) => !!f.largura && !!f.altura && f.altura > f.largura;

/** Proporção em que a foto entra na proposta. */
export const proporcaoDe = (f: FotoMedida) => (ehVertical(f) ? VERTICAL : HORIZONTAL);

/** true quando a foto foge mais de 5% do 4:3 / 3:4 e vai ser recortada. */
export function foraDoPadrao(f: FotoMedida) {
  if (!f.largura || !f.altura) return false;
  const alvo = proporcaoDe(f);
  return Math.abs(f.largura / f.altura / alvo - 1) > 0.05;
}
