"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { conferirSenha, exigirUsuario, hashSenha } from "@/lib/auth";

export async function trocarSenha(_: string | null, form: FormData): Promise<string | null> {
  const u = await exigirUsuario({ permitirSenhaProvisoria: true });
  const atual = String(form.get("atual") ?? "");
  const nova = String(form.get("nova") ?? "");
  const confirma = String(form.get("confirma") ?? "");

  const reg = await db.usuario.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await conferirSenha(atual, reg.senhaHash))) return "A senha atual não confere.";
  if (nova.length < 8) return "A nova senha precisa ter pelo menos 8 caracteres.";
  if (nova !== confirma) return "A confirmação não é igual à nova senha.";
  if (nova === atual) return "Escolha uma senha diferente da atual.";

  await db.usuario.update({ where: { id: u.id }, data: { senhaHash: await hashSenha(nova), trocarSenha: false } });
  redirect("/?senha=ok");
}
