"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { StatusProposta } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { calcularProposta, lerValor, numeroProposta, reais } from "@/lib/formato";
import { ETAPAS, rotuloStatusProposta, rotuloEtapa } from "@/lib/rotulos";

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const ordem = (e: string) => ETAPAS.findIndex((x) => x.valor === e);

export async function salvarProposta(_: string | null, form: FormData): Promise<string | null> {
  const u = await exigirUsuario();
  const id = txt(form, "id");
  const clienteId = txt(form, "clienteId");
  const embarcacaoId = txt(form, "embarcacaoId");
  if (!clienteId) return "Escolha o cliente.";
  if (!embarcacaoId) return "Escolha a embarcação.";

  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || (u.papel !== "ADMIN" && cliente.vendedorId !== u.id)) return "Cliente não encontrado na sua carteira.";
  const barco = await db.embarcacao.findUnique({ where: { id: embarcacaoId } });
  if (!barco) return "Embarcação não encontrada.";

  const validadeTxt = txt(form, "validade");
  if (!validadeTxt) return "Informe a validade da proposta.";

  const base = {
    valorTabela: lerValor(form.get("valorTabela")),
    opcionais: txt(form, "opcionais"),
    desconto: lerValor(form.get("desconto")),
    valorTroca: lerValor(form.get("valorTroca")),
    entrada: lerValor(form.get("entrada")),
    parcelas: Math.max(0, parseInt(String(form.get("parcelas") ?? "0"), 10) || 0),
  };
  if (base.valorTabela <= 0) return "Informe o valor da embarcação.";
  const calc = calcularProposta(base);
  if (base.entrada > calc.valorFinal) return "A entrada é maior que o valor final.";

  const dados = {
    clienteId,
    embarcacaoId,
    ...base,
    valorOpcionais: calc.valorOpcionais,
    valorFinal: calc.valorFinal,
    valorParcela: calc.valorParcela,
    barcoTroca: txt(form, "barcoTroca"),
    formaPagamento: txt(form, "formaPagamento"),
    prazoEntrega: txt(form, "prazoEntrega"),
    localEntrega: txt(form, "localEntrega"),
    validade: new Date(validadeTxt + "T23:59:00-03:00"),
    observacoes: txt(form, "observacoes"),
  };

  let propostaId = id;
  if (id) {
    const atual = await db.proposta.findUnique({ where: { id } });
    if (!atual || (u.papel !== "ADMIN" && atual.vendedorId !== u.id)) return "Proposta não encontrada.";
    await db.proposta.update({ where: { id }, data: dados });
  } else {
    const p = await db.proposta.create({ data: { ...dados, vendedorId: cliente.vendedorId } });
    propostaId = p.id;
    await db.interacao.create({
      data: {
        clienteId,
        usuarioId: u.id,
        tipo: "PROPOSTA",
        descricao: `Proposta ${numeroProposta(p.numero, p.criadoEm)} gerada · ${barco.modelo} · ${reais(calc.valorFinal)}`,
      },
    });
    if (ordem(cliente.etapa) < ordem("PROPOSTA")) {
      await db.cliente.update({ where: { id: clienteId }, data: { etapa: "PROPOSTA" } });
      await db.interacao.create({
        data: { clienteId, usuarioId: u.id, tipo: "MUDANCA_ETAPA", descricao: `${rotuloEtapa(cliente.etapa)} → Proposta` },
      });
    }
  }
  revalidatePath("/propostas");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/propostas/${propostaId}`);
}

export async function mudarStatusProposta(form: FormData) {
  const u = await exigirUsuario();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as StatusProposta;
  if (!(status in rotuloStatusProposta)) return;
  const p = await db.proposta.findUnique({ where: { id }, include: { cliente: true, embarcacao: true } });
  if (!p || (u.papel !== "ADMIN" && p.vendedorId !== u.id) || p.status === status) return;

  await db.proposta.update({ where: { id }, data: { status } });
  await db.interacao.create({
    data: {
      clienteId: p.clienteId,
      usuarioId: u.id,
      tipo: "PROPOSTA",
      descricao: `Proposta ${numeroProposta(p.numero, p.criadoEm)}: ${rotuloStatusProposta[p.status]} → ${rotuloStatusProposta[status]}`,
    },
  });
  // Proposta aceita: venda fechada no funil e barco reservado
  if (status === "ACEITA") {
    if (p.cliente.etapa !== "GANHO") {
      await db.cliente.update({ where: { id: p.clienteId }, data: { etapa: "GANHO" } });
      await db.interacao.create({
        data: { clienteId: p.clienteId, usuarioId: u.id, tipo: "MUDANCA_ETAPA", descricao: `${rotuloEtapa(p.cliente.etapa)} → Venda fechada` },
      });
    }
    if (p.embarcacao.status === "DISPONIVEL") await db.embarcacao.update({ where: { id: p.embarcacaoId }, data: { status: "RESERVADA" } });
  }
  if (status === "ENVIADA" && ordem(p.cliente.etapa) < ordem("PROPOSTA")) {
    await db.cliente.update({ where: { id: p.clienteId }, data: { etapa: "PROPOSTA" } });
  }
  revalidatePath(`/propostas/${id}`);
  revalidatePath("/propostas");
}

export async function duplicarProposta(form: FormData) {
  const u = await exigirUsuario();
  const p = await db.proposta.findUnique({ where: { id: String(form.get("id")) } });
  if (!p || (u.papel !== "ADMIN" && p.vendedorId !== u.id)) return;
  const { id: _id, numero: _n, criadoEm: _c, atualizadoEm: _a, status: _s, ...resto } = p;
  const nova = await db.proposta.create({
    data: { ...resto, status: "RASCUNHO", validade: new Date(Date.now() + 10 * 864e5) },
  });
  redirect(`/propostas/${nova.id}/editar`);
}
