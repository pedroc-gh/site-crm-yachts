// Acrescenta 3 fotos de detalhe de EXEMPLO às embarcações de demonstração.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
const db = new PrismaClient();
for (const [modelo, prefixo] of [["SESSA C68", "c68"], ["PHANTOM 345", "p345"]] as const) {
  const b = await db.embarcacao.findFirst({ where: { modelo } });
  if (!b || (await db.foto.count({ where: { embarcacaoId: b.id, papel: "DETALHE" } })) > 0) continue;
  for (let i = 1; i <= 3; i++) {
    await db.foto.create({
      data: { embarcacaoId: b.id, papel: "DETALHE", mime: "image/jpeg", ordem: i, dados: readFileSync(`prisma/exemplos/${prefixo}-detalhe-${i}.jpg`) },
    });
  }
}
console.log("Fotos de detalhe de exemplo adicionadas.");
await db.$disconnect();
