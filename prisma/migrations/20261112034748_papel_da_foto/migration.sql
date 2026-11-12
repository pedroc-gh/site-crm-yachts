-- CreateEnum
CREATE TYPE "PapelFoto" AS ENUM ('PRINCIPAL', 'DETALHE');

-- AlterTable
ALTER TABLE "fotos" ADD COLUMN     "papel" "PapelFoto" NOT NULL DEFAULT 'DETALHE';

-- A primeira foto de cada embarcação passa a ser a principal (costado)
UPDATE "fotos" f SET "papel" = 'PRINCIPAL'
WHERE f."id" = (SELECT f2."id" FROM "fotos" f2 WHERE f2."embarcacaoId" = f."embarcacaoId" ORDER BY f2."ordem", f2."criadoEm" LIMIT 1);
