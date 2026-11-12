"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirAdmin, type UsuarioLogado } from "@/lib/auth";
import { lerPlanilha } from "@/lib/importacao/planilha";
import { analisarClientes, analisarEmbarcacoes, type StatusLinha } from "@/lib/importacao/validar";
import type { TipoImportacao } from "@/lib/importacao/colunas";

const MAX_ARQUIVO = 5 * 1024 * 1024;

export type LinhaPrevia = { numero: number; rotulo: string; status: StatusLinha; mensagens: string[] };
export type ResultadoAnalise =
  | { erro: string }
  | { arquivo: string; linhas: LinhaPrevia[]; ok: number; duplicados: number; erros: number; ignoradas: string[] };
export type ResultadoImportacao = { erro: string } | { importados: number; duplicados: number; erros: number };

async function analisar(tipo: TipoImportacao, form: FormData, u: UsuarioLogado) {
  const arquivo = form.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new Error("Escolha o arquivo da planilha.");
  if (!/\.(xlsx|csv)$/i.test(arquivo.name)) throw new Error("Envie um arquivo Excel (.xlsx) ou CSV. Se for .xls antigo, salve como .xlsx.");
  if (arquivo.size > MAX_ARQUIVO) throw new Error("O arquivo passa de 5 MB. Divida em arquivos menores.");
  const leitura = await lerPlanilha(Buffer.from(await arquivo.arrayBuffer()), arquivo.name, tipo);
  if (leitura.faltando.length) {
    throw new Error(`Faltam colunas obrigatórias: ${leitura.faltando.join(", ")}. Use o modelo para conferir os nomes.`);
  }
  if (leitura.linhas.length === 0) throw new Error("A planilha não tem nenhuma linha preenchida abaixo do cabeçalho.");
  const analise = tipo === "clientes" ? await analisarClientes(leitura.linhas, u) : await analisarEmbarcacoes(leitura.linhas);
  return { arquivo: arquivo.name, leitura, analise };
}

const tipoDe = (f: FormData): TipoImportacao => (f.get("tipo") === "embarcacoes" ? "embarcacoes" : "clientes");

/** Passo 2: confere o arquivo sem gravar nada. */
export async function conferirPlanilha(_: ResultadoAnalise | null, form: FormData): Promise<ResultadoAnalise> {
  const u = await exigirAdmin();
  try {
    const { arquivo, leitura, analise } = await analisar(tipoDe(form), form, u);
    return {
      arquivo,
      linhas: analise.linhas.map(({ numero, rotulo, status, mensagens }) => ({ numero, rotulo, status, mensagens })),
      ok: analise.ok,
      duplicados: analise.duplicados,
      erros: analise.erros,
      ignoradas: leitura.ignoradas,
    };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Não foi possível ler a planilha." };
  }
}

/** Passo 3: grava as linhas válidas. O arquivo é conferido de novo, então nada muda entre a prévia e a gravação. */
export async function importarPlanilha(_: ResultadoImportacao | null, form: FormData): Promise<ResultadoImportacao> {
  const u = await exigirAdmin();
  const tipo = tipoDe(form);
  try {
    const { arquivo, analise } = await analisar(tipo, form, u);
    if (tipo === "clientes") {
      const dados = analise.linhas.flatMap((l) => (l.status === "ok" && l.dados ? [l.dados] : []));
      await db.$transaction(async (tx) => {
        const criados = await tx.cliente.createManyAndReturn({ data: dados as never[], select: { id: true, origem: true } });
        await tx.interacao.createMany({
          data: criados.map((c) => ({
            clienteId: c.id,
            usuarioId: u.id,
            tipo: "NOTA" as const,
            descricao: `Cliente importado da planilha "${arquivo}"${c.origem ? ` · origem: ${c.origem}` : ""}.`,
          })),
        });
      }, { timeout: 60_000 });
      revalidatePath("/clientes");
      revalidatePath("/funil");
      revalidatePath("/");
    } else {
      const dados = analise.linhas.flatMap((l) => (l.status === "ok" && l.dados ? [l.dados] : []));
      await db.embarcacao.createMany({ data: dados as never[] });
      revalidatePath("/embarcacoes");
    }
    return { importados: analise.ok, duplicados: analise.duplicados, erros: analise.erros };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Não foi possível importar." };
  }
}
