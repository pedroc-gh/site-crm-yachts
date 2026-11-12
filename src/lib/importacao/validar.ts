import "server-only";
import type { Condicao, Etapa, Prisma, StatusEmbarcacao } from "@prisma/client";
import { db } from "@/lib/db";
import type { UsuarioLogado } from "@/lib/auth";
import { ETAPAS, MAX_ITENS, UFS, rotuloStatusEmbarcacao } from "@/lib/rotulos";
import { lerValor } from "@/lib/formato";
import { normalizar } from "./colunas";
import type { LinhaLida, Valor } from "./planilha";

export type StatusLinha = "ok" | "duplicado" | "erro";
export type LinhaAnalisada<T> = { numero: number; rotulo: string; status: StatusLinha; mensagens: string[]; dados?: T };
export type Analise<T> = { linhas: LinhaAnalisada<T>[]; ok: number; duplicados: number; erros: number };

// ---------- conversões de célula ----------
const texto = (v: Valor) => (v == null ? null : v instanceof Date ? v.toLocaleDateString("pt-BR") : String(v).trim() || null);

function numero(v: Valor): number | null | "invalido" {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : "invalido";
  const s = String(v).trim();
  if (!/\d/.test(s) || /[a-z]/i.test(s.replace(/r\$/i, ""))) return "invalido";
  return lerValor(s);
}

function inteiro(v: Valor): number | null | "invalido" {
  const n = numero(v);
  return n === "invalido" || n == null ? n : Math.round(n);
}

function dataCelula(v: Valor): Date | null | "invalido" {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? "invalido" : new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), 12));
  if (typeof v === "number") {
    // número de série do Excel (dias desde 30/12/1899)
    if (v < 1 || v > 80000) return "invalido";
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5);
    d.setUTCHours(12);
    return d;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const d = new Date(Date.UTC(ano, Number(m[2]) - 1, Number(m[1]), 12));
    return d.getUTCDate() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 ? d : "invalido";
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return "invalido";
}

const digitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
/** Celular comparável: só dígitos, sem o 55 do Brasil */
const chaveTelefone = (s: string | null | undefined) => {
  const d = digitos(s);
  return d.length >= 12 && d.startsWith("55") ? d.slice(2) : d;
};

function condicaoDe(v: Valor): Condicao | null | "invalido" {
  const n = normalizar(texto(v) ?? "");
  if (!n) return null;
  if (n === "novo" || n === "novos" || n === "new") return "NOVO";
  if (n === "seminovo" || n === "seminovos" || n === "usado") return "SEMINOVO";
  return "invalido";
}

