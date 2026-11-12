// Dados de EXEMPLO para conhecer o sistema. Não rode em produção.
// Senha de todos os usuários de exemplo: regatta2026
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

const db = new PrismaClient();
const dias = (n: number) => new Date(Date.now() + n * 864e5);

async function main() {
  if ((await db.usuario.count()) > 0) {
    console.log("O banco já tem usuários; seed ignorado.");
    return;
  }
  const senhaHash = await bcrypt.hash("regatta2026", 10);
  const admin = await db.usuario.create({
    data: { nome: "Administrador Exemplo", email: "admin@exemplo.com.br", telefone: "11957997972", papel: "ADMIN", senhaHash, trocarSenha: false },
  });
  const ana = await db.usuario.create({
    data: { nome: "Ana Exemplo", email: "ana@exemplo.com.br", telefone: "11988887777", papel: "VENDEDOR", senhaHash, trocarSenha: false },
  });
  const bruno = await db.usuario.create({
    data: { nome: "Bruno Exemplo", email: "bruno@exemplo.com.br", telefone: "13977776666", papel: "VENDEDOR", senhaHash, trocarSenha: false },
  });

  const c68 = await db.embarcacao.create({
    data: {
      condicao: "NOVO", marca: "Sessa Marine", modelo: "SESSA C68", ano: 2026, comprimentoPes: 68, motorizacao: "2x Volvo Penta IPS 1350",
      combustivel: "Diesel", cabines: 4, capacidade: 18, cor: "Branco", localizacao: "Estaleiro, Itália", preco: 21500000, status: "ENCOMENDA",
      equipamentos: "Flybridge com hard top\nGerador 2x 17,5 kW\nAr-condicionado em todas as cabines\nEstabilizador giroscópico\nPlataforma de popa hidráulica\nJoystick de atracação",
      descricao: "Design italiano, quatro cabines e um flybridge pensado para receber a família inteira. A Sessa C68 é feita para quem vive o mar sem pressa.",
      fotos: { create: [{ papel: "PRINCIPAL", mime: "image/jpeg", dados: readFileSync("public/barcos/sessa-c68.jpg"), ordem: 0 }, ...[1, 2, 3].map((i) => ({ papel: "DETALHE" as const, mime: "image/jpeg", dados: readFileSync(`prisma/exemplos/c68-detalhe-${i}.jpg`), ordem: i }))] },
    },
  });
  const p345 = await db.embarcacao.create({
    data: {
      condicao: "SEMINOVO", marca: "Phantom", modelo: "PHANTOM 345", ano: 2019, comprimentoPes: 34.5, motorizacao: "2x Mercruiser 300 hp",
      horasMotor: 420, combustivel: "Gasolina", cabines: 1, capacidade: 12, cor: "Branco", localizacao: "Marina, Guarujá - SP",
      inscricao: "Exemplo 000123", preco: 399000, status: "DISPONIVEL",
      equipamentos: "Revisão completa\nCapota nova\nGPS e sonda\nGeladeira\nChuveiro de popa",
      descricao: "Revisado e com garantia. Pronto para navegar neste verão.",
      fotos: { create: [{ papel: "PRINCIPAL", mime: "image/jpeg", dados: readFileSync("public/barcos/phantom-345.jpg"), ordem: 0 }, ...[1, 2, 3].map((i) => ({ papel: "DETALHE" as const, mime: "image/jpeg", dados: readFileSync(`prisma/exemplos/p345-detalhe-${i}.jpg`), ordem: i }))] },
    },
  });
  await db.embarcacao.create({
    data: { condicao: "NOVO", marca: "Sessa Marine", modelo: "SESSA KL40", ano: 2026, comprimentoPes: 40, motorizacao: "3x Mercury Verado 400", combustivel: "Gasolina", cabines: 1, capacidade: 14, preco: 5900000, status: "ENCOMENDA" },
  });
  await db.embarcacao.create({
    data: { condicao: "SEMINOVO", marca: "Sessa Marine", modelo: "SESSA F42", ano: 2021, comprimentoPes: 42, motorizacao: "2x Volvo Penta D6 435", horasMotor: 310, combustivel: "Diesel", cabines: 2, capacidade: 12, localizacao: "Marina, Angra dos Reis - RJ", preco: 3450000, status: "RESERVADA" },
  });

  const clientes = [
    { nome: "Ricardo Exemplo", telefone: "11991234567", cidade: "São Paulo", uf: "SP", origem: "Evento / boat show", interesse: "NOVO", modeloInteresse: "SESSA C68", orcamento: 22000000, etapa: "NEGOCIACAO", proximoContato: dias(1), vendedorId: ana.id },
    { nome: "Fernanda Exemplo", telefone: "11982345678", cidade: "Santos", uf: "SP", origem: "Instagram", interesse: "SEMINOVO", modeloInteresse: "PHANTOM 345", orcamento: 420000, etapa: "VISITA_SEA_TRIAL", proximoContato: dias(-2), vendedorId: ana.id },
    { nome: "Marcos Exemplo", telefone: "21973456789", cidade: "Rio de Janeiro", uf: "RJ", origem: "Indicação", interesse: "NOVO", modeloInteresse: "SESSA KL40", orcamento: 6000000, etapa: "QUALIFICADO", proximoContato: dias(3), vendedorId: bruno.id },
    { nome: "Juliana Exemplo", telefone: "13964567890", cidade: "Guarujá", uf: "SP", origem: "Site Regatta Yachts", interesse: null, etapa: "NOVO_LEAD", proximoContato: dias(0), vendedorId: bruno.id },
    { nome: "Paulo Exemplo", telefone: "11955678901", cidade: "Campinas", uf: "SP", origem: "Cliente da casa", interesse: "SEMINOVO", modeloInteresse: "SESSA F42", orcamento: 3500000, etapa: "GANHO", vendedorId: ana.id },
    { nome: "Carla Exemplo", telefone: "47946789012", cidade: "Balneário Camboriú", uf: "SC", origem: "RD Station", interesse: "NOVO", modeloInteresse: "SESSA C68", etapa: "PRIMEIRO_CONTATO", proximoContato: dias(5), vendedorId: bruno.id },
  ] as const;
  const criados = [];
  for (const c of clientes) {
    const cli = await db.cliente.create({ data: { ...c, interesse: c.interesse ?? null } });
    await db.interacao.create({ data: { clienteId: cli.id, usuarioId: c.vendedorId, tipo: "NOTA", descricao: `Cliente cadastrado · origem: ${c.origem}.`, data: dias(-12) } });
    criados.push(cli);
  }
  const [ricardo, fernanda] = criados;
  await db.interacao.createMany({
    data: [
      { clienteId: ricardo.id, usuarioId: ana.id, tipo: "REUNIAO", descricao: "Conheceu a C68 no boat show. Quer 4 cabines e flybridge para a família.", data: dias(-10) },
      { clienteId: ricardo.id, usuarioId: ana.id, tipo: "PROPOSTA", descricao: "Proposta enviada por e-mail.", data: dias(-4) },
      { clienteId: ricardo.id, usuarioId: ana.id, tipo: "LIGACAO", descricao: "Pediu condição com entrada de 30% e saldo em 12 meses.", data: dias(-1) },
      { clienteId: fernanda.id, usuarioId: ana.id, tipo: "WHATSAPP", descricao: "Enviadas fotos e vídeo do Phantom 345.", data: dias(-6) },
      { clienteId: fernanda.id, usuarioId: ana.id, tipo: "SEA_TRIAL", descricao: "Navegou no sábado com o marido. Gostou muito, vai avaliar o financiamento.", data: dias(-3) },
    ],
  });
  await db.proposta.create({
    data: {
      clienteId: ricardo.id, embarcacaoId: c68.id, vendedorId: ana.id, status: "ENVIADA", valorTabela: 21500000,
      opcionais: "Teto solar no flybridge | 180.000,00\nPacote de eletrônicos Garmin | 240.000,00\nKit de segurança e salvatagem (incluso)",
      valorOpcionais: 420000, desconto: 650000, valorFinal: 21270000, entrada: 6381000, parcelas: 12, valorParcela: 1240750,
      formaPagamento: "Sinal na assinatura do pedido, saldo em 12 parcelas mensais sem juros", prazoEntrega: "Março de 2027",
      localEntrega: "Marina, Guarujá - SP", validade: dias(10), observacoes: "Inclui transporte do estaleiro, despacho aduaneiro e documentação na Capitania dos Portos.",
    },
  });
  await db.proposta.create({
    data: {
      clienteId: fernanda.id, embarcacaoId: p345.id, vendedorId: ana.id, status: "RASCUNHO", valorTabela: 399000, desconto: 9000, valorFinal: 390000,
      entrada: 117000, parcelas: 10, valorParcela: 27300, formaPagamento: "Entrada + 10x sem juros", prazoEntrega: "Imediata, após quitação", localEntrega: "Marina, Guarujá - SP", validade: dias(7),
    },
  });
  console.log("Exemplos criados. Acesse com admin@exemplo.com.br / regatta2026 (ou ana@ / bruno@).");
  void admin;
}

main().finally(() => db.$disconnect());
