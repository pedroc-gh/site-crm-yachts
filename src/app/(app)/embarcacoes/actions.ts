"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Condicao, StatusEmbarcacao } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { lerValor } from "@/lib/formato";
import { lerDimensoes } from "@/lib/fotos";
import { MAX_ITENS, MAX_DETALHES } from "@/lib/rotulos";

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



function arquivos(form: FormData, campo: string) {
  return form.getAll(campo).filter((f): f is File => f instanceof File && f.size > 0);
}

function validar(f: File) {
  if (!TIPOS.includes(f.type)) throw new Error(`"${f.name}" não é JPG, PNG ou WebP.`);
  if (f.size > MAX_FOTO) throw new Error(`"${f.name}" tem mais de 6 MB. Reduza a foto antes de enviar.`);
}

/** Confere as fotos antes de salvar qualquer dado. */
async function conferirFotos(embarcacaoId: string | null, form: FormData) {
  const principal = arquivos(form, "fotoPrincipal");
  const detalhes = arquivos(form, "fotosDetalhe");
  [...principal, ...detalhes].forEach(validar);
  if (principal.length > 1) throw new Error("Envie só uma foto principal.");
  const existentes = embarcacaoId ? await db.foto.count({ where: { embarcacaoId, papel: "DETALHE" } }) : 0;
  if (existentes + detalhes.length > MAX_DETALHES) {
    const livres = MAX_DETALHES - existentes;
    throw new Error(
      livres <= 0
        ? `Já existem ${MAX_DETALHES} fotos de detalhe. Remova uma antes de enviar outra.`
        : `Cabem só mais ${livres} foto(s) de detalhe (máximo ${MAX_DETALHES}).`,
    );
  }
  return { principal: principal[0], detalhes };
}

async function salvarFotos(embarcacaoId: string, fotos: { principal?: File; detalhes: File[] }) {
  if (fotos.principal) {
    // A nova foto principal substitui a anterior
    await db.foto.deleteMany({ where: { embarcacaoId, papel: "PRINCIPAL" } });
    const dados = Buffer.from(await fotos.principal.arrayBuffer());
    await db.foto.create({
      data: { embarcacaoId, papel: "PRINCIPAL", mime: fotos.principal.type, dados, ordem: 0, ...lerDimensoes(dados) },
    });
  }
  const ultima = await db.foto.aggregate({ where: { embarcacaoId }, _max: { ordem: true } });
  let ordem = (ultima._max.ordem ?? 0) + 1;
  for (const f of fotos.detalhes) {
    const dados = Buffer.from(await f.arrayBuffer());
    await db.foto.create({ data: { embarcacaoId, papel: "DETALHE", mime: f.type, dados, ordem: ordem++, ...lerDimensoes(dados) } });
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

  const linhasItens = (txt(form, "equipamentos") ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (linhasItens.length > MAX_ITENS) return `Itens e equipamentos: no máximo ${MAX_ITENS} itens (há ${linhasItens.length}).`;

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
    equipamentos: linhasItens.length ? linhasItens.join("\n") : null,
    descricao: txt(form, "descricao"),
  };

  let embId = id;
  try {
    const fotos = await conferirFotos(id, form);
    if (id) await db.embarcacao.update({ where: { id }, data: dados });
    else embId = (await db.embarcacao.create({ data: dados })).id;
    await salvarFotos(embId!, fotos);
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

/** Troca de papel: o detalhe vira a principal e a principal antiga vira detalhe. */
export async function fotoPrincipal(form: FormData) {
  await exigirUsuario();
  const id = String(form.get("fotoId"));
  const f = await db.foto.findUniqueOrThrow({ where: { id } });
  await db.$transaction([
    db.foto.updateMany({ where: { embarcacaoId: f.embarcacaoId, papel: "PRINCIPAL" }, data: { papel: "DETALHE", ordem: f.ordem } }),
    db.foto.update({ where: { id }, data: { papel: "PRINCIPAL", ordem: 0 } }),
  ]);
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
