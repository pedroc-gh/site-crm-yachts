-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "Etapa" AS ENUM ('NOVO_LEAD', 'PRIMEIRO_CONTATO', 'QUALIFICADO', 'VISITA_SEA_TRIAL', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoInteracao" AS ENUM ('LIGACAO', 'WHATSAPP', 'EMAIL', 'REUNIAO', 'VISITA', 'SEA_TRIAL', 'NOTA', 'MUDANCA_ETAPA', 'PROPOSTA');

-- CreateEnum
CREATE TYPE "Condicao" AS ENUM ('NOVO', 'SEMINOVO');

-- CreateEnum
CREATE TYPE "StatusEmbarcacao" AS ENUM ('DISPONIVEL', 'RESERVADA', 'VENDIDA', 'ENCOMENDA');

-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('RASCUNHO', 'ENVIADA', 'ACEITA', 'RECUSADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'VENDEDOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "trocarSenha" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "cidade" TEXT,
    "uf" VARCHAR(2),
    "profissao" TEXT,
    "origem" TEXT,
    "interesse" "Condicao",
    "modeloInteresse" TEXT,
    "orcamento" DECIMAL(14,2),
    "possuiBarco" TEXT,
    "observacoes" TEXT,
    "etapa" "Etapa" NOT NULL DEFAULT 'NOVO_LEAD',
    "motivoPerda" TEXT,
    "proximoContato" TIMESTAMP(3),
    "vendedorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacoes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoInteracao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embarcacoes" (
    "id" TEXT NOT NULL,
    "condicao" "Condicao" NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER,
    "comprimentoPes" DECIMAL(5,1),
    "motorizacao" TEXT,
    "horasMotor" INTEGER,
    "combustivel" TEXT,
    "cabines" INTEGER,
    "capacidade" INTEGER,
    "cor" TEXT,
    "localizacao" TEXT,
    "inscricao" TEXT,
    "preco" DECIMAL(14,2) NOT NULL,
    "status" "StatusEmbarcacao" NOT NULL DEFAULT 'DISPONIVEL',
    "equipamentos" TEXT,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embarcacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" TEXT NOT NULL,
    "embarcacaoId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "dados" BYTEA NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "embarcacaoId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "status" "StatusProposta" NOT NULL DEFAULT 'RASCUNHO',
    "valorTabela" DECIMAL(14,2) NOT NULL,
    "opcionais" TEXT,
    "valorOpcionais" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "barcoTroca" TEXT,
    "valorTroca" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valorFinal" DECIMAL(14,2) NOT NULL,
    "entrada" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "parcelas" INTEGER NOT NULL DEFAULT 0,
    "valorParcela" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "formaPagamento" TEXT,
    "prazoEntrega" TEXT,
    "localEntrega" TEXT,
    "validade" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "clientes_vendedorId_etapa_idx" ON "clientes"("vendedorId", "etapa");

-- CreateIndex
CREATE INDEX "interacoes_clienteId_data_idx" ON "interacoes"("clienteId", "data");

-- CreateIndex
CREATE INDEX "embarcacoes_condicao_status_idx" ON "embarcacoes"("condicao", "status");

-- CreateIndex
CREATE UNIQUE INDEX "propostas_numero_key" ON "propostas"("numero");

-- CreateIndex
CREATE INDEX "propostas_vendedorId_status_idx" ON "propostas"("vendedorId", "status");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_embarcacaoId_fkey" FOREIGN KEY ("embarcacaoId") REFERENCES "embarcacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_embarcacaoId_fkey" FOREIGN KEY ("embarcacaoId") REFERENCES "embarcacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