// ---------- clientes ----------
export async function analisarClientes(linhas: LinhaLida[], u: UsuarioLogado): Promise<Analise<Prisma.ClienteCreateManyInput>> {
  const [existentes, usuarios] = await Promise.all([
    db.cliente.findMany({ select: { cpfCnpj: true, email: true, telefone: true } }),
    db.usuario.findMany({ where: { ativo: true }, select: { id: true, email: true } }),
  ]);
  const cpfs = new Set(existentes.map((c) => digitos(c.cpfCnpj)).filter(Boolean));
  const emails = new Set(existentes.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[]);
  const fones = new Set(existentes.map((c) => chaveTelefone(c.telefone)).filter((d) => d.length >= 10));
  const consultores = new Map(usuarios.map((x) => [x.email.toLowerCase(), x.id]));
  const etapas = new Map<string, Etapa>();
  for (const e of ETAPAS) {
    etapas.set(normalizar(e.rotulo), e.valor);
    etapas.set(normalizar(e.valor), e.valor);
  }

  const resultado: LinhaAnalisada<Prisma.ClienteCreateManyInput>[] = [];
  for (const { numero: n, valores: v } of linhas) {
    const erros: string[] = [];
    const nome = texto(v.nome);
    const telefone = texto(v.telefone);
    const email = texto(v.email)?.toLowerCase() ?? null;
    if (!nome) erros.push("Falta o nome.");
    if (!telefone && !email) erros.push("Informe celular ou e-mail.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push(`E-mail inválido: "${email}".`);
    if (telefone && digitos(telefone).length < 10) erros.push(`Celular sem DDD ou incompleto: "${telefone}".`);

    const uf = texto(v.uf)?.toUpperCase() ?? null;
    if (uf && !UFS.includes(uf)) erros.push(`UF inválida: "${uf}". Use a sigla do estado (SP, RJ...).`);

    const interesseTxt = texto(v.interesse);
    const interesse = condicaoDe(v.interesse);
    if (interesse === "invalido") erros.push(`Interesse "${interesseTxt}" não reconhecido. Use Novo ou Seminovo.`);

    const etapaTxt = texto(v.etapa);
    const etapa = etapaTxt ? etapas.get(normalizar(etapaTxt)) : "NOVO_LEAD";
    if (!etapa) erros.push(`Etapa "${etapaTxt}" não existe. Use: ${ETAPAS.map((e) => e.rotulo).join(", ")}.`);

    const orcamento = numero(v.orcamento);
    if (orcamento === "invalido") erros.push(`Orçamento não é um número: "${texto(v.orcamento)}".`);
    const nasc = dataCelula(v.dataNascimento);
    if (nasc === "invalido") erros.push(`Data de nascimento inválida: "${texto(v.dataNascimento)}". Use dd/mm/aaaa.`);
    const prox = dataCelula(v.proximoContato);
    if (prox === "invalido") erros.push(`Próximo contato inválido: "${texto(v.proximoContato)}". Use dd/mm/aaaa.`);

    let vendedorId = u.id;
    const emailConsultor = texto(v.emailConsultor)?.toLowerCase();
    if (emailConsultor) {
      const id = consultores.get(emailConsultor);
      if (id) vendedorId = id;
      else erros.push(`Consultor "${emailConsultor}" não está cadastrado (ou está desativado) em Equipe.`);
    }

    const rotulo = nome ?? email ?? telefone ?? `Linha ${n}`;
    if (erros.length) {
      resultado.push({ numero: n, rotulo, status: "erro", mensagens: erros });
      continue;
    }

    const cpf = digitos(texto(v.cpfCnpj));
    const fone = chaveTelefone(telefone);
    const dup =
      (cpf && cpfs.has(cpf) && "CPF/CNPJ") || (email && emails.has(email) && "e-mail") || (fone.length >= 10 && fones.has(fone) && "celular");
    if (dup) {
      resultado.push({ numero: n, rotulo, status: "duplicado", mensagens: [`Já existe um cliente com o mesmo ${dup}, no sistema ou numa linha anterior do arquivo.`] });
      continue;
    }
    if (cpf) cpfs.add(cpf);
    if (email) emails.add(email);
    if (fone.length >= 10) fones.add(fone);

    resultado.push({
      numero: n,
      rotulo,
      status: "ok",
      mensagens: [],
      dados: {
        nome: nome!,
        telefone,
        email,
        cpfCnpj: texto(v.cpfCnpj),
        dataNascimento: nasc as Date | null,
        cidade: texto(v.cidade),
        uf,
        profissao: texto(v.profissao),
        origem: texto(v.origem),
        interesse: interesse as Condicao | null,
        modeloInteresse: texto(v.modeloInteresse),
        orcamento: (orcamento as number | null) || null,
        possuiBarco: texto(v.possuiBarco),
        observacoes: texto(v.observacoes),
        etapa: etapa!,
        proximoContato: prox as Date | null,
        vendedorId,
      },
    });
  }
  return resumir(resultado);
}

// ---------- embarcações ----------
export async function analisarEmbarcacoes(linhas: LinhaLida[]): Promise<Analise<Prisma.EmbarcacaoCreateManyInput>> {
  const existentes = await db.embarcacao.findMany({ select: { condicao: true, modelo: true, ano: true, inscricao: true } });
  const inscricoes = new Set(existentes.map((b) => normalizar(b.inscricao ?? "")).filter(Boolean));
  const novos = new Set(existentes.filter((b) => b.condicao === "NOVO").map((b) => `${normalizar(b.modelo)}|${b.ano ?? ""}`));
  const situacoes = new Map(Object.entries(rotuloStatusEmbarcacao).map(([valor, rot]) => [normalizar(rot), valor as StatusEmbarcacao]));
  situacoes.set("disponivel", "DISPONIVEL");
  situacoes.set("encomenda", "ENCOMENDA");

  const resultado: LinhaAnalisada<Prisma.EmbarcacaoCreateManyInput>[] = [];
  for (const { numero: n, valores: v } of linhas) {
    const erros: string[] = [];
    const condicao = condicaoDe(v.condicao);
    const marca = texto(v.marca);
    const modelo = texto(v.modelo)?.toUpperCase() ?? null;
    const preco = numero(v.preco);
    if (!condicao) erros.push("Falta a condição (Novo ou Seminovo).");
    else if (condicao === "invalido") erros.push(`Condição "${texto(v.condicao)}" não reconhecida. Use Novo ou Seminovo.`);
    if (!marca) erros.push("Falta a marca.");
    if (!modelo) erros.push("Falta o modelo.");
    if (preco == null) erros.push("Falta o preço.");
    else if (preco === "invalido" || preco <= 0) erros.push(`Preço inválido: "${texto(v.preco)}".`);

    const nums = { ano: inteiro(v.ano), comprimentoPes: numero(v.comprimentoPes), horasMotor: inteiro(v.horasMotor), cabines: inteiro(v.cabines), capacidade: inteiro(v.capacidade) };
    const nomes: Record<string, string> = { ano: "Ano", comprimentoPes: "Comprimento", horasMotor: "Horas de motor", cabines: "Cabines", capacidade: "Capacidade" };
    for (const [k, val] of Object.entries(nums)) if (val === "invalido") erros.push(`${nomes[k]} não é um número: "${texto(v[k])}".`);
    if (typeof nums.ano === "number" && (nums.ano < 1950 || nums.ano > new Date().getFullYear() + 3)) erros.push(`Ano fora do esperado: ${nums.ano}.`);

    const situacaoTxt = texto(v.status);
    let status: StatusEmbarcacao = condicao === "NOVO" ? "ENCOMENDA" : "DISPONIVEL";
    if (situacaoTxt) {
      const s = situacoes.get(normalizar(situacaoTxt));
      if (s) status = s;
      else erros.push(`Situação "${situacaoTxt}" não existe. Use: ${Object.values(rotuloStatusEmbarcacao).join(", ")}.`);
    }

    const itens = (texto(v.equipamentos) ?? "").split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
    if (itens.length > MAX_ITENS) erros.push(`Itens e equipamentos: ${itens.length} itens, o máximo é ${MAX_ITENS}.`);

    const rotulo = [modelo, typeof nums.ano === "number" ? nums.ano : null].filter(Boolean).join(" ") || `Linha ${n}`;
    if (erros.length) {
      resultado.push({ numero: n, rotulo, status: "erro", mensagens: erros });
      continue;
    }

    const inscricao = texto(v.inscricao);
    const chaveNovo = `${normalizar(modelo!)}|${nums.ano ?? ""}`;
    const dup =
      (inscricao && inscricoes.has(normalizar(inscricao)) && `a mesma inscrição (${inscricao})`) ||
      (condicao === "NOVO" && novos.has(chaveNovo) && "o mesmo modelo e ano entre os novos");
    if (dup) {
      resultado.push({ numero: n, rotulo, status: "duplicado", mensagens: [`Já existe uma embarcação com ${dup}, no sistema ou numa linha anterior do arquivo.`] });
      continue;
    }
    if (inscricao) inscricoes.add(normalizar(inscricao));
    if (condicao === "NOVO") novos.add(chaveNovo);

    resultado.push({
      numero: n,
      rotulo,
      status: "ok",
      mensagens: [],
      dados: {
        condicao: condicao as Condicao,
        marca: marca!,
        modelo: modelo!,
        preco: preco as number,
        ano: nums.ano as number | null,
        comprimentoPes: (nums.comprimentoPes as number | null) || null,
        motorizacao: texto(v.motorizacao),
        horasMotor: condicao === "SEMINOVO" ? (nums.horasMotor as number | null) : null,
        combustivel: texto(v.combustivel),
        cabines: nums.cabines as number | null,
        capacidade: nums.capacidade as number | null,
        cor: texto(v.cor),
        localizacao: texto(v.localizacao),
        inscricao,
        status,
        equipamentos: itens.length ? itens.join("\n") : null,
        descricao: texto(v.descricao),
      },
    });
  }
  return resumir(resultado);
}

function resumir<T>(linhas: LinhaAnalisada<T>[]): Analise<T> {
  return {
    linhas,
    ok: linhas.filter((l) => l.status === "ok").length,
    duplicados: linhas.filter((l) => l.status === "duplicado").length,
    erros: linhas.filter((l) => l.status === "erro").length,
  };
}
