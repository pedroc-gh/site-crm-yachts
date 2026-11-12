"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Etapa, Condicao, TipoInteracao } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario, type UsuarioLogado } from "@/lib/auth";
import { ETAPAS, rotuloEtapa } from "@/lib/rotulos";
import { lerValor } from "@/lib/formato";

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

/** Garante que o cliente pertence ao vendedor (ou que é admin). */
export async function clienteDoUsuario(id: string, u: UsuarioLogado) {
  const c = await db.cliente.findUnique({ where: { id } });
  if (!c || (u.papel !== "ADMIN" && c.vendedorId !== u.id)) return null;
  return c;
}

export async function salvarCliente(_: string | null, form: FormData): Promise<string | null> {
  const u = await exigirUsuario();
  const id = txt(form, "id");
  const nome = txt(form, "nome");
  if (!nome) return "Informe o nome do cliente.";
  if (!txt(form, "telefone") && !txt(form, "email")) return "Informe pelo menos um telefone ou e-mail.";

  const interesse = txt(form, "interesse") as Condicao | null;
  const nasc = txt(form, "dataNascimento");
  const prox = txt(form, "proximoContato");
  const orc = lerValor(form.get("orcamento"));

  // Só o admin escolhe/transfere o consultor responsável
  let vendedorId = u.id;
  if (u.papel === "ADMIN" && txt(form, "vendedorId")) vendedorId = txt(form, "vendedorId")!;

  const dados = {
    nome,
    cpfCnpj: txt(form, "cpfCnpj"),
    email: txt(form, "email")?.toLowerCase() ?? null,
    telefone: txt(form, "telefone"),
    dataNascimento: nasc ? new Date(nasc + "T12:00:00") : null,
    cidade: txt(form, "cidade"),
    uf: txt(form, "uf"),
    profissao: txt(form, "profissao"),
    origem: txt(form, "origem"),
    interesse: interesse === "NOVO" || interesse === "SEMINOVO" ? interesse : null,
    modeloInteresse: txt(form, "modeloInteresse"),
    orcamento: orc > 0 ? orc : null,
    possuiBarco: txt(form, "possuiBarco"),
    observacoes: txt(form, "observacoes"),
    proximoContato: prox ? new Date(prox + "T12:00:00") : null,
  };

  let clienteId: string;
  if (id) {
    const atual = await clienteDoUsuario(id, u);
    if (!atual) return "Cliente não encontrado na sua carteira.";
    await db.cliente.update({
      where: { id },
      data: { ...dados, ...(u.papel === "ADMIN" ? { vendedorId } : {}) },
    });
    clienteId = id;
  } else {
    const c = await db.cliente.create({ data: { ...dados, vendedorId } });
    await db.interacao.create({
      data: { clienteId: c.id, usuarioId: u.id, tipo: "NOTA", descricao: `Cliente cadastrado${dados.origem ? ` · origem: ${dados.origem}` : ""}.` },
    });
    clienteId = c.id;
  }
  revalidatePath("/clientes");
  redirect(`/clientes/${clienteId}`);
}

export async function moverEtapa(clienteId: string, etapa: Etapa, motivoPerda?: string) {
  const u = await exigirUsuario();
  if (!ETAPAS.some((e) => e.valor === etapa)) return { erro: "Etapa inválida." };
  const c = await clienteDoUsuario(clienteId, u);
  if (!c) return { erro: "Cliente não encontrado na sua carteira." };
  if (c.etapa === etapa) return { ok: true };
  await db.$transaction([
    db.cliente.update({
      where: { id: clienteId },
      data: { etapa, motivoPerda: etapa === "PERDIDO" ? motivoPerda?.trim() || c.motivoPerda : null },
    }),
    db.interacao.create({
      data: {
        clienteId,
        usuarioId: u.id,
        tipo: "MUDANCA_ETAPA",
        descricao:
          `${rotuloEtapa(c.etapa)} → ${rotuloEtapa(etapa)}` +
          (etapa === "PERDIDO" && motivoPerda?.trim() ? `\nMotivo: ${motivoPerda.trim()}` : ""),
      },
    }),
  ]);
  revalidatePath("/funil");
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function moverEtapaForm(form: FormData) {
  await moverEtapa(String(form.get("clienteId")), String(form.get("etapa")) as Etapa, String(form.get("motivo") ?? ""));
}

export async function registrarInteracao(_: string | null, form: FormData): Promise<string | null> {
  const u = await exigirUsuario();
  const clienteId = String(form.get("clienteId") ?? "");
  const tipo = String(form.get("tipo") ?? "NOTA") as TipoInteracao;
  const descricao = String(form.get("descricao") ?? "").trim();
  const prox = String(form.get("proximoContato") ?? "").trim();
  if (!descricao) return "Descreva o que aconteceu no contato.";
  const c = await clienteDoUsuario(clienteId, u);
  if (!c) return "Cliente não encontrado na sua carteira.";

  await db.interacao.create({ data: { clienteId, usuarioId: u.id, tipo, descricao } });
  // Contato registrado em lead novo já o leva para "Primeiro contato"
  const avancar = c.etapa === "NOVO_LEAD" && tipo !== "NOTA";
  await db.cliente.update({
    where: { id: clienteId },
    data: {
      proximoContato: prox ? new Date(prox + "T12:00:00") : c.proximoContato,
      ...(avancar ? { etapa: "PRIMEIRO_CONTATO" } : {}),
    },
  });
  if (avancar) {
    await db.interacao.create({
      data: { clienteId, usuarioId: u.id, tipo: "MUDANCA_ETAPA", descricao: "Novo lead → Primeiro contato" },
    });
  }
  revalidatePath(`/clientes/${clienteId}`);
  return null;
}

export async function excluirCliente(form: FormData) {
  const u = await exigirUsuario();
  if (u.papel !== "ADMIN") return;
  const id = String(form.get("id"));
  const temProposta = await db.proposta.count({ where: { clienteId: id } });
  if (temProposta > 0) redirect(`/clientes/${id}?erro=proposta`);
  await db.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  redirect("/clientes");
}
