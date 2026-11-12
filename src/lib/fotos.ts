import "server-only";
import { imageSize } from "image-size";
import { db } from "./db";

/** Largura e altura em pixels lidas do próprio arquivo (JPG, PNG ou WebP). */
export function lerDimensoes(dados: Uint8Array): { largura: number; altura: number } | null {
  try {
    const r = imageSize(dados);
    if (!r.width || !r.height) return null;
    // Fotos de celular giradas pela orientação EXIF (5 a 8) trocam largura e altura
    const girada = r.orientation != null && r.orientation >= 5;
    return girada ? { largura: r.height, altura: r.width } : { largura: r.width, altura: r.height };
  } catch {
    return null;
  }
}

/** Fotos enviadas antes do registro de tamanho: mede e grava uma vez. */
export async function garantirDimensoes(embarcacaoId: string) {
  const pendentes = await db.foto.findMany({
    where: { embarcacaoId, OR: [{ largura: null }, { altura: null }] },
    select: { id: true, dados: true },
  });
  for (const f of pendentes) {
    const d = lerDimensoes(f.dados);
    if (d) await db.foto.update({ where: { id: f.id }, data: d });
  }
}
