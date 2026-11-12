"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirAdmin, gerarSenhaProvisoria, hashSenha } from "@/lib/auth";

export type ResultadoUsuario = { erro?: string; senha?: string; nome?: string; email?: string } | null;

export async function criarUsuario(_: ResultadoUsuario, form: FormData): Promise<ResultadoUsuario> {
  await exigirAdmin();
  const nome = String(form.get("nome") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const telefone = String(form.get("telefone") ?? "").trim() || null;
  const papel = form.get("papel") === "ADMIN" ? "ADMIN" : "VENDEDOR";
  if (!nome) return { erro: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Informe um e-mail válido." };
  if (await db.usuario.findUnique({ where: { email } })) return { erro: "Já existe um acesso com este e-mail." };

  const senha = gerarSenhaProvisoria();
  await db.usuario.create({ data: { nome, email, telefone, papel, senhaHash: await hashSenha(senha), trocarSenha: true } });
  revalidatePath("/usuarios");
  return { senha, nome, email };
}

export async function redefinirSenha(_: ResultadoUsuario, form: FormData): Promise<ResultadoUsuario> {
  await exigirAdmin();
  const id = String(form.get("id"));
  const senha = gerarSenhaProvisoria();
  const u = await db.usuario.update({ where: { id }, data: { senhaHash: await hashSenha(senha), trocarSenha: true } });
  return { senha, nome: u.nome, email: u.email };
}

export async function alternarAtivo(form: FormData) {
  const admin = await exigirAdmin();
  const id = String(form.get("id"));
  if (id === admin.id) return;
  const u = await db.usuario.findUniqueOrThrow({ where: { id } });
  await db.usuario.update({ where: { id }, data: { ativo: !u.ativo } });
  revalidatePath("/usuarios");
}

export async function atualizarUsuario(form: FormData) {
  const admin = await exigirAdmin();
  const id = String(form.get("id"));
  const papel = form.get("papel") === "ADMIN" ? "ADMIN" : "VENDEDOR";
  const telefone = String(form.get("telefone") ?? "").trim() || null;
  await db.usuario.update({ where: { id }, data: { telefone, ...(id === admin.id ? {} : { papel }) } });
  revalidatePath("/usuarios");
}

/** Passa todos os clientes abertos de um consultor para outro (ex.: desligamento). */
export async function transferirCarteira(form: FormData) {
  await exigirAdmin();
  const de = String(form.get("de"));
  const para = String(form.get("para"));
  if (!para || de === para) return;
  await db.cliente.updateMany({ where: { vendedorId: de }, data: { vendedorId: para } });
  revalidatePath("/usuarios");
  revalidatePath("/clientes");
}
