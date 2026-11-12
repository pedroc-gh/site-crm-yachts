"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Condicao, StatusEmbarcacao } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { lerValor } from "@/lib/formato";

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const int = (f: FormData, k: string) => {
  const v = parseInt(String(f.get(k) ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(v) ? v : null;
};

const MAX_FOTO = 6 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

async function salvarFotos(embarcacaoId: string, form: FormData) {
  const arquivos = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const ultima = await db.foto.aggregate({ where: { embarcacaoId }, _max: { ordem: true } });
  let ordem = (ultima._max.ordem ?? -1) + 1;
  for (const f of arquivos) {
    if (!TIPOS.includes(f.type)) throw new Error(`"${f.name}" não é JPG, PNG ou WebP.`);
    if (f.size > MAX_FOTO) throw new Error(`"${f.name}" tem mais de 6 MB. Reduza a foto antes de enviar.`);
    await db.foto.create({ data: { embarcacaoId, mime: f.type, dados: Buffer.from(await f.arrayBuffer()), ordem: ordem++ } });
  }
}

export async function salvarEmbarcacao(_: string | null, form: FormData): Promise<string | null> {
  await exigirUsuario();
  const id = txt(form, "id");
  const condicao = txt(form, "condicao") as Condicao | null;
  const modelo = txt(form, "modelo");
  const marca = txt(form, "marca");
  const preco = lerValor(form.get("preco"));
  if (condicao !== "NOVO" && condicao !== "SEMINOVO") return "Escolha se o barco é novo ou seminovo.";
  if (!marca || !modelo) return "Informe marca e modelo.";
  if (preco <= 0) return "Informe o preço de venda.";

  const pes = lerValor(form.get("comprimentoPes"));
  const dados = {
    condicao,
    marca,
    modelo: modelo.toUpperCase(),
    ano: int(form, "ano"),
    comprimentoPes: pes > 0 ? pes : null,
    motorizacao: txt(form, "motorizacao"),
    horasMotor: condicao === "SEMINOVO" ? int(form, "horasMotor") : null,
    combustivel: txt(form, "combustivel"),
    cabines: int(form, "cabines"),
    capacidade: int(form, "capacidade"),
    cor: txt(form, "cor"),
    localizacao: txt(form, "localizacao"),
    inscricao: txt(form, "inscricao"),
    preco,
    status: (txt(form, "status") ?? "DISPONIVEL") as StatusEmbarcacao,
    equipamentos: txt(form, "equipamentos"),
    descricao: txt(form, "descricao"),
  };

  let embId = id;
  try {
    if (id) await db.embarcacao.update({ where: { id }, data: dados });
    else embId = (await db.embarcacao.create({ data: dados })).id;
    await salvarFotos(embId!, form);
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível salvar.";
  }
  revalidatePath("/embarcacoes");
  redirect(`/embarcacoes/${embId}?salvo=1`);
}

export async function removerFoto(form: FormData) {
  await exigirUsuario();
  const id = String(form.get("fotoId"));
  const f = await db.foto.delete({ where: { id } });
  revalidatePath(`/embarcacoes/${f.embarcacaoId}`);
}

export async function fotoPrincipal(form: FormData) {
  await exigirUsuario();
  const id = String(form.get("fotoId"));
  const f = await db.foto.findUniqueOrThrow({ where: { id } });
  const menor = await db.foto.aggregate({ where: { embarcacaoId: f.embarcacaoId }, _min: { ordem: true } });
  await db.foto.update({ where: { id }, data: { ordem: (menor._min.ordem ?? 0) - 1 } });
  revalidatePath(`/embarcacoes/${f.embarcacaoId}`);
}

export async function excluirEmbarcacao(form: FormData) {
  const u = await exigirUsuario();
  if (u.papel !== "ADMIN") return;
  const id = String(form.get("id"));
  if ((await db.proposta.count({ where: { embarcacaoId: id } })) > 0) redirect(`/embarcacoes/${id}?erro=proposta`);
  await db.embarcacao.delete({ where: { id } });
  revalidatePath("/embarcacoes");
  redirect("/embarcacoes");
}
